import { UserTier, TierLimits } from '@/types/models';

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    maxHabits: 50,
    maxTasks: 100,
    maxGoals: 10,
    hasCalendarSync: false,
    hasAdvancedAnalytics: false,
  },
  premium: {
    maxHabits: null, // unlimited
    maxTasks: null,
    maxGoals: null,
    hasCalendarSync: true,
    hasAdvancedAnalytics: true,
  }
};
