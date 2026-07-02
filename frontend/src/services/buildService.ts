import { apiClient } from '../lib/api';

export interface DeployInput {
  repoUrl: string;
  branch: string;
  buildCommand: string;
  projectName: string;
  envContent?: string;
  installCommand?: string;
  runtime?: string;
  projectId?: number;
}

export interface DeployResponse {
  status: string;
  jobId: string;
  internalId: string;
  message: string;
}

export const buildService = {
  deploy: (data: DeployInput) => 
    apiClient<DeployResponse>('/build/deploy', {
      method: 'POST',
      data,
    }),
};
