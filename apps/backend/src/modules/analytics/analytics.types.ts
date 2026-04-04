import { Platform } from '../../config/constants';

export interface MetricsData {
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  followers: number;
  followersGained: number;
}

export interface PlatformAnalytics {
  platform: Platform;
  date: string;
  metrics: MetricsData;
}

export interface PostPerformance {
  postId: string;
  text: string;
  platform: Platform;
  publishedAt: Date;
  metrics: MetricsData;
  engagementRate: number;
}

export interface AnalyticsSummary {
  totalPosts: number;
  totalImpressions: number;
  totalEngagement: number;
  totalReach: number;
  avgEngagementRate: number;
  followersGained: number;
  platformBreakdown: Record<Platform, Partial<MetricsData>>;
  periodStart: string;
  periodEnd: string;
}

export interface TrendPoint {
  date: string;
  value: number;
  platform?: Platform;
}

export interface EngagementTrends {
  impressions: TrendPoint[];
  engagement: TrendPoint[];
  followers: TrendPoint[];
}

export interface DateRangeDto {
  startDate: string;
  endDate: string;
}
