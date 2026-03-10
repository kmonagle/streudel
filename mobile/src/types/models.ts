// Core data models based on Life | Ordered API schema

// Subscription types
export type UserTier = 'free' | 'premium';

export type SubscriptionStatus =
  | 'active' | 'cancelled' | 'expired'
  | 'grace_period' | 'trial' | 'none';

export interface SubscriptionInfo {
  tier: UserTier;
  status: SubscriptionStatus;
  expiresAt?: string;
  willRenew: boolean;
  platform?: 'ios' | 'android';  // Purchase platform (mobile only)
  productId?: string;
  purchasedAt?: string;
  isInTrialPeriod?: boolean;
}

export interface TierLimits {
  maxHabits: number | null;      // null = unlimited
  maxTasks: number | null;
  maxGoals: number | null;
  hasCalendarSync: boolean;
  hasAdvancedAnalytics?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  subscription: SubscriptionInfo;
  // Computed properties for convenience
  name?: string;
  picture?: string;
}


export interface Calendar {
  id: string;
  name: string;
  description: string | null;
  backgroundColor: string;
  foregroundColor: string;
  isPrimary: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string; // ISO string or YYYY-MM-DD for all-day
  endTime: string; // ISO string or YYYY-MM-DD for all-day
  isAllDay: boolean;
  color: string;
}


// Recipes
export interface ParsedIngredient {
  amount: string | null;
  unit: string | null;
  ingredient: string;
  originalText: string;
  notes: string | null;
  category: string | null;
  aisle: string | null;
}

export interface Recipe {
  id: string;
  userId: string;
  url: string;
  title: string;
  imageUrl: string | null;
  description: string | null;
  ingredients: string[];
  parsedIngredients: ParsedIngredient[];
  instructions: string[];
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  cuisine: string | null;
  category: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeFromUrlDto {
  url: string;
}

export interface UpdateRecipeDto {
  title?: string;
  notes?: string;
  imageUrl?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  cuisine?: string;
  category?: string;
}

// Recipe Queue
export interface RecipeQueueItem {
  id: string;
  recipeId: string;
  recipe: Recipe;
  servingMultiplier: number;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddToRecipeQueueDto {
  recipeId: string;
  servingMultiplier?: number;
}

export interface UpdateRecipeQueueItemDto {
  servingMultiplier?: number;
  sortOrder?: number;
}

export interface BuildShoppingListDto {
  goalName?: string; // Defaults to "Shopping List"
}

// Shopping Lists (Legacy - keeping for now but may remove)
export interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  ingredient: string;
  amount: string | null;
  unit: string | null;
  aisle: string | null;
  category: string | null;
  checked: boolean;
  recipeId: string | null;
  recipeTitle: string | null;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  userId: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateShoppingListDto {
  name: string;
}

export interface UpdateShoppingListDto {
  name?: string;
}

export interface CreateShoppingListItemDto {
  ingredient: string;
  amount?: string;
  unit?: string;
  aisle?: string;
  category?: string;
  recipeId?: string;
  recipeTitle?: string;
}

export interface UpdateShoppingListItemDto {
  ingredient?: string;
  amount?: string;
  unit?: string;
  aisle?: string;
  category?: string;
  checked?: boolean;
}

export interface AddRecipeToShoppingListDto {
  recipeId: string;
  servingMultiplier?: number;
}

// Goals (used as shopping list categories)
export interface Goal {
  id: string;
  name: string;
  title: string;
  type: string | null;
  color: string | null;
  userId: string;
  sortOrder: number;
}

// Tasks (shopping list items)
export interface Task {
  id: string;
  name: string;
  title: string;
  notes: string | null;
  completed: boolean;
  completedToday: boolean;
  completionCount: number;
  goalId: string | null;
  isOnToday: boolean;
  isToday: boolean;
  sortOrder: number;
  todaySortOrder: number | null;
  userId: string;
}

export interface CreateTaskDto {
  title: string;
  notes?: string;
  goalId?: string;
  isToday?: boolean;
  completed?: boolean;
}

export interface UpdateTaskDto {
  title?: string;
  notes?: string;
  completed?: boolean;
  isToday?: boolean;
  goalId?: string;
  sortOrder?: number;
}

// User Settings
export type ThemeSetting = 'light' | 'dark' | 'auto';
export type StartScreenSetting = 'today' | 'mystuff';

export interface UserSettings {
  theme: ThemeSetting;
  startScreen: StartScreenSetting;
  countdownDaysThreshold: number;
  upcomingTasksDaysThreshold: number;
  showUpcomingEvents: boolean;
  showCountdowns: boolean;
}

export interface UpdateSettingsDto {
  theme?: ThemeSetting;
  startScreen?: StartScreenSetting;
  countdownDaysThreshold?: number;
  upcomingTasksDaysThreshold?: number;
  showUpcomingEvents?: boolean;
  showCountdowns?: boolean;
}
