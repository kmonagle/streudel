// Shopping Lists API service
import { apiClient } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import {
  ShoppingList,
  ShoppingListItem,
  CreateShoppingListDto,
  UpdateShoppingListDto,
  CreateShoppingListItemDto,
  UpdateShoppingListItemDto,
  AddRecipeToShoppingListDto,
} from '../../types/models';

export const shoppingListsApi = {
  /**
   * Get all shopping lists
   */
  async getAll(): Promise<ShoppingList[]> {
    const response = await apiClient.get<ShoppingList[]>(API_ENDPOINTS.SHOPPING_LISTS);
    return response.data;
  },

  /**
   * Get shopping list by ID
   */
  async getById(id: string): Promise<ShoppingList> {
    const response = await apiClient.get<ShoppingList>(API_ENDPOINTS.SHOPPING_LIST_BY_ID(id));
    return response.data;
  },

  /**
   * Create a new shopping list
   */
  async create(data: CreateShoppingListDto): Promise<ShoppingList> {
    const response = await apiClient.post<ShoppingList>(API_ENDPOINTS.SHOPPING_LISTS, data);
    return response.data;
  },

  /**
   * Update a shopping list
   */
  async update(id: string, data: UpdateShoppingListDto): Promise<ShoppingList> {
    const response = await apiClient.patch<ShoppingList>(API_ENDPOINTS.SHOPPING_LIST_BY_ID(id), data);
    return response.data;
  },

  /**
   * Delete a shopping list
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SHOPPING_LIST_BY_ID(id));
  },

  /**
   * Add an item to a shopping list
   */
  async addItem(listId: string, data: CreateShoppingListItemDto): Promise<ShoppingListItem> {
    const response = await apiClient.post<ShoppingListItem>(
      API_ENDPOINTS.SHOPPING_LIST_ITEMS(listId),
      data
    );
    return response.data;
  },

  /**
   * Update a shopping list item
   */
  async updateItem(listId: string, itemId: string, data: UpdateShoppingListItemDto): Promise<ShoppingListItem> {
    const response = await apiClient.patch<ShoppingListItem>(
      API_ENDPOINTS.SHOPPING_LIST_ITEM_BY_ID(listId, itemId),
      data
    );
    return response.data;
  },

  /**
   * Delete a shopping list item
   */
  async deleteItem(listId: string, itemId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SHOPPING_LIST_ITEM_BY_ID(listId, itemId));
  },

  /**
   * Add recipe ingredients to shopping list
   */
  async addRecipe(listId: string, data: AddRecipeToShoppingListDto): Promise<ShoppingList> {
    const response = await apiClient.post<ShoppingList>(
      API_ENDPOINTS.SHOPPING_LIST_ADD_RECIPE(listId),
      data
    );
    return response.data;
  },

  /**
   * Clear all checked items from a shopping list
   */
  async clearChecked(listId: string): Promise<ShoppingList> {
    const response = await apiClient.post<ShoppingList>(
      API_ENDPOINTS.SHOPPING_LIST_CLEAR_CHECKED(listId)
    );
    return response.data;
  },
};
