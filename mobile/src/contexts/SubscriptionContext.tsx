import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';
import { subscriptionService } from '@/services/subscription/subscriptionService';
import { subscriptionApi } from '@/services/api/subscription';
import { SubscriptionInfo, TierLimits } from '@/types/models';
import { TIER_LIMITS } from '@/constants/tierLimits';

interface SubscriptionContextType {
  subscription: SubscriptionInfo | null;
  limits: TierLimits | null;
  isLoading: boolean;

  isPremium: boolean;
  canAccessFeature: (feature: string) => boolean;
  canCreateItem: (itemType: 'habit' | 'task' | 'goal', currentCount: number) => boolean;

  purchaseSubscription: (pkg: any) => Promise<void>;
  restorePurchases: () => Promise<void>;
  refreshSubscription: () => Promise<void>;

  showUpgradePrompt: (feature: string) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [limits, setLimits] = useState<TierLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize RevenueCat when user logs in
  useEffect(() => {
    if (user) {
      initializeSubscription();
    } else {
      // Clear subscription when user logs out
      setSubscription(null);
      setLimits(null);
      setIsLoading(false);
    }
  }, [user]);

  const initializeSubscription = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Initialize RevenueCat with user ID
      await subscriptionService.initialize(user.id);

      // Set subscription from user data
      if (user.subscription?.tier) {
        setSubscription(user.subscription);
        setLimits(TIER_LIMITS[user.subscription.tier]);
        console.log('✅ Subscription initialized:', user.subscription.tier);
      } else {
        // Default to free tier if no subscription data
        const freeTier = { tier: 'free' as const, status: 'active' as const };
        setSubscription(freeTier);
        setLimits(TIER_LIMITS.free);
        console.log('✅ Subscription initialized with default free tier');
      }
    } catch (error) {
      console.error('Failed to initialize subscription:', error);

      // Fall back to user's subscription data even if RevenueCat fails
      if (user.subscription?.tier) {
        setSubscription(user.subscription);
        setLimits(TIER_LIMITS[user.subscription.tier]);
      } else {
        // Default to free tier
        const freeTier = { tier: 'free' as const, status: 'active' as const };
        setSubscription(freeTier);
        setLimits(TIER_LIMITS.free);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isPremium = subscription?.tier === 'premium' && subscription?.status === 'active';

  const canAccessFeature = (feature: string): boolean => {
    if (isPremium) return true;

    switch (feature) {
      case 'calendar_sync':
        return limits?.hasCalendarSync ?? false;
      case 'advanced_analytics':
        return limits?.hasAdvancedAnalytics ?? false;
      default:
        return true;
    }
  };

  const canCreateItem = (itemType: 'habit' | 'task' | 'goal', currentCount: number): boolean => {
    if (isPremium) return true;

    const limitKey = `max${itemType.charAt(0).toUpperCase() + itemType.slice(1)}s` as keyof TierLimits;
    const limit = limits?.[limitKey];

    if (limit === null) return true; // unlimited
    return currentCount < (limit as number);
  };

  const purchaseSubscription = async (pkg: any) => {
    setIsLoading(true);
    try {
      await subscriptionService.purchasePackage(pkg);
      await refreshSubscription();
      console.log('✅ Purchase successful');
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase failed:', error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    setIsLoading(true);
    try {
      await subscriptionService.restorePurchases();
      await refreshSubscription();
      console.log('✅ Purchases restored');
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscription = async () => {
    if (!user) return;

    try {
      const status = await subscriptionApi.getStatus();
      setSubscription(status);
      setLimits(TIER_LIMITS[status.tier]);
      console.log('✅ Subscription refreshed:', status.tier);
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
      throw error;
    }
  };

  const showUpgradePrompt = (feature: string) => {
    router.push(`/subscription?feature=${feature}`);
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      limits,
      isLoading,
      isPremium,
      canAccessFeature,
      canCreateItem,
      purchaseSubscription,
      restorePurchases,
      refreshSubscription,
      showUpgradePrompt
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
