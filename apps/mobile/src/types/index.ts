// ─── Enums & Union Types ────────────────────────────────────────────────────

export type MarketingMode = 'manual' | 'ai' | 'hybrid';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'processing';

export type Platform = 'twitter' | 'facebook' | 'instagram' | 'linkedin';

export type Tone = 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational' | 'promotional';

export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

export type Industry =
  | 'technology'
  | 'retail'
  | 'healthcare'
  | 'finance'
  | 'education'
  | 'food_beverage'
  | 'real_estate'
  | 'fitness'
  | 'beauty'
  | 'travel'
  | 'entertainment'
  | 'nonprofit'
  | 'other';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Platform Ad Config ───────────────────────────────────────────────────────

export interface PlatformAdConfig {
  platform: Platform;
  enabled: boolean;
  costPerAd: number;  // in cents
  currency: string;
}

// ─── Business ────────────────────────────────────────────────────────────────

export interface Business {
  id: string;
  userId: string;
  name: string;
  description: string;
  industry: Industry;
  tone: Tone;
  targetAudience: string;
  marketingMode: MarketingMode;
  logoUrl?: string;
  website?: string;
  platformAdConfigs?: PlatformAdConfig[];
  createdAt: string;
  updatedAt: string;
}

// ─── Platform Connection ──────────────────────────────────────────────────────

export interface PlatformConnection {
  id: string;
  platform: Platform;
  accountName: string;
  accountId: string;
  isActive: boolean;
  expiresAt?: string;
  connectedAt: string;
}

// ─── Post ────────────────────────────────────────────────────────────────────

export interface PostMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface PlatformPostStatus {
  platform: Platform;
  status: PostStatus;
  platformPostId?: string;
  errorMessage?: string;
  publishedAt?: string;
}

export interface PostPlatformEntry {
  platform: Platform;
  status: PostStatus;
  platformPostId?: string;
  publishedAt?: string;
  error?: string;
}

export interface Post {
  id: string;
  business: string;
  content: {
    text: string;
    mediaUrls: string[];
    hashtags: string[];
  };
  platforms: PostPlatformEntry[];
  status: PostStatus;
  mode: 'manual' | 'ai';
  aiPrompt?: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalPosts: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagements: number;
  engagementRate: number;
  followersGained: number;
  periodStart: string;
  periodEnd: string;
}

export interface PlatformAnalytics {
  platform: Platform;
  followers: number;
  followersGained: number;
  reach: number;
  impressions: number;
  engagements: number;
  engagementRate: number;
  postsCount: number;
}

export interface PostPerformance {
  postId: string;
  content: string;
  platform: Platform;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  publishedAt: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  platform?: Platform;
}

// ─── Billing / Subscription ──────────────────────────────────────────────────

export interface PlanFeature {
  label: string;
  included: boolean;
  limit?: string;
}

export interface Plan {
  id: PlanType;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  postsPerMonth: number | 'unlimited';
  platforms: number | 'unlimited';
  aiPosts: number | 'unlimited';
  features: PlanFeature[];
}

export interface Subscription {
  id: string;
  userId: string;
  planType: PlanType;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  credits: number;
  postsUsed: number;
  postsLimit: number | null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Navigation Param Lists ───────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  BusinessSetup: undefined;
};

export type MainDrawerParamList = {
  Tabs: undefined;
  BusinessSetup: undefined;
  Billing: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Posts: undefined;
  Ads: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type PostsStackParamList = {
  PostsList: undefined;
  CreatePost: { mode?: 'manual' | 'ai' };
  PostDetail: { postId: string };
};

export type AdsStackParamList = {
  CampaignsList: undefined;
  CreateCampaign: undefined;
  CampaignDetail: { campaignId: string };
};

export type RootStackParamList = AuthStackParamList &
  OnboardingStackParamList &
  MainDrawerParamList &
  TabParamList &
  PostsStackParamList &
  AdsStackParamList;
