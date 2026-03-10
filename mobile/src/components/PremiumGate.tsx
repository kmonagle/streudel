import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Colors } from '@/constants/colors';

interface PremiumGateProps {
  feature: string;
  featureName: string;
  description: string;
}

export default function PremiumGate({ feature, featureName, description }: PremiumGateProps) {
  const { showUpgradePrompt } = useSubscription();
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={40} color="#FFD700" />
      </View>

      <Text style={[styles.featureName, { color: colors.text }]}>{featureName}</Text>
      <Text style={[styles.description, { color: colors.icon }]}>{description}</Text>

      <TouchableOpacity
        style={[styles.upgradeButton, { backgroundColor: '#FFD700' }]}
        onPress={() => showUpgradePrompt(feature)}
      >
        <Ionicons name="star" size={20} color="#fff" />
        <Text style={styles.upgradeButtonText}>Unlock with Premium</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  featureName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
