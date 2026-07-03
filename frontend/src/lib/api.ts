import { useAuthStore } from '../store/useAuthStore';

export const BASE_URL = import.meta.env.VITE_API_URL || 'https://microps.in/api/v1';

interface FetchOptions extends RequestInit {
  data?: any;
}

export const apiClient = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { data, headers, ...customConfig } = options;
  const token = useAuthStore.getState().token;

  const config: RequestInit = {
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const result = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      // Auto-logout on 401 Unauthorized
      useAuthStore.getState().logout();
    }
    throw new Error(result.message || 'API Error');
  }

  return (result.data !== undefined ? result.data : result) as T;
};
