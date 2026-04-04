import { AnalyticsModel } from './analytics.model';
import { PostModel } from '../posts/post.model';
import { platformService } from '../platforms/platform.service';
import {
  AnalyticsSummary,
  PlatformAnalytics,
  PostPerformance,
  EngagementTrends,
  TrendPoint,
} from './analytics.types';
import { Platform, PLATFORMS } from '../../config/constants';

export class AnalyticsService {
  async getDashboardSummary(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsSummary> {
    const records = await AnalyticsModel.find({
      business: businessId,
      date: { $gte: startDate, $lte: endDate },
    }).exec();

    let totalImpressions = 0;
    let totalEngagement = 0;
    let totalReach = 0;
    let followersGained = 0;

    const platformBreakdown: Record<string, {
      impressions: number; engagement: number; reach: number; followers: number;
    }> = {};

    for (const record of records) {
      totalImpressions += record.metrics.impressions;
      totalEngagement += record.metrics.engagement;
      totalReach += record.metrics.reach;
      followersGained += record.metrics.followersGained;

      if (!platformBreakdown[record.platform]) {
        platformBreakdown[record.platform] = { impressions: 0, engagement: 0, reach: 0, followers: 0 };
      }
      platformBreakdown[record.platform].impressions += record.metrics.impressions;
      platformBreakdown[record.platform].engagement += record.metrics.engagement;
      platformBreakdown[record.platform].reach += record.metrics.reach;
      platformBreakdown[record.platform].followers += record.metrics.followersGained;
    }

    const totalPosts = await PostModel.countDocuments({
      business: businessId,
      publishedAt: { $gte: startDate, $lte: endDate },
    });

    const avgEngagementRate = totalImpressions > 0
      ? (totalEngagement / totalImpressions) * 100
      : 0;

    return {
      totalPosts,
      totalImpressions,
      totalEngagement,
      totalReach,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      followersGained,
      platformBreakdown: platformBreakdown as AnalyticsSummary['platformBreakdown'],
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
    };
  }

  async getPlatformAnalytics(
    businessId: string,
    platform: Platform,
    startDate: Date,
    endDate: Date,
  ): Promise<PlatformAnalytics[]> {
    const records = await AnalyticsModel.find({
      business: businessId,
      platform,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .exec();

    return records.map((r) => ({
      platform: r.platform,
      date: r.date.toISOString().split('T')[0],
      metrics: r.metrics,
    }));
  }

  async getTopPosts(businessId: string, limit = 10): Promise<PostPerformance[]> {
    const posts = await PostModel.find({
      business: businessId,
      status: 'published',
    })
      .sort({ createdAt: -1 })
      .limit(limit * 3) // fetch more to sort by engagement
      .exec();

    const performances: PostPerformance[] = [];

    for (const post of posts) {
      for (const platformEntry of post.platforms) {
        if (platformEntry.status !== 'published') continue;

        const stats = post.engagementStats?.get?.(platformEntry.platform) ?? {
          impressions: 0, likes: 0, comments: 0, shares: 0, reach: 0,
        };

        const totalEngagement = (stats.likes ?? 0) + (stats.comments ?? 0) + (stats.shares ?? 0);
        const engagementRate = (stats.impressions ?? 0) > 0
          ? (totalEngagement / stats.impressions) * 100
          : 0;

        performances.push({
          postId: post.id,
          text: post.content.text.substring(0, 100),
          platform: platformEntry.platform,
          publishedAt: platformEntry.publishedAt ?? post.publishedAt ?? new Date(),
          metrics: {
            impressions: stats.impressions ?? 0,
            reach: stats.reach ?? 0,
            engagement: totalEngagement,
            likes: stats.likes ?? 0,
            comments: stats.comments ?? 0,
            shares: stats.shares ?? 0,
            clicks: 0,
            followers: 0,
            followersGained: 0,
          },
          engagementRate: Math.round(engagementRate * 100) / 100,
        });
      }
    }

    return performances
      .sort((a, b) => b.metrics.engagement - a.metrics.engagement)
      .slice(0, limit);
  }

  async getEngagementTrends(
    businessId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EngagementTrends> {
    const records = await AnalyticsModel.find({
      business: businessId,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .exec();

    // Group by date
    const byDate = new Map<string, { impressions: number; engagement: number; followers: number }>();
    for (const record of records) {
      const dateKey = record.date.toISOString().split('T')[0];
      const existing = byDate.get(dateKey) ?? { impressions: 0, engagement: 0, followers: 0 };
      existing.impressions += record.metrics.impressions;
      existing.engagement += record.metrics.engagement;
      existing.followers += record.metrics.followersGained;
      byDate.set(dateKey, existing);
    }

    const impressions: TrendPoint[] = [];
    const engagement: TrendPoint[] = [];
    const followers: TrendPoint[] = [];

    for (const [date, metrics] of byDate.entries()) {
      impressions.push({ date, value: metrics.impressions });
      engagement.push({ date, value: metrics.engagement });
      followers.push({ date, value: metrics.followers });
    }

    return { impressions, engagement, followers };
  }

  async syncPlatformAnalytics(businessId: string): Promise<void> {
    const connections = await platformService.getConnections(businessId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const connection of connections) {
      if (!connection.isActive) continue;

      try {
        // Fetch recent published posts for this platform and update stats
        const posts = await PostModel.find({
          business: businessId,
          'platforms.platform': connection.platform,
          'platforms.status': 'published',
          publishedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
        }).exec();

        let dailyImpressions = 0;
        let dailyEngagement = 0;
        let dailyReach = 0;
        let dailyLikes = 0;
        let dailyComments = 0;
        let dailyShares = 0;

        for (const post of posts) {
          const platformEntry = post.platforms.find((p) => p.platform === connection.platform);
          if (!platformEntry?.platformPostId) continue;

          try {
            const connectionWithToken = await platformService.getConnection(
              businessId,
              connection.platform,
            );
            if (!connectionWithToken) continue;

            const analytics = await platformService.getAnalytics(
              connectionWithToken,
              platformEntry.platformPostId,
            );

            dailyImpressions += analytics.impressions;
            dailyEngagement += analytics.engagement;
            dailyReach += analytics.reach;
            dailyLikes += analytics.likes;
            dailyComments += analytics.comments;
            dailyShares += analytics.shares;

            // Update post engagement stats
            await PostModel.findByIdAndUpdate(post.id, {
              $set: {
                [`engagementStats.${connection.platform}`]: {
                  impressions: analytics.impressions,
                  reach: analytics.reach,
                  likes: analytics.likes,
                  comments: analytics.comments,
                  shares: analytics.shares,
                },
              },
            });
          } catch {
            // Continue even if one post fails
          }
        }

        // Upsert daily analytics record
        await AnalyticsModel.findOneAndUpdate(
          { business: businessId, platform: connection.platform, date: today },
          {
            $set: {
              metrics: {
                impressions: dailyImpressions,
                reach: dailyReach,
                engagement: dailyEngagement,
                likes: dailyLikes,
                comments: dailyComments,
                shares: dailyShares,
                clicks: 0,
                followers: 0,
                followersGained: 0,
              },
            },
          },
          { upsert: true },
        ).exec();
      } catch (err) {
        console.error(`Failed to sync analytics for ${connection.platform}:`, err);
      }
    }
  }
}

export const analyticsService = new AnalyticsService();
