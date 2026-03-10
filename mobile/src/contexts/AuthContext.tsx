import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { User } from '../types/models';
import { apiClient, apiClientInstance } from '../services/api/client';
import { API_ENDPOINTS } from '../constants/api';
import { secureStorage } from '../services/storage/secureStorage';
import { authService } from '../services/auth/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSessionCookie, setHasSessionCookie] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Load user data on mount
  useEffect(() => {
    loadUser();

    // Set up unauthorized callback for auto-logout on 401
    apiClientInstance.setUnauthorizedCallback(() => {
      console.log('🔒 Session expired - auto logout');
      handleAutoLogout();
    });
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'habit-calendar' || segments[0] === 'recipe-manager' || segments[0] === 'execution' || segments[0] === 'capture' || segments[0] === 'subscription';

    if (!user && inAuthGroup) {
      // User is not signed in but trying to access protected route
      router.replace('/login');
    } else if (user && !inAuthGroup && segments[0] !== undefined) {
      // User is signed in but on auth screens - redirect to index
      // Index will handle navigation based on start screen preference
      router.replace('/');
    }
  }, [user, segments, isLoading]);

  const loadUser = async () => {
    try {
      const sessionCookie = await secureStorage.getSessionCookie();
      console.log('🔍 loadUser - Has session cookie:', !!sessionCookie);

      setHasSessionCookie(!!sessionCookie);

      if (sessionCookie) {
        // Try to get cached user data first
        const cachedUserData = await secureStorage.getUserData();
        console.log('🔍 loadUser - Has cached user data:', !!cachedUserData);

        if (cachedUserData) {
          try {
            const userData = JSON.parse(cachedUserData);
            // Add computed fields if not already present
            if (userData.firstName && userData.lastName && !userData.name) {
              userData.name = `${userData.firstName} ${userData.lastName}`;
            }
            if (userData.profileImageUrl && !userData.picture) {
              userData.picture = userData.profileImageUrl;
            }
            setUser(userData);
            console.log('✅ Loaded cached user data for:', userData.email);
          } catch (error) {
            console.error('Failed to parse cached user data:', error);
          }
        }

        // Fetch fresh user data from backend to validate session
        try {
          console.log('🔄 Validating session with backend...');
          const response = await apiClient.get(API_ENDPOINTS.AUTH_USER);
          const freshUserData = response.data;

          // Add computed fields for backwards compatibility
          freshUserData.name = `${freshUserData.firstName} ${freshUserData.lastName}`;
          freshUserData.picture = freshUserData.profileImageUrl;

          setUser(freshUserData);
          await secureStorage.setUserData(JSON.stringify(freshUserData));
          console.log('✅ Session valid - fetched fresh user data from backend');
        } catch (error: any) {
          console.error('❌ Session validation failed:', error?.error || error?.message);

          // Check if this is a 401 (session expired)
          if (error?.error?.includes?.('Unauthorized') || error?.error?.includes?.('401')) {
            console.log('🔒 Session expired - clearing storage and requiring re-login');
            // Session expired - clear everything and force re-login
            await secureStorage.clearAll();
            setUser(null);
            setHasSessionCookie(false);
          } else if (!cachedUserData) {
            // Some other error and no cached data - clear session
            console.log('⚠️ Unknown error and no cached data - clearing session');
            await secureStorage.clearAll();
            setUser(null);
            setHasSessionCookie(false);
          } else {
            // Some other error but we have cached data - keep using it
            console.log('⚠️ Backend error but using cached data');
          }
        }
      } else {
        console.log('ℹ️ No session cookie found - user needs to log in');
      }
    } catch (error) {
      console.error('❌ Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    // Add computed fields
    if (userData.firstName && userData.lastName && !userData.name) {
      userData.name = `${userData.firstName} ${userData.lastName}`;
    }
    if (userData.profileImageUrl && !userData.picture) {
      userData.picture = userData.profileImageUrl;
    }

    // CRITICAL: Wait for session cookie to be stored before setting user
    // This prevents race conditions where screens try to fetch data before cookie exists
    let retries = 0;
    const maxRetries = 10;
    let cookieFound = false;

    while (retries < maxRetries && !cookieFound) {
      const cookie = await secureStorage.getSessionCookie();
      if (cookie) {
        console.log('✅ Session cookie confirmed in storage');
        cookieFound = true;
        setHasSessionCookie(true);
      } else {
        console.log(`⏳ Waiting for session cookie... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
    }

    if (!cookieFound) {
      console.error('❌ Session cookie not found after login - this should not happen!');
      // Still set user but flag that we don't have cookie
      setHasSessionCookie(false);
    }

    setUser(userData);
    console.log('✅ User logged in:', userData.email);
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Call enhanced auth service signOut (will call backend)
      await authService.signOut();

      // Clear user state
      setUser(null);
      setHasSessionCookie(false);

      console.log('✅ Logout successful');

      // Navigate to login
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);

      // Even if logout fails, clear local state and navigate
      setUser(null);
      setHasSessionCookie(false);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLogout = async () => {
    // Similar to logout but without calling backend (since we got 401)
    // Storage is already cleared in API client interceptor
    setUser(null);
    setHasSessionCookie(false);
    setIsLoading(false);
    console.log('✅ Auto-logout complete - redirecting to login');
    router.replace('/login');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && hasSessionCookie, // Only authenticated if BOTH user AND cookie exist
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
