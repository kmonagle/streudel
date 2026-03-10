// Authentication API service
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { apiClient } from './client';
import { API_ENDPOINTS, OAUTH_CONFIG } from '../../constants/api';
import { User } from '../../types/models';
import { OAuthProvider } from '../../types/api';
import { secureStorage } from '../storage/secureStorage';
import { authService } from '../auth/authService';

// Complete web browser auth session properly
WebBrowser.maybeCompleteAuthSession();

export const authApi = {
  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>(API_ENDPOINTS.AUTH_USER);
    return response.data;
  },

  /**
   * Initiate OAuth login with provider
   */
  async loginWithOAuth(provider: OAuthProvider): Promise<{ success: boolean; user?: User }> {
    try {
      console.log('🔐 authApi.loginWithOAuth called with provider:', provider);

      // Use the authService which has proper transfer token exchange
      if (provider === 'google') {
        console.log('🔐 Calling authService.signInWithGoogle()...');
        await authService.signInWithGoogle();

        // Add a small delay to ensure session is fully established
        console.log('⏳ Waiting for session to be fully established...');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Fetch user data to confirm authentication
        console.log('🔐 Fetching user data after sign in...');
        const user = await authService.getUserData();

        if (user) {
          console.log('✅ Login successful, got user:', user.email);

          // Verify we can make another API call successfully
          console.log('🔍 Verifying session with second API call...');
          try {
            const verifyUser = await authService.getUserData();
            if (verifyUser) {
              console.log('✅ Session verified with second call');
            }
          } catch (error) {
            console.error('⚠️ Second API call failed, but continuing...', error);
          }

          return { success: true, user };
        } else {
          console.error('❌ No user data returned after sign in');
          return { success: false };
        }
      } else {
        console.error('❌ Unsupported provider (only Google is implemented):', provider);
        throw new Error(`${provider} sign in not yet implemented. Only Google is currently supported.`);
      }
    } catch (error) {
      console.error('❌ OAuth login error:', error);
      return { success: false };
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage
      await secureStorage.clearAll();
    }
  },

  /**
   * Check if user is authenticated
   */
  async checkAuth(): Promise<{ isAuthenticated: boolean; user?: User }> {
    try {
      const cookie = await secureStorage.getSessionCookie();
      if (!cookie) {
        return { isAuthenticated: false };
      }

      const user = await this.getCurrentUser();
      return { isAuthenticated: true, user };
    } catch (error) {
      // If getCurrentUser fails, clear invalid session
      await secureStorage.clearAll();
      return { isAuthenticated: false };
    }
  },
};
