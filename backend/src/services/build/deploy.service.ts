import {
  ECSClient,
  RegisterTaskDefinitionCommand,
  UpdateServiceCommand,
  CreateServiceCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  CreateTargetGroupCommand,
  CreateRuleCommand,
  DescribeRulesCommand,
  ModifyRuleCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { buildBus } from '../../utils/eventBus';
import { decryptAESnGCM, EncryptedEnvPayload } from '../../utils/encryptEnv';
import { updateProjectLiveUrlDB } from '../../repository/project.repository';

const ecsClient = new ECSClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });
const elbClient = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION || 'ap-southeast-2' });

const AWS_CLUSTER_NAME_HQ = process.env.AWS_CLUSTER_NAME_HQ || 'microps-cluster';
const VPC_ID = process.env.VPC_ID;
const LISTENER_ALB_ARN = process.env.ALB_ARN;
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'microps.com';

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
    const existingRule = rulesRes.Rules?.find((r) =>
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
  const shortProject = projectName.substring(0, 10);
  const targetGroupName = `tg-u${userId}-${shortProject}-${Date.now().toString().slice(-6)}`;

  const familyName = `tenant-${userId}-${projectName}-task`;
  const serviceName = `tenant-${userId}-${projectName}-service`;
  const tenantDomain = `tenant-${userId}-${projectName}.${BASE_DOMAIN}`;
  const liveUrl = `http://${tenantDomain}`;

  try {
    buildBus.emit('build-progress', {
      userId: userId,
      message: 'ECR pushed and ECS DEPLOYMENT STARTED',
    });

    let ecsEnvironment: { name: string; value: string }[] = [];
    if (encryptedGCM && encryptedGCM.encryptedPayload && encryptedGCM.iv) {
      try {
        const decryptedString = decryptAESnGCM(encryptedGCM.encryptedPayload, encryptedGCM.iv);
        ecsEnvironment = decryptedString
          .split('\n')
          .filter((line) => line.includes('='))
          .map((line) => {
            const [name, ...val] = line.split('=');
            return { name: name.trim(), value: val.join('=').trim() };
          });
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

    const serviceExists = describe.services && describe.services.length > 0 && describe.services[0].status !== 'INACTIVE';

    if (!serviceExists) {
      // 3A. CREATING TARGET GROUP
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
      const targetGroupArn = tgResponse.TargetGroups?.[0].TargetGroupArn;

      // 3B. Create The ALB Listener Rule
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

      buildBus.emit('build-progress', { userId, message: `[CD Engine] ✅ Network routing configured for ${tenantDomain}` });

      await ecsClient.send(
        new CreateServiceCommand({
          cluster: AWS_CLUSTER_NAME_HQ,
          serviceName,
          taskDefinition: newTaskArn,
          desiredCount: 1,
          launchType: 'FARGATE',
          networkConfiguration: {
            awsvpcConfiguration: {
              subnets: [process.env.ECS_SUBNET_1 || '', process.env.ECS_SUBNET_2 || ''],
              securityGroups: [process.env.ECS_SECURITY_GROUP || ''],
              assignPublicIp: 'ENABLED',
            },
          },
          loadBalancers: [
            {
              targetGroupArn: targetGroupArn,
              containerName: projectName,
              containerPort: 3000,
            },
          ],
        })
      );

      await updateProjectLiveUrlDB(userId, projectId || projectName, liveUrl);
      buildBus.emit('build-progress', { userId, liveUrl, message: `[CD Engine] 🚀 Deployed successfully! App will be live at ${liveUrl}` });
    } else {
      const existingTgArn = describe.services?.[0]?.loadBalancers?.[0]?.targetGroupArn;
      if (existingTgArn) {
        await ensureTargetGroupRule(existingTgArn, tenantDomain);
      }
      await ecsClient.send(
        new UpdateServiceCommand({
          cluster: AWS_CLUSTER_NAME_HQ,
          service: serviceName,
          taskDefinition: newTaskArn,
          forceNewDeployment: true,
        })
      );
      await updateProjectLiveUrlDB(userId, projectId || projectName, liveUrl);
      buildBus.emit('build-progress', { userId, liveUrl, message: `[CD Engine] 🚀 Service updated successfully! App live at ${liveUrl}` });
    }

    return true;
  } catch (err: any) {
    console.error('ERROR: FAILED DEPLOYMENT', err);
    buildBus.emit('build-progress', { userId, message: `❌ Deployment failed: ${err.message}` });
    return false;
  }
};
