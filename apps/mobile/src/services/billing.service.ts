import apiClient from './api.service';
import { ApiResponse, Subscription, PlanType } from '../types';

export interface CheckoutData {
  planType: PlanType;
  billingCycle: 'monthly' | 'yearly';
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface PurchaseCreditsData {
  credits: number;
}

export interface PurchaseCreditsResponse {
  checkoutUrl: string;
  sessionId: string;
}

export const BillingService = {
  async createCheckout(
    data: CheckoutData,
  ): Promise<ApiResponse<CheckoutResponse>> {
    const response = await apiClient.post<ApiResponse<CheckoutResponse>>(
      '/billing/checkout',
      data,
    );
    return response.data;
  },

  async getSubscription(): Promise<ApiResponse<Subscription>> {
    const response = await apiClient.get<ApiResponse<Subscription>>(
      '/billing/subscription',
    );
    return response.data;
  },

  async cancelSubscription(): Promise<ApiResponse<Subscription>> {
    const response = await apiClient.post<ApiResponse<Subscription>>(
      '/billing/subscription/cancel',
    );
    return response.data;
  },

  async reactivateSubscription(): Promise<ApiResponse<Subscription>> {
    const response = await apiClient.post<ApiResponse<Subscription>>(
      '/billing/subscription/reactivate',
    );
    return response.data;
  },

  async purchaseCredits(
    data: PurchaseCreditsData,
  ): Promise<ApiResponse<PurchaseCreditsResponse>> {
    const response = await apiClient.post<ApiResponse<PurchaseCreditsResponse>>(
      '/billing/credits/purchase',
      data,
    );
    return response.data;
  },
};
