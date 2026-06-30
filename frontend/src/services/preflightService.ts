import { apiClient } from '../lib/api';

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

export const preflightService = {
  analyze: (repoUrl: string) => 
    apiClient<PreflightReport>('/preflight/analyze', { 
      method: 'POST', 
      data: { repoUrl } 
    }),
};
