// Authentication store using Zustand
import { create } from 'zustand';
import { User } from '../types/models';
import { OAuthProvider } from '../types/api';
import { authApi } from '../services/api/auth';
import { apiClientInstance } from '../services/api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (provider: OAuthProvider) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Set up unauthorized callback for API client
  apiClientInstance.setUnauthorizedCallback(() => {
    set({ user: null, isAuthenticated: false });
  });

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    /**
     * Login with OAuth provider
     */
    login: async (provider: OAuthProvider) => {
      set({ isLoading: true, error: null });
      try {
        const result = await authApi.loginWithOAuth(provider);

        if (result.success && result.user) {
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } else {
          set({
            isLoading: false,
            error: 'Login failed. Please try again.',
          });
          return false;
        }
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Login failed',
        });
        return false;
      }
    },

    /**
     * Logout current user
     */
    logout: async () => {
      set({ isLoading: true });
      try {
        await authApi.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    },

    /**
     * Check if user is authenticated
     */
    checkAuth: async () => {
      set({ isLoading: true });
      try {
        const result = await authApi.checkAuth();

        if (result.isAuthenticated && result.user) {
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },

    /**
     * Clear error message
     */
    clearError: () => {
      set({ error: null });
    },
  };
});
