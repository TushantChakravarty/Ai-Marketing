import axios from 'axios';
import { BasePlatformProvider, PostContent } from './base.provider';
import { PublishResult, PlatformAnalyticsData } from '../platform.types';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

export class TwitterProvider extends BasePlatformProvider {
  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async publishPost(content: PostContent): Promise<PublishResult> {
    try {
      const text = content.hashtags?.length
        ? `${content.text}\n\n${content.hashtags.map((h) => `#${h}`).join(' ')}`
        : content.text;

      // Truncate to Twitter's 280 char limit
      const tweetText = text.length > 280 ? text.substring(0, 277) + '...' : text;

      const response = await axios.post(
        `${TWITTER_API_BASE}/tweets`,
        { text: tweetText },
        { headers: this.headers },
      );

      const tweetId = response.data?.data?.id;
      return {
        success: true,
        platformPostId: tweetId,
        url: tweetId ? `https://twitter.com/i/web/status/${tweetId}` : undefined,
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      return {
        success: false,
        error: error.response?.data?.detail ?? error.message ?? 'Failed to publish tweet',
      };
    }
  }

  async getAnalytics(tweetId: string): Promise<PlatformAnalyticsData> {
    try {
      const response = await axios.get(`${TWITTER_API_BASE}/tweets/${tweetId}`, {
        headers: this.headers,
        params: {
          'tweet.fields': 'public_metrics',
        },
      });

      const metrics = response.data?.data?.public_metrics ?? {};
      return {
        impressions: metrics.impression_count ?? 0,
        reach: metrics.impression_count ?? 0,
        engagement: (metrics.like_count ?? 0) + (metrics.reply_count ?? 0) + (metrics.retweet_count ?? 0),
        likes: metrics.like_count ?? 0,
        comments: metrics.reply_count ?? 0,
        shares: metrics.retweet_count ?? 0,
        clicks: metrics.url_link_clicks ?? 0,
      };
    } catch {
      return { impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
    }
  }

  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken?: string; expiry?: Date }> {
    if (!this.refreshToken) throw new Error('No refresh token available');

    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
        },
      },
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiry: new Date(Date.now() + response.data.expires_in * 1000),
    };
  }

  async validateConnection(): Promise<boolean> {
    try {
      await axios.get(`${TWITTER_API_BASE}/users/me`, { headers: this.headers });
      return true;
    } catch {
      return false;
    }
  }

  async getProfileInfo(): Promise<{ userId: string; username: string; displayName?: string }> {
    const response = await axios.get(`${TWITTER_API_BASE}/users/me`, {
      headers: this.headers,
      params: { 'user.fields': 'name,username' },
    });
    const user = response.data?.data;
    return {
      userId: user.id,
      username: user.username,
      displayName: user.name,
    };
  }
}
