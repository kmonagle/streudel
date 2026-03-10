import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { capturesApi } from '../services/api/captures';

interface ShareContextType {
  pendingShare: { text: string; source?: string } | null;
  setSharedContent: (text: string, source?: string) => Promise<void>;
  clearSharedContent: () => void;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export function useShare() {
  const context = useContext(ShareContext);
  if (context === undefined) {
    throw new Error('useShare must be used within a ShareProvider');
  }
  return context;
}

interface ShareProviderProps {
  children: ReactNode;
}

export function ShareProvider({ children }: ShareProviderProps) {
  const [pendingShare, setPendingShare] = useState<{ text: string; source?: string } | null>(null);
  const router = useRouter();

  const setSharedContent = async (text: string, source?: string) => {
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ Attempted to share empty content');
      return;
    }

    console.log('📥 setSharedContent called with text:', text);
    console.log('📥 setSharedContent source:', source);

    try {
      // Store pending share
      setPendingShare({ text, source });

      console.log('📡 Calling capturesApi.create()...');
      // Create capture in backend
      const capture = await capturesApi.create({
        content: text,
        source,
      });

      console.log('✅ Capture created:', capture);

      // Navigate to My Stuff to show the capture
      console.log('🔄 Navigating to My Stuff...');
      router.push('/(tabs)/mystuff');

      // Clear pending share
      setPendingShare(null);
    } catch (error: any) {
      console.error('❌ Failed to create capture:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error response:', error.response?.data);

      // If it's an auth error, silently fail - user will be redirected to login
      // by the AuthContext's 401 handler
      if (error.error?.includes('Unauthorized') || error.error?.includes('401')) {
        console.log('⚠️ Capture failed due to auth - user will be redirected to login');
        setPendingShare(null); // Clear pending share
        return;
      }

      // Keep in pending state for retry
      setPendingShare({ text, source });

      // Show error to user for non-auth errors
      Alert.alert('Error', `Failed to create capture: ${error.error || error.message || 'Unknown error'}`);
    }
  };

  const clearSharedContent = () => {
    setPendingShare(null);
  };

  const value: ShareContextType = {
    pendingShare,
    setSharedContent,
    clearSharedContent,
  };

  return <ShareContext.Provider value={value}>{children}</ShareContext.Provider>;
}
