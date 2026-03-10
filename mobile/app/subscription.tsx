import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionService } from '@/services/subscription/subscriptionService';
import { useSettings } from '@/contexts/SettingsContext';
import { Colors } from '@/constants/colors';

export default function SubscriptionScreen() {
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  const { purchaseSubscription, restorePurchases } = useSubscription();
  const { effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];

  const [offerings, setOfferings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(true);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoadingOfferings(true);
      const offers = await subscriptionService.getOfferings();
      setOfferings(offers);
    } catch (error) {
      console.error('Failed to load offerings:', error);
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handlePurchase = async (pkg: any) => {
    setIsLoading(true);
    try {
      await purchaseSubscription(pkg);
      Alert.alert(
        'Success!',
        'Welcome to Premium! Enjoy unlimited access to all features.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      await restorePurchases();
      Alert.alert(
        'Restored!',
        'Your Premium subscription has been restored.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('No Purchases Found', 'We couldn\'t find any purchases to restore.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Ionicons name="star" size={60} color="#FFD700" />
        <Text style={[styles.title, { color: colors.text }]}>Upgrade to Premium</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Unlock unlimited potential
        </Text>
      </View>

      {/* Feature list */}
      <View style={styles.featuresList}>
        <FeatureItem
          icon="infinite"
          title="Unlimited Habits & Tasks"
          description="Create as many as you need"
          colors={colors}
        />
        <FeatureItem
          icon="calendar"
          title="Google Calendar Sync"
          description="See your calendar events on Today screen"
          colors={colors}
        />
        <FeatureItem
          icon="analytics"
          title="Advanced Analytics"
          description="Track your progress over time"
          colors={colors}
        />
        <FeatureItem
          icon="sparkles"
          title="Priority Support"
          description="Get help when you need it"
          colors={colors}
        />
      </View>

      {/* Pricing packages */}
      {loadingOfferings ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={[styles.loadingText, { color: colors.icon }]}>
            Loading subscription options...
          </Text>
        </View>
      ) : offerings?.current?.availablePackages ? (
        <View style={styles.packagesContainer}>
          {offerings.current.availablePackages.map((pkg: any) => (
            <TouchableOpacity
              key={pkg.identifier}
              style={[
                styles.packageCard,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              onPress={() => handlePurchase(pkg)}
              disabled={isLoading}
            >
              <View style={styles.packageHeader}>
                <Text style={[styles.packageTitle, { color: colors.text }]}>
                  {pkg.product.title}
                </Text>
                {pkg.packageType === 'ANNUAL' && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveText}>BEST VALUE</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.packagePrice, { color: colors.text }]}>
                {pkg.product.priceString}
              </Text>
              <Text style={[styles.packageDescription, { color: colors.icon }]}>
                {pkg.product.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.icon }]}>
            No subscription options available at this time.
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleRestore}
        style={styles.restoreButton}
        disabled={isLoading}
      >
        <Text style={[styles.restoreText, { color: colors.icon }]}>
          Restore Purchases
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.icon }]}>
          Subscriptions auto-renew unless cancelled 24 hours before the end of the period.
        </Text>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      )}
    </ScrollView>
  );
}

interface FeatureItemProps {
  icon: any;
  title: string;
  description: string;
  colors: any;
}

function FeatureItem({ icon, title, description, colors }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={24} color="#4CAF50" />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.icon }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  featuresList: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF5020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  packagesContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  packageCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saveText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  restoreButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  restoreText: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
