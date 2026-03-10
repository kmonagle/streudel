import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { Goal } from '../../types/models';

export const goalsApi = {
  async getAll(): Promise<Goal[]> {
    const response = await apiClient.get<Goal[]>(API_ENDPOINTS.GOALS);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.GOAL_BY_ID(id));
  },

  async deleteCompletedTasks(goalId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.GOAL_DELETE_COMPLETED_TASKS(goalId));
  },
};
