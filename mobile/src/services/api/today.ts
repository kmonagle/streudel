// Today view API service
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { TodayItem, TodayReorderItem } from '../../types/models';

export const todayApi = {
  /**
   * Get all items for Today view
   */
  async getAll(): Promise<TodayItem[]> {
    const response = await apiClient.get<TodayItem[]>(API_ENDPOINTS.TODAY);
    return response.data;
  },

  /**
   * Reorder items in Today view
   */
  async reorder(items: TodayReorderItem[]): Promise<void> {
    await apiClient.post(API_ENDPOINTS.TODAY_REORDER, { items });
  },
};
