import { ICampaign, AdMetrics } from '../ads.model';
import { MetaCampaignCreateResult } from '../ads.types';

export abstract class BaseAdsProvider {
  protected accessToken: string;
  protected adAccountId: string;

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
  }

  /** Create the full campaign stack: Campaign → AdSet → Creative → Ad */
  abstract createCampaign(campaign: ICampaign): Promise<MetaCampaignCreateResult>;

  /** Pause a running campaign */
  abstract pauseCampaign(platformCampaignId: string): Promise<void>;

  /** Resume a paused campaign */
  abstract resumeCampaign(platformCampaignId: string): Promise<void>;

  /** Delete / archive a campaign */
  abstract deleteCampaign(platformCampaignId: string): Promise<void>;

  /** Pull latest performance metrics */
  abstract getInsights(platformCampaignId: string, dateRange?: { since: string; until: string }): Promise<AdMetrics>;

  /** Search targeting interests by keyword */
  abstract searchInterests(query: string): Promise<{ id: string; name: string }[]>;

  /** Estimate audience size for given targeting */
  abstract estimateAudience(targeting: ICampaign['targeting']): Promise<{ lower: number; upper: number }>;

  /** Validate the access token and ad account are still valid */
  abstract validateConnection(): Promise<boolean>;
}
