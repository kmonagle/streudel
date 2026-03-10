// Recipes API service
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import { Recipe, CreateRecipeFromUrlDto, UpdateRecipeDto } from '../../types/models';

export const recipesApi = {
  /**
   * Get all recipes
   */
  async getAll(): Promise<Recipe[]> {
    const response = await apiClient.get<Recipe[]>(API_ENDPOINTS.RECIPES);
    return response.data;
  },

  /**
   * Get recipe by ID
   */
  async getById(id: string): Promise<Recipe> {
    const response = await apiClient.get<Recipe>(API_ENDPOINTS.RECIPE_BY_ID(id));
    return response.data;
  },

  /**
   * Create a new recipe from URL
   */
  async createFromUrl(data: CreateRecipeFromUrlDto): Promise<Recipe> {
    console.log('🔵 recipesApi.createFromUrl - sending:', JSON.stringify(data, null, 2));
    const response = await apiClient.post<Recipe>(API_ENDPOINTS.RECIPES_FROM_URL, data);
    console.log('🟢 recipesApi.createFromUrl - received:', JSON.stringify(response.data, null, 2));
    return response.data;
  },

  /**
   * Update a recipe
   */
  async update(id: string, data: UpdateRecipeDto): Promise<Recipe> {
    const response = await apiClient.patch<Recipe>(API_ENDPOINTS.RECIPE_BY_ID(id), data);
    return response.data;
  },

  /**
   * Delete a recipe
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.RECIPE_BY_ID(id));
  },
};
