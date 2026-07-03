import React, { useMemo } from 'react';

interface PipelineStep {
  name: string;
  status: 'done' | 'active' | 'error' | 'pending';
  duration: string;
}

interface PipelineViewProps {
  isDeploying: boolean;
  diagnosticReport: any;
  buildLogs?: string[];
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  isDeploying,
  diagnosticReport,
  buildLogs = [],
}) => {
  const steps: PipelineStep[] = useMemo(() => {
    const fullLogText = buildLogs.join(' ').toLowerCase();
    const hasError =
      !!diagnosticReport ||
      buildLogs.some(
        (l) =>
          l.toLowerCase().includes('error') ||
          l.toLowerCase().includes('failed') ||
          l.includes('❌')
      );

    // Identify milestones from real build logs
    const hasPreflightStart =
      isDeploying ||
      fullLogText.includes('starting deployment sequence') ||
      fullLogText.includes('pre-flight intelligence scanner');
    const hasPreflightDone =
      fullLogText.includes('scanner result: passed') ||
      fullLogText.includes('starting build stage') ||
      fullLogText.includes('queued for build worker') ||
      fullLogText.includes('initializing workspace');

    const hasBuildStart =
      hasPreflightDone &&
      (fullLogText.includes('starting build stage') ||
        fullLogText.includes('queued for build worker') ||
        fullLogText.includes('initializing workspace'));
    const hasBuildDone =
      fullLogText.includes('building docker image') ||
      fullLogText.includes('logging into aws ecr') ||
      fullLogText.includes('build successful');

    const hasContainerizeStart = fullLogText.includes('building docker image');
    const hasContainerizeDone =
      fullLogText.includes('logging into aws ecr') ||
      fullLogText.includes('tagging image') ||
      fullLogText.includes('pushing image');

    const hasPushStart =
      fullLogText.includes('logging into aws ecr') ||
      fullLogText.includes('tagging image') ||
      fullLogText.includes('pushing image');
    const hasPushDone =
      fullLogText.includes('cleaning up') ||
      fullLogText.includes('build & push completed successfully') ||
      fullLogText.includes('ecs deployment started');

    const hasProvisionStart =
      fullLogText.includes('ecs deployment started') ||
      fullLogText.includes('cleaning up');
    const hasProvisionDone =
      fullLogText.includes('network routing configured') ||
      fullLogText.includes('service updated successfully') ||
      fullLogText.includes('create service') ||
      fullLogText.includes('deployed successfully');

    const hasDeployStart =
      hasProvisionDone ||
      fullLogText.includes('update service') ||
      fullLogText.includes('create service') ||
      fullLogText.includes('network routing configured');
    const hasDeployDone =
      fullLogText.includes('service updated successfully') ||
      fullLogText.includes('app live at') ||
      fullLogText.includes('deployed successfully');

    const hasComplete =
      fullLogText.includes('deployed successfully') ||
      fullLogText.includes('service updated successfully') ||
      fullLogText.includes('app live at');

    // Helper to compute step status
    const getStatus = (
      isStarted: boolean,
      isDone: boolean,
      isNextStarted: boolean
    ): 'done' | 'active' | 'error' | 'pending' => {
      if (hasError && isStarted && !isDone) return 'error';
      if (hasError && !isStarted) return 'pending';
      if (isDone) return 'done';
      if (isStarted || (hasError && isNextStarted)) return hasError ? 'error' : 'active';
      return 'pending';
    };

    // If we have no logs yet and not deploying, default to idle/done or pending
    if (!isDeploying && buildLogs.length === 0) {
      return [
        { name: 'Pre-flight', status: 'done', duration: '2s' },
        { name: 'Build', status: 'done', duration: '12s' },
        { name: 'Containerize', status: 'done', duration: '16s' },
        { name: 'Push', status: 'done', duration: '8s' },
        { name: 'Provision', status: 'done', duration: '18s' },
        { name: 'Deploy', status: 'done', duration: '14s' },
        { name: 'Health', status: 'done', duration: '5s' },
        { name: 'Traffic', status: 'done', duration: '3s' },
        { name: 'Complete', status: 'done', duration: '1s' },
      ];
    }

    const preflightStatus = getStatus(hasPreflightStart, hasPreflightDone, hasBuildStart);
    const buildStatus = getStatus(hasBuildStart || hasPreflightDone, hasBuildDone, hasContainerizeStart);
    const containerizeStatus = getStatus(hasContainerizeStart || hasBuildDone, hasContainerizeDone, hasPushStart);
    const pushStatus = getStatus(hasPushStart || hasContainerizeDone, hasPushDone, hasProvisionStart);
    const provisionStatus = getStatus(hasProvisionStart || hasPushDone, hasProvisionDone, hasDeployStart);
    const deployStatus = getStatus(hasDeployStart || hasProvisionDone, hasDeployDone, hasComplete);
    const healthStatus = getStatus(hasDeployStart, hasComplete, hasComplete);
    const trafficStatus = getStatus(hasProvisionDone, hasComplete, hasComplete);
    const completeStatus = hasComplete ? 'done' : hasError ? 'error' : 'pending';

    return [
      { name: 'Pre-flight', status: preflightStatus, duration: preflightStatus === 'done' ? '2.4s' : preflightStatus === 'active' ? 'Running...' : '-' },
      { name: 'Build', status: buildStatus, duration: buildStatus === 'done' ? '14.2s' : buildStatus === 'active' ? 'Compiling...' : '-' },
      { name: 'Containerize', status: containerizeStatus, duration: containerizeStatus === 'done' ? '18.1s' : containerizeStatus === 'active' ? 'Packaging...' : '-' },
      { name: 'Push', status: pushStatus, duration: pushStatus === 'done' ? '9.5s' : pushStatus === 'active' ? 'Pushing ECR...' : '-' },
      { name: 'Provision', status: provisionStatus, duration: provisionStatus === 'done' ? '21.0s' : provisionStatus === 'active' ? 'Allocating ECS...' : '-' },
      { name: 'Deploy', status: deployStatus, duration: deployStatus === 'done' ? '15.3s' : deployStatus === 'active' ? 'Updating Task...' : '-' },
      { name: 'Health', status: healthStatus, duration: healthStatus === 'done' ? '5.8s' : healthStatus === 'active' ? 'Probing...' : '-' },
      { name: 'Traffic', status: trafficStatus, duration: trafficStatus === 'done' ? '3.2s' : trafficStatus === 'active' ? 'Routing ALB...' : '-' },
      { name: 'Complete', status: completeStatus, duration: completeStatus === 'done' ? 'Live 🚀' : '-' },
    ];
  }, [buildLogs, isDeploying, diagnosticReport]);

  const getCardStyles = (status: PipelineStep['status']) => {
    switch (status) {
      case 'done':
        return 'bg-surface border-success/40 text-ivory hover:border-success/70 shadow-sm';
      case 'active':
        return 'bg-gradient-to-br from-gold/15 via-surface to-surface border-gold text-ivory shadow-[0_0_20px_rgba(201,152,45,0.2)] scale-[1.02] ring-1 ring-gold/40';
      case 'error':
        return 'bg-error/15 border-error text-ivory shadow-[0_0_20px_rgba(239,68,68,0.25)]';
      case 'pending':
      default:
        return 'bg-obsidian/60 border-border-subtle/50 text-text-muted opacity-60';
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-headline-md text-base text-ivory font-semibold">
            Execution Pipeline
          </h3>
          {isDeploying && !diagnosticReport && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold/10 text-gold border border-gold/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold"></span>
              </span>
              LIVE STREAMING
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-text-muted">
          {steps.filter((s) => s.status === 'done').length} / {steps.length} Steps Completed
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5 font-mono text-[11px]">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border flex flex-col justify-between min-h-[76px] transition-all duration-300 ease-out ${getCardStyles(
              step.status
            )}`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="font-bold truncate text-[12px] tracking-tight">
                {step.name}
              </span>
              <div className="shrink-0 flex items-center">
                {step.status === 'done' && (
                  <span className="w-4 h-4 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
                {step.status === 'active' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                  </span>
                )}
                {step.status === 'error' && (
                  <span className="w-4 h-4 rounded-full bg-error/20 text-error flex items-center justify-center text-[10px] font-bold">
                    ✕
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold opacity-75 truncate">
                {step.duration}
              </span>
              {step.status === 'active' && (
                <span className="text-[9px] uppercase tracking-wider text-gold font-bold">
                  Active
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
