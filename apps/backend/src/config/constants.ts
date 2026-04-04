export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: '',
    limits: {
      posts: 10,
      businesses: 1,
      platforms: 2,
      aiGenerations: 5,
      teamMembers: 1,
    },
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? '',
    limits: {
      posts: 100,
      businesses: 3,
      platforms: 4,
      aiGenerations: 50,
      teamMembers: 3,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 79,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
    limits: {
      posts: 500,
      businesses: 10,
      platforms: -1, // unlimited
      aiGenerations: 200,
      teamMembers: 10,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '',
    limits: {
      posts: -1,
      businesses: -1,
      platforms: -1,
      aiGenerations: -1,
      teamMembers: -1,
    },
  },
} as const;

export const PLATFORMS = ['twitter', 'facebook', 'instagram', 'linkedin'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const POST_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHING: 'publishing',
  PUBLISHED: 'published',
  FAILED: 'failed',
} as const;
export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

export const POST_MODE = {
  MANUAL: 'manual',
  AI: 'ai',
} as const;
export type PostMode = (typeof POST_MODE)[keyof typeof POST_MODE];

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  INCOMPLETE: 'incomplete',
} as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const MARKETING_MODE = {
  MANUAL: 'manual',
  AI: 'ai',
  HYBRID: 'hybrid',
} as const;
export type MarketingMode = (typeof MARKETING_MODE)[keyof typeof MARKETING_MODE];

export const TONE = {
  PROFESSIONAL: 'professional',
  CASUAL: 'casual',
  HUMOROUS: 'humorous',
  INSPIRATIONAL: 'inspirational',
  EDUCATIONAL: 'educational',
  PROMOTIONAL: 'promotional',
} as const;
export type Tone = (typeof TONE)[keyof typeof TONE];

export const INDUSTRY_LIST = [
  'technology',
  'healthcare',
  'finance',
  'education',
  'retail',
  'food_beverage',
  'travel',
  'real_estate',
  'fitness',
  'beauty',
  'entertainment',
  'nonprofit',
  'consulting',
  'manufacturing',
  'other',
] as const;
export type Industry = (typeof INDUSTRY_LIST)[number];

export const SENTIMENT = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
} as const;

export const QUEUE_NAMES = {
  POST_SCHEDULER: 'post-scheduler',
  ANALYTICS_SYNC: 'analytics-sync',
  EMAIL: 'email',
} as const;

export const CACHE_TTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 3600,     // 1 hour
  DAY: 86400,     // 24 hours
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const PASSWORD_RESET_EXPIRY_HOURS = 2;
export const EMAIL_VERIFY_EXPIRY_HOURS = 24;
export const OTP_LENGTH = 6;
export const SALT_ROUNDS = 12;
export const MAX_RETRY_ATTEMPTS = 3;
