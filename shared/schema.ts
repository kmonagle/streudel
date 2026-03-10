import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, index, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email").unique(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    subscriptionTier: varchar("subscription_tier", { length: 10 }).default("free"),
    subscriptionStatus: varchar("subscription_status", { length: 20 }).default("none"),
    subscriptionExpiresAt: timestamp("subscription_expires_at"),
    subscriptionWillRenew: boolean("subscription_will_renew").default(false),
    subscriptionPlatform: varchar("subscription_platform", { length: 10 }),
    subscriptionProductId: varchar("subscription_product_id", { length: 100 }),
    subscriptionPurchasedAt: timestamp("subscription_purchased_at"),
    subscriptionCancelledAt: timestamp("subscription_cancelled_at"),
    subscriptionIsTrial: boolean("subscription_is_trial").default(false),
    revenuecatUserId: varchar("revenuecat_user_id", { length: 100 }),
  },
  (table) => [
    index("idx_users_subscription_tier").on(table.subscriptionTier),
    index("idx_users_revenuecat_id").on(table.revenuecatUserId),
  ],
);

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  color: text("color").default("blue"),
  sortOrder: integer("sort_order").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  isHabitGoal: boolean("is_habit_goal").notNull().default(false),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 20 }).default("regular"),
  shoppingListGroupId: varchar("shopping_list_group_id"),
}, (table) => [
  index("idx_goals_type").on(table.type),
  index("idx_goals_shopping_group").on(table.shoppingListGroupId),
]);

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  notes: text("notes"),
  completed: boolean("completed").notNull().default(false),
  completedToday: boolean("completed_today").notNull().default(false),
  completionCount: integer("completion_count").notNull().default(0),
  isToday: boolean("is_today").notNull().default(false),
  goalId: varchar("goal_id").references(() => goals.id),
  sortOrder: integer("sort_order").notNull().default(0),
  todaySortOrder: integer("today_sort_order"),
  timerMinutes: integer("timer_minutes"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceRule: text("recurrence_rule"),
  nextOccurrence: timestamp("next_occurrence"),
  lastCompleted: timestamp("last_completed"),
  category: varchar("category", { length: 50 }),
  dueDate: date("due_date"),
  upcomingDays: integer("upcoming_days"),
});

export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  notes: text("notes"),
  isToday: boolean("is_today").notNull().default(false),
  completedToday: boolean("completed_today").notNull().default(false),
  completionCount: integer("completion_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  todaySortOrder: integer("today_sort_order"),
  timerMinutes: integer("timer_minutes"),
  frequencyTarget: varchar("frequency_target", { length: 100 }),
  userId: varchar("user_id").references(() => users.id).notNull(),
  upcomingDays: integer("upcoming_days"),
});

// Habit completion history for calendar view
export const habitCompletions = pgTable(
  "habit_completions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    habitId: varchar("habit_id").references(() => habits.id, { onDelete: "cascade" }),
    taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    userId: varchar("user_id").references(() => users.id).notNull(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
    completionDate: varchar("completion_date").notNull(), // YYYY-MM-DD format for easy querying
  },
  (table) => [
    index("idx_habit_completions_user_date").on(table.userId, table.completionDate),
    index("idx_habit_completions_habit").on(table.habitId, table.completionDate),
    index("idx_habit_completions_task").on(table.taskId, table.completionDate),
  ],
);

export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).omit({
  id: true,
  completedAt: true,
});

export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  sortOrder: true,
  userId: true,
});

export const insertTaskSchema = createInsertSchema(tasks, {
  nextOccurrence: z.string().datetime().nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  upcomingDays: z.number().int().min(0).max(30).nullable().optional(),
}).omit({
  id: true,
  completed: true,
  completedToday: true,
  completionCount: true,
  todaySortOrder: true,
  userId: true,
  lastCompleted: true,
});

export const insertHabitSchema = createInsertSchema(habits, {
  upcomingDays: z.number().int().min(0).max(30).nullable().optional(),
}).omit({
  id: true,
  completedToday: true,
  completionCount: true,
  todaySortOrder: true,
  userId: true,
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

// Bulk operation schemas
export const bulkCreateTasksSchema = z.object({
  tasks: z.array(insertTaskSchema).min(1).max(100),
});

export const bulkUpdateTasksSchema = z.object({
  updates: z.array(z.object({
    id: z.string(),
    title: z.string().optional(),
    notes: z.string().nullable().optional(),
    completed: z.boolean().optional(),
    isToday: z.boolean().optional(),
    goalId: z.string().nullable().optional(),
    timerMinutes: z.number().nullable().optional(),
  })).min(1).max(100),
});

export const bulkDeleteTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(100),
});

export const bulkCreateHabitsSchema = z.object({
  habits: z.array(insertHabitSchema).min(1).max(100),
});

export const bulkCreateGoalsSchema = z.object({
  goals: z.array(insertGoalSchema).min(1).max(100),
});

