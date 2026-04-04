import {
  AdPlatform,
  CampaignObjective,
  CampaignStatus,
  AdPlacement,
  OptimizationGoal,
  BillingEvent,
  AudienceTargeting,
  AdCreative,
  AdBudget,
  ICampaign,
} from './ads.model';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateCampaignDto {
  businessId: string;
  platform: AdPlatform;
  name: string;
  objective: CampaignObjective;
  budget: AdBudget;
  targeting: AudienceTargeting;
  placements: AdPlacement[];
  optimizationGoal: OptimizationGoal;
  billingEvent: BillingEvent;
  creative: AdCreative;
  metaAdAccountId: string;
}

export interface UpdateCampaignDto {
  name?: string;
  budget?: Partial<AdBudget>;
  targeting?: AudienceTargeting;
  creative?: Partial<AdCreative>;
  status?: CampaignStatus;
}

export interface GetCampaignsQuery {
  businessId: string;
  status?: CampaignStatus;
  platform?: AdPlatform;
  page?: number;
  limit?: number;
}

// ─── Meta API types ───────────────────────────────────────────────────────────

export interface MetaCampaignCreateResult {
  campaignId: string;
  adSetId: string;
  adCreativeId: string;
  adId: string;
}

export interface MetaInsights {
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  cpm: string;
  cpc: string;
  ctr: string;
  frequency: string;
  actions?: { action_type: string; value: string }[];
}

// ─── Interest Search ──────────────────────────────────────────────────────────

export interface MetaInterest {
  id: string;
  name: string;
  audience_size_lower_bound?: number;
  audience_size_upper_bound?: number;
  path?: string[];
  topic?: string;
}
