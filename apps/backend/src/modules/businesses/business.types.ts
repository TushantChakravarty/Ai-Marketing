import { MarketingMode, Tone, Industry, Platform } from '../../config/constants';

export interface SocialHandles {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
}

export interface ConnectedPlatform {
  platform: Platform;
  connectedAt: Date;
  platformUserId?: string;
  platformUsername?: string;
}

export interface Business {
  id: string;
  owner: string;
  name: string;
  description?: string;
  industry: Industry;
  website?: string;
  logo?: string;
  socialHandles: SocialHandles;
  marketingMode: MarketingMode;
  targetAudience?: string;
  tone: Tone;
  connectedPlatforms: ConnectedPlatform[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBusinessDto {
  name: string;
  description?: string;
  industry: Industry;
  website?: string;
  logo?: string;
  socialHandles?: SocialHandles;
  marketingMode?: MarketingMode;
  targetAudience?: string;
  tone?: Tone;
}

export interface UpdateBusinessDto {
  name?: string;
  description?: string;
  industry?: Industry;
  website?: string;
  logo?: string;
  socialHandles?: SocialHandles;
  marketingMode?: MarketingMode;
  targetAudience?: string;
  tone?: Tone;
  isActive?: boolean;
}

export interface ConnectPlatformDto {
  platform: Platform;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  platformUserId: string;
  platformUsername: string;
}
