import { CampaignModel, ICampaign } from './ads.model';
import { MetaAdsProvider } from './providers/meta.provider';
import { CreateCampaignDto, UpdateCampaignDto, GetCampaignsQuery } from './ads.types';
import { env } from '../../config/env.config';

class AdsService {
  // ── Get provider ──────────────────────────────────────────────────────────

  private getMetaProvider(adAccountId?: string): MetaAdsProvider {
    if (!env.META_ACCESS_TOKEN) {
      throw new Error('META_ACCESS_TOKEN is not configured. Add it to your backend .env file.');
    }
    const accountId = adAccountId || env.META_AD_ACCOUNT_ID;
    if (!accountId) {
      throw new Error('No Meta Ad Account ID. Set META_AD_ACCOUNT_ID in .env or provide it when creating the campaign.');
    }
    return new MetaAdsProvider(env.META_ACCESS_TOKEN, accountId, env.META_PAGE_ID);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async createCampaign(ownerId: string, dto: CreateCampaignDto): Promise<ICampaign> {
    const campaign = await CampaignModel.create({
      business: dto.businessId,
      owner: ownerId,
      platform: dto.platform,
      name: dto.name,
      objective: dto.objective,
      budget: dto.budget,
      targeting: dto.targeting,
      placements: dto.placements,
      optimizationGoal: dto.optimizationGoal,
      billingEvent: dto.billingEvent,
      creative: dto.creative,
      metaAdAccountId: dto.metaAdAccountId || env.META_AD_ACCOUNT_ID,
      status: 'draft',
    });

    return campaign;
  }

  async launchCampaign(campaignId: string, ownerId: string): Promise<ICampaign> {
    const campaign = await CampaignModel.findOne({ _id: campaignId, owner: ownerId });
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status === 'active') throw new Error('Campaign is already active');

    const provider = this.getMetaProvider(campaign.metaAdAccountId);

    try {
      const result = await provider.createCampaign(campaign);

      campaign.metaCampaignId = result.campaignId;
      campaign.metaAdSetId = result.adSetId;
      campaign.metaAdId = result.adId;
      campaign.creative.metaAdCreativeId = result.adCreativeId;
      campaign.status = 'active';
      campaign.errorMessage = undefined;

      await provider.resumeCampaign(result.campaignId);
      await campaign.save();
    } catch (err: any) {
      campaign.status = 'failed';
      campaign.errorMessage = err?.response?.data?.error?.message ?? err.message;
      await campaign.save();
      throw err;
    }

    return campaign;
  }

  async pauseCampaign(campaignId: string, ownerId: string): Promise<ICampaign> {
    const campaign = await CampaignModel.findOne({ _id: campaignId, owner: ownerId });
    if (!campaign) throw new Error('Campaign not found');
    if (!campaign.metaCampaignId) throw new Error('Campaign has not been launched yet');

    const provider = this.getMetaProvider(campaign.metaAdAccountId);
    await provider.pauseCampaign(campaign.metaCampaignId);
    campaign.status = 'paused';
    await campaign.save();

    return campaign;
  }

  async resumeCampaign(campaignId: string, ownerId: string): Promise<ICampaign> {
    const campaign = await CampaignModel.findOne({ _id: campaignId, owner: ownerId });
    if (!campaign) throw new Error('Campaign not found');
    if (!campaign.metaCampaignId) throw new Error('Campaign has not been launched yet');

    const provider = this.getMetaProvider(campaign.metaAdAccountId);
    await provider.resumeCampaign(campaign.metaCampaignId);
    campaign.status = 'active';
    await campaign.save();

    return campaign;
  }

  async deleteCampaign(campaignId: string, ownerId: string): Promise<void> {
    const campaign = await CampaignModel.findOne({ _id: campaignId, owner: ownerId });
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.metaCampaignId) {
      const provider = this.getMetaProvider(campaign.metaAdAccountId);
      await provider.deleteCampaign(campaign.metaCampaignId);
    }

    await CampaignModel.deleteOne({ _id: campaignId });
  }

  async updateCampaign(
    campaignId: string,
    ownerId: string,
    dto: UpdateCampaignDto,
  ): Promise<ICampaign> {
    const campaign = await CampaignModel.findOneAndUpdate(
      { _id: campaignId, owner: ownerId },
      { $set: dto },
      { new: true },
    );
    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }

  async getCampaigns(query: GetCampaignsQuery) {
    const { businessId, status, platform, page = 1, limit = 20 } = query;
    const filter: Record<string, unknown> = { business: businessId };
    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    const [campaigns, total] = await Promise.all([
      CampaignModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CampaignModel.countDocuments(filter),
    ]);

    return { campaigns, total, page, limit };
  }

  async getCampaignById(campaignId: string, ownerId: string): Promise<ICampaign> {
    const campaign = await CampaignModel.findOne({ _id: campaignId, owner: ownerId });
    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }

  // ── Insights ──────────────────────────────────────────────────────────────

  async syncInsights(campaignId: string, ownerId: string): Promise<ICampaign> {
    const campaign = await CampaignModel.findOne({ _id: campaignId, owner: ownerId });
    if (!campaign) throw new Error('Campaign not found');
    if (!campaign.metaCampaignId) throw new Error('Campaign has not been launched yet');

    const provider = this.getMetaProvider(campaign.metaAdAccountId);
    const metrics = await provider.getInsights(campaign.metaCampaignId);
    campaign.metrics = metrics;
    await campaign.save();

    return campaign;
  }

  // ── Audience Tools ────────────────────────────────────────────────────────

  async searchInterests(adAccountId: string, query: string) {
    const provider = this.getMetaProvider(adAccountId);
    return provider.searchInterests(query);
  }

  async estimateAudience(adAccountId: string, targeting: ICampaign['targeting']) {
    const provider = this.getMetaProvider(adAccountId);
    return provider.estimateAudience(targeting);
  }
}

export const adsService = new AdsService();
