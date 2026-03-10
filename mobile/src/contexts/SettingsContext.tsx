import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSettings, UpdateSettingsDto } from '../types/models';
import { settingsApi } from '../services/api/settings';
import { useColorScheme } from 'react-native';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  updateSettings: (updates: UpdateSettingsDto) => Promise<void>;
  effectiveTheme: 'light' | 'dark'; // Resolved theme (auto becomes light/dark based on system)
}

const defaultSettings: UserSettings = {
  theme: 'auto',
  startScreen: 'today',
  countdownDaysThreshold: 7,
  upcomingTasksDaysThreshold: 1,
  showUpcomingEvents: true,
  showCountdowns: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const systemColorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();

  // Load settings when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      loadSettings();
    } else {
      // Use defaults when not authenticated
      setSettings(defaultSettings);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      console.log('🔄 Loading settings from backend...');
      const userSettings = await settingsApi.get();
      console.log('📥 Loaded settings from backend:', JSON.stringify(userSettings, null, 2));
      setSettings(userSettings);
    } catch (error: any) {
      console.error('❌ Failed to load settings:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Use defaults if API fails
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: UpdateSettingsDto) => {
    try {
      console.log('📤 Updating settings with:', updates);
      const updatedSettings = await settingsApi.update(updates);
      console.log('📥 Received updated settings:', updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  // Resolve effective theme (auto becomes light/dark based on system)
  const effectiveTheme: 'light' | 'dark' =
    settings?.theme === 'auto'
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : (settings?.theme === 'dark' ? 'dark' : 'light');

  const value: SettingsContextType = {
    settings: settings || defaultSettings,
    isLoading,
    updateSettings,
    effectiveTheme,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
