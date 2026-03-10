import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { API_ENDPOINTS, OAUTH_CONFIG } from '../../constants/api';
import { secureStorage } from '../storage/secureStorage';
import { apiClient } from '../api/client';
import { User } from '../../types/models';

// Required for web-based auth to work properly
WebBrowser.maybeCompleteAuthSession();

class AuthService {
  /**
   * Sign in with Google using the web app's OAuth flow
   */
  async signInWithGoogle(): Promise<void> {
    console.log('🚀🚀🚀 SIGN IN WITH GOOGLE STARTED 🚀🚀🚀');
    try {
      // Create the redirect URI for the callback
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: OAUTH_CONFIG.redirectScheme,
        path: OAUTH_CONFIG.redirectPath,
      });

      console.log('📱 Redirect URI:', redirectUri);

      // Use the OAuth state parameter to pass the mobile redirect URI
      // This survives the entire OAuth flow without relying on sessions
      const state = JSON.stringify({
        mobileRedirectUri: redirectUri,
        platform: 'mobile',
      });

      // Build the OAuth URL with the state parameter
      const authUrl = `${API_ENDPOINTS.AUTH_GOOGLE}?state=${encodeURIComponent(state)}`;

      console.log('🔗 Auth URL:', authUrl);

      // Open the browser to the Google OAuth endpoint on your backend
      // The backend will handle the OAuth flow and redirect back with a session cookie
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      console.log('🔐 Auth result type:', result.type);
      console.log('🔐 Full auth result:', JSON.stringify(result, null, 2));

      if (result.type === 'success') {
        // Extract the transfer token from the URL
        const url = result.url;
        console.log('📍 Success URL:', url);

        if (url) {
          const params = new URL(url).searchParams;
          const transferToken = params.get('transferToken');

          console.log('🎫 Transfer token from URL:', transferToken);

          if (transferToken) {
            // Exchange the transfer token for a real session cookie
            console.log('🔄 Exchanging transfer token for session cookie...');

            const exchangeResponse = await fetch(`${API_ENDPOINTS.AUTH_MOBILE_EXCHANGE}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ transferToken }),
            });

            console.log('📊 Exchange response status:', exchangeResponse.status);
            console.log('📊 Exchange response headers:', JSON.stringify(Object.fromEntries(exchangeResponse.headers.entries()), null, 2));

            if (!exchangeResponse.ok) {
              const errorText = await exchangeResponse.text();
              console.error('❌ Exchange failed:', errorText);
              throw new Error('Failed to exchange transfer token');
            }

            const exchangeData = await exchangeResponse.json();
            console.log('✅ Exchange response data:', JSON.stringify(exchangeData, null, 2));

            // Store the real signed session cookie
            if (exchangeData.sessionId) {
              let sessionCookie = exchangeData.sessionId;

              console.log('🍪 Raw sessionId from backend:', sessionCookie.substring(0, 50) + '...');

              // Backend returns just the session value (s:...), we need to add the cookie name
              // Format should be: connect.sid=s:...
              if (!sessionCookie.includes('connect.sid=')) {
                // Check if this looks like a valid express-session signature (starts with s:)
                if (sessionCookie.startsWith('s:')) {
                  console.log('✅ Valid session signature detected, adding connect.sid prefix');
                  sessionCookie = `connect.sid=${sessionCookie}`;
                } else if (sessionCookie.startsWith('GAESA=') || sessionCookie.startsWith('__Secure-')) {
                  // This is a Google Cloud or other infrastructure cookie - wrong!
                  console.error('❌❌❌ WRONG COOKIE! Backend returned infrastructure cookie:', sessionCookie.substring(0, 50));
                  throw new Error('Backend returned infrastructure cookie instead of session cookie');
                } else {
                  // Unknown format
                  console.error('❌ Unknown cookie format:', sessionCookie.substring(0, 50));
                  throw new Error('Backend returned unknown cookie format');
                }
              }

              console.log('🍪 Final cookie to store:', {
                length: sessionCookie.length,
                hasConnectSid: sessionCookie.includes('connect.sid'),
                preview: sessionCookie.substring(0, 50) + '...'
              });

              await secureStorage.setSessionCookie(sessionCookie);
              console.log('✅ Session cookie stored in secure storage');

              // Small delay to ensure SecureStore has fully persisted
              await new Promise(resolve => setTimeout(resolve, 100));

              // Verify it was stored correctly by reading it back
              const verifyRead = await secureStorage.getSessionCookie();
              if (verifyRead) {
                console.log('✅ Cookie verified readable from storage');
              } else {
                console.error('❌ WARNING: Cookie was stored but could not be read back!');
                throw new Error('Session cookie storage verification failed');
              }
            } else {
              console.error('❌ No sessionId in exchange response. Response keys:', Object.keys(exchangeData));
              throw new Error('No sessionId in exchange response');
            }
          } else {
            console.warn('⚠️ No transferToken in redirect URL');
            throw new Error('No authentication token received');
          }
        } else {
          throw new Error('No URL in success response');
        }

        return;
      } else if (result.type === 'cancel') {
        console.error('❌ Auth cancelled - user closed browser or redirect failed');
        throw new Error('Sign in was cancelled');
      } else if (result.type === 'dismiss') {
        console.error('❌ Auth dismissed');
        throw new Error('Sign in was dismissed');
      } else {
        console.error('❌ Auth failed with type:', result.type);
        throw new Error('Sign in failed');
      }
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      throw error;
    }
  }

  /**
   * Get user data from backend
   */
  async getUserData(): Promise<User | null> {
    try {
      console.log('🔍 Fetching user data from:', API_ENDPOINTS.AUTH_USER);
      const storedCookie = await secureStorage.getSessionCookie();
      console.log('🔍 Using stored cookie:', storedCookie ? `${storedCookie.substring(0, 30)}... (${storedCookie.length} chars)` : 'NONE');

      const response = await apiClient.get(API_ENDPOINTS.AUTH_USER);
      const userData = response.data;

      console.log('✅ User data response:', JSON.stringify(userData, null, 2));

      // Store user data in secure storage
      await secureStorage.setUserData(JSON.stringify(userData));
      console.log('✅ User data fetched and stored');

      return userData;
    } catch (error) {
      console.error('❌ Failed to fetch user data:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error keys:', error ? Object.keys(error) : 'null');
      return null;
    }
  }

  /**
   * Sign out and clear session
   */
  async signOut(): Promise<void> {
    try {
      // Call backend logout endpoint
      try {
        await apiClient.post(API_ENDPOINTS.LOGOUT);
        console.log('✅ Backend logout successful');
      } catch (error) {
        console.error('⚠️ Backend logout failed (continuing with local cleanup):', error);
        // Continue with local cleanup even if backend call fails
      }

      // Clear local storage
      await secureStorage.clearAll();
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated (has a session cookie)
   */
  async isAuthenticated(): Promise<boolean> {
    const sessionCookie = await secureStorage.getSessionCookie();
    const isAuth = !!sessionCookie;
    console.log('🔍 isAuthenticated check:', isAuth);
    if (isAuth) {
      // Log cookie length without exposing the actual value
      console.log('🔍 Session cookie length:', sessionCookie.length, 'chars');
    }
    return isAuth;
  }

  /**
   * Validate that the current session is still valid with the backend
   */
  async validateSession(): Promise<boolean> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH_USER);
      console.log('✅ Session is valid');
      return true;
    } catch (error) {
      console.log('❌ Session validation failed:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
