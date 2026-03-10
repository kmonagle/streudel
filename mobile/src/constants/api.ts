// API configuration constants

export const API_BASE_URL = 'https://streudel-production.up.railway.app';

// API Endpoints
export const API_ENDPOINTS = {
  // Health & Auth
  HEALTH: '/api/health',
  AUTH_USER: '/api/auth/user',
  AUTH_GOOGLE: `${API_BASE_URL}/api/auth/google`,
  AUTH_FACEBOOK: `${API_BASE_URL}/api/auth/facebook`,
  AUTH_APPLE: `${API_BASE_URL}/api/auth/apple`,
  AUTH_MOBILE_EXCHANGE: `${API_BASE_URL}/api/auth/mobile/exchange`,
  LOGOUT: '/api/auth/logout',

  // Recipes
  RECIPES: '/api/recipes',
  RECIPES_FROM_URL: '/api/recipes/from-url',
  RECIPE_BY_ID: (id: string) => `/api/recipes/${id}`,

  // Recipe Queue
  RECIPE_QUEUE: '/api/recipe-queue',
  RECIPE_QUEUE_ITEM_BY_ID: (id: string) => `/api/recipe-queue/${id}`,
  RECIPE_QUEUE_BUILD_SHOPPING_LIST: '/api/recipe-queue/build-shopping-list',
  RECIPE_QUEUE_REORDER: '/api/recipe-queue/reorder',

  // Shopping Lists
  SHOPPING_LISTS: '/api/shopping-lists',
  SHOPPING_LIST_BY_ID: (id: string) => `/api/shopping-lists/${id}`,
  SHOPPING_LIST_ITEMS: (listId: string) => `/api/shopping-lists/${listId}/items`,
  SHOPPING_LIST_ITEM_BY_ID: (listId: string, itemId: string) => `/api/shopping-lists/${listId}/items/${itemId}`,
  SHOPPING_LIST_ADD_RECIPE: (listId: string) => `/api/shopping-lists/${listId}/add-recipe`,
  SHOPPING_LIST_CLEAR_CHECKED: (listId: string) => `/api/shopping-lists/${listId}/clear-checked`,

  // Goals (used as shopping list categories)
  GOALS: '/api/goals',
  GOAL_BY_ID: (id: string) => `/api/goals/${id}`,
  GOAL_TASKS: (goalId: string) => `/api/goals/${goalId}/tasks`,
  GOAL_DELETE_COMPLETED_TASKS: (goalId: string) => `/api/goals/${goalId}/tasks/completed`,

  // Tasks (shopping list items)
  TASKS: '/api/tasks',
  TASK_BY_ID: (id: string) => `/api/tasks/${id}`,

  // Settings
  SETTINGS: '/api/settings',

  // Subscription
  SUBSCRIPTION_VALIDATE: '/api/subscription/validate',
  SUBSCRIPTION_STATUS: '/api/subscription/status',
  SUBSCRIPTION_RESTORE: '/api/subscription/restore',
  SUBSCRIPTION_LIMITS: '/api/subscription/limits',
} as const;

// OAuth configuration
export const OAUTH_CONFIG = {
  redirectScheme: 'streudel',
  redirectPath: 'oauth-callback',
};
