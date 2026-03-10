import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { User } from '../types/models';
import { useSettings } from '../contexts/SettingsContext';
import { useSubscription } from '../contexts/SubscriptionContext';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => Promise<void>;
}

export default function ProfileModal({ visible, onClose, user, onLogout }: ProfileModalProps) {
  const { effectiveTheme } = useSettings();
  const { subscription, isPremium } = useSubscription();
  const colors = Colors[effectiveTheme];
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await onLogout();
            } catch (error) {
              console.error('Logout error in modal:', error);
            } finally {
              setIsLoggingOut(false);
              onClose();
            }
          }
        }
      ]
    );
  };

  // Get user initials for fallback avatar
  const getInitials = (name?: string): string => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Profile
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {user ? (
            <>
              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                {user.picture && !imageError ? (
                  <Image
                    source={{ uri: user.picture }}
                    style={styles.avatar}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.tint }]}>
                    <Text style={styles.avatarInitials}>
                      {getInitials(user?.name)}
                    </Text>
                  </View>
                )}
                <Text style={[styles.userName, { color: colors.text }]}>
                  {user?.name || 'Unknown User'}
                </Text>
                <Text style={[styles.userEmail, { color: colors.icon }]}>
                  {user?.email || 'No email'}
                </Text>

                {/* Tier Indicator */}
                {subscription && (
                  <View style={styles.tierIndicator}>
                    <View style={[
                      styles.tierPill,
                      { backgroundColor: isPremium ? '#FFD70020' : colors.card, borderColor: isPremium ? '#FFD700' : colors.border }
                    ]}>
                      <Ionicons
                        name={isPremium ? "star" : "star-outline"}
                        size={16}
                        color={isPremium ? '#FFD700' : colors.icon}
                      />
                      <Text style={[
                        styles.tierPillText,
                        { color: isPremium ? '#FFD700' : colors.text }
                      ]}>
                        {subscription.tier === 'premium' ? 'Premium Member' : 'Free Plan'}
                      </Text>
                    </View>
                    {!isPremium && (
                      <TouchableOpacity
                        style={styles.upgradeLink}
                        onPress={() => {
                          onClose();
                          router.push('/subscription');
                        }}
                      >
                        <Text style={[styles.upgradeLinkText, { color: colors.tint }]}>
                          Unlock Premium Features →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Account Info Card */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Account Information
                </Text>
                <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={20} color={colors.icon} />
                    <View style={styles.infoTextContainer}>
                      <Text style={[styles.infoLabel, { color: colors.icon }]}>Email</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email || 'No email'}</Text>
                    </View>
                  </View>
                  <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.infoRow}>
                    <Ionicons name="logo-google" size={20} color={colors.icon} />
                    <View style={styles.infoTextContainer}>
                      <Text style={[styles.infoLabel, { color: colors.icon }]}>Sign-in method</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>Google</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Logout Button */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={[
                    styles.logoutButton,
                    {
                      backgroundColor: colors.error + '10',
                      borderColor: colors.error,
                    },
                    isLoggingOut && styles.logoutButtonDisabled
                  ]}
                  onPress={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <>
                      <Ionicons name="log-out-outline" size={20} color={colors.error} />
                      <Text style={[styles.logoutButtonText, { color: colors.error }]}>
                        Sign Out
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                No user data available
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    marginVertical: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  tierIndicator: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tierPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeLink: {
    marginTop: 4,
  },
  upgradeLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
