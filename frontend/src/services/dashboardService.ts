import { apiClient } from '../lib/api';

export interface DashboardOverviewData {
  totalProjects: number;
  buildMinutes: {
    used: number;
    limit: number;
  };
  bandwidthGb: {
    used: number;
    limit: number;
  };
  recentProjects: Array<{
    id: number;
    name: string;
    repo_url: string;
    branch?: string;
    language?: string;
    live_url?: string;
    created_at: string;
  }>;
  systemHealth: {
    status: string;
    orchestrator: string;
    region: string;
    timestamp: string;
  };
}

export const dashboardService = {
  getOverview: () => apiClient<DashboardOverviewData>('/dashboard/overview'),
};
