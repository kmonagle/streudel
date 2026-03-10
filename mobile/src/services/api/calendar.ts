// Calendar API service
import { apiClient } from './client';
import { Calendar, CalendarEvent } from '../../types/models';

export const calendarApi = {
  /**
   * Get list of user's Google Calendars
   */
  async getCalendars(): Promise<Calendar[]> {
    const response = await apiClient.get<{ calendars: Calendar[] }>('/api/calendar/calendars');
    return response.data.calendars;
  },

  /**
   * Get events from selected calendars
   */
  async getEvents(calendarIds: string[], days: number = 7): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      calendarIds: calendarIds.join(','),
      days: days.toString(),
    });

    const response = await apiClient.get<{ events: CalendarEvent[] }>(
      `/api/calendar/events?${params.toString()}`
    );
    return response.data.events;
  },
};
