import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';
import { useSettings } from '../../src/contexts/SettingsContext';

export default function LoginScreen() {
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];
  const { login, isLoading, error } = useAuthStore();

  const handleGoogleLogin = async () => {
    try {
      console.log('Starting Google login...');

      // Show alert explaining what will happen
      Alert.alert(
        'Sign in with Google',
        'A browser will open to sign in. After signing in, you\'ll be redirected back to the app.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              const success = await login('google');
              console.log('Login result:', success);
              if (!success) {
                Alert.alert(
                  'Login Failed',
                  error || 'Unable to complete sign in. This may be because:\n\n• Your backend OAuth is not configured for mobile redirects\n• iOS blocked the browser session\n• The authentication was cancelled'
                );
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', 'An unexpected error occurred during login.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Streudel</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Recipes &amp; shopping lists, made simple
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.tint} style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </TouchableOpacity>

            <Text style={[styles.note, { color: colors.icon }]}>
              Facebook and Apple Sign In coming soon
            </Text>
          </View>
        )}

        {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  loader: {
    marginTop: 32,
  },
  error: {
    marginTop: 16,
    textAlign: 'center',
  },
});
