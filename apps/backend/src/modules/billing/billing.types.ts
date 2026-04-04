import { SubscriptionStatus } from '../../config/constants';

export interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  limits: {
    posts: number;
    businesses: number;
    platforms: number;
    aiGenerations: number;
    teamMembers: number;
  };
}

export interface Subscription {
  id: string;
  user: string;
  business: string;
  plan: string;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  postCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCheckoutDto {
  planId: string;
  businessId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface PurchaseCreditsDto {
  credits: number;
  businessId: string;
}
