export interface ActiveDetection {
  runtime: string;
  framework: string;
  detectedPort: number;
  requiredEnvVars: string[];
  warnings: string[];
  computeCostMonthly: number;
  computeSpec: string;
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
}
