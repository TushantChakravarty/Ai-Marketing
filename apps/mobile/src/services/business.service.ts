import apiClient from './api.service';
import {
  ApiResponse,
  Business,
  PlatformConnection,
  Platform,
} from '../types';

export interface CreateBusinessData {
  name: string;
  description: string;
  industry: string;
  tone: string;
  targetAudience: string;
  marketingMode: string;
  website?: string;
}

export interface ConnectPlatformData {
  platform: Platform;
  authCode: string;
  redirectUri: string;
}

export const BusinessService = {
  async createBusiness(
    data: CreateBusinessData,
  ): Promise<ApiResponse<Business>> {
    const response = await apiClient.post<ApiResponse<Business>>(
      '/businesses',
      data,
    );
    return response.data;
  },

  async getBusiness(businessId: string): Promise<ApiResponse<Business>> {
    const response = await apiClient.get<ApiResponse<Business>>(
      `/businesses/${businessId}`,
    );
    return response.data;
  },

  async getMyBusinesses(): Promise<ApiResponse<Business[]>> {
    const response = await apiClient.get<ApiResponse<Business[]>>(
      '/businesses/me',
    );
    return response.data;
  },

  async updateBusiness(
    businessId: string,
    data: Partial<CreateBusinessData>,
  ): Promise<ApiResponse<Business>> {
    const response = await apiClient.patch<ApiResponse<Business>>(
      `/businesses/${businessId}`,
      data,
    );
    return response.data;
  },

  async connectPlatform(
    businessId: string,
    data: ConnectPlatformData,
  ): Promise<ApiResponse<PlatformConnection>> {
    const response = await apiClient.post<ApiResponse<PlatformConnection>>(
      `/businesses/${businessId}/platforms/connect`,
      data,
    );
    return response.data;
  },

  async disconnectPlatform(
    businessId: string,
    platform: Platform,
  ): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/businesses/${businessId}/platforms/${platform}`,
    );
    return response.data;
  },

  async getPlatformConnections(
    businessId: string,
  ): Promise<ApiResponse<PlatformConnection[]>> {
    const response = await apiClient.get<ApiResponse<PlatformConnection[]>>(
      `/businesses/${businessId}/platforms`,
    );
    return response.data;
  },
};
