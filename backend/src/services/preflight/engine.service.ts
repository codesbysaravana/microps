import { scanRepository } from './scanner.service';
import { detectorPlugins } from './detectors.service';
import { PreflightReport, ActiveDetection } from '../../types/preflight.types';

export const runPreflightAnalysis = async (repoUrl: string): Promise<PreflightReport> => {
  const startTime = Date.now();
  const blockers: string[] = [];
  let warnings: string[] = [];

  // 1. Scan repo file tree once
  const { owner, repo, fileSet } = await scanRepository(repoUrl);

  if (fileSet.size === 0) {
    blockers.push(`Could not fetch file tree for repository ${repoUrl}. Check if repo is public or URL is valid.`);
    return {
      success: false,
      durationSec: ((Date.now() - startTime) / 1000).toFixed(1),
      radar: { runtime: 'Unknown', framework: 'Unknown', port: 0 },
      environment: { requiredVars: [], warnings: [], blockers },
      costOracle: { computeSpec: 'Unknown', computeMonthly: 0, infrastructureMonthly: 0, totalMonthly: 0 },
    };
  }

  // 2. Run Detectors to find active runtime
  let activeDetection: ActiveDetection | null = null;
  for (const plugin of detectorPlugins) {
    if (plugin.canDetect(fileSet)) {
      activeDetection = await plugin.detect(owner, repo, fileSet);
      break;
    }
  }

  // Default fallback if no known runtime detected
  if (!activeDetection) {
    activeDetection = {
      runtime: 'Docker Custom',
      framework: 'Custom Runtime (Dockerfile)',
      detectedPort: 3000,
      requiredEnvVars: ['PORT'],
      warnings: ['No recognized dependency file found. Relying on custom build.'],
      computeCostMonthly: 11.40,
      computeSpec: '0.25 vCPU / 512MB Fargate Spot',
    };
  }

  if (!fileSet.has('Dockerfile')) {
    activeDetection.warnings.push('No custom Dockerfile detected. MicrOps will generate standard buildpack container.');
  }

  warnings = warnings.concat(activeDetection.warnings || []);

  // 3. Compute Cost Oracle
  const computeMonthly = activeDetection.computeCostMonthly;
  const ecrAndAlbMonthly = 3.28;
  const totalMonthly = computeMonthly + ecrAndAlbMonthly;
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // 4. Format Structured Output
  return {
    success: blockers.length === 0,
    durationSec,
    radar: {
      runtime: activeDetection.runtime,
      framework: activeDetection.framework,
      port: activeDetection.detectedPort,
      deployType: activeDetection.deployType,
      packageManager: activeDetection.packageManager,
    },
    environment: {
      requiredVars: activeDetection.requiredEnvVars,
      warnings,
      blockers,
    },
    costOracle: {
      computeSpec: activeDetection.computeSpec,
      computeMonthly: Number(computeMonthly.toFixed(2)),
      infrastructureMonthly: Number(ecrAndAlbMonthly.toFixed(2)),
      totalMonthly: Number(totalMonthly.toFixed(2)),
    },
    preflightFixes: activeDetection.preflightFixes,
  };
};
