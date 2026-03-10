import { 
  type Goal, 
  type Task, 
  type Habit, 
  type User,
  type HabitCompletion,
  type Countdown,
  type Capture,
  type Recipe,
  type ShoppingList,
  type ShoppingListItem,
  type UserSettings,
  type UpdateUserSettings,
  type InsertGoal, 
  type InsertTask, 
  type InsertHabit, 
  type InsertCountdown,
  type InsertCapture,
  type InsertRecipe,
  type UpdateRecipe,
  type UpsertUser,
  type UpdateGoal, 
  type UpdateTask, 
  type UpdateHabit, 
  type UpdateCountdown,
  type ReorderItems, 
  type ReorderTodayItems,
  type SubscriptionInfo,
  type SubscriptionTier,
  type ParsedIngredient,
  type RecipeQueueItem,
  type InsertRecipeQueueItem,
  type LearnedPositionResult,
  TIER_LIMITS,
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { goals, tasks, habits, users, habitCompletions, countdowns, captures, userSettings, recipes, shoppingLists, recipeQueue, todaySortEvents } from "@shared/schema";
import { db } from "./db";
import { eq, isNull, and, desc, asc, gte, lte } from "drizzle-orm";
import rrule from "rrule";
const { RRule } = rrule;

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByRevenueCatId(revenuecatUserId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Goals
  getGoals(userId: string, showArchived?: boolean): Promise<Goal[]>;
  getGoal(id: string, userId: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal & { userId: string; sortOrder?: number; type?: string | null; shoppingListGroupId?: string | null }): Promise<Goal>;
  updateGoal(id: string, userId: string, updates: UpdateGoal): Promise<Goal | undefined>;
  deleteGoal(id: string, userId: string): Promise<boolean>;
  deleteShoppingGoals(userId: string): Promise<number>;

  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  getTasksByGoal(goalId: string, userId: string): Promise<Task[]>;
  getTask(id: string, userId: string): Promise<Task | undefined>;
  createTask(task: InsertTask & { userId: string }): Promise<Task>;
  updateTask(id: string, userId: string, updates: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<boolean>;

  // Habits
  getHabits(userId: string): Promise<Habit[]>;
  getHabit(id: string, userId: string): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit & { userId: string }): Promise<Habit>;
  updateHabit(id: string, userId: string, updates: UpdateHabit): Promise<Habit | undefined>;
  deleteHabit(id: string, userId: string): Promise<boolean>;

  // Today items
  getTodayItems(userId: string): Promise<{ tasks: Task[]; habits: Habit[] }>;

  // Reordering
  reorderGoals(userId: string, reorder: ReorderItems): Promise<void>;
  reorderTasks(goalId: string | null, userId: string, reorder: ReorderItems): Promise<void>;
  reorderHabits(userId: string, reorder: ReorderItems): Promise<void>;
  reorderTodayItems(userId: string, reorder: ReorderTodayItems, eventType?: string): Promise<void>;

  // Today sort event logging & position learning
  logSortEvent(userId: string, itemId: string, itemType: string, newPosition: number, eventType: string, oldPosition?: number | null): Promise<void>;
  getLearnedPosition(userId: string, itemId: string, itemType: string): Promise<LearnedPositionResult>;
  getLearnedPositionsBulk(userId: string, items: { itemId: string; itemType: string }[]): Promise<LearnedPositionResult[]>;

  // Bulk operations
  deleteCompletedTasks(goalId: string | null, userId: string): Promise<void>;
  bulkCreateTasks(tasksData: (InsertTask & { userId: string })[]): Promise<Task[]>;
  bulkUpdateTasks(updates: { id: string; title?: string; notes?: string | null; completed?: boolean; isToday?: boolean; goalId?: string | null; timerMinutes?: number | null }[], userId: string): Promise<Task[]>;
  bulkDeleteTasks(taskIds: string[], userId: string): Promise<number>;
  bulkCreateHabits(habitsData: (InsertHabit & { userId: string })[]): Promise<Habit[]>;
  bulkCreateGoals(goalsData: (InsertGoal & { userId: string })[]): Promise<Goal[]>;

  // Habit completion history
  logHabitCompletion(userId: string, habitId?: string, taskId?: string): Promise<HabitCompletion>;
  getHabitCompletionHistory(userId: string, startDate: string, endDate: string): Promise<HabitCompletion[]>;
  addHabitCompletionForDate(userId: string, completionDate: string, habitId?: string, taskId?: string): Promise<HabitCompletion>;
  removeHabitCompletionForDate(userId: string, completionDate: string, habitId?: string, taskId?: string): Promise<boolean>;

  // Countdowns
  getCountdowns(userId: string): Promise<Countdown[]>;
  getCountdown(id: string, userId: string): Promise<Countdown | undefined>;
  createCountdown(countdown: InsertCountdown & { userId: string }): Promise<Countdown>;
  updateCountdown(id: string, userId: string, updates: UpdateCountdown): Promise<Countdown | undefined>;
  deleteCountdown(id: string, userId: string): Promise<boolean>;

  // Captures
  getCaptures(userId: string): Promise<Capture[]>;
  createCapture(capture: InsertCapture & { userId: string }): Promise<Capture>;
  deleteCapture(id: string, userId: string): Promise<boolean>;

  // Recipes
  getRecipes(userId: string): Promise<Recipe[]>;
  getRecipe(id: string, userId: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe & { userId: string }): Promise<Recipe>;
  updateRecipe(id: string, userId: string, updates: UpdateRecipe): Promise<Recipe | undefined>;
  deleteRecipe(id: string, userId: string): Promise<boolean>;

  // Shopping Lists
  getShoppingLists(userId: string): Promise<ShoppingList[]>;
  getShoppingList(id: string, userId: string): Promise<ShoppingList | undefined>;
  createShoppingList(name: string, recipeIds: string[], userId: string): Promise<ShoppingList>;
  updateShoppingListItem(id: string, userId: string, ingredient: string, checked: boolean): Promise<ShoppingList | undefined>;
  deleteShoppingList(id: string, userId: string): Promise<boolean>;

  // Recipe Queue
  getRecipeQueue(userId: string): Promise<RecipeQueueItem[]>;
  getRecipeQueueItem(id: string, userId: string): Promise<RecipeQueueItem | undefined>;
  addToRecipeQueue(item: InsertRecipeQueueItem & { userId: string }): Promise<RecipeQueueItem>;
  updateRecipeQueueItem(id: string, userId: string, servingMultiplier: number): Promise<RecipeQueueItem | undefined>;
  removeFromRecipeQueue(id: string, userId: string): Promise<boolean>;
  reorderRecipeQueue(userId: string, orderedIds: string[]): Promise<void>;
  clearRecipeQueue(userId: string): Promise<void>;

  // User settings
  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings>;

  // Subscription
  getSubscriptionInfo(userId: string): Promise<SubscriptionInfo>;
  updateSubscription(userId: string, updates: Partial<{
    tier: SubscriptionTier;
    status: string;
    expiresAt: Date | null;
    willRenew: boolean;
    platform: string | null;
    productId: string | null;
    purchasedAt: Date | null;
    cancelledAt: Date | null;
    isTrial: boolean;
    revenuecatUserId: string | null;
  }>): Promise<User>;
  countUserHabits(userId: string): Promise<number>;
  countUserTasks(userId: string): Promise<number>;
  countUserGoals(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByRevenueCatId(revenuecatUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.revenuecatUserId, revenuecatUserId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by email or id
    let existingUser;
    if (userData.email) {
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      existingUser = found;
    }

    if (existingUser) {
      // Update existing user (excluding ID to avoid foreign key violations)
      const { id, ...updateData } = userData;
      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return updatedUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();
      return newUser;
    }
  }

  // Goals
  async getGoals(userId: string, showArchived: boolean = false): Promise<Goal[]> {
    const conditions = showArchived
      ? eq(goals.userId, userId)
      : and(eq(goals.userId, userId), eq(goals.archived, false));
    
    return await db
      .select()
      .from(goals)
      .where(conditions)
      .orderBy(asc(goals.sortOrder));
  }

  async getGoal(id: string, userId: string): Promise<Goal | undefined> {
    const [goal] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));
    return goal;
  }

  async createGoal(goalData: InsertGoal & { userId: string; sortOrder?: number; type?: string | null; shoppingListGroupId?: string | null }): Promise<Goal> {
    const sortOrder = goalData.sortOrder ?? await this.getNextSortOrder('goals', goalData.userId);
    const [goal] = await db
      .insert(goals)
      .values({ ...goalData, sortOrder })
      .returning();
    return goal;
  }

  async updateGoal(id: string, userId: string, updates: UpdateGoal): Promise<Goal | undefined> {
    const [goal] = await db
      .update(goals)
      .set(updates)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return goal;
  }

  async deleteGoal(id: string, userId: string): Promise<boolean> {
    await db.delete(tasks).where(and(eq(tasks.goalId, id), eq(tasks.userId, userId)));
    const result = await db
      .delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteShoppingGoals(userId: string): Promise<number> {
    const shoppingGoals = await db
      .select({ id: goals.id })
      .from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.type, 'shopping')));
    
    for (const goal of shoppingGoals) {
      await db.delete(tasks).where(eq(tasks.goalId, goal.id));
    }
    
    const result = await db
      .delete(goals)
      .where(and(eq(goals.userId, userId), eq(goals.type, 'shopping')));
    
    return result.rowCount ?? 0;
  }

  // Tasks
  async getTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(asc(tasks.sortOrder));
  }

  async getTasksByGoal(goalId: string, userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.goalId, goalId), eq(tasks.userId, userId)))
      .orderBy(asc(tasks.sortOrder));
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task;
  }

  async createTask(taskData: InsertTask & { userId: string }): Promise<Task> {
    // Use provided sortOrder or get the next one if not provided
    const sortOrder = taskData.sortOrder ?? await this.getNextSortOrder('tasks', taskData.userId, taskData.goalId || undefined);
    let todaySortOrder = null;
    
    if (taskData.isToday) {
      todaySortOrder = await this.getNextTodaySortOrder(taskData.userId);
    }

    // Convert nextOccurrence from ISO string to Date for database
    const { nextOccurrence: nextOccurrenceStr, ...restData } = taskData;
    const dbData: any = {
      ...restData,
      sortOrder,
      todaySortOrder,
      nextOccurrence: nextOccurrenceStr ? new Date(nextOccurrenceStr) : null,
    };

    const [task] = await db
      .insert(tasks)
      .values(dbData)
      .returning();
    return task;
  }

  async updateTask(id: string, userId: string, updates: UpdateTask): Promise<Task | undefined> {
    // Get current task to check if it belongs to a habit goal
    const currentTask = await this.getTask(id, userId);
    if (!currentTask) return undefined;
    
    let isHabitGoal = false;
    if (currentTask.goalId) {
      const goal = await this.getGoal(currentTask.goalId, userId);
      isHabitGoal = goal?.isHabitGoal || false;
    }
    
    // Habit-style completion logic for tasks in habit goals
    if (isHabitGoal && updates.completedToday === true) {
      updates.isToday = false;
      updates.todaySortOrder = null;
      updates.completionCount = (currentTask.completionCount || 0) + 1;
      // Log completion for history
      await this.logHabitCompletion(userId, undefined, id);
    }
    
    // Handle recurring task completion - reschedule instead of completing
    if (updates.completed === true && currentTask.isRecurring && currentTask.recurrenceRule) {
      try {
        const rule = RRule.fromString(currentTask.recurrenceRule);
        // Use the scheduled date for calculating next occurrence (not current date)
        // This handles early completion correctly
        const baseDate = currentTask.nextOccurrence || new Date();
        const next = rule.after(baseDate, false); // false = exclusive, get NEXT occurrence
        
        // Prepare database updates (excluding the string nextOccurrence from updates)
        const { nextOccurrence: _, ...otherUpdates } = updates;
        const dbUpdates = {
          ...otherUpdates,
          completed: false,
          isToday: false,
          todaySortOrder: null,
          lastCompleted: new Date(),
          nextOccurrence: next || null, // null if rule has ended
        };
        
        const [task] = await db
          .update(tasks)
          .set(dbUpdates)
          .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
          .returning();
        return task;
      } catch (error) {
        console.error('Error processing recurring task:', error);
        // Fall through to normal completion if rrule parsing fails
      }
    }
    
    // Smart completion logic: if task is completed (regular task), remove from Today
    if (updates.completed === true) {
      updates.isToday = false;
      updates.todaySortOrder = null;
    }
    
    // Smart today logic: if task is added to today
    if (updates.isToday === true) {
      if (isHabitGoal) {
        // For habit goals, reset completedToday
        updates.completedToday = false;
      } else {
        // For regular tasks, reset completed
        updates.completed = false;
      }
      if (updates.todaySortOrder === undefined) {
        updates.todaySortOrder = await this.getNextTodaySortOrder(userId);
      }
    }
    
    // If removing from today, clear the todaySortOrder
    if (updates.isToday === false) {
      updates.todaySortOrder = null;
    }
    
    // Handle converting from recurring to non-recurring (clear recurring fields)
    // and convert nextOccurrence string to Date for database
    const { nextOccurrence: nextOccurrenceStr, ...restUpdates } = updates;
    const dbUpdates: any = { ...restUpdates };
    
    // Convert nextOccurrence string to Date if provided
    if (nextOccurrenceStr !== undefined) {
      dbUpdates.nextOccurrence = nextOccurrenceStr ? new Date(nextOccurrenceStr) : null;
    }
    
    // If switching from recurring to non-recurring, clear the recurring fields
    if (updates.isRecurring === false) {
      dbUpdates.recurrenceRule = null;
      dbUpdates.nextOccurrence = null;
      dbUpdates.lastCompleted = null;
    }
    
    const [task] = await db
      .update(tasks)
      .set(dbUpdates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    if (task) {
      if (updates.isToday === true && task.todaySortOrder != null) {
        await this.logSortEvent(userId, id, 'task', task.todaySortOrder, 'add', null).catch(() => {});
      } else if (updates.isToday === false) {
        await this.logSortEvent(userId, id, 'task', currentTask.todaySortOrder ?? 0, 'remove', currentTask.todaySortOrder ?? null).catch(() => {});
      }
    }

    return task;
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Habits
  async getHabits(userId: string): Promise<Habit[]> {
    return await db
      .select()
      .from(habits)
      .where(eq(habits.userId, userId))
      .orderBy(asc(habits.sortOrder));
  }

  async getHabit(id: string, userId: string): Promise<Habit | undefined> {
    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)));
    return habit;
  }

  async createHabit(habitData: InsertHabit & { userId: string }): Promise<Habit> {
    // Use provided sortOrder or get the next one if not provided
    const sortOrder = habitData.sortOrder ?? await this.getNextSortOrder('habits', habitData.userId);
    let todaySortOrder = null;
    
    if (habitData.isToday) {
      todaySortOrder = await this.getNextTodaySortOrder(habitData.userId);
    }

    const [habit] = await db
      .insert(habits)
      .values({ ...habitData, sortOrder, todaySortOrder })
      .returning();
    return habit;
  }

  async updateHabit(id: string, userId: string, updates: UpdateHabit): Promise<Habit | undefined> {
    // Smart completion logic: if habit is completed today, remove from Today and increment completion count
    if (updates.completedToday === true) {
      updates.isToday = false;
      updates.todaySortOrder = null;
      
      // Get current habit to increment completion count
      const currentHabit = await this.getHabit(id, userId);
      if (currentHabit) {
        updates.completionCount = (currentHabit.completionCount || 0) + 1;
        // Log completion for history
        await this.logHabitCompletion(userId, id, undefined);
      }
    }
    
    // Smart today logic: if habit is added to today, set it to not completed
    if (updates.isToday === true) {
      updates.completedToday = false;
      if (updates.todaySortOrder === undefined) {
        updates.todaySortOrder = await this.getNextTodaySortOrder(userId);
      }
    }
    
    // If removing from today, clear the todaySortOrder
    if (updates.isToday === false) {
      updates.todaySortOrder = null;
    }
    
    const currentHabitForLog = updates.isToday !== undefined ? await this.getHabit(id, userId) : null;

    const [habit] = await db
      .update(habits)
      .set(updates)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning();

    if (habit) {
      if (updates.isToday === true && habit.todaySortOrder != null) {
        await this.logSortEvent(userId, id, 'habit', habit.todaySortOrder, 'add', null).catch(() => {});
      } else if (updates.isToday === false && currentHabitForLog) {
        await this.logSortEvent(userId, id, 'habit', currentHabitForLog.todaySortOrder ?? 0, 'remove', currentHabitForLog.todaySortOrder ?? null).catch(() => {});
      }
    }

    return habit;
  }

  async deleteHabit(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Today items
  async getTodayItems(userId: string): Promise<{ tasks: Task[]; habits: Habit[] }> {
    const [todayTasks, todayHabits] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(and(eq(tasks.isToday, true), eq(tasks.userId, userId)))
        .orderBy(asc(tasks.todaySortOrder)),
      db
        .select()
        .from(habits)
        .where(and(eq(habits.isToday, true), eq(habits.userId, userId)))
        .orderBy(asc(habits.todaySortOrder))
    ]);

    return { tasks: todayTasks, habits: todayHabits };
  }

  // Reordering
  async reorderGoals(userId: string, reorder: ReorderItems): Promise<void> {
    for (const item of reorder.items) {
      await db
        .update(goals)
        .set({ sortOrder: item.sortOrder })
        .where(and(eq(goals.id, item.id), eq(goals.userId, userId)));
    }
  }

  async reorderTasks(goalId: string | null, userId: string, reorder: ReorderItems): Promise<void> {
    for (const item of reorder.items) {
      const whereCondition = goalId 
        ? and(eq(tasks.id, item.id), eq(tasks.goalId, goalId), eq(tasks.userId, userId))
        : and(eq(tasks.id, item.id), isNull(tasks.goalId), eq(tasks.userId, userId));
      
      await db
        .update(tasks)
        .set({ sortOrder: item.sortOrder })
        .where(whereCondition);
    }
  }

  async reorderHabits(userId: string, reorder: ReorderItems): Promise<void> {
    for (const item of reorder.items) {
      await db
        .update(habits)
        .set({ sortOrder: item.sortOrder })
        .where(and(eq(habits.id, item.id), eq(habits.userId, userId)));
    }
  }

  async reorderTodayItems(userId: string, reorder: ReorderTodayItems, eventType: string = 'drag'): Promise<void> {
    for (const item of reorder.items) {
      let oldPosition: number | null = null;

      if (item.type === 'task') {
        const existing = await db
          .select({ todaySortOrder: tasks.todaySortOrder })
          .from(tasks)
          .where(and(eq(tasks.id, item.id), eq(tasks.userId, userId)))
          .limit(1);
        oldPosition = existing[0]?.todaySortOrder ?? null;

        await db
          .update(tasks)
          .set({ todaySortOrder: item.todaySortOrder })
          .where(and(eq(tasks.id, item.id), eq(tasks.userId, userId)));
      } else if (item.type === 'habit') {
        const existing = await db
          .select({ todaySortOrder: habits.todaySortOrder })
          .from(habits)
          .where(and(eq(habits.id, item.id), eq(habits.userId, userId)))
          .limit(1);
        oldPosition = existing[0]?.todaySortOrder ?? null;

        await db
          .update(habits)
          .set({ todaySortOrder: item.todaySortOrder })
          .where(and(eq(habits.id, item.id), eq(habits.userId, userId)));
      }

      await this.logSortEvent(userId, item.id, item.type, item.todaySortOrder, eventType, oldPosition);
    }
  }

  async logSortEvent(userId: string, itemId: string, itemType: string, newPosition: number, eventType: string, oldPosition?: number | null): Promise<void> {
    await db.insert(todaySortEvents).values({
      userId,
      itemId,
      itemType,
      newPosition,
      eventType,
      oldPosition: oldPosition ?? null,
    });
  }

  async getLearnedPosition(userId: string, itemId: string, itemType: string): Promise<LearnedPositionResult> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const events = await db
      .select()
      .from(todaySortEvents)
      .where(
        and(
          eq(todaySortEvents.userId, userId),
          eq(todaySortEvents.itemId, itemId),
          eq(todaySortEvents.itemType, itemType),
          gte(todaySortEvents.createdAt, ninetyDaysAgo),
          sql`${todaySortEvents.eventType} IN ('drag', 'quick_sort', 'add', 'build_today')`
        )
      )
      .orderBy(desc(todaySortEvents.createdAt));

    if (events.length < 3) {
      return { itemId, itemType: itemType as 'task' | 'habit', learnedPosition: null, confidence: 0, dataPoints: events.length };
    }

    const now = Date.now();
    let totalWeightedPosition = 0;
    let totalWeight = 0;

    for (const event of events) {
      const daysAgo = (now - event.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const weight = daysAgo <= 7 ? 3.0 : daysAgo <= 30 ? 2.0 : 1.0;
      totalWeightedPosition += event.newPosition * weight;
      totalWeight += weight;
    }

    const learnedPosition = Math.round(totalWeightedPosition / totalWeight);
    const confidence = Math.min(totalWeight / 20.0, 1.0);

    return { itemId, itemType: itemType as 'task' | 'habit', learnedPosition, confidence, dataPoints: events.length };
  }

  async getLearnedPositionsBulk(userId: string, items: { itemId: string; itemType: string }[]): Promise<LearnedPositionResult[]> {
    return Promise.all(items.map(item => this.getLearnedPosition(userId, item.itemId, item.itemType)));
  }

  async deleteCompletedTasks(goalId: string | null, userId: string): Promise<void> {
    const whereCondition = goalId 
      ? and(eq(tasks.completed, true), eq(tasks.goalId, goalId), eq(tasks.userId, userId))
      : and(eq(tasks.completed, true), isNull(tasks.goalId), eq(tasks.userId, userId));
    
    await db
      .delete(tasks)
      .where(whereCondition);
  }

  // Habit completion history
  async logHabitCompletion(userId: string, habitId?: string, taskId?: string): Promise<HabitCompletion> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const [completion] = await db
      .insert(habitCompletions)
      .values({
        userId,
        habitId: habitId || null,
        taskId: taskId || null,
        completionDate: today,
      })
      .returning();
    return completion;
  }

  async getHabitCompletionHistory(userId: string, startDate: string, endDate: string): Promise<HabitCompletion[]> {
    return await db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.userId, userId),
          gte(habitCompletions.completionDate, startDate),
          lte(habitCompletions.completionDate, endDate)
        )
      )
      .orderBy(desc(habitCompletions.completedAt));
  }

  async addHabitCompletionForDate(userId: string, completionDate: string, habitId?: string, taskId?: string): Promise<HabitCompletion> {
    if (habitId) {
      const [habit] = await db.select().from(habits).where(and(eq(habits.id, habitId), eq(habits.userId, userId)));
      if (!habit) throw new Error("Habit not found or not owned by user");
    } else if (taskId) {
      const [task] = await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
      if (!task) throw new Error("Task not found or not owned by user");
    }
    
    const [completion] = await db
      .insert(habitCompletions)
      .values({
        userId,
        habitId: habitId || null,
        taskId: taskId || null,
        completionDate,
      })
      .returning();
    return completion;
  }

  async removeHabitCompletionForDate(userId: string, completionDate: string, habitId?: string, taskId?: string): Promise<boolean> {
    if (habitId) {
      const [habit] = await db.select().from(habits).where(and(eq(habits.id, habitId), eq(habits.userId, userId)));
      if (!habit) throw new Error("Habit not found or not owned by user");
    } else if (taskId) {
      const [task] = await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
      if (!task) throw new Error("Task not found or not owned by user");
    }
    
    const conditions = [
      eq(habitCompletions.userId, userId),
      eq(habitCompletions.completionDate, completionDate),
    ];
    
    if (habitId) {
      conditions.push(eq(habitCompletions.habitId, habitId));
    } else if (taskId) {
      conditions.push(eq(habitCompletions.taskId, taskId));
    }
    
    const result = await db
      .delete(habitCompletions)
      .where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Countdowns
  async getCountdowns(userId: string): Promise<Countdown[]> {
    return await db
      .select()
      .from(countdowns)
      .where(eq(countdowns.userId, userId))
      .orderBy(asc(countdowns.sortOrder));
  }

  async getCountdown(id: string, userId: string): Promise<Countdown | undefined> {
    const [countdown] = await db
      .select()
      .from(countdowns)
      .where(and(eq(countdowns.id, id), eq(countdowns.userId, userId)));
    return countdown;
  }

  async createCountdown(countdownData: InsertCountdown & { userId: string }): Promise<Countdown> {
    const existingCountdowns = await db
      .select()
      .from(countdowns)
      .where(eq(countdowns.userId, countdownData.userId));
    const sortOrder = existingCountdowns.length;
    
    const [countdown] = await db
      .insert(countdowns)
      .values({ ...countdownData, sortOrder })
      .returning();
    return countdown;
  }

  async updateCountdown(id: string, userId: string, updates: UpdateCountdown): Promise<Countdown | undefined> {
    const [countdown] = await db
      .update(countdowns)
      .set(updates)
      .where(and(eq(countdowns.id, id), eq(countdowns.userId, userId)))
      .returning();
    return countdown;
  }

  async deleteCountdown(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(countdowns)
      .where(and(eq(countdowns.id, id), eq(countdowns.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Captures
  async getCaptures(userId: string): Promise<Capture[]> {
    return await db
      .select()
      .from(captures)
      .where(eq(captures.userId, userId))
      .orderBy(desc(captures.createdAt));
  }

  async createCapture(captureData: InsertCapture & { userId: string }): Promise<Capture> {
    const [capture] = await db
      .insert(captures)
      .values(captureData)
      .returning();
    return capture;
  }

  async deleteCapture(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(captures)
      .where(and(eq(captures.id, id), eq(captures.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Recipes
  async getRecipes(userId: string): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.createdAt));
  }

  async getRecipe(id: string, userId: string): Promise<Recipe | undefined> {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
    return recipe;
  }

  async createRecipe(recipeData: InsertRecipe & { userId: string }): Promise<Recipe> {
    const [recipe] = await db
      .insert(recipes)
      .values(recipeData)
      .returning();
    return recipe;
  }

  async updateRecipe(id: string, userId: string, updates: UpdateRecipe): Promise<Recipe | undefined> {
    const [recipe] = await db
      .update(recipes)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    return recipe;
  }

  async deleteRecipe(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Shopping Lists
  async getShoppingLists(userId: string): Promise<ShoppingList[]> {
    return db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.userId, userId))
      .orderBy(desc(shoppingLists.createdAt));
  }

  async getShoppingList(id: string, userId: string): Promise<ShoppingList | undefined> {
    const [list] = await db
      .select()
      .from(shoppingLists)
      .where(and(eq(shoppingLists.id, id), eq(shoppingLists.userId, userId)));
    return list;
  }

  async createShoppingList(name: string, recipeIds: string[], userId: string): Promise<ShoppingList> {
    const userRecipes = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.userId, userId)));
    
    const selectedRecipes = userRecipes.filter(r => recipeIds.includes(r.id));
    
    const ingredientMap = new Map<string, {
      totalAmount: number | null;
      unit: string | null;
      category: string | null;
      aisle: string | null;
      recipes: Set<string>;
    }>();
    
    for (const recipe of selectedRecipes) {
      const parsed = recipe.parsedIngredients as ParsedIngredient[];
      for (const ing of parsed) {
        const key = ing.ingredient.toLowerCase();
        const existing = ingredientMap.get(key);
        
        if (existing) {
          existing.recipes.add(recipe.title);
          if (ing.amount && existing.unit === ing.unit) {
            const amount = parseFloat(ing.amount.replace(/[^\d.]/g, '')) || 0;
            if (existing.totalAmount !== null) {
              existing.totalAmount += amount;
            }
          }
        } else {
          const amount = ing.amount ? parseFloat(ing.amount.replace(/[^\d.]/g, '')) || null : null;
          ingredientMap.set(key, {
            totalAmount: amount,
            unit: ing.unit,
            category: ing.category || null,
            aisle: ing.aisle || null,
            recipes: new Set([recipe.title]),
          });
        }
      }
    }
    
    const items: ShoppingListItem[] = Array.from(ingredientMap.entries()).map(([ingredient, data]) => ({
      ingredient,
      totalAmount: data.totalAmount?.toString() || null,
      unit: data.unit,
      category: data.category,
      aisle: data.aisle,
      checked: false,
      recipes: Array.from(data.recipes),
    }));
    
    items.sort((a, b) => {
      const catA = a.category || 'ZZZ';
      const catB = b.category || 'ZZZ';
      if (catA !== catB) return catA.localeCompare(catB);
      return a.ingredient.localeCompare(b.ingredient);
    });
    
    const [list] = await db
      .insert(shoppingLists)
      .values({ userId, name, items })
      .returning();
    
    return list;
  }

  async updateShoppingListItem(id: string, userId: string, ingredient: string, checked: boolean): Promise<ShoppingList | undefined> {
    const [list] = await db
      .select()
      .from(shoppingLists)
      .where(and(eq(shoppingLists.id, id), eq(shoppingLists.userId, userId)));
    
    if (!list) return undefined;
    
    const items = list.items as ShoppingListItem[];
    const updated = items.map(item => 
      item.ingredient.toLowerCase() === ingredient.toLowerCase() 
        ? { ...item, checked } 
        : item
    );
    
    const [result] = await db
      .update(shoppingLists)
      .set({ items: updated, updatedAt: new Date() })
      .where(and(eq(shoppingLists.id, id), eq(shoppingLists.userId, userId)))
      .returning();
    
    return result;
  }

  async deleteShoppingList(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(shoppingLists)
      .where(and(eq(shoppingLists.id, id), eq(shoppingLists.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // User settings
  private readonly defaultSettings: UserSettings = {
    theme: 'auto',
    startScreen: 'today',
    countdownDaysThreshold: 7,
    showQuoteSplash: true,
    showUpcomingEvents: true,
    showCountdowns: true,
  };

  async getUserSettings(userId: string): Promise<UserSettings> {
    const [row] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    
    if (!row) {
      return this.defaultSettings;
    }
    
    return { ...this.defaultSettings, ...(row.settings as Partial<UserSettings>) };
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings> {
    const existing = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    
    if (existing.length === 0) {
      // Create new settings row
      const newSettings = { ...this.defaultSettings, ...updates };
      await db.insert(userSettings).values({
        userId,
        settings: newSettings,
      });
      return newSettings;
    } else {
      // Merge with existing settings
      const currentSettings = existing[0].settings as Partial<UserSettings>;
      const mergedSettings = { ...this.defaultSettings, ...currentSettings, ...updates };
      await db
        .update(userSettings)
        .set({ settings: mergedSettings, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId));
      return mergedSettings;
    }
  }

  // Helper methods
  private async getNextSortOrder(table: 'goals' | 'tasks' | 'habits', userId: string, goalId?: string): Promise<number> {
    let items;
    
    if (table === 'goals') {
      items = await db.select().from(goals).where(eq(goals.userId, userId));
    } else if (table === 'tasks') {
      if (goalId) {
        items = await db.select().from(tasks).where(and(eq(tasks.goalId, goalId), eq(tasks.userId, userId)));
      } else {
        items = await db.select().from(tasks).where(and(isNull(tasks.goalId), eq(tasks.userId, userId)));
      }
    } else {
      items = await db.select().from(habits).where(eq(habits.userId, userId));
    }
    
    return items.length;
  }

  private async getNextTodaySortOrder(userId: string): Promise<number> {
    const [todayTasks, todayHabits] = await Promise.all([
      db.select().from(tasks).where(and(eq(tasks.isToday, true), eq(tasks.userId, userId))),
      db.select().from(habits).where(and(eq(habits.isToday, true), eq(habits.userId, userId)))
    ]);
    
    return todayTasks.length + todayHabits.length;
  }

  // Subscription methods
  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
    const user = await this.getUser(userId);
    if (!user) {
      return {
        tier: 'free',
        status: 'none',
        expiresAt: null,
        willRenew: false,
        platform: null,
        productId: null,
        purchasedAt: null,
        isInTrialPeriod: false,
      };
    }

    // Check if subscription expired
    if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()) {
      // Expired - update status
      if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'grace_period') {
        await this.updateSubscription(userId, {
          tier: 'free',
          status: 'expired',
        });
        return {
          tier: 'free',
          status: 'expired',
          expiresAt: user.subscriptionExpiresAt?.toISOString() || null,
          willRenew: false,
          platform: user.subscriptionPlatform as 'ios' | 'android' | null,
          productId: user.subscriptionProductId,
          purchasedAt: user.subscriptionPurchasedAt?.toISOString() || null,
          isInTrialPeriod: false,
        };
      }
    }

    return {
      tier: (user.subscriptionTier as 'free' | 'premium') || 'free',
      status: (user.subscriptionStatus as SubscriptionInfo['status']) || 'none',
      expiresAt: user.subscriptionExpiresAt?.toISOString() || null,
      willRenew: user.subscriptionWillRenew || false,
      platform: user.subscriptionPlatform as 'ios' | 'android' | null,
      productId: user.subscriptionProductId,
      purchasedAt: user.subscriptionPurchasedAt?.toISOString() || null,
      isInTrialPeriod: user.subscriptionIsTrial || false,
    };
  }

  async updateSubscription(userId: string, updates: Partial<{
    tier: SubscriptionTier;
    status: string;
    expiresAt: Date | null;
    willRenew: boolean;
    platform: string | null;
    productId: string | null;
    purchasedAt: Date | null;
    cancelledAt: Date | null;
    isTrial: boolean;
    revenuecatUserId: string | null;
  }>): Promise<User> {
    const dbUpdates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (updates.tier !== undefined) dbUpdates.subscriptionTier = updates.tier;
    if (updates.status !== undefined) dbUpdates.subscriptionStatus = updates.status;
    if (updates.expiresAt !== undefined) dbUpdates.subscriptionExpiresAt = updates.expiresAt;
    if (updates.willRenew !== undefined) dbUpdates.subscriptionWillRenew = updates.willRenew;
    if (updates.platform !== undefined) dbUpdates.subscriptionPlatform = updates.platform;
    if (updates.productId !== undefined) dbUpdates.subscriptionProductId = updates.productId;
    if (updates.purchasedAt !== undefined) dbUpdates.subscriptionPurchasedAt = updates.purchasedAt;
    if (updates.cancelledAt !== undefined) dbUpdates.subscriptionCancelledAt = updates.cancelledAt;
    if (updates.isTrial !== undefined) dbUpdates.subscriptionIsTrial = updates.isTrial;
    if (updates.revenuecatUserId !== undefined) dbUpdates.revenuecatUserId = updates.revenuecatUserId;

    const [updatedUser] = await db
      .update(users)
      .set(dbUpdates)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async countUserHabits(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(habits)
      .where(eq(habits.userId, userId));
    return result.length;
  }

  async countUserTasks(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));
    return result.length;
  }

  async countUserGoals(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId));
    return result.length;
  }

  // Recipe Queue operations
  async getRecipeQueue(userId: string): Promise<RecipeQueueItem[]> {
    return await db
      .select()
      .from(recipeQueue)
      .where(eq(recipeQueue.userId, userId))
      .orderBy(asc(recipeQueue.sortOrder));
  }

  async getRecipeQueueItem(id: string, userId: string): Promise<RecipeQueueItem | undefined> {
    const [item] = await db
      .select()
      .from(recipeQueue)
      .where(and(eq(recipeQueue.id, id), eq(recipeQueue.userId, userId)));
    return item;
  }

  async addToRecipeQueue(item: InsertRecipeQueueItem & { userId: string }): Promise<RecipeQueueItem> {
    const existingItems = await this.getRecipeQueue(item.userId);
    const maxSortOrder = existingItems.length > 0 
      ? Math.max(...existingItems.map(i => i.sortOrder)) 
      : -1;
    
    const [newItem] = await db
      .insert(recipeQueue)
      .values({
        ...item,
        sortOrder: maxSortOrder + 1,
      })
      .returning();
    return newItem;
  }

  async updateRecipeQueueItem(id: string, userId: string, servingMultiplier: number): Promise<RecipeQueueItem | undefined> {
    const [updated] = await db
      .update(recipeQueue)
      .set({ servingMultiplier })
      .where(and(eq(recipeQueue.id, id), eq(recipeQueue.userId, userId)))
      .returning();
    return updated;
  }

  async removeFromRecipeQueue(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(recipeQueue)
      .where(and(eq(recipeQueue.id, id), eq(recipeQueue.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async reorderRecipeQueue(userId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(recipeQueue)
        .set({ sortOrder: i })
        .where(and(eq(recipeQueue.id, orderedIds[i]), eq(recipeQueue.userId, userId)));
    }
  }

  async clearRecipeQueue(userId: string): Promise<void> {
    await db
      .delete(recipeQueue)
      .where(eq(recipeQueue.userId, userId));
  }

  // Bulk operations with transaction support
  async bulkCreateTasks(tasksData: (InsertTask & { userId: string })[]): Promise<Task[]> {
    if (tasksData.length === 0) return [];
    
    return await db.transaction(async (tx) => {
      const userId = tasksData[0].userId;
      
      const goalGroups = new Map<string | null, (InsertTask & { userId: string })[]>();
      for (const task of tasksData) {
        const key = task.goalId || null;
        if (!goalGroups.has(key)) {
          goalGroups.set(key, []);
        }
        goalGroups.get(key)!.push(task);
      }
      
      const allCreated: Task[] = [];
      
      for (const [goalId, groupTasks] of Array.from(goalGroups.entries())) {
        const existingTasks = goalId 
          ? await tx.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.goalId, goalId)))
          : await tx.select().from(tasks).where(and(eq(tasks.userId, userId), isNull(tasks.goalId)));
        
        const maxSortOrder = existingTasks.length > 0 
          ? Math.max(...existingTasks.map(t => t.sortOrder)) 
          : -1;
        
        const tasksToInsert = groupTasks.map((taskData, index) => ({
          ...taskData,
          sortOrder: taskData.sortOrder ?? (maxSortOrder + index + 1),
          completed: false,
          completedToday: false,
          completionCount: 0,
          nextOccurrence: taskData.nextOccurrence ? new Date(taskData.nextOccurrence) : null,
        }));
        
        const created = await tx.insert(tasks).values(tasksToInsert).returning();
        allCreated.push(...created);
      }
      
      return allCreated;
    });
  }

  async bulkUpdateTasks(updates: { id: string; title?: string; notes?: string | null; completed?: boolean; isToday?: boolean; goalId?: string | null; timerMinutes?: number | null }[], userId: string): Promise<Task[]> {
    return await db.transaction(async (tx) => {
      const updatedTasks: Task[] = [];
      
      for (const update of updates) {
        const { id, ...updateData } = update;
        const [updated] = await tx
          .update(tasks)
          .set(updateData)
          .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
          .returning();
        
        if (updated) {
          updatedTasks.push(updated);
        }
      }
      
      return updatedTasks;
    });
  }

  async bulkDeleteTasks(taskIds: string[], userId: string): Promise<number> {
    return await db.transaction(async (tx) => {
      let deletedCount = 0;
      
      for (const taskId of taskIds) {
        const result = await tx
          .delete(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
          .returning();
        
        if (result.length > 0) {
          deletedCount++;
        }
      }
      
      return deletedCount;
    });
  }

  async bulkCreateHabits(habitsData: (InsertHabit & { userId: string })[]): Promise<Habit[]> {
    if (habitsData.length === 0) return [];
    
    return await db.transaction(async (tx) => {
      const userId = habitsData[0].userId;
      const existingHabits = await tx.select().from(habits).where(eq(habits.userId, userId));
      const maxSortOrder = existingHabits.length > 0 
        ? Math.max(...existingHabits.map(h => h.sortOrder)) 
        : -1;
      
      const habitsToInsert = habitsData.map((habitData, index) => ({
        ...habitData,
        sortOrder: habitData.sortOrder ?? (maxSortOrder + index + 1),
        completedToday: false,
        completionCount: 0,
      }));
      
      const created = await tx.insert(habits).values(habitsToInsert).returning();
      return created;
    });
  }

  async bulkCreateGoals(goalsData: (InsertGoal & { userId: string })[]): Promise<Goal[]> {
    if (goalsData.length === 0) return [];
    
    return await db.transaction(async (tx) => {
      const userId = goalsData[0].userId;
      const existingGoals = await tx.select().from(goals).where(eq(goals.userId, userId));
      const maxSortOrder = existingGoals.length > 0 
        ? Math.max(...existingGoals.map(g => g.sortOrder)) 
        : -1;
      
      const goalsToInsert = goalsData.map((goalData, index) => ({
        ...goalData,
        sortOrder: maxSortOrder + index + 1,
        archived: false,
      }));
      
      const created = await tx.insert(goals).values(goalsToInsert).returning();
      return created;
    });
  }
}

export const storage = new DatabaseStorage();