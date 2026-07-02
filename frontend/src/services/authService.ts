import { apiClient } from '../lib/api';
import type { LoginInput, SignupInput } from '../lib/validations';

interface AuthResponse {
  user: { id: number; name: string; email: string };
  token: string;
}

export const authService = {
  login: (data: LoginInput) => apiClient<AuthResponse>('/auth/login', { method: 'POST', data }),
  signup: (data: SignupInput) => apiClient<any>('/auth/signup', { method: 'POST', data }),
  updateProfile: (name: string) => apiClient<{ user: { id: number; name: string; email: string } }>('/auth/profile', { method: 'PUT', data: { name } }),
};
