import apiClient from './api.service';
import {
  ApiResponse,
  AuthTokens,
  User,
  LoginCredentials,
  RegisterData,
} from '../types';

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export const AuthService = {
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data,
    );
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials,
    );
    return response.data;
  },

  async logout(refreshToken: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>('/auth/logout', {
      refreshToken,
    });
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshResponse>> {
    const response = await apiClient.post<ApiResponse<RefreshResponse>>(
      '/auth/refresh',
      { refreshToken },
    );
    return response.data;
  },

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>(
      '/auth/forgot-password',
      { email },
    );
    return response.data;
  },

  async resetPassword(data: {
    token: string;
    password: string;
  }): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>(
      '/auth/reset-password',
      data,
    );
    return response.data;
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },
};
