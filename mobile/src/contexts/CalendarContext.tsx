import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Calendar, CalendarEvent } from '../types/models';
import { calendarApi } from '../services/api/calendar';
import { useAuth } from './AuthContext';
import * as SecureStore from 'expo-secure-store';

interface CalendarContextType {
  calendars: Calendar[];
  events: CalendarEvent[];
  selectedCalendarIds: string[];
  isLoading: boolean;
  hasCalendarPermission: boolean | null; // null = unknown, true = granted, false = denied
  loadCalendars: () => Promise<void>;
  loadEvents: () => Promise<void>;
  selectCalendars: (ids: string[]) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedCalendarIds';

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}

interface CalendarProviderProps {
  children: ReactNode;
}

export function CalendarProvider({ children }: CalendarProviderProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCalendarPermission, setHasCalendarPermission] = useState<boolean | null>(null); // null = unknown
  const { isAuthenticated } = useAuth();

  // Load saved calendar selection from AsyncStorage
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedSelection();
    } else {
      // Clear state when logged out
      setCalendars([]);
      setEvents([]);
      setSelectedCalendarIds([]);
      setHasCalendarPermission(null); // Reset to unknown when logged out
    }
  }, [isAuthenticated]);

  // Load events when selected calendars change
  useEffect(() => {
    if (isAuthenticated && selectedCalendarIds.length > 0) {
      loadEvents();
    } else {
      setEvents([]);
    }
  }, [selectedCalendarIds, isAuthenticated]);

  const loadSavedSelection = async () => {
    try {
      const saved = await SecureStore.getItemAsync(STORAGE_KEY);
      if (saved) {
        const ids = JSON.parse(saved);
        setSelectedCalendarIds(ids);
      }
    } catch (error) {
      console.error('Failed to load saved calendar selection:', error);
    }
  };

  const loadCalendars = async () => {
    setIsLoading(true);
    try {
      const calendarList = await calendarApi.getCalendars();
      setCalendars(calendarList);
      setHasCalendarPermission(true);

      // Auto-select primary calendar if nothing selected yet
      if (selectedCalendarIds.length === 0 && calendarList.length > 0) {
        const primaryCalendar = calendarList.find(cal => cal.isPrimary);
        if (primaryCalendar) {
          await selectCalendars([primaryCalendar.id]);
        }
      }
    } catch (error: any) {
      console.error('Failed to load calendars:', error);

      // Check if it's a permission error (403 or specific error message)
      const errorMessage = error?.error || error?.message || '';
      if (error?.response?.status === 403 || errorMessage.includes('permission')) {
        setHasCalendarPermission(false);
        console.log('📅 Calendar permission not granted - user needs to re-authenticate');
      } else {
        // Other error - don't change permission state
        console.error('📅 Unexpected error loading calendars:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    if (selectedCalendarIds.length === 0) {
      setEvents([]);
      return;
    }

    setIsLoading(true);
    try {
      const eventList = await calendarApi.getEvents(selectedCalendarIds, 7);
      setEvents(eventList);
      console.log(`✅ Loaded ${eventList.length} calendar events`);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      // Don't clear events on error - keep showing cached data
    } finally {
      setIsLoading(false);
    }
  };

  const selectCalendars = async (ids: string[]) => {
    setSelectedCalendarIds(ids);

    // Save to SecureStore
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error('Failed to save calendar selection:', error);
    }
  };

  const refreshEvents = async () => {
    await loadEvents();
  };

  const value: CalendarContextType = {
    calendars,
    events,
    selectedCalendarIds,
    isLoading,
    hasCalendarPermission,
    loadCalendars,
    loadEvents,
    selectCalendars,
    refreshEvents,
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}
