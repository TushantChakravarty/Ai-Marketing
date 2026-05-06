import axios from 'axios';
import { PlatformConnectionModel, IPlatformConnection } from './platform.model';
import { Platform } from '../../config/constants';
import { PublishResult, PlatformAnalyticsData } from './platform.types';
import { TwitterProvider } from './providers/twitter.provider';
import { FacebookProvider } from './providers/facebook.provider';
import { InstagramProvider } from './providers/instagram.provider';
import { BasePlatformProvider, PostContent } from './providers/base.provider';
import { env } from '../../config/env.config';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

const OAUTH_CONFIGS: Record<Platform, { authUrl: string; scopes: string[] }> = {
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'pages_manage_metadata'],
  },
  instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: ['r_liteprofile', 'w_member_social'],
  },
};

export class PlatformService {
  getOAuthUrl(platform: Platform, businessId: string, returnUrl: string): string {
    const config = OAUTH_CONFIGS[platform];
    const state = Buffer.from(JSON.stringify({ platform, businessId, returnUrl })).toString('base64');
    const redirectUri = `${env.BACKEND_URL}/api/v1/platforms/oauth/${platform}/callback`;

    const params = new URLSearchParams({
      response_type: 'code',
      state,
      redirect_uri: redirectUri,
      scope: config.scopes.join(platform === 'facebook' ? ',' : ' '),
    });

    if (platform === 'twitter') {
      params.set('client_id', env.TWITTER_CLIENT_ID);
      params.set('code_challenge', 'challenge');
      params.set('code_challenge_method', 'plain');
    } else if (platform === 'facebook') {
      params.set('client_id', env.FACEBOOK_APP_ID);
    } else if (platform === 'instagram') {
      params.set('client_id', env.INSTAGRAM_APP_ID);
    } else if (platform === 'linkedin') {
      params.set('client_id', env.LINKEDIN_CLIENT_ID);
    }

    return `${config.authUrl}?${params.toString()}`;
  }

  async handleCallback(
    platform: Platform,
    code: string,
    state: string,
  ): Promise<{ connection: IPlatformConnection; returnUrl: string }> {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8')) as {
      businessId: string;
      returnUrl: string;
    };
    const { businessId, returnUrl } = stateData;

    let connection: IPlatformConnection;

    if (platform === 'facebook') {
      connection = await this.handleFacebookCallback(businessId, code);
    } else {
      const tokens = await this.exchangeCodeForTokens(platform, code);
      const provider = this.createProvider(platform, tokens.accessToken, tokens.refreshToken, '');
      const profile = await provider.getProfileInfo();

      connection = (await PlatformConnectionModel.findOneAndUpdate(
        { business: businessId, platform },
        {
          $set: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: tokens.expiry,
            platformUserId: profile.userId,
            platformUsername: profile.username,
            isActive: true,
            connectedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      ).exec())!;
    }

    return { connection, returnUrl };
  }

  private async handleFacebookCallback(
    businessId: string,
    code: string,
  ): Promise<IPlatformConnection> {
    const redirectUri = `${env.BACKEND_URL}/api/v1/platforms/oauth/facebook/callback`;

    // 1. Exchange code for short-lived user access token
    const tokenRes = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
      params: {
        client_id: env.FACEBOOK_APP_ID,
        client_secret: env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
    });
    const shortLivedToken: string = tokenRes.data.access_token;

    // 2. Exchange for long-lived user token (~60 days)
    const longLivedRes = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: env.FACEBOOK_APP_ID,
        client_secret: env.FACEBOOK_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });
    const longLivedToken: string = longLivedRes.data.access_token;
    const expiresIn: number = longLivedRes.data.expires_in ?? 5184000;

    // 3. Get user's managed pages (each page has its own never-expiring token)
    const pagesRes = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
      params: { access_token: longLivedToken, fields: 'id,name,access_token' },
    });

    const pages: Array<{ id: string; name: string; access_token: string }> =
      pagesRes.data.data ?? [];

    if (pages.length === 0) {
      throw Object.assign(
        new Error('No Facebook Pages found. Please create a Facebook Page and try again.'),
        { statusCode: 400 },
      );
    }

    // Use the first page
    const page = pages[0];

    const connection = await PlatformConnectionModel.findOneAndUpdate(
      { business: businessId, platform: 'facebook' },
      {
        $set: {
          accessToken: page.access_token,
          tokenExpiry: new Date(Date.now() + expiresIn * 1000),
          platformUserId: page.id,
          platformUsername: page.name,
          isActive: true,
          connectedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    ).exec();

    return connection!;
  }

  private async exchangeCodeForTokens(
    _platform: Platform,
    code: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiry?: Date }> {
    // Placeholder for Twitter/LinkedIn — implement per-platform when needed
    return { accessToken: code, expiry: new Date(Date.now() + 3600 * 1000) };
  }

  createProvider(
    platform: Platform,
    accessToken: string,
    refreshToken: string | undefined,
    platformUserId: string,
  ): BasePlatformProvider {
    switch (platform) {
      case 'twitter':
        return new TwitterProvider(accessToken, refreshToken);
      case 'facebook':
        return new FacebookProvider(accessToken, platformUserId, refreshToken);
      case 'instagram':
        return new InstagramProvider(accessToken, platformUserId, refreshToken);
      default:
        throw new Error(`Provider not implemented for platform: ${platform}`);
    }
  }

  async publishPost(
    connection: IPlatformConnection,
    content: PostContent,
  ): Promise<PublishResult> {
    const provider = this.createProvider(
      connection.platform,
      connection.accessToken,
      connection.refreshToken,
      connection.platformUserId,
    );
    return provider.publishPost(content);
  }

  async getAnalytics(
    connection: IPlatformConnection,
    postId: string,
  ): Promise<PlatformAnalyticsData> {
    const provider = this.createProvider(
      connection.platform,
      connection.accessToken,
      connection.refreshToken,
      connection.platformUserId,
    );
    return provider.getAnalytics(postId);
  }

  async getConnections(businessId: string): Promise<IPlatformConnection[]> {
    return PlatformConnectionModel.find({ business: businessId, isActive: true }).exec();
  }

  async getConnection(businessId: string, platform: Platform): Promise<IPlatformConnection | null> {
    return PlatformConnectionModel.findOne({ business: businessId, platform, isActive: true })
      .select('+accessToken +refreshToken')
      .exec();
  }

  async disconnectPlatform(businessId: string, platform: Platform): Promise<void> {
    await PlatformConnectionModel.findOneAndUpdate(
      { business: businessId, platform },
      { $set: { isActive: false } },
    ).exec();
  }
}

export const platformService = new PlatformService();
