// Subscription API service
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { SubscriptionInfo, TierLimits } from '../../types/models';

export const subscriptionApi = {
  /**
   * Validate subscription with backend (after RevenueCat purchase)
   */
  async validate(purchaserInfo: any): Promise<SubscriptionInfo> {
    const response = await apiClient.post<SubscriptionInfo>(
      API_ENDPOINTS.SUBSCRIPTION_VALIDATE,
      { purchaserInfo }
    );
    return response.data;
  },

  /**
   * Get current subscription status
   */
  async getStatus(): Promise<SubscriptionInfo> {
    const response = await apiClient.get<SubscriptionInfo>(
      API_ENDPOINTS.SUBSCRIPTION_STATUS
    );
    return response.data;
  },

  /**
   * Restore purchases (after reinstall or device transfer)
   */
  async restore(): Promise<SubscriptionInfo> {
    const response = await apiClient.post<SubscriptionInfo>(
      API_ENDPOINTS.SUBSCRIPTION_RESTORE
    );
    return response.data;
  },

  /**
   * Get tier limits for current user
   */
  async getLimits(): Promise<TierLimits> {
    const response = await apiClient.get<TierLimits>(
      API_ENDPOINTS.SUBSCRIPTION_LIMITS
    );
    return response.data;
  },
};
