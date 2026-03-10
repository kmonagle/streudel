import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertGoalSchema, insertTaskSchema, insertHabitSchema, updateGoalSchema, updateTaskSchema, updateHabitSchema, reorderItemsSchema, reorderTodayItemsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // Goals routes
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/:id", async (req, res) => {
    try {
      const goal = await storage.getGoal(req.params.id);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid goal data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const updates = updateGoalSchema.parse(req.body);
      const goal = await storage.updateGoal(req.params.id, updates);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGoal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/goals/:goalId/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasksByGoal(req.params.goalId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks for goal" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const updates = updateTaskSchema.parse(req.body);
      
      // Apply business logic: when marking complete, remove from today; when setting to today, mark as not complete
      let finalUpdates = { ...updates };
      if (updates.completed === true) {
        finalUpdates.isToday = false;
      } else if (updates.isToday === true) {
        finalUpdates.completed = false;
      }
      
      const task = await storage.updateTask(req.params.id, finalUpdates);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Habits routes
  app.get("/api/habits", async (req, res) => {
    try {
      const habits = await storage.getHabits();
      res.json(habits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  app.post("/api/habits", async (req, res) => {
    try {
      const habitData = insertHabitSchema.parse(req.body);
      const habit = await storage.createHabit(habitData);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid habit data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create habit" });
    }
  });

  app.patch("/api/habits/:id", async (req, res) => {
    try {
      const updates = updateHabitSchema.parse(req.body);
      
      // Apply business logic: when marking complete, remove from today; when setting to today, mark as not complete
      let finalUpdates = { ...updates };
      if (updates.completedToday === true) {
        finalUpdates.isToday = false;
      } else if (updates.isToday === true) {
        finalUpdates.completedToday = false;
      }
      
      const habit = await storage.updateHabit(req.params.id, finalUpdates);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteHabit(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  // Today items
  app.get("/api/today", async (req, res) => {
    try {
      const todayItems = await storage.getTodayItems();
      res.json(todayItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today items" });
    }
  });

  // Reordering routes
  app.post("/api/goals/reorder", async (req, res) => {
    try {
      const reorderData = reorderItemsSchema.parse(req.body);
      await storage.reorderGoals(reorderData);
      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reorder data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to reorder goals" });
    }
  });

  app.post("/api/tasks/reorder", async (req, res) => {
    try {
      const { goalId } = req.query;
      const reorderData = reorderItemsSchema.parse(req.body);
      await storage.reorderTasks(goalId as string || null, reorderData);
      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reorder data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to reorder tasks" });
    }
  });

  app.post("/api/habits/reorder", async (req, res) => {
    try {
      const reorderData = reorderItemsSchema.parse(req.body);
      await storage.reorderHabits(reorderData);
      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reorder data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to reorder habits" });
    }
  });

  app.post("/api/today/reorder", async (req, res) => {
    try {
      const reorderData = reorderTodayItemsSchema.parse(req.body);
      await storage.reorderTodayItems(reorderData);
      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reorder data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to reorder today items" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
