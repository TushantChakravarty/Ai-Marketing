import { Plan, Platform, MarketingMode, Tone, Industry } from '../types';

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    postsPerMonth: 10,
    platforms: 2,
    aiPosts: 3,
    features: [
      { label: '10 posts/month', included: true },
      { label: '2 platforms', included: true },
      { label: '3 AI-generated posts', included: true },
      { label: 'Basic analytics', included: true },
      { label: 'Post scheduling', included: false },
      { label: 'Content calendar', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 290,
    postsPerMonth: 60,
    platforms: 3,
    aiPosts: 20,
    features: [
      { label: '60 posts/month', included: true },
      { label: '3 platforms', included: true },
      { label: '20 AI-generated posts', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Post scheduling', included: true },
      { label: 'Content calendar', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 79,
    yearlyPrice: 790,
    postsPerMonth: 'unlimited',
    platforms: 4,
    aiPosts: 'unlimited',
    features: [
      { label: 'Unlimited posts', included: true },
      { label: 'All 4 platforms', included: true },
      { label: 'Unlimited AI posts', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Post scheduling', included: true },
      { label: 'Content calendar', included: true },
      { label: 'Priority support', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    postsPerMonth: 'unlimited',
    platforms: 'unlimited',
    aiPosts: 'unlimited',
    features: [
      { label: 'Unlimited posts', included: true },
      { label: 'Unlimited platforms', included: true },
      { label: 'Unlimited AI posts', included: true },
      { label: 'Custom analytics', included: true },
      { label: 'Post scheduling', included: true },
      { label: 'Content calendar', included: true },
      { label: 'Dedicated support', included: true },
    ],
  },
];

// ─── Platforms ────────────────────────────────────────────────────────────────

export interface PlatformConfig {
  id: Platform;
  name: string;
  icon: string;
  color: string;
  charLimit: number;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: 'twitter',
    color: '#1DA1F2',
    charLimit: 280,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    charLimit: 63206,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    color: '#E1306C',
    charLimit: 2200,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
    charLimit: 3000,
  },
];

// ─── Marketing Modes ──────────────────────────────────────────────────────────

export interface MarketingModeConfig {
  id: MarketingMode;
  title: string;
  description: string;
  icon: string;
  pros: string[];
}

export const MARKETING_MODES: MarketingModeConfig[] = [
  {
    id: 'manual',
    title: 'Manual',
    description: 'You write every post. Full creative control.',
    icon: 'pencil',
    pros: ['Full creative control', 'Authentic voice', 'No AI involvement'],
  },
  {
    id: 'ai',
    title: 'AI Autopilot',
    description: 'AI generates and schedules posts automatically.',
    icon: 'robot',
    pros: ['Fully automated', 'Consistent posting', 'AI-optimized content'],
  },
  {
    id: 'hybrid',
    title: 'Hybrid',
    description: 'AI drafts posts, you approve before publishing.',
    icon: 'tune',
    pros: ['AI assistance', 'Human approval', 'Best of both worlds'],
  },
];

// ─── Tones ────────────────────────────────────────────────────────────────────

export interface ToneConfig {
  id: Tone;
  label: string;
  description: string;
  emoji: string;
}

export const TONES: ToneConfig[] = [
  { id: 'professional', label: 'Professional', description: 'Formal and authoritative', emoji: '💼' },
  { id: 'casual', label: 'Casual', description: 'Friendly and approachable', emoji: '😊' },
  { id: 'humorous', label: 'Humorous', description: 'Fun and witty', emoji: '😄' },
  { id: 'inspirational', label: 'Inspirational', description: 'Motivating and uplifting', emoji: '🌟' },
  { id: 'educational', label: 'Educational', description: 'Informative and insightful', emoji: '📚' },
  { id: 'promotional', label: 'Promotional', description: 'Sales and offers focused', emoji: '🎯' },
];

// ─── Industries ───────────────────────────────────────────────────────────────

export interface IndustryConfig {
  id: Industry;
  label: string;
  icon: string;
}

export const INDUSTRIES: IndustryConfig[] = [
  { id: 'technology', label: 'Technology', icon: 'laptop' },
  { id: 'retail', label: 'Retail', icon: 'store' },
  { id: 'healthcare', label: 'Healthcare', icon: 'hospital' },
  { id: 'finance', label: 'Finance', icon: 'bank' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'food_beverage', label: 'Food & Beverage', icon: 'food' },
  { id: 'real_estate', label: 'Real Estate', icon: 'home-city' },
  { id: 'fitness', label: 'Fitness', icon: 'dumbbell' },
  { id: 'beauty', label: 'Beauty', icon: 'spa' },
  { id: 'travel', label: 'Travel', icon: 'airplane' },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { id: 'nonprofit', label: 'Non-Profit', icon: 'hand-heart' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal' },
];

// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = 'AI Marketing';
export const APP_VERSION = '1.0.0';
export const SUPPORT_EMAIL = 'support@aimarketing.app';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@aimarketing/access_token',
  REFRESH_TOKEN: '@aimarketing/refresh_token',
  USER: '@aimarketing/user',
  CURRENT_BUSINESS: '@aimarketing/current_business',
  ONBOARDING_COMPLETED: '@aimarketing/onboarding_completed',
  THEME: '@aimarketing/theme',
} as const;

export const POST_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
  processing: 'Processing',
};

export const CREDIT_PACKAGES = [
  { credits: 10, price: 5, label: '10 Credits — $5' },
  { credits: 25, price: 10, label: '25 Credits — $10' },
  { credits: 100, price: 35, label: '100 Credits — $35' },
];
