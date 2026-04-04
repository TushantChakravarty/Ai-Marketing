import { Platform } from '../../config/constants';

export interface PlatformConnection {
  id: string;
  business: string;
  platform: Platform;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  platformUserId: string;
  platformUsername: string;
  isActive: boolean;
  connectedAt: Date;
}

export interface PlatformPost {
  platformPostId: string;
  platform: Platform;
  url?: string;
  publishedAt: Date;
}

export interface OAuthCallbackDto {
  code: string;
  state: string;
  businessId?: string;
}

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  url?: string;
  error?: string;
}

export interface PlatformAnalyticsData {
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}
