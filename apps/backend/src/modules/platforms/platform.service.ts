import { PlatformConnectionModel, IPlatformConnection } from './platform.model';
import { Platform } from '../../config/constants';
import { PublishResult, PlatformAnalyticsData } from './platform.types';
import { TwitterProvider } from './providers/twitter.provider';
import { FacebookProvider } from './providers/facebook.provider';
import { InstagramProvider } from './providers/instagram.provider';
import { BasePlatformProvider, PostContent } from './providers/base.provider';
import { env } from '../../config/env.config';

const OAUTH_CONFIGS: Record<Platform, { authUrl: string; scopes: string[] }> = {
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
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
  getOAuthUrl(platform: Platform, businessId: string): string {
    const config = OAUTH_CONFIGS[platform];
    const state = Buffer.from(JSON.stringify({ platform, businessId })).toString('base64');
    const redirectUri = `${env.BACKEND_URL}/api/v1/platforms/oauth/${platform}/callback`;

    const params = new URLSearchParams({
      response_type: 'code',
      state,
      redirect_uri: redirectUri,
      scope: config.scopes.join(' '),
    });

    if (platform === 'twitter') {
      params.set('client_id', env.TWITTER_CLIENT_ID);
      params.set('code_challenge', 'challenge'); // PKCE - simplified
      params.set('code_challenge_method', 'plain');
    } else if (platform === 'facebook' || platform === 'instagram') {
      params.set('client_id', platform === 'facebook' ? env.FACEBOOK_APP_ID : env.INSTAGRAM_APP_ID);
    } else if (platform === 'linkedin') {
      params.set('client_id', env.LINKEDIN_CLIENT_ID);
    }

    return `${config.authUrl}?${params.toString()}`;
  }

  async handleCallback(
    platform: Platform,
    code: string,
    state: string,
  ): Promise<IPlatformConnection> {
    // Decode state to get businessId
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    const businessId = stateData.businessId;

    // Exchange code for tokens (simplified; each platform differs)
    const tokens = await this.exchangeCodeForTokens(platform, code);

    // Get provider and fetch profile
    const provider = this.createProvider(platform, tokens.accessToken, tokens.refreshToken, '');
    const profile = await provider.getProfileInfo();

    // Upsert connection
    const connection = await PlatformConnectionModel.findOneAndUpdate(
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
    ).exec();

    return connection!;
  }

  private async exchangeCodeForTokens(
    platform: Platform,
    code: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiry?: Date }> {
    // Stub: each platform has different token exchange logic
    // In production, implement per-platform OAuth token exchange via axios
    console.log(`Exchanging code for ${platform} tokens`);
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
