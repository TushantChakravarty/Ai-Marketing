import axios from 'axios';
import { BasePlatformProvider, PostContent } from './base.provider';
import { PublishResult, PlatformAnalyticsData } from '../platform.types';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

export class FacebookProvider extends BasePlatformProvider {
  private pageId: string;

  constructor(accessToken: string, pageId: string, refreshToken?: string) {
    super(accessToken, refreshToken);
    this.pageId = pageId;
  }

  async publishPost(content: PostContent): Promise<PublishResult> {
    try {
      const message = content.hashtags?.length
        ? `${content.text}\n\n${content.hashtags.map((h) => `#${h}`).join(' ')}`
        : content.text;

      const params: Record<string, string> = {
        message,
        access_token: this.accessToken,
      };

      // If there are media URLs, attach the first image
      if (content.mediaUrls?.length) {
        params.link = content.mediaUrls[0];
      }

      const response = await axios.post(
        `${GRAPH_API_BASE}/${this.pageId}/feed`,
        params,
      );

      const postId = response.data?.id;
      return {
        success: true,
        platformPostId: postId,
        url: postId ? `https://www.facebook.com/${postId}` : undefined,
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      return {
        success: false,
        error: error.response?.data?.error?.message ?? error.message ?? 'Failed to publish Facebook post',
      };
    }
  }

  async getAnalytics(postId: string): Promise<PlatformAnalyticsData> {
    try {
      const response = await axios.get(`${GRAPH_API_BASE}/${postId}/insights`, {
        params: {
          metric: 'post_impressions,post_reach,post_engaged_users,post_reactions_by_type_total',
          access_token: this.accessToken,
        },
      });

      const insights: Record<string, number> = {};
      for (const item of response.data?.data ?? []) {
        insights[item.name] = item.values?.[0]?.value ?? 0;
      }

      return {
        impressions: insights.post_impressions ?? 0,
        reach: insights.post_reach ?? 0,
        engagement: insights.post_engaged_users ?? 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
      };
    } catch {
      return { impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
    }
  }

  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken?: string; expiry?: Date }> {
    const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: this.accessToken,
      },
    });

    return {
      accessToken: response.data.access_token,
      expiry: new Date(Date.now() + (response.data.expires_in ?? 5184000) * 1000),
    };
  }

  async validateConnection(): Promise<boolean> {
    try {
      await axios.get(`${GRAPH_API_BASE}/me`, {
        params: { access_token: this.accessToken, fields: 'id' },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getProfileInfo(): Promise<{ userId: string; username: string; displayName?: string }> {
    const response = await axios.get(`${GRAPH_API_BASE}/me`, {
      params: { access_token: this.accessToken, fields: 'id,name,username' },
    });
    return {
      userId: response.data.id,
      username: response.data.username ?? response.data.id,
      displayName: response.data.name,
    };
  }
}
