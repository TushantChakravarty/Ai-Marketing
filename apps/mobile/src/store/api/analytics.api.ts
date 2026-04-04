import { baseApi } from './base.api';
import {
  ApiResponse,
  AnalyticsSummary,
  PlatformAnalytics,
  PostPerformance,
  TrendDataPoint,
  Platform,
} from '../../types';

interface DashboardData {
  summary: AnalyticsSummary;
  platformBreakdown: PlatformAnalytics[];
  topPosts: PostPerformance[];
}

interface TrendsResponse {
  engagement: TrendDataPoint[];
  reach: TrendDataPoint[];
  impressions: TrendDataPoint[];
}

interface AnalyticsParams {
  businessId: string;
  startDate: string;
  endDate: string;
  platform?: Platform;
}

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getDashboard: builder.query<
      ApiResponse<DashboardData>,
      { businessId: string; startDate: string; endDate: string }
    >({
      query: params => ({ url: '/analytics/dashboard', params }),
      providesTags: ['Analytics'],
    }),

    getPlatformAnalytics: builder.query<
      ApiResponse<PlatformAnalytics[]>,
      AnalyticsParams
    >({
      query: params => ({ url: '/analytics/platforms', params }),
      providesTags: ['Analytics'],
    }),

    getTopPosts: builder.query<
      ApiResponse<PostPerformance[]>,
      AnalyticsParams & { limit?: number }
    >({
      query: params => ({ url: '/analytics/top-posts', params }),
      providesTags: ['Analytics'],
    }),

    getTrends: builder.query<ApiResponse<TrendsResponse>, AnalyticsParams>({
      query: params => ({ url: '/analytics/trends', params }),
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetPlatformAnalyticsQuery,
  useGetTopPostsQuery,
  useGetTrendsQuery,
} = analyticsApi;
