import mongoose, { Document, Schema } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type AdPlatform = 'meta'; // extensible: 'google' | 'tiktok' | 'linkedin'

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

export type AdPlacement =
  | 'facebook_feed'
  | 'instagram_feed'
  | 'instagram_stories'
  | 'facebook_stories'
  | 'facebook_reels'
  | 'instagram_reels'
  | 'audience_network';

// ─── Targeting ────────────────────────────────────────────────────────────────

export interface AudienceTargeting {
  ageMin?: number;
  ageMax?: number;
  genders?: ('male' | 'female' | 'all')[];
  countries?: string[];             // ISO 3166-1 alpha-2 codes e.g. ['US', 'GB']
  cities?: string[];
  interests?: { id: string; name: string }[];
  customAudienceIds?: string[];     // Meta Custom Audiences
  lookalikeSources?: string[];
  excludedAudienceIds?: string[];
}

// ─── Creative ─────────────────────────────────────────────────────────────────

export interface AdCreative {
  headline: string;
  bodyText: string;
  callToAction:
    | 'LEARN_MORE'
    | 'SHOP_NOW'
    | 'SIGN_UP'
    | 'CONTACT_US'
    | 'GET_QUOTE'
    | 'BOOK_NOW'
    | 'DOWNLOAD';
  imageUrls?: string[];
  videoUrl?: string;
  linkUrl?: string;
  displayLink?: string;
  metaAdCreativeId?: string;      // returned by Meta after creative is created
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export interface AdBudget {
  type: 'daily' | 'lifetime';
  amount: number;                  // in cents/smallest currency unit
  currency: string;                // ISO 4217 e.g. 'USD'
  startDate: Date;
  endDate?: Date;
}

// ─── Performance Metrics ──────────────────────────────────────────────────────

export interface AdMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;                   // in cents
  cpm: number;                     // cost per mille
  cpc: number;                     // cost per click
  ctr: number;                     // click-through rate %
  conversions: number;
  costPerConversion: number;
  frequency: number;
  lastSyncedAt: Date;
}

// ─── Campaign Document ────────────────────────────────────────────────────────

export interface ICampaign extends Document {
  business: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  platform: AdPlatform;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  budget: AdBudget;
  targeting: AudienceTargeting;
  placements: AdPlacement[];
  optimizationGoal: OptimizationGoal;
  billingEvent: BillingEvent;
  creative: AdCreative;
  // Which specific social networks this campaign runs on (subset of what the platform API supports)
  selectedPlatforms: string[];  // e.g. ['facebook', 'instagram']
  // Meta-specific IDs
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaAdId?: string;
  metaAdAccountId: string;
  // Performance
  metrics?: AdMetrics;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const adMetricsSchema = new Schema<AdMetrics>(
  {
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    costPerConversion: { type: Number, default: 0 },
    frequency: { type: Number, default: 0 },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const campaignSchema = new Schema<ICampaign>(
  {
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    platform: { type: String, enum: ['meta'], required: true },
    name: { type: String, required: true, trim: true },
    objective: {
      type: String,
      enum: ['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'APP_PROMOTION', 'SALES'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'failed'],
      default: 'draft',
      index: true,
    },
    budget: {
      type: { type: String, enum: ['daily', 'lifetime'], required: true },
      amount: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
      startDate: { type: Date, required: true },
      endDate: { type: Date },
    },
    targeting: {
      ageMin: Number,
      ageMax: Number,
      genders: [String],
      countries: [String],
      cities: [String],
      interests: [{ id: String, name: String }],
      customAudienceIds: [String],
      lookalikeSources: [String],
      excludedAudienceIds: [String],
    },
    placements: [{ type: String }],
    optimizationGoal: { type: String, required: true },
    billingEvent: { type: String, required: true },
    creative: {
      headline: { type: String, required: true },
      bodyText: { type: String, required: true },
      callToAction: { type: String, required: true },
      imageUrls: [String],
      videoUrl: String,
      linkUrl: { type: String, required: false, default: '' },
      displayLink: String,
      metaAdCreativeId: String,
    },
    selectedPlatforms: { type: [String], default: ['facebook', 'instagram'] },
    metaCampaignId: String,
    metaAdSetId: String,
    metaAdId: String,
    metaAdAccountId: { type: String, required: true },
    metrics: adMetricsSchema,
    errorMessage: String,
  },
  { timestamps: true },
);

campaignSchema.index({ business: 1, status: 1 });
campaignSchema.index({ business: 1, createdAt: -1 });

export const CampaignModel = mongoose.model<ICampaign>('Campaign', campaignSchema);
