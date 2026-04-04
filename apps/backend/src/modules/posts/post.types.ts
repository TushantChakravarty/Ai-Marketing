import { PostStatus, PostMode, Platform } from '../../config/constants';

export interface PlatformPostStatus {
  platform: Platform;
  status: PostStatus;
  platformPostId?: string;
  publishedAt?: Date;
  error?: string;
}

export interface EngagementStats {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
}

export interface Post {
  id: string;
  business: string;
  author: string;
  content: {
    text: string;
    mediaUrls: string[];
    hashtags: string[];
  };
  platforms: PlatformPostStatus[];
  scheduledAt?: Date;
  publishedAt?: Date;
  status: PostStatus;
  mode: PostMode;
  aiPrompt?: string;
  engagementStats: Record<Platform, EngagementStats>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostDto {
  businessId: string;
  text: string;
  mediaUrls?: string[];
  hashtags?: string[];
  platforms: Platform[];
  mode?: PostMode;
  aiPrompt?: string;
}

export interface SchedulePostDto {
  scheduledAt: string; // ISO date string
}

export interface UpdatePostDto {
  text?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  platforms?: Platform[];
  aiPrompt?: string;
}
