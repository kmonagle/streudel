// Secure storage for session cookies and sensitive data
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  SESSION_COOKIE: 'session_cookie',
  USER_DATA: 'user_data',
} as const;

export const secureStorage = {
  // Session cookie management
  async setSessionCookie(cookie: string): Promise<void> {
    try {
      console.log('💾 STORING session cookie (length:', cookie.length, ', preview:', cookie.substring(0, 30) + '...)');
      await SecureStore.setItemAsync(KEYS.SESSION_COOKIE, cookie);
      console.log('✅ Session cookie STORED successfully');
    } catch (error) {
      console.error('❌ Failed to store session cookie:', error);
      throw error;
    }
  },

  async getSessionCookie(): Promise<string | null> {
    try {
      const cookie = await SecureStore.getItemAsync(KEYS.SESSION_COOKIE);
      if (cookie) {
        console.log('📦 Retrieved session cookie from storage (length:', cookie.length, ')');
      } else {
        console.log('📦 No session cookie found in storage');
        console.trace('📦 Stack trace for "no cookie" call'); // See who's calling when cookie is missing
      }
      return cookie;
    } catch (error) {
      console.error('Failed to retrieve session cookie:', error);
      return null;
    }
  },

  async clearSessionCookie(): Promise<void> {
    try {
      console.log('🗑️ CLEARING session cookie');
      console.trace('🗑️ Stack trace for clearSessionCookie'); // See who's calling this
      await SecureStore.deleteItemAsync(KEYS.SESSION_COOKIE);
    } catch (error) {
      console.error('Failed to clear session cookie:', error);
    }
  },

  // User data management
  async setUserData(userData: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.USER_DATA, userData);
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw error;
    }
  },

  async getUserData(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEYS.USER_DATA);
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  },

  async clearUserData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEYS.USER_DATA);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  },

  // Clear all stored data
  async clearAll(): Promise<void> {
    await Promise.all([this.clearSessionCookie(), this.clearUserData()]);
  },
};
