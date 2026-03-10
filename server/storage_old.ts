import { 
  type Goal, 
  type Task, 
  type Habit, 
  type User,
  type InsertGoal, 
  type InsertTask, 
  type InsertHabit, 
  type UpsertUser,
  type UpdateGoal, 
  type UpdateTask, 
  type UpdateHabit, 
  type ReorderItems, 
  type ReorderTodayItems 
} from "@shared/schema";
import { goals, tasks, habits, users } from "@shared/schema";
import { db } from "./db";
import { eq, isNull, and, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Goals
  getGoals(userId: string): Promise<Goal[]>;
  getGoal(id: string, userId: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal & { userId: string }): Promise<Goal>;
  updateGoal(id: string, userId: string, updates: UpdateGoal): Promise<Goal | undefined>;
  deleteGoal(id: string, userId: string): Promise<boolean>;

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
  reorderTodayItems(userId: string, reorder: ReorderTodayItems): Promise<void>;
}

export class MemStorage implements IStorage {
  private goals: Map<string, Goal>;
  private tasks: Map<string, Task>;
  private habits: Map<string, Habit>;

  constructor() {
    this.goals = new Map();
    this.tasks = new Map();
    this.habits = new Map();
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const sortOrder = Array.from(this.goals.values()).length;
    const goal: Goal = { 
      ...insertGoal, 
      id, 
      sortOrder,
      description: insertGoal.description || null
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: string, updates: UpdateGoal): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, ...updates };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: string): Promise<boolean> {
    // Delete all tasks in this goal first
    const tasksInGoal = Array.from(this.tasks.values()).filter(task => task.goalId === id);
    tasksInGoal.forEach(task => this.tasks.delete(task.id));
    
    return this.goals.delete(id);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getTasksByGoal(goalId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.goalId === goalId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const existingTasks = Array.from(this.tasks.values()).filter(t => t.goalId === insertTask.goalId);
    const sortOrder = existingTasks.length;
    let todaySortOrder = null;
    
    if (insertTask.isToday) {
      const todayTasks = Array.from(this.tasks.values()).filter(t => t.isToday);
      const todayHabits = Array.from(this.habits.values()).filter(h => h.isToday);
      todaySortOrder = todayTasks.length + todayHabits.length;
    }

    const task: Task = { 
      ...insertTask, 
      id, 
      completed: false, 
      sortOrder,
      todaySortOrder,
      goalId: insertTask.goalId || null,
      isToday: insertTask.isToday || false
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: UpdateTask): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Habits
  async getHabits(): Promise<Habit[]> {
    return Array.from(this.habits.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    return this.habits.get(id);
  }

  async createHabit(insertHabit: InsertHabit): Promise<Habit> {
    const id = randomUUID();
    const sortOrder = Array.from(this.habits.values()).length;
    let todaySortOrder = null;
    
    if (insertHabit.isToday) {
      const todayTasks = Array.from(this.tasks.values()).filter(t => t.isToday);
      const todayHabits = Array.from(this.habits.values()).filter(h => h.isToday);
      todaySortOrder = todayTasks.length + todayHabits.length;
    }

    const habit: Habit = { 
      ...insertHabit, 
      id, 
      completedToday: false, 
      sortOrder,
      todaySortOrder,
      isToday: insertHabit.isToday || false
    };
    this.habits.set(id, habit);
    return habit;
  }

  async updateHabit(id: string, updates: UpdateHabit): Promise<Habit | undefined> {
    const habit = this.habits.get(id);
    if (!habit) return undefined;
    
    const updatedHabit = { ...habit, ...updates };
    this.habits.set(id, updatedHabit);
    return updatedHabit;
  }

  async deleteHabit(id: string): Promise<boolean> {
    return this.habits.delete(id);
  }

  // Today items
  async getTodayItems(): Promise<{ tasks: Task[]; habits: Habit[] }> {
    const tasks = Array.from(this.tasks.values())
      .filter(task => task.isToday)
      .sort((a, b) => (a.todaySortOrder || 0) - (b.todaySortOrder || 0));
    
    const habits = Array.from(this.habits.values())
      .filter(habit => habit.isToday)
      .sort((a, b) => (a.todaySortOrder || 0) - (b.todaySortOrder || 0));
    
    return { tasks, habits };
  }

  // Reordering
  async reorderGoals(reorder: ReorderItems): Promise<void> {
    reorder.items.forEach(item => {
      const goal = this.goals.get(item.id);
      if (goal) {
        this.goals.set(item.id, { ...goal, sortOrder: item.sortOrder });
      }
    });
  }

  async reorderTasks(goalId: string | null, reorder: ReorderItems): Promise<void> {
    reorder.items.forEach(item => {
      const task = this.tasks.get(item.id);
      if (task && (
        (goalId === null && task.goalId === null) || 
        (goalId !== null && task.goalId === goalId)
      )) {
        this.tasks.set(item.id, { ...task, sortOrder: item.sortOrder });
      }
    });
  }

  async reorderHabits(reorder: ReorderItems): Promise<void> {
    reorder.items.forEach(item => {
      const habit = this.habits.get(item.id);
      if (habit) {
        this.habits.set(item.id, { ...habit, sortOrder: item.sortOrder });
      }
    });
  }

  async reorderTodayItems(reorder: ReorderTodayItems): Promise<void> {
    reorder.items.forEach(item => {
      if (item.type === 'task') {
        const task = this.tasks.get(item.id);
        if (task && task.isToday) {
          this.tasks.set(item.id, { ...task, todaySortOrder: item.todaySortOrder });
        }
      } else if (item.type === 'habit') {
        const habit = this.habits.get(item.id);
        if (habit && habit.isToday) {
          this.habits.set(item.id, { ...habit, todaySortOrder: item.todaySortOrder });
        }
      }
    });
  }
}

export class DatabaseStorage implements IStorage {
  async getGoals(): Promise<Goal[]> {
    return await db.select().from(goals).orderBy(asc(goals.sortOrder));
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async createGoal(goalData: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const sortOrder = (goalData as any).sortOrder ?? (await this.getNextSortOrder(goals));
    
    const [goal] = await db
      .insert(goals)
      .values({ ...goalData, id, sortOrder })
      .returning();
    return goal;
  }

  async updateGoal(id: string, updates: UpdateGoal): Promise<Goal | undefined> {
    const [goal] = await db
      .update(goals)
      .set(updates)
      .where(eq(goals.id, id))
      .returning();
    return goal || undefined;
  }

  async deleteGoal(id: string): Promise<boolean> {
    // Delete associated tasks first
    await db.delete(tasks).where(eq(tasks.goalId, id));
    
    const result = await db.delete(goals).where(eq(goals.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(asc(tasks.sortOrder));
  }

  async getTasksByGoal(goalId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.goalId, goalId)).orderBy(asc(tasks.sortOrder));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const id = randomUUID();
    const sortOrder = (taskData as any).sortOrder ?? (await this.getNextSortOrder(tasks, taskData.goalId));
    
    const [task] = await db
      .insert(tasks)
      .values({ ...taskData, id, sortOrder })
      .returning();
    return task;
  }

  async updateTask(id: string, updates: UpdateTask): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getHabits(): Promise<Habit[]> {
    return await db.select().from(habits).orderBy(asc(habits.sortOrder));
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit || undefined;
  }

  async createHabit(habitData: InsertHabit): Promise<Habit> {
    const id = randomUUID();
    const sortOrder = (habitData as any).sortOrder ?? (await this.getNextSortOrder(habits));
    
    const [habit] = await db
      .insert(habits)
      .values({ ...habitData, id, sortOrder })
      .returning();
    return habit;
  }

  async updateHabit(id: string, updates: UpdateHabit): Promise<Habit | undefined> {
    const [habit] = await db
      .update(habits)
      .set(updates)
      .where(eq(habits.id, id))
      .returning();
    return habit || undefined;
  }

  async deleteHabit(id: string): Promise<boolean> {
    const result = await db.delete(habits).where(eq(habits.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTodayItems(): Promise<{ tasks: Task[]; habits: Habit[] }> {
    const todayTasks = await db.select().from(tasks).where(eq(tasks.isToday, true)).orderBy(asc(tasks.todaySortOrder));
    const todayHabits = await db.select().from(habits).where(eq(habits.isToday, true)).orderBy(asc(habits.todaySortOrder));
    
    return {
      tasks: todayTasks,
      habits: todayHabits,
    };
  }

  async reorderGoals(reorder: ReorderItems): Promise<void> {
    for (const item of reorder.items) {
      await db.update(goals).set({ sortOrder: item.sortOrder }).where(eq(goals.id, item.id));
    }
  }

  async reorderTasks(goalId: string | null, reorder: ReorderItems): Promise<void> {
    for (const item of reorder.items) {
      await db.update(tasks).set({ sortOrder: item.sortOrder }).where(eq(tasks.id, item.id));
    }
  }

  async reorderHabits(reorder: ReorderItems): Promise<void> {
    for (const item of reorder.items) {
      await db.update(habits).set({ sortOrder: item.sortOrder }).where(eq(habits.id, item.id));
    }
  }

  async reorderTodayItems(reorder: ReorderTodayItems): Promise<void> {
    for (const item of reorder.items) {
      if (item.type === "task") {
        await db.update(tasks).set({ todaySortOrder: item.todaySortOrder }).where(eq(tasks.id, item.id));
      } else if (item.type === "habit") {
        await db.update(habits).set({ todaySortOrder: item.todaySortOrder }).where(eq(habits.id, item.id));
      }
    }
  }

  private async getNextSortOrder(table: any, goalId?: string | null): Promise<number> {
    let query = db.select().from(table);
    
    if (goalId !== undefined && table === tasks) {
      query = goalId ? query.where(eq(table.goalId, goalId)) : query.where(isNull(table.goalId));
    }
    
    const items = await query;
    return items.length;
  }
}

export const storage = new DatabaseStorage();
