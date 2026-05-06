import axios, { AxiosInstance } from 'axios';
import { BaseAdsProvider } from './base-ads.provider';
import { ICampaign, AdMetrics, AudienceTargeting } from '../ads.model';
import { MetaCampaignCreateResult, MetaInsights, MetaInterest } from '../ads.types';

const META_API_VERSION = 'v19.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// Map our objective names → Meta API objective names
const OBJECTIVE_MAP: Record<string, string> = {
  AWARENESS: 'OUTCOME_AWARENESS',
  TRAFFIC: 'OUTCOME_TRAFFIC',
  ENGAGEMENT: 'OUTCOME_ENGAGEMENT',
  LEADS: 'OUTCOME_LEADS',
  APP_PROMOTION: 'OUTCOME_APP_PROMOTION',
  SALES: 'OUTCOME_SALES',
};

// Map our CTA names → Meta CTA type values
const CTA_MAP: Record<string, string> = {
  LEARN_MORE: 'LEARN_MORE',
  SHOP_NOW: 'SHOP_NOW',
  SIGN_UP: 'SIGN_UP',
  CONTACT_US: 'CONTACT_US',
  GET_QUOTE: 'GET_QUOTE',
  BOOK_NOW: 'BOOK_NOW',
  DOWNLOAD: 'DOWNLOAD',
};

export class MetaAdsProvider extends BaseAdsProvider {
  private client: AxiosInstance;
  private pageId: string;

  constructor(accessToken: string, adAccountId: string, pageId = '') {
    super(accessToken, adAccountId);
    this.pageId = pageId;
    this.client = axios.create({
      baseURL: META_API_BASE,
      params: { access_token: accessToken },
    });
  }

  // ── Create Campaign Stack ──────────────────────────────────────────────────

  async createCampaign(campaign: ICampaign): Promise<MetaCampaignCreateResult> {
    // 1. Create Campaign
    const { data: campaignData } = await this.client.post(
      `/act_${this.adAccountId}/campaigns`,
      {
        name: campaign.name,
        objective: OBJECTIVE_MAP[campaign.objective] ?? campaign.objective,
        status: 'PAUSED', // always start paused — user activates manually
        special_ad_categories: [],
      },
    );

    const metaCampaignId: string = campaignData.id;

    // 2. Build targeting spec
    const targetingSpec = this.buildTargetingSpec(campaign.targeting);

    // Restrict to selected Meta platforms (facebook / instagram)
    const metaPlatforms = (campaign.selectedPlatforms ?? []).filter(
      p => p === 'facebook' || p === 'instagram',
    );
    if (metaPlatforms.length > 0) {
      targetingSpec.publisher_platforms = metaPlatforms;
    }

    // 3. Create Ad Set
    const adSetPayload: Record<string, unknown> = {
      name: `${campaign.name} — Ad Set`,
      campaign_id: metaCampaignId,
      status: 'PAUSED',
      optimization_goal: campaign.optimizationGoal,
      billing_event: campaign.billingEvent,
      targeting: targetingSpec,
      start_time: campaign.budget.startDate.toISOString(),
      ...(campaign.budget.endDate ? { end_time: campaign.budget.endDate.toISOString() } : {}),
      ...(campaign.budget.type === 'daily'
        ? { daily_budget: campaign.budget.amount }
        : { lifetime_budget: campaign.budget.amount }),
    };

    const { data: adSetData } = await this.client.post(
      `/act_${this.adAccountId}/adsets`,
      adSetPayload,
    );

    const metaAdSetId: string = adSetData.id;

    // 4. Create Ad Creative
    const creativePayload = this.buildCreativePayload(campaign);
    const { data: creativeData } = await this.client.post(
      `/act_${this.adAccountId}/adcreatives`,
      creativePayload,
    );
    const metaAdCreativeId: string = creativeData.id;

    // 5. Create Ad
    const { data: adData } = await this.client.post(`/act_${this.adAccountId}/ads`, {
      name: `${campaign.name} — Ad`,
      adset_id: metaAdSetId,
      creative: { creative_id: metaAdCreativeId },
      status: 'PAUSED',
    });

    return {
      campaignId: metaCampaignId,
      adSetId: metaAdSetId,
      adCreativeId: metaAdCreativeId,
      adId: adData.id,
    };
  }

  // ── Status Management ──────────────────────────────────────────────────────

  async pauseCampaign(metaCampaignId: string): Promise<void> {
    await this.client.post(`/${metaCampaignId}`, { status: 'PAUSED' });
  }

  async resumeCampaign(metaCampaignId: string): Promise<void> {
    await this.client.post(`/${metaCampaignId}`, { status: 'ACTIVE' });
  }

