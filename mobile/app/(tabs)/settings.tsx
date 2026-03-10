import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useSettings } from '../../src/contexts/SettingsContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCalendar } from '../../src/contexts/CalendarContext';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
import PremiumGate from '../../src/components/PremiumGate';
import { ThemeSetting, StartScreenSetting } from '../../src/types/models';

export default function SettingsScreen() {
  const { settings, isLoading, updateSettings, effectiveTheme } = useSettings();
  const colors = Colors[effectiveTheme];
  const { user, logout, isAuthenticated } = useAuth();
  const { subscription, isPremium } = useSubscription();
  const {
    calendars,
    selectedCalendarIds,
    isLoading: isLoadingCalendars,
    hasCalendarPermission,
    loadCalendars,
    selectCalendars,
  } = useCalendar();

  const [isSaving, setIsSaving] = useState(false);
  const [countdownInput, setCountdownInput] = useState((settings?.countdownDaysThreshold ?? 7).toString());
  const [upcomingTasksInput, setUpcomingTasksInput] = useState((settings?.upcomingTasksDaysThreshold ?? 1).toString());
  const [loadedCalendars, setLoadedCalendars] = useState(false);

  // Load calendars when screen is focused (only once per session)
  useFocusEffect(
    React.useCallback(() => {
      if (!loadedCalendars && isAuthenticated) {
        loadCalendars();
        setLoadedCalendars(true);
      }
    }, [loadedCalendars, isAuthenticated])
  );

  const handleToggleCalendar = async (calendarId: string) => {
    const newSelection = selectedCalendarIds.includes(calendarId)
      ? selectedCalendarIds.filter(id => id !== calendarId)
      : [...selectedCalendarIds, calendarId];

    await selectCalendars(newSelection);
  };

  const handleThemeChange = async (theme: ThemeSetting) => {
    try {
      setIsSaving(true);
      await updateSettings({ theme });
    } catch (error) {
      Alert.alert('Error', 'Failed to update theme setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartScreenChange = async (startScreen: StartScreenSetting) => {
    try {
      setIsSaving(true);
      await updateSettings({ startScreen });
    } catch (error) {
      Alert.alert('Error', 'Failed to update start screen setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountdownThresholdSave = async () => {
    const value = parseInt(countdownInput);
    if (isNaN(value) || value < 1) {
      Alert.alert('Invalid Value', 'Please enter a number greater than 0');
      return;
    }

    try {
      setIsSaving(true);
      await updateSettings({ countdownDaysThreshold: value });
      Alert.alert('Saved', 'Countdown threshold updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update countdown threshold');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpcomingTasksThresholdSave = async () => {
    const value = parseInt(upcomingTasksInput);
    if (isNaN(value) || value < 1) {
      Alert.alert('Invalid Value', 'Please enter a number greater than 0');
      return;
    }

    try {
      setIsSaving(true);
      await updateSettings({ upcomingTasksDaysThreshold: value });
      Alert.alert('Saved', 'Upcoming tasks threshold updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update upcoming tasks threshold');
    } finally {
      setIsSaving(false);
    }
  };


  const handleToggleUpcomingEvents = async (value: boolean) => {
    console.log('🔄 Toggling upcoming events to:', value);
    try {
      setIsSaving(true);
      const result = await updateSettings({ showUpcomingEvents: value });
      console.log('✅ Upcoming events updated:', result);
    } catch (error) {
      console.error('❌ Failed to update upcoming events:', error);
      Alert.alert('Error', 'Failed to update upcoming events setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCountdowns = async (value: boolean) => {
    console.log('🔄 Toggling countdowns to:', value);
    try {
      setIsSaving(true);
      const result = await updateSettings({ showCountdowns: value });
      console.log('✅ Countdowns updated:', result);
    } catch (error) {
      console.error('❌ Failed to update countdowns:', error);
      Alert.alert('Error', 'Failed to update countdowns setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* User Info */}
        {user && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.userInfo}>
              <Ionicons name="person-circle-outline" size={48} color={colors.icon} />
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: colors.icon }]}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Subscription Section */}
        {subscription && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.tierBadge}>
                <Ionicons
                  name={isPremium ? "star" : "star-outline"}
                  size={20}
                  color={isPremium ? '#FFD700' : colors.icon}
                />
                <Text style={[styles.tierText, { color: colors.text }]}>
                  {subscription.tier === 'premium' ? 'Premium' : 'Free'}
                </Text>
              </View>

              {!isPremium && (
                <TouchableOpacity
                  style={[styles.upgradeButton, { backgroundColor: '#FFD700' }]}
                  onPress={() => router.push('/subscription')}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>

            {isPremium && subscription.expiresAt && (
              <Text style={[styles.subscriptionDetails, { color: colors.icon }]}>
                {subscription.willRenew ? 'Renews' : 'Expires'} on{' '}
                {new Date(subscription.expiresAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            )}
          </View>
        )}

        {/* Theme Setting */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={styles.settingGroup}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
            <View style={styles.optionButtons}>
              {(['light', 'dark', 'auto'] as ThemeSetting[]).map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[
                    styles.optionButton,
                    { borderColor: colors.border },
                    settings?.theme === theme && { backgroundColor: colors.tint, borderColor: colors.tint },
                  ]}
                  onPress={() => handleThemeChange(theme)}
                  disabled={isSaving}
                >
                  <Ionicons
                    name={
                      theme === 'light' ? 'sunny' :
                      theme === 'dark' ? 'moon' :
                      'contrast'
                    }
                    size={20}
                    color={settings?.theme === theme ? '#fff' : colors.icon}
                  />
                  <Text style={[
                    styles.optionButtonText,
                    { color: settings?.theme === theme ? '#fff' : colors.text },
                  ]}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Start Screen Setting */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Navigation</Text>
          <View style={styles.settingGroup}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Start Screen</Text>
            <Text style={[styles.settingHint, { color: colors.icon }]}>
              Which screen to show when you open the app
            </Text>
            <View style={styles.optionButtons}>
              {(['today', 'mystuff'] as StartScreenSetting[]).map((screen) => (
                <TouchableOpacity
                  key={screen}
                  style={[
                    styles.optionButton,
                    { borderColor: colors.border },
                    settings?.startScreen === screen && { backgroundColor: colors.tint, borderColor: colors.tint },
                  ]}
                  onPress={() => handleStartScreenChange(screen)}
                  disabled={isSaving}
                >
                  <Ionicons
                    name={screen === 'today' ? 'sunny' : 'list'}
                    size={20}
                    color={settings?.startScreen === screen ? '#fff' : colors.icon}
                  />
                  <Text style={[
                    styles.optionButtonText,
                    { color: settings?.startScreen === screen ? '#fff' : colors.text },
                  ]}>
                    {screen === 'today' ? 'Today' : 'My Stuff'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>

        {/* Today Screen Settings */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today Screen</Text>

          <View style={styles.settingGroup}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Show Upcoming Events</Text>
                <Text style={[styles.settingHint, { color: colors.icon, marginBottom: 0 }]}>
                  Display calendar events on Today screen
                </Text>
              </View>
              <Switch
                value={settings?.showUpcomingEvents ?? true}
                onValueChange={handleToggleUpcomingEvents}
                disabled={isSaving}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={[styles.settingGroup, { marginTop: 16 }]}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Show Countdowns</Text>
                <Text style={[styles.settingHint, { color: colors.icon, marginBottom: 0 }]}>
                  Display upcoming countdowns on Today screen
                </Text>
              </View>
              <Switch
                value={settings?.showCountdowns ?? true}
                onValueChange={handleToggleCountdowns}
                disabled={isSaving}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={[styles.settingGroup, { marginTop: 16 }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Countdown Threshold</Text>
            <Text style={[styles.settingHint, { color: colors.icon }]}>
              Countdowns within this many days will appear on Today
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.numberInput, {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }]}
                value={countdownInput}
                onChangeText={setCountdownInput}
                keyboardType="number-pad"
                placeholder="7"
                placeholderTextColor={colors.icon}
              />
              <Text style={[styles.inputLabel, { color: colors.text }]}>days</Text>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.tint }]}
                onPress={handleCountdownThresholdSave}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.settingGroup, { marginTop: 16 }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Upcoming Tasks Threshold</Text>
            <Text style={[styles.settingHint, { color: colors.icon }]}>
              Recurring tasks within this many days will appear on Today
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.numberInput, {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }]}
                value={upcomingTasksInput}
                onChangeText={setUpcomingTasksInput}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={colors.icon}
              />
              <Text style={[styles.inputLabel, { color: colors.text }]}>days</Text>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.tint }]}
                onPress={handleUpcomingTasksThresholdSave}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Google Calendar */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Google Calendar</Text>
          {!isPremium ? (
            <PremiumGate
              feature="calendar_sync"
              featureName="Calendar Sync"
              description="Sync your Google Calendar and see events on your Today screen"
            />
          ) : hasCalendarPermission === false ? (
            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.icon }]}>
                Calendar permission not granted. Sign out and sign back in to enable calendar sync.
              </Text>
            </View>
          ) : isLoadingCalendars ? (
            <ActivityIndicator size="small" color={colors.tint} style={{ marginVertical: 12 }} />
          ) : calendars.length === 0 ? (
            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.icon }]}>
                No calendars found
              </Text>
            </View>
          ) : (
            <View style={styles.settingGroup}>
              <Text style={[styles.settingHint, { color: colors.icon }]}>
                Select calendars to show on Today and My Stuff screens
              </Text>
              <View style={{ marginTop: 12 }}>
                {calendars.map((calendar) => {
                  const isSelected = selectedCalendarIds.includes(calendar.id);
                  return (
                    <TouchableOpacity
                      key={calendar.id}
                      style={[styles.calendarItem, { borderColor: colors.border }]}
                      onPress={() => handleToggleCalendar(calendar.id)}
                    >
                      <View
                        style={[
                          styles.calendarColor,
                          { backgroundColor: calendar.backgroundColor },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.calendarName, { color: colors.text }]}>
                          {calendar.name}
                          {calendar.isPrimary && ' (Primary)'}
                        </Text>
                        {calendar.description && (
                          <Text style={[styles.calendarDescription, { color: colors.icon }]}>
                            {calendar.description}
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={isSelected ? colors.tint : colors.icon}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error + '10', borderColor: colors.error }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutButtonText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingGroup: {
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingHint: {
    fontSize: 14,
    marginBottom: 12,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  calendarColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  calendarName: {
    fontSize: 15,
    fontWeight: '500',
  },
  calendarDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierText: {
    fontSize: 18,
    fontWeight: '600',
  },
  upgradeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionDetails: {
    fontSize: 14,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
});
