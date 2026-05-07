// ─── Enums ────────────────────────────────────────────────────────────────────

export type AdPlatform = 'meta';

export type CampaignObjective =
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'LEADS'
  | 'APP_PROMOTION'
  | 'SALES';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'failed';

export type BillingEvent = 'IMPRESSIONS' | 'LINK_CLICKS' | 'POST_ENGAGEMENT';

export type OptimizationGoal =
  | 'REACH'
  | 'LINK_CLICKS'
  | 'IMPRESSIONS'
  | 'LEAD_GENERATION'
  | 'CONVERSIONS'
  | 'POST_ENGAGEMENT';

export type CampaignCTA =
  | 'LEARN_MORE'
  | 'SHOP_NOW'
  | 'SIGN_UP'
  | 'CONTACT_US'
  | 'GET_QUOTE'
  | 'BOOK_NOW'
  | 'DOWNLOAD';

// ─── Targeting ────────────────────────────────────────────────────────────────

export interface AudienceTargeting {
  ageMin?: number;
  ageMax?: number;
  genders?: ('male' | 'female' | 'all')[];
  countries?: string[];
  cities?: string[];
  interests?: { id: string; name: string }[];
  customAudienceIds?: string[];
  excludedAudienceIds?: string[];
}

export interface MetaInterest {
  id: string;
  name: string;
}

// ─── Creative ─────────────────────────────────────────────────────────────────

export interface AdCreative {
  headline: string;
  bodyText: string;
  callToAction: CampaignCTA;
  imageUrls?: string[];
  videoUrl?: string;
  linkUrl?: string;
  displayLink?: string;
  metaAdCreativeId?: string;
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export interface AdBudget {
  type: 'daily' | 'lifetime';
  amount: number;
  currency: string;
  startDate: string;
  endDate?: string;
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface AdMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  cpm: number;
  cpc: number;
  ctr: number;
  conversions: number;
  costPerConversion: number;
  frequency: number;
  lastSyncedAt: string;
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  _id: string;
  business: string;
  owner: string;
  platform: AdPlatform;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  budget: AdBudget;
  targeting: AudienceTargeting;
  placements: string[];
  optimizationGoal: OptimizationGoal;
  billingEvent: BillingEvent;
  creative: AdCreative;
  metaAdAccountId: string;
  selectedPlatforms: string[];
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaAdId?: string;
  metrics?: AdMetrics;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateCampaignDto {
  businessId: string;
  platform: AdPlatform;
  name: string;
  objective: CampaignObjective;
  budget: AdBudget;
  targeting: AudienceTargeting;
  placements: string[];
  optimizationGoal: OptimizationGoal;
  billingEvent: BillingEvent;
  creative: AdCreative;
  metaAdAccountId: string;
  selectedPlatforms: string[];
}

export interface UpdateCampaignDto {
  name?: string;
  budget?: Partial<AdBudget>;
  targeting?: AudienceTargeting;
  creative?: Partial<AdCreative>;
}

export interface GetCampaignsQuery {
  businessId: string;
  status?: CampaignStatus;
  platform?: AdPlatform;
  page?: number;
  limit?: number;
}

// ─── UI Config ────────────────────────────────────────────────────────────────

export const OBJECTIVES: { value: CampaignObjective; label: string; icon: string; description: string }[] = [
  { value: 'AWARENESS', label: 'Awareness', icon: 'bullhorn', description: 'Reach people likely to remember your ad' },
  { value: 'TRAFFIC', label: 'Traffic', icon: 'cursor-pointer', description: 'Send people to a destination' },
  { value: 'ENGAGEMENT', label: 'Engagement', icon: 'heart-outline', description: 'Get more post likes, comments & shares' },
  { value: 'LEADS', label: 'Leads', icon: 'account-plus-outline', description: 'Collect leads for your business' },
  { value: 'SALES', label: 'Sales', icon: 'cart-outline', description: 'Drive purchases on your website' },
];

export const CTA_OPTIONS: { value: CampaignCTA; label: string }[] = [
  { value: 'LEARN_MORE', label: 'Learn More' },
  { value: 'SHOP_NOW', label: 'Shop Now' },
  { value: 'SIGN_UP', label: 'Sign Up' },
  { value: 'CONTACT_US', label: 'Contact Us' },
  { value: 'GET_QUOTE', label: 'Get Quote' },
  { value: 'BOOK_NOW', label: 'Book Now' },
  { value: 'DOWNLOAD', label: 'Download' },
];

export const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: '#9E9E9E', icon: 'pencil-outline' },
  active: { label: 'Active', color: '#4CAF50', icon: 'play-circle-outline' },
  paused: { label: 'Paused', color: '#FF9800', icon: 'pause-circle-outline' },
  completed: { label: 'Completed', color: '#2196F3', icon: 'check-circle-outline' },
  failed: { label: 'Failed', color: '#F44336', icon: 'alert-circle-outline' },
};
