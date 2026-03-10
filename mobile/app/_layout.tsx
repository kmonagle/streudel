import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ShareProvider, useShare } from '../src/contexts/ShareContext';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { SubscriptionProvider } from '../src/contexts/SubscriptionContext';
import { CalendarProvider } from '../src/contexts/CalendarContext';
import { AddItemProvider } from '../src/contexts/AddItemContext';

function DeepLinkHandler() {
  const { setSharedContent } = useShare();

  useEffect(() => {
    const checkAppGroupForCapture = async () => {
      try {
        // Check App Group UserDefaults for pending capture
        // This requires expo-shared-preferences or a native module
        // For now, we'll just handle the deep link parameter version
        console.log('📥 Checking for pending captures from App Group...');
      } catch (error) {
        console.error('❌ Error checking app group:', error);
      }
    };

    const handleDeepLink = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      const { path, queryParams } = parsed;

      console.log('🔗 Deep link received:', url);
      console.log('📍 Path:', path);
      console.log('🔑 Query params:', queryParams);

      if (path === 'check-captures') {
        console.log('📥 Check captures deep link detected');
        checkAppGroupForCapture();
      } else if (path === 'capture' && queryParams?.text) {
        const text = decodeURIComponent(queryParams.text as string);
        const source = queryParams.source ? decodeURIComponent(queryParams.source as string) : undefined;

        console.log('📥 Capture deep link detected:', { text, source });
        setSharedContent(text, source);
      }
    };

    // Handle initial URL (app opened from share while not running)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    // Handle URL while app is running or in background
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => subscription.remove();
  }, [setSharedContent]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SubscriptionProvider>
          <CalendarProvider>
            <ShareProvider>
              <AddItemProvider>
              <DeepLinkHandler />
              <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="recipe-manager" options={{ headerShown: false }} />
                <Stack.Screen name="subscription" options={{ headerShown: false }} />
              </Stack>
              </AddItemProvider>
            </ShareProvider>
          </CalendarProvider>
        </SubscriptionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
