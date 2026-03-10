import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { Task, CreateTaskDto, UpdateTaskDto } from '../../types/models';

export const tasksApi = {
  async getAll(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(API_ENDPOINTS.TASKS);
    return response.data;
  },

  async create(data: CreateTaskDto): Promise<Task> {
    const response = await apiClient.post<Task>(API_ENDPOINTS.TASKS, data);
    return response.data;
  },

  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    const response = await apiClient.patch<Task>(API_ENDPOINTS.TASK_BY_ID(id), data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.TASK_BY_ID(id));
  },
};
