import apiClient from './api.service';
import {
  ApiResponse,
  AnalyticsSummary,
  PlatformAnalytics,
  PostPerformance,
  TrendDataPoint,
  Platform,
} from '../types';

export interface DashboardData {
  summary: AnalyticsSummary;
  platformBreakdown: PlatformAnalytics[];
  topPosts: PostPerformance[];
}

export interface GetAnalyticsParams {
  businessId: string;
  startDate: string;
  endDate: string;
  platform?: Platform;
}

export interface TrendsResponse {
  engagement: TrendDataPoint[];
  reach: TrendDataPoint[];
  impressions: TrendDataPoint[];
}

export const AnalyticsService = {
  async getDashboard(
    businessId: string,
    params: { startDate: string; endDate: string },
  ): Promise<ApiResponse<DashboardData>> {
    const response = await apiClient.get<ApiResponse<DashboardData>>(
      `/analytics/dashboard`,
      { params: { businessId, ...params } },
    );
    return response.data;
  },

  async getPlatformAnalytics(
    params: GetAnalyticsParams,
  ): Promise<ApiResponse<PlatformAnalytics[]>> {
    const response = await apiClient.get<ApiResponse<PlatformAnalytics[]>>(
      '/analytics/platforms',
      { params },
    );
    return response.data;
  },

  async getTopPosts(
    params: GetAnalyticsParams & { limit?: number },
  ): Promise<ApiResponse<PostPerformance[]>> {
    const response = await apiClient.get<ApiResponse<PostPerformance[]>>(
      '/analytics/top-posts',
      { params },
    );
    return response.data;
  },

  async getTrends(
    params: GetAnalyticsParams,
  ): Promise<ApiResponse<TrendsResponse>> {
    const response = await apiClient.get<ApiResponse<TrendsResponse>>(
      '/analytics/trends',
      { params },
    );
    return response.data;
  },
};
