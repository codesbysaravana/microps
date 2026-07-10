import {
  ECSClient,
  DescribeServicesCommand,
  UpdateServiceCommand,
} from '@aws-sdk/client-ecs';
import { getActiveEcsProjects } from '../repository/project.repository';

const ecsClient = new ECSClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });
const AWS_CLUSTER_NAME_HQ = process.env.AWS_CLUSTER_NAME_HQ || 'microps-cluster';

// How long (in minutes) a service must be idle before scaling to zero
const IDLE_THRESHOLD_MINUTES = parseInt(process.env.IDLE_THRESHOLD_MINUTES || '15');

// How often the scaler runs (in milliseconds)
export const IDLE_SCALER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Idle Scaler Job
 * 
 * Runs on an interval. For every project with an active ECS service:
 * 1. Check if last_deployed_at is older than IDLE_THRESHOLD_MINUTES
 * 2. Check if the ECS service currently has running tasks
 * 3. If both conditions are true → scale desiredCount to 0
 * 
 * This is MicrOps's cost control moat: free-tier users don't burn Fargate
 * capacity when their apps are idle.
 */
export async function runIdleScaler(): Promise<void> {
  try {
    const projects = await getActiveEcsProjects();

    if (projects.length === 0) {
      return; // No active ECS services to manage
    }

    console.log(`[Idle Scaler] Checking ${projects.length} active ECS services...`);

    const now = Date.now();

    for (const project of projects) {
      try {
        // Skip if deployed recently (within threshold)
        if (project.last_deployed_at) {
          const deployedAt = new Date(project.last_deployed_at).getTime();
          const minutesSinceDeploy = (now - deployedAt) / (1000 * 60);
          
          if (minutesSinceDeploy < IDLE_THRESHOLD_MINUTES) {
            continue; // Too recent, skip
          }
        }

        // Check current running count
        const describeRes = await ecsClient.send(new DescribeServicesCommand({
          cluster: AWS_CLUSTER_NAME_HQ,
          services: [project.ecs_service_name],
        }));

        const service = describeRes.services?.find(s => s.status === 'ACTIVE');
        if (!service) continue;

        const runningCount = service.runningCount || 0;
        const desiredCount = service.desiredCount || 0;

        // Already scaled to zero
        if (desiredCount === 0) continue;

        // Service is running and has been idle past the threshold → scale down
        console.log(`[Idle Scaler] Scaling to zero: project ${project.id} (${project.name}) — service ${project.ecs_service_name}, running=${runningCount}, idle for ${IDLE_THRESHOLD_MINUTES}+ minutes`);

        await ecsClient.send(new UpdateServiceCommand({
          cluster: AWS_CLUSTER_NAME_HQ,
          service: project.ecs_service_name,
          desiredCount: 0,
        }));

        console.log(`[Idle Scaler] ✅ Scaled to zero: ${project.ecs_service_name}`);

      } catch (serviceErr: any) {
        // Don't let one project's error stop the entire scan
        console.error(`[Idle Scaler] Error checking project ${project.id}:`, serviceErr.message);
      }
    }
  } catch (err: any) {
    console.error('[Idle Scaler] Fatal error in scaler run:', err.message);
  }
}

/**
 * Start the idle scaler on a repeating interval.
 * Called once from server.ts on boot.
 */
let scalerInterval: ReturnType<typeof setInterval> | null = null;

export function startIdleScaler(): void {
  if (scalerInterval) {
    console.warn('[Idle Scaler] Already running, skipping duplicate start.');
    return;
  }

  console.log(`[Idle Scaler] Started — checking every ${IDLE_SCALER_INTERVAL_MS / 1000}s, threshold: ${IDLE_THRESHOLD_MINUTES} minutes`);
  
  // Run once immediately on boot, then on interval
  runIdleScaler();
  scalerInterval = setInterval(runIdleScaler, IDLE_SCALER_INTERVAL_MS);
}

export function stopIdleScaler(): void {
  if (scalerInterval) {
    clearInterval(scalerInterval);
    scalerInterval = null;
    console.log('[Idle Scaler] Stopped.');
  }
}
