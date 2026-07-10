import {
  ECSClient,
  RegisterTaskDefinitionCommand,
  UpdateServiceCommand,
  CreateServiceCommand,
  DescribeServicesCommand,
  DeleteServiceCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  CreateTargetGroupCommand,
  DescribeTargetGroupsCommand,
  CreateRuleCommand,
  DescribeRulesCommand,
  ModifyRuleCommand,
  DeleteRuleCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { buildBus } from '../../utils/eventBus';
import { decryptAESnGCM, EncryptedEnvPayload } from '../../utils/encryptEnv';
import { updateProjectLiveUrlDB, updateProjectEcsMetadata } from '../../repository/project.repository';

const ecsClient = new ECSClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });
const elbClient = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION || 'ap-southeast-2' });

const AWS_CLUSTER_NAME_HQ = process.env.AWS_CLUSTER_NAME_HQ || 'microps-cluster';
const VPC_ID = process.env.VPC_ID;
const LISTENER_ALB_ARN = process.env.ALB_ARN;
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'microps.com';
const PROTOCOL = process.env.PROTOCOL || (process.env.ENABLE_HTTPS === 'true' ? 'https' : 'http');

async function getNextRulePriority(): Promise<number> {
  const response = await elbClient.send(new DescribeRulesCommand({ ListenerArn: LISTENER_ALB_ARN }));
  if (!response.Rules) return 1;
  const priorities = response.Rules.map((r) => r.Priority).filter((p) => p !== 'default').map(Number);
  return priorities.length > 0 ? Math.max(...priorities) + 1 : 1;
}

async function ensureTargetGroupRule(targetGroupArn: string, tenantDomain: string): Promise<void> {
  if (!LISTENER_ALB_ARN) return;
  try {
    const rulesRes = await elbClient.send(new DescribeRulesCommand({ ListenerArn: LISTENER_ALB_ARN }));

    // Purge stale rules matching tenantDomain that point to a different target group to prevent priority shadowing
    for (const rule of rulesRes.Rules || []) {
      if (rule.Priority === 'default' || !rule.RuleArn) continue;
      const hosts = rule.Conditions?.find((c) => c.Field === 'host-header')?.HostHeaderConfig?.Values || [];
      const tgArn = rule.Actions?.[0]?.TargetGroupArn;
      if (hosts.includes(tenantDomain) && tgArn && tgArn !== targetGroupArn) {
        await elbClient.send(new DeleteRuleCommand({ RuleArn: rule.RuleArn }));
        console.log(`[CD Engine] Pruned stale ALB rule ${rule.Priority} pointing to legacy target group.`);
      }
    }

    const updatedRulesRes = await elbClient.send(new DescribeRulesCommand({ ListenerArn: LISTENER_ALB_ARN }));
    const existingRule = updatedRulesRes.Rules?.find((r) =>
      r.Actions?.some((a) => a.TargetGroupArn === targetGroupArn)
    );

    if (existingRule && existingRule.RuleArn) {
      const values = existingRule.Conditions?.find((c) => c.Field === 'host-header')?.HostHeaderConfig?.Values || [];
      if (!values.includes(tenantDomain)) {
        await elbClient.send(
          new ModifyRuleCommand({
            RuleArn: existingRule.RuleArn,
            Conditions: [
              {
                Field: 'host-header',
                HostHeaderConfig: { Values: [tenantDomain] },
              },
            ],
          })
        );
      }
    } else {
      // FIX #8: Retry with priority increment on PriorityInUseException
      let createRuleSuccess = false;
      for (let attempt = 0; attempt < 3 && !createRuleSuccess; attempt++) {
        try {
          const rulePriority = await getNextRulePriority();
          await elbClient.send(
            new CreateRuleCommand({
              ListenerArn: LISTENER_ALB_ARN,
              Priority: rulePriority,
              Conditions: [
                {
                  Field: 'host-header',
                  HostHeaderConfig: { Values: [tenantDomain] },
                },
              ],
              Actions: [
                {
                  Type: 'forward',
                  TargetGroupArn: targetGroupArn,
                },
              ],
            })
          );
          createRuleSuccess = true;
        } catch (ruleErr: any) {
          if (ruleErr.name === 'PriorityInUseException' || ruleErr.message?.includes('PriorityInUse')) {
            console.warn(`[CD Engine] Priority collision on attempt ${attempt + 1}, retrying...`);
            continue;
          }
          throw ruleErr;
        }
      }
    }
  } catch (err: any) {
    console.error('[CD Engine] Failed to ensure ALB Listener Rule:', err.message);
  }
}

