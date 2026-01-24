import apiClient from '@/lib/api-client';
import { User } from '@/stores/auth-store';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'PROFESSOR';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response = await apiClient.post<RefreshResponse>('/auth/refresh-token', {
      refreshToken,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
