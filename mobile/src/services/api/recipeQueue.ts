// Recipe Queue API service
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import {
  RecipeQueueItem,
  AddToRecipeQueueDto,
  UpdateRecipeQueueItemDto,
  BuildShoppingListDto,
  Goal,
  ReorderItem,
} from '../../types/models';

export const recipeQueueApi = {
  /**
   * Get all items in the recipe queue
   */
  async getAll(): Promise<RecipeQueueItem[]> {
    console.log('📋 recipeQueueApi.getAll - Starting request to:', API_ENDPOINTS.RECIPE_QUEUE);
    try {
      const response = await apiClient.get<RecipeQueueItem[]>(API_ENDPOINTS.RECIPE_QUEUE);
      console.log('📋 recipeQueueApi.getAll - Success, got', response.data?.length || 0, 'items');
      return response.data;
    } catch (error) {
      console.error('📋 recipeQueueApi.getAll - Failed with error:', error);
      throw error;
    }
  },

  /**
   * Add a recipe to the queue
   */
  async add(data: AddToRecipeQueueDto): Promise<RecipeQueueItem> {
    const response = await apiClient.post<RecipeQueueItem>(API_ENDPOINTS.RECIPE_QUEUE, data);
    return response.data;
  },

  /**
   * Update a recipe queue item
   */
  async update(id: string, data: UpdateRecipeQueueItemDto): Promise<RecipeQueueItem> {
    const response = await apiClient.patch<RecipeQueueItem>(
      API_ENDPOINTS.RECIPE_QUEUE_ITEM_BY_ID(id),
      data
    );
    return response.data;
  },

  /**
   * Remove a recipe from the queue
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.RECIPE_QUEUE_ITEM_BY_ID(id));
  },

  /**
   * Build shopping list from queue - creates multiple category goals with tasks for each ingredient
   * Uses Claude Haiku AI to intelligently categorize ingredients by grocery store section
   * and sort them for efficient shopping (grouping duplicates like multiple kale entries).
   * Returns array of goals (one per category: Produce, Dairy, Meat, etc.)
   */
  async buildShoppingList(data?: BuildShoppingListDto): Promise<Goal[]> {
    const response = await apiClient.post<Goal[]>(
      API_ENDPOINTS.RECIPE_QUEUE_BUILD_SHOPPING_LIST,
      data || {}
    );
    return response.data;
  },

  /**
   * Reorder recipe queue items
   */
  async reorder(items: ReorderItem[]): Promise<RecipeQueueItem[]> {
    const response = await apiClient.post<RecipeQueueItem[]>(
      API_ENDPOINTS.RECIPE_QUEUE_REORDER,
      { items }
    );
    return response.data;
  },
};
