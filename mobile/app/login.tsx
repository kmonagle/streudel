import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { authService } from '../src/services/auth/authService';
import { useAuth } from '../src/contexts/AuthContext';
import { useSettings } from '../src/contexts/SettingsContext';

export default function LoginScreen() {
  const router = useRouter();
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Complete OAuth flow
      await authService.signInWithGoogle();

      // Fetch user data from backend
      const userData = await authService.getUserData();

      if (userData) {
        // Update auth context with user data
        // CRITICAL: Wait for login to complete (ensures cookie is stored)
        await login(userData);
        console.log('✅ Login successful, user data stored');
        // Navigation will be handled by AuthContext
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error: any) {
      console.error('Google sign in failed:', error);
      // Only show error if it's not a user cancellation
      if (error?.message && !error.message.includes('cancelled') && !error.message.includes('dismissed')) {
        Alert.alert('Sign In Failed', error.message || 'Unable to sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Logo/Branding */}
        <View style={styles.brandingContainer}>
          <Text style={[styles.brandText, { color: colors.text }]}>Streudel</Text>
          <Text style={[styles.tagline, { color: colors.icon }]}>
            Recipes &amp; shopping lists, made simple
          </Text>
        </View>

        {/* Sign In Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.googleButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.tint} />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="#EA4335" />
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Sign in with Google
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.icon }]}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
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
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  brandText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
