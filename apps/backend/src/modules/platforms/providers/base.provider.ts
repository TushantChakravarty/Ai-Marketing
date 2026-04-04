import { PublishResult, PlatformAnalyticsData } from '../platform.types';

export interface PostContent {
  text: string;
  mediaUrls?: string[];
  hashtags?: string[];
}

export abstract class BasePlatformProvider {
  protected accessToken: string;
  protected refreshToken?: string;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  abstract publishPost(content: PostContent): Promise<PublishResult>;
  abstract getAnalytics(postId: string): Promise<PlatformAnalyticsData>;
  abstract refreshAccessToken(): Promise<{ accessToken: string; refreshToken?: string; expiry?: Date }>;
  abstract validateConnection(): Promise<boolean>;
  abstract getProfileInfo(): Promise<{ userId: string; username: string; displayName?: string }>;
}
