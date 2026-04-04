import axios from 'axios';
import { BasePlatformProvider, PostContent } from './base.provider';
import { PublishResult, PlatformAnalyticsData } from '../platform.types';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

export class InstagramProvider extends BasePlatformProvider {
  private igUserId: string;

  constructor(accessToken: string, igUserId: string, refreshToken?: string) {
    super(accessToken, refreshToken);
    this.igUserId = igUserId;
  }

  async publishPost(content: PostContent): Promise<PublishResult> {
    try {
      const caption = content.hashtags?.length
        ? `${content.text}\n\n${content.hashtags.map((h) => `#${h}`).join(' ')}`
        : content.text;

      // Instagram requires at least one image
      const imageUrl = content.mediaUrls?.[0];
      if (!imageUrl) {
        return { success: false, error: 'Instagram posts require at least one image URL' };
      }

      // Step 1: Create media container
      const containerResponse = await axios.post(
        `${GRAPH_API_BASE}/${this.igUserId}/media`,
        {
          image_url: imageUrl,
          caption,
          access_token: this.accessToken,
        },
      );

      const containerId = containerResponse.data?.id;
      if (!containerId) {
        return { success: false, error: 'Failed to create media container' };
      }

      // Step 2: Publish container
      const publishResponse = await axios.post(
        `${GRAPH_API_BASE}/${this.igUserId}/media_publish`,
        {
          creation_id: containerId,
          access_token: this.accessToken,
        },
      );

      const postId = publishResponse.data?.id;
      return {
        success: true,
        platformPostId: postId,
        url: postId ? `https://www.instagram.com/p/${postId}` : undefined,
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      return {
        success: false,
        error: error.response?.data?.error?.message ?? error.message ?? 'Failed to publish Instagram post',
      };
    }
  }

  async getAnalytics(mediaId: string): Promise<PlatformAnalyticsData> {
    try {
      const response = await axios.get(`${GRAPH_API_BASE}/${mediaId}/insights`, {
        params: {
          metric: 'impressions,reach,engagement,likes,comments,shares,saved',
          access_token: this.accessToken,
        },
      });

      const metrics: Record<string, number> = {};
      for (const item of response.data?.data ?? []) {
        metrics[item.name] = item.values?.[0]?.value ?? item.value ?? 0;
      }

      return {
        impressions: metrics.impressions ?? 0,
        reach: metrics.reach ?? 0,
        engagement: metrics.engagement ?? 0,
        likes: metrics.likes ?? 0,
        comments: metrics.comments ?? 0,
        shares: metrics.shares ?? 0,
        clicks: metrics.saved ?? 0,
      };
    } catch {
      return { impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
    }
  }

  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken?: string; expiry?: Date }> {
    const response = await axios.get(`${GRAPH_API_BASE}/refresh_access_token`, {
      params: {
        grant_type: 'ig_refresh_token',
        access_token: this.accessToken,
      },
    });

    return {
      accessToken: response.data.access_token,
      expiry: new Date(Date.now() + (response.data.expires_in ?? 5184000) * 1000),
    };
  }

  async validateConnection(): Promise<boolean> {
    try {
      await axios.get(`${GRAPH_API_BASE}/${this.igUserId}`, {
        params: { access_token: this.accessToken, fields: 'id' },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getProfileInfo(): Promise<{ userId: string; username: string; displayName?: string }> {
    const response = await axios.get(`${GRAPH_API_BASE}/${this.igUserId}`, {
      params: {
        access_token: this.accessToken,
        fields: 'id,username,name',
      },
    });
    return {
      userId: response.data.id,
      username: response.data.username,
      displayName: response.data.name,
    };
  }
}