export type Goal = typeof goals.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Subscription types
export const subscriptionTierEnum = z.enum(['free', 'premium']);
export const subscriptionStatusEnum = z.enum(['active', 'cancelled', 'expired', 'grace_period', 'trial', 'none']);
export const subscriptionPlatformEnum = z.enum(['ios', 'android']);

export type SubscriptionTier = z.infer<typeof subscriptionTierEnum>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;
export type SubscriptionPlatform = z.infer<typeof subscriptionPlatformEnum>;

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiresAt: string | null;
  willRenew: boolean;
  platform: SubscriptionPlatform | null;
  productId: string | null;
  purchasedAt: string | null;
  isInTrialPeriod: boolean;
}

export const TIER_LIMITS = {
  free: {
    maxHabits: 50,
    maxTasks: 100,
    maxGoals: 10,
    hasCalendarSync: false,
    hasAdvancedAnalytics: false,
  },
  premium: {
    maxHabits: null,
    maxTasks: null,
    maxGoals: null,
    hasCalendarSync: true,
    hasAdvancedAnalytics: true,
  },
} as const;

export type TierLimits = typeof TIER_LIMITS[keyof typeof TIER_LIMITS];

export const updateSubscriptionSchema = z.object({
  tier: subscriptionTierEnum.optional(),
  status: subscriptionStatusEnum.optional(),
  expiresAt: z.string().nullable().optional(),
  willRenew: z.boolean().optional(),
  platform: subscriptionPlatformEnum.nullable().optional(),
  productId: z.string().nullable().optional(),
  purchasedAt: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  isTrial: z.boolean().optional(),
  revenuecatUserId: z.string().nullable().optional(),
});

export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>;

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  notes: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  completedToday: z.boolean().optional(),
  completionCount: z.number().optional(),
  isToday: z.boolean().optional(),
  goalId: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  todaySortOrder: z.number().nullable().optional(),
  timerMinutes: z.number().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().nullable().optional(),
  nextOccurrence: z.string().nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  upcomingDays: z.number().int().min(0).max(30).nullable().optional(),
});

export const updateHabitSchema = z.object({
  title: z.string().optional(),
  notes: z.string().nullable().optional(),
  isToday: z.boolean().optional(),
  completedToday: z.boolean().optional(),
  completionCount: z.number().optional(),
  sortOrder: z.number().optional(),
  todaySortOrder: z.number().nullable().optional(),
  timerMinutes: z.number().nullable().optional(),
  frequencyTarget: z.string().nullable().optional(),
  upcomingDays: z.number().int().min(0).max(30).nullable().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
  archived: z.boolean().optional(),
  isHabitGoal: z.boolean().optional(),
  type: z.string().optional(),
  shoppingListGroupId: z.string().nullable().optional(),
});

export const reorderItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number(),
  })),
});

export const reorderTodayItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    type: z.enum(['task', 'habit']),
    todaySortOrder: z.number(),
  })),
  eventType: z.enum(['drag', 'quick_sort']).optional().default('drag'),
});

export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type UpdateHabit = z.infer<typeof updateHabitSchema>;
export type UpdateGoal = z.infer<typeof updateGoalSchema>;
export type ReorderItems = z.infer<typeof reorderItemsSchema>;
export type ReorderTodayItems = z.infer<typeof reorderTodayItemsSchema>;

// Countdowns
export const countdowns = pgTable("countdowns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  targetDate: varchar("target_date").notNull(), // YYYY-MM-DD format
  sortOrder: integer("sort_order").notNull().default(0),
  userId: varchar("user_id").references(() => users.id).notNull(),
});

export const insertCountdownSchema = createInsertSchema(countdowns).omit({
  id: true,
  sortOrder: true,
  userId: true,
});

export const updateCountdownSchema = z.object({
  name: z.string().optional(),
  targetDate: z.string().optional(),
  sortOrder: z.number().optional(),
});

export type InsertCountdown = z.infer<typeof insertCountdownSchema>;
export type UpdateCountdown = z.infer<typeof updateCountdownSchema>;
export type Countdown = typeof countdowns.$inferSelect;

// User settings
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  settings: jsonb("settings").notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  startScreen: z.enum(['today', 'mystuff']).default('today'),
  countdownDaysThreshold: z.number().int().positive().default(7),
  showQuoteSplash: z.boolean().default(true),
  showUpcomingEvents: z.boolean().default(true),
  showCountdowns: z.boolean().default(true),
});

export const updateUserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  startScreen: z.enum(['today', 'mystuff']).optional(),
  countdownDaysThreshold: z.number().int().positive().optional(),
  showQuoteSplash: z.boolean().optional(),
  showUpcomingEvents: z.boolean().optional(),
  showCountdowns: z.boolean().optional(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type UserSettingsRow = typeof userSettings.$inferSelect;

// Captures - for mobile share sheet content
export const captures = pgTable("captures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  source: text("source"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
});