export const deployServiceECS = async (
  userId: number,
  projectName: string,
  imageURI: string,
  encryptedGCM: EncryptedEnvPayload | null,
  projectId?: number
): Promise<boolean> => {
  // FIX #2: Deterministic target group name — one per project, reused across deploys
  const shortProject = projectName.substring(0, 14);
  const targetGroupName = `tg-u${userId}-${shortProject}`;

  const familyName = `tenant-${userId}-${projectName}-task`;
  const serviceName = `tenant-${userId}-${projectName}-service`;
  const tenantDomain = `tenant-${userId}-${projectName}.${BASE_DOMAIN}`;
  const liveUrl = `${PROTOCOL}://${tenantDomain}`;

  try {
    buildBus.emit('build-progress', {
      userId: userId,
      message: 'ECR pushed and ECS DEPLOYMENT STARTED',
    });

    let ecsEnvironment: { name: string; value: string }[] = [
      { name: 'PORT', value: '3000' },
      { name: 'SERVER_PORT', value: '3000' },
    ];
    if (encryptedGCM && encryptedGCM.encryptedPayload && encryptedGCM.iv) {
      try {
        const decryptedString = decryptAESnGCM(encryptedGCM.encryptedPayload, encryptedGCM.iv);
        const userEnv = decryptedString
          .split('\n')
          .filter((line) => line.includes('='))
          .map((line) => {
            const [name, ...val] = line.split('=');
            return { name: name.trim(), value: val.join('=').trim() };
          });
        // Filter out PORT if user explicitly defined it or push user vars
        for (const item of userEnv) {
          if (item.name === 'PORT' || item.name === 'SERVER_PORT') continue;
          const idx = ecsEnvironment.findIndex((e) => e.name === item.name);
          if (idx !== -1) ecsEnvironment[idx] = item;
          else ecsEnvironment.push(item);
        }
      } catch (err: any) {
        console.error('❌ Failed to decrypt secrets for ECS deployment:', err.message);
      }
    }

    const registerResponse = await ecsClient.send(
      new RegisterTaskDefinitionCommand({
        family: familyName,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        runtimePlatform: {
          operatingSystemFamily: 'LINUX',
          cpuArchitecture: 'X86_64',
        },
        executionRoleArn: process.env.ECS_EXECUTION_ROLE_ARN,
        taskRoleArn: process.env.ECS_TASK_ROLE_ARN,
        containerDefinitions: [
          {
            name: projectName,
            image: imageURI,
            essential: true,
            environment: ecsEnvironment,
            portMappings: [
              {
                containerPort: 3000,
                protocol: 'tcp',
              },
            ],
            logConfiguration: process.env.ECS_EXECUTION_ROLE_ARN
              ? {
                logDriver: 'awslogs',
                options: {
                  'awslogs-group': '/ecs/microps-tenants',
                  'awslogs-region': process.env.AWS_REGION || 'ap-southeast-2',
                  'awslogs-stream-prefix': `tenant-${userId}`,
                  'awslogs-create-group': 'true',
                },
              }
              : undefined,
          },
        ],
      })
    );

    const newTaskArn = registerResponse.taskDefinition?.taskDefinitionArn;

    const describe = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: AWS_CLUSTER_NAME_HQ,
        services: [serviceName],
      })
    );

    const activeService = describe.services?.find((s) => s.status === 'ACTIVE');

    let targetGroupArn = describe.services?.[0]?.loadBalancers?.[0]?.targetGroupArn;
    if (!targetGroupArn) {
      try {
        const tgResponse = await elbClient.send(
          new CreateTargetGroupCommand({
            Name: targetGroupName,
            Protocol: 'HTTP',
            Port: 3000,
            VpcId: VPC_ID,
            TargetType: 'ip',
            HealthCheckPath: '/',
            HealthCheckIntervalSeconds: 30,
          })
        );
        targetGroupArn = tgResponse.TargetGroups?.[0].TargetGroupArn;
      } catch (tgErr: any) {
        if (tgErr.name === 'DuplicateTargetGroupName' || tgErr.message?.includes('DuplicateTargetGroupName')) {
          const descTg = await elbClient.send(new DescribeTargetGroupsCommand({ Names: [targetGroupName] }));
          targetGroupArn = descTg.TargetGroups?.[0]?.TargetGroupArn;
        } else {
          throw tgErr;
        }
      }
    }

    if (activeService) {
      if (targetGroupArn) {
        await ensureTargetGroupRule(targetGroupArn, tenantDomain);
      }
      try {
        await ecsClient.send(
          new UpdateServiceCommand({
            cluster: AWS_CLUSTER_NAME_HQ,
            service: serviceName,
            taskDefinition: newTaskArn,
            forceNewDeployment: true,
          })
        );
        await updateProjectLiveUrlDB(userId, projectId || projectName, liveUrl);
        if (projectId) await updateProjectEcsMetadata(projectId, serviceName, familyName);
        buildBus.emit('build-progress', { userId, liveUrl, message: `[CD Engine] 🚀 Service updated successfully! App live at ${liveUrl}` });
        return true;
      } catch (updateErr: any) {
        if (updateErr.name !== 'ServiceNotActiveException' && !updateErr.message?.includes('not ACTIVE')) {
          throw updateErr;
        }
        console.warn('UpdateService threw ServiceNotActiveException, falling back to CreateService...');
      }
    }

    if (describe.services?.[0]?.status === 'DRAINING' || describe.services?.[0]?.status === 'INACTIVE') {
      try {
        await ecsClient.send(new DeleteServiceCommand({ cluster: AWS_CLUSTER_NAME_HQ, service: serviceName, force: true }));
        await new Promise((res) => setTimeout(res, 3000));
      } catch (delErr) { /* ignore */ }
    }

    if (targetGroupArn) {
      await ensureTargetGroupRule(targetGroupArn, tenantDomain);
    }

    buildBus.emit('build-progress', { userId, message: `[CD Engine] ✅ Network routing configured for ${tenantDomain}` });

    await ecsClient.send(
      new CreateServiceCommand({
        cluster: AWS_CLUSTER_NAME_HQ,
        serviceName,
        taskDefinition: newTaskArn,
        desiredCount: 1,
        launchType: 'FARGATE',
        // FIX #9: Grace period so heavy containers (Java, ML) have time to boot
        healthCheckGracePeriodSeconds: 60,
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: [process.env.ECS_SUBNET_1 || '', process.env.ECS_SUBNET_2 || ''],
            securityGroups: [process.env.ECS_SECURITY_GROUP || ''],
            assignPublicIp: 'ENABLED',
          },
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroupArn!,
            containerName: projectName,
            containerPort: 3000,
          },
        ],
      })
    );

    await updateProjectLiveUrlDB(userId, projectId || projectName, liveUrl);
    if (projectId) await updateProjectEcsMetadata(projectId, serviceName, familyName);
    buildBus.emit('build-progress', { userId, liveUrl, message: `[CD Engine] 🚀 Deployed successfully! App will be live at ${liveUrl}` });

    return true;
  } catch (err: any) {
    console.error('ERROR: FAILED DEPLOYMENT', err);
    buildBus.emit('build-progress', { userId, message: `❌ Deployment failed: ${err.message}` });
    return false;
  }
};
