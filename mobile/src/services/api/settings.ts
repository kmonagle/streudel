// User Settings API service
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { UserSettings, UpdateSettingsDto } from '../../types/models';

export const settingsApi = {
  /**
   * Get current user's settings
   */
  async get(): Promise<UserSettings> {
    const response = await apiClient.get<UserSettings>(API_ENDPOINTS.SETTINGS);
    return response.data;
  },

  /**
   * Update user settings (partial update supported)
   */
  async update(updates: UpdateSettingsDto): Promise<UserSettings> {
    const response = await apiClient.put<UserSettings>(API_ENDPOINTS.SETTINGS, updates);
    return response.data;
  },
};
