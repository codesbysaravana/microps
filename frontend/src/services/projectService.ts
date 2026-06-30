import { apiClient } from '../lib/api';

export interface Project {
  id: number;
  user_id: number;
  name: string;
  repo_url: string;
  branch: string;
  language: string;
  framework: string;
  install_command: string;
  build_command: string;
  created_at: string;
  liveUrl: string;
}

export const projectService = {
  getProjects: () => apiClient<{ success: boolean; projects: Project[] }>('/projects'),
  updateProject: (id: number, data: { branch: string; buildCommand: string; installCommand: string }) =>
    apiClient<{ success: boolean; project: Project }>(`/projects/${id}`, { method: 'PUT', data }),
  deleteProject: (id: number) => apiClient<{ success: boolean; message: string }>(`/projects/${id}`, { method: 'DELETE' }),
};