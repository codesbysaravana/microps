export type DeployType = 'FRONTEND_SPA' | 'BACKEND_API' | 'FULLSTACK' | 'CUSTOM_CONTAINER';
export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export interface PreflightFix {
  fix: 'SET_INSTALL_CMD' | 'SET_BUILD_CMD' | 'SET_START_CMD' | 'SET_RUNTIME' | 'SET_PACKAGE_MANAGER';
  value: string;
  reason: string;
}

export interface ActiveDetection {
  runtime: string;
  framework: string;
  detectedPort: number;
  requiredEnvVars: string[];
  warnings: string[];
  computeCostMonthly: number;
  computeSpec: string;
  // v2: New fields (all optional to preserve backward compat)
  deployType?: DeployType;
  packageManager?: PackageManager;
  preflightFixes?: PreflightFix[];
}

export interface IDetector {
  name: string;
  canDetect: (fileSet: Set<string>) => boolean;
  detect: (owner: string, repo: string, fileSet: Set<string>) => Promise<ActiveDetection>;
}

export interface PreflightReport {
  success: boolean;
  durationSec: string;
  radar: {
    runtime: string;
    framework: string;
    port: number;
    deployType?: DeployType;
    packageManager?: PackageManager;
  };
  environment: {
    requiredVars: string[];
    warnings: string[];
    blockers: string[];
  };
  costOracle: {
    computeSpec: string;
    computeMonthly: number;
    infrastructureMonthly: number;
    totalMonthly: number;
  };
  preflightFixes?: PreflightFix[];
}