  async deleteCampaign(metaCampaignId: string): Promise<void> {
    await this.client.post(`/${metaCampaignId}`, { status: 'ARCHIVED' });
  }

  // ── Insights ───────────────────────────────────────────────────────────────

  async getInsights(
    metaCampaignId: string,
    dateRange?: { since: string; until: string },
  ): Promise<AdMetrics> {
    const params: Record<string, string> = {
      fields: 'impressions,reach,clicks,spend,cpm,cpc,ctr,frequency,actions',
      level: 'campaign',
    };

    if (dateRange) {
      params.time_range = JSON.stringify(dateRange);
    }

    const { data } = await this.client.get(`/${metaCampaignId}/insights`, { params });

    const raw: MetaInsights = data.data?.[0] ?? {};

    const conversions =
      raw.actions
        ?.filter(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')
        .reduce((sum, a) => sum + parseInt(a.value, 10), 0) ?? 0;

    const spend = parseFloat(raw.spend ?? '0') * 100; // convert to cents

    return {
      impressions: parseInt(raw.impressions ?? '0', 10),
      reach: parseInt(raw.reach ?? '0', 10),
      clicks: parseInt(raw.clicks ?? '0', 10),
      spend,
      cpm: parseFloat(raw.cpm ?? '0'),
      cpc: parseFloat(raw.cpc ?? '0'),
      ctr: parseFloat(raw.ctr ?? '0'),
      conversions,
      costPerConversion: conversions > 0 ? spend / conversions : 0,
      frequency: parseFloat(raw.frequency ?? '0'),
      lastSyncedAt: new Date(),
    };
  }

  // ── Interest Search ────────────────────────────────────────────────────────

  async searchInterests(query: string): Promise<{ id: string; name: string }[]> {
    const { data } = await this.client.get(`/act_${this.adAccountId}/targetingsearch`, {
      params: {
        q: query,
        type: 'adinterest',
        limit: 20,
      },
    });

    return (data.data as MetaInterest[]).map(i => ({ id: i.id, name: i.name }));
  }

  // ── Audience Estimation ────────────────────────────────────────────────────

  async estimateAudience(
    targeting: ICampaign['targeting'],
  ): Promise<{ lower: number; upper: number }> {
    const targetingSpec = this.buildTargetingSpec(targeting);

    const { data } = await this.client.get(
      `/act_${this.adAccountId}/reachestimate`,
      {
        params: {
          targeting_spec: JSON.stringify(targetingSpec),
          optimize_for: 'REACH',
        },
      },
    );

    return {
      lower: data.users_lower_bound ?? 0,
      upper: data.users_upper_bound ?? 0,
    };
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  async validateConnection(): Promise<boolean> {
    try {
      await this.client.get(`/act_${this.adAccountId}`, {
        params: { fields: 'id,name,account_status' },
      });
      return true;
    } catch {
      return false;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildTargetingSpec(targeting: AudienceTargeting): Record<string, unknown> {
    const spec: Record<string, unknown> = {};

    if (targeting.ageMin) spec.age_min = targeting.ageMin;
    if (targeting.ageMax) spec.age_max = targeting.ageMax;

    if (targeting.genders?.length) {
      // Meta: 1 = male, 2 = female, omit for all
      const genderMap: Record<string, number> = { male: 1, female: 2 };
      const genderNums = targeting.genders
        .filter(g => g !== 'all')
        .map(g => genderMap[g])
        .filter(Boolean);
      if (genderNums.length > 0) spec.genders = genderNums;
    }

    if (targeting.countries?.length) {
      spec.geo_locations = { countries: targeting.countries };
    }

    if (targeting.interests?.length) {
      spec.interests = targeting.interests.map(i => ({ id: i.id, name: i.name }));
    }

    if (targeting.customAudienceIds?.length) {
      spec.custom_audiences = targeting.customAudienceIds.map(id => ({ id }));
    }

    if (targeting.excludedAudienceIds?.length) {
      spec.excluded_custom_audiences = targeting.excludedAudienceIds.map(id => ({ id }));
    }

    return spec;
  }

  private buildCreativePayload(campaign: ICampaign): Record<string, unknown> {
    const { creative } = campaign;

    const linkData: Record<string, unknown> = {
      message: creative.bodyText,
      link: creative.linkUrl,
      name: creative.headline,
      call_to_action: {
        type: CTA_MAP[creative.callToAction] ?? creative.callToAction,
        value: { link: creative.linkUrl },
      },
    };

    if (creative.imageUrls?.length) {
      linkData.picture = creative.imageUrls[0];
    }

    return {
      name: `${campaign.name} — Creative`,
      object_story_spec: {
        page_id: this.pageId || this.adAccountId,
        link_data: linkData,
      },
    };
  }
}
