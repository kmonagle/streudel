import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { useSettings } from '../src/contexts/SettingsContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { settings, isLoading: isLoadingSettings } = useSettings();

  // Show loading while checking authentication and settings
  if (isLoading || isLoadingSettings) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    // Go directly to start screen
    const startScreen = settings?.startScreen || 'today';
    return <Redirect href={`/(tabs)/${startScreen}`} />;
  } else {
    return <Redirect href="/login" />;
  }
}
