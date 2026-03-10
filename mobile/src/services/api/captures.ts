// Captures API service
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { Capture, CreateCaptureDto } from '../../types/models';

export const capturesApi = {
  /**
   * Get all captures
   */
  async getAll(): Promise<Capture[]> {
    const response = await apiClient.get<Capture[]>(API_ENDPOINTS.CAPTURES);
    return response.data;
  },

  /**
   * Get capture by ID
   */
  async getById(id: string): Promise<Capture> {
    const response = await apiClient.get<Capture>(API_ENDPOINTS.CAPTURE_BY_ID(id));
    return response.data;
  },

  /**
   * Create a new capture
   */
  async create(data: CreateCaptureDto): Promise<Capture> {
    const response = await apiClient.post<Capture>(API_ENDPOINTS.CAPTURES, data);
    return response.data;
  },

  /**
   * Delete a capture
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CAPTURE_BY_ID(id));
  },
};