export const insertCaptureSchema = createInsertSchema(captures).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export type InsertCapture = z.infer<typeof insertCaptureSchema>;
export type Capture = typeof captures.$inferSelect;

// Recipes
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  ingredients: jsonb("ingredients").notNull().default([]),
  parsedIngredients: jsonb("parsed_ingredients").notNull().default([]),
  instructions: jsonb("instructions").notNull().default([]),
  prepTime: text("prep_time"),
  cookTime: text("cook_time"),
  totalTime: text("total_time"),
  servings: text("servings"),
  cuisine: text("cuisine"),
  category: text("category"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_recipes_user_id").on(table.userId),
  index("idx_recipes_created_at").on(table.createdAt),
]);

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const parsedIngredientSchema = z.object({
  amount: z.string().nullable(),
  unit: z.string().nullable(),
  ingredient: z.string(),
  originalText: z.string(),
  notes: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  aisle: z.string().nullable().optional(),
});

export type ParsedIngredient = z.infer<typeof parsedIngredientSchema>;

export const ingredientCategories = pgTable("ingredient_categories", {
  ingredient: varchar("ingredient", { length: 255 }).primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  aisle: varchar("aisle", { length: 100 }),
  spoonacularId: integer("spoonacular_id"),
  imageUrl: text("image_url"),
  source: varchar("source", { length: 20 }).notNull().default("spoonacular"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ingredient_category").on(table.category),
  index("idx_ingredient_source").on(table.source),
]);

export type IngredientCategory = typeof ingredientCategories.$inferSelect;

export const updateRecipeSchema = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  ingredients: z.array(z.string()).optional(),
  parsedIngredients: z.array(parsedIngredientSchema).optional(),
  instructions: z.array(z.string()).optional(),
  prepTime: z.string().nullable().optional(),
  cookTime: z.string().nullable().optional(),
  totalTime: z.string().nullable().optional(),
  servings: z.string().nullable().optional(),
  cuisine: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type UpdateRecipe = z.infer<typeof updateRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

export const shoppingLists = pgTable("shopping_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  items: jsonb("items").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_shopping_lists_user_id").on(table.userId),
]);

export const shoppingListItemSchema = z.object({
  ingredient: z.string(),
  totalAmount: z.string().nullable(),
  unit: z.string().nullable(),
  category: z.string().nullable(),
  aisle: z.string().nullable(),
  checked: z.boolean(),
  recipes: z.array(z.string()),
});

export type ShoppingListItem = z.infer<typeof shoppingListItemSchema>;

export const insertShoppingListSchema = createInsertSchema(shoppingLists).omit({
  id: true,
  userId: true,
  items: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  recipeIds: z.array(z.string()),
});

export const updateShoppingListItemSchema = z.object({
  checked: z.boolean(),
});

export type InsertShoppingList = z.infer<typeof insertShoppingListSchema>;
export type ShoppingList = typeof shoppingLists.$inferSelect;

// Recipe queue for building shopping lists
export const recipeQueue = pgTable("recipe_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  recipeId: varchar("recipe_id").references(() => recipes.id, { onDelete: "cascade" }).notNull(),
  servingMultiplier: integer("serving_multiplier").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_recipe_queue_user_id").on(table.userId),
  index("idx_recipe_queue_sort_order").on(table.sortOrder),
]);

export const insertRecipeQueueSchema = createInsertSchema(recipeQueue).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const updateRecipeQueueSchema = z.object({
  servingMultiplier: z.number().int().min(1).max(100),
});

export const reorderRecipeQueueSchema = z.object({
  orderedIds: z.array(z.string()),
});

export type RecipeQueueItem = typeof recipeQueue.$inferSelect;
export type InsertRecipeQueueItem = z.infer<typeof insertRecipeQueueSchema>;

// Today sort event history for position learning
export const todaySortEvents = pgTable(
  "today_sort_events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    itemId: varchar("item_id", { length: 255 }).notNull(),
    itemType: varchar("item_type", { length: 10 }).notNull(), // 'task' or 'habit'
    oldPosition: integer("old_position"),
    newPosition: integer("new_position").notNull(),
    eventType: varchar("event_type", { length: 20 }).notNull(), // 'drag', 'quick_sort', 'add', 'remove', 'build_today'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_sort_events_user_item").on(table.userId, table.itemId),
    index("idx_sort_events_user_created").on(table.userId, table.createdAt),
  ],
);

export type TodaySortEvent = typeof todaySortEvents.$inferSelect;

export const learnedPositionResultSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(['task', 'habit']),
  learnedPosition: z.number().nullable(),
  confidence: z.number(),
  dataPoints: z.number(),
});

export type LearnedPositionResult = z.infer<typeof learnedPositionResultSchema>;

export const bulkLearnedPositionsSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    itemType: z.enum(['task', 'habit']),
  })),
});
