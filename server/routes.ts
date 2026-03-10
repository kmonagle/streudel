import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./googleAuth";
import { insertGoalSchema, insertTaskSchema, insertHabitSchema, insertCountdownSchema, insertCaptureSchema, updateGoalSchema, updateTaskSchema, updateHabitSchema, updateCountdownSchema, reorderItemsSchema, reorderTodayItemsSchema, updateUserSettingsSchema, updateRecipeSchema, insertRecipeQueueSchema, updateRecipeQueueSchema, reorderRecipeQueueSchema, bulkCreateTasksSchema, bulkUpdateTasksSchema, bulkDeleteTasksSchema, bulkCreateHabitsSchema, bulkCreateGoalsSchema, bulkLearnedPositionsSchema, ParsedIngredient, TIER_LIMITS } from "@shared/schema";
import { parseRecipeFromUrl } from "./recipeParser";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { google } from "googleapis";

export async function registerRoutes(app: Express): Promise<Server> {
  // Swagger API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [System]
   *     security: []
   *     responses:
   *       200:
   *         description: Server is healthy
   */
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth middleware
  await setupAuth(app);

  /**
   * @swagger
   * /api/auth/user:
   *   get:
   *     summary: Get current authenticated user
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Current user data
   *       401:
   *         description: Not authenticated
   */
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const subscriptionInfo = await storage.getSubscriptionInfo(userId);
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        subscription: subscriptionInfo,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  /**
   * @swagger
   * /api/goals:
   *   get:
   *     summary: Get all goals
   *     tags: [Goals]
   *     parameters:
   *       - in: query
   *         name: showArchived
   *         schema:
   *           type: boolean
   *         description: Include archived goals
   *     responses:
   *       200:
   *         description: List of goals
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Goal'
   *   post:
   *     summary: Create a new goal
   *     tags: [Goals]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name: { type: string }
   *               description: { type: string }
   *               color: { type: string }
   *               isHabitGoal: { type: boolean }
   *     responses:
   *       201:
   *         description: Created goal
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Goal'
   *
   * /api/goals/{id}:
   *   get:
   *     summary: Get goal by ID
   *     tags: [Goals]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Goal details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Goal'
   *       404:
   *         description: Goal not found
   *   patch:
   *     summary: Update a goal
   *     tags: [Goals]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               description: { type: string }
   *               color: { type: string }
   *               isArchived: { type: boolean }
   *               isHabitGoal: { type: boolean }
   *     responses:
   *       200:
   *         description: Updated goal
   *       404:
   *         description: Goal not found
   *   delete:
   *     summary: Delete a goal
   *     tags: [Goals]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Goal deleted
   *       404:
   *         description: Goal not found
   */
  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const showArchived = req.query.showArchived === 'true';
      const goals = await storage.getGoals(userId, showArchived);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goal = await storage.getGoal(req.params.id, userId);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check subscription limits
      const subscriptionInfo = await storage.getSubscriptionInfo(userId);
      const limits = TIER_LIMITS[subscriptionInfo.tier];
      if (limits.maxGoals !== null) {
        const currentCount = await storage.countUserGoals(userId);
        if (currentCount >= limits.maxGoals) {
          return res.status(429).json({
            error: "Limit exceeded",
            details: {
              limit: limits.maxGoals,
              current: currentCount,
              feature: "goals",
              tier: subscriptionInfo.tier,
              upgradeRequired: subscriptionInfo.tier === 'free',
            },
          });
        }
      }
      
      const goalData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal({ ...goalData, userId });
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid goal data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = updateGoalSchema.parse(req.body);
      const goal = await storage.updateGoal(req.params.id, userId, updates);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid goal data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteGoal(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Bulk Goal Operations
  app.post("/api/goals/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = bulkCreateGoalsSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid bulk goal data", 
          details: parsed.error.errors 
        });
      }
      
      if (parsed.data.goals.length > 100) {
        return res.status(413).json({
          error: "Too many goals",
          message: "Maximum 100 goals per bulk request",
          provided: parsed.data.goals.length
        });
      }
      
      const goalsData = parsed.data.goals.map(goal => ({ ...goal, userId }));
      const createdGoals = await storage.bulkCreateGoals(goalsData);
      
      res.status(201).json({ goals: createdGoals, count: createdGoals.length });
    } catch (error) {
      console.error("Failed to bulk create goals:", error);
      res.status(500).json({ error: "Failed to bulk create goals" });
    }
  });

  /**
   * @swagger
   * /api/tasks:
   *   get:
   *     summary: Get all standalone tasks (not in goals)
   *     tags: [Tasks]
   *     responses:
   *       200:
   *         description: List of tasks
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Task'
   *   post:
   *     summary: Create a new task
   *     tags: [Tasks]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name: { type: string }
   *               notes: { type: string }
   *               goalId: { type: string }
   *               isOnToday: { type: boolean }
   *     responses:
   *       201:
   *         description: Created task
   *
   * /api/tasks/{id}:
   *   get:
   *     summary: Get task by ID
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Task details
   *       404:
   *         description: Task not found
   *   patch:
   *     summary: Update a task
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               notes: { type: string }
   *               completed: { type: boolean }
   *               completedToday: { type: boolean }
   *               isOnToday: { type: boolean }
   *     responses:
   *       200:
   *         description: Updated task
   *       404:
   *         description: Task not found
   *   delete:
   *     summary: Delete a task
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Task deleted
   *
   * /api/tasks/completed:
   *   delete:
   *     summary: Delete all completed standalone tasks
   *     tags: [Tasks]
   *     parameters:
   *       - in: query
   *         name: goalId
   *         schema:
   *           type: string
   *         description: Optional goal ID to filter
   *     responses:
   *       204:
   *         description: Completed tasks deleted
   *
   * /api/goals/{goalId}/tasks:
   *   get:
   *     summary: Get tasks for a specific goal
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: goalId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of tasks in goal
   *
   * /api/goals/{goalId}/tasks/completed:
   *   delete:
   *     summary: Delete completed tasks for a goal
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: goalId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Completed tasks deleted
   */
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/goals/:goalId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tasks = await storage.getTasksByGoal(req.params.goalId, userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const task = await storage.getTask(req.params.id, userId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check subscription limits
      const subscriptionInfo = await storage.getSubscriptionInfo(userId);
      const limits = TIER_LIMITS[subscriptionInfo.tier];
      if (limits.maxTasks !== null) {
        const currentCount = await storage.countUserTasks(userId);
        if (currentCount >= limits.maxTasks) {
          return res.status(429).json({
            error: "Limit exceeded",
            details: {
              limit: limits.maxTasks,
              current: currentCount,
              feature: "tasks",
              tier: subscriptionInfo.tier,
              upgradeRequired: subscriptionInfo.tier === 'free',
            },
          });
        }
      }
      
      const taskData = insertTaskSchema.parse(req.body);
      
      // Validate recurring task fields
      if (taskData.isRecurring) {
        if (!taskData.recurrenceRule) {
          return res.status(400).json({ error: "recurrenceRule is required for recurring tasks" });
        }
        if (!taskData.nextOccurrence) {
          return res.status(400).json({ error: "nextOccurrence is required for recurring tasks" });
        }
        // Validate RRULE format
        try {
          const rruleLib = await import('rrule');
          const RRule = rruleLib.default?.RRule || rruleLib.RRule;
          RRule.fromString(taskData.recurrenceRule);
        } catch (e) {
          return res.status(400).json({ error: "Invalid recurrence rule format" });
        }
      }
      
      const task = await storage.createTask({ ...taskData, userId });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.delete("/api/tasks/completed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { goalId } = req.query;
      await storage.deleteCompletedTasks(goalId || null, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting completed tasks:", error);
      res.status(500).json({ error: "Failed to delete completed tasks" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = updateTaskSchema.parse(req.body);
      
      // If toggling to recurring, validate required fields are provided
      if (updates.isRecurring === true) {
        // Get current task to check if it already has the required fields
        const currentTask = await storage.getTask(req.params.id, userId);
        if (!currentTask) {
          return res.status(404).json({ error: "Task not found" });
        }
        
        const effectiveRule = updates.recurrenceRule ?? currentTask.recurrenceRule;
        const effectiveNext = updates.nextOccurrence ?? currentTask.nextOccurrence;
        
        if (!effectiveRule) {
          return res.status(400).json({ error: "recurrenceRule is required for recurring tasks" });
        }
        if (!effectiveNext) {
          return res.status(400).json({ error: "nextOccurrence is required for recurring tasks" });
        }
        
        // Validate RRULE format
        try {
          const rruleLib = await import('rrule');
          const RRule = rruleLib.default?.RRule || rruleLib.RRule;
          RRule.fromString(effectiveRule);
        } catch (e) {
          return res.status(400).json({ error: "Invalid recurrence rule format" });
        }
        
        // Validate nextOccurrence is a valid date
        if (updates.nextOccurrence && isNaN(new Date(updates.nextOccurrence).getTime())) {
          return res.status(400).json({ error: "nextOccurrence must be a valid date" });
        }
      }
      
      const task = await storage.updateTask(req.params.id, userId, updates);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteTask(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Bulk Task Operations
  app.post("/api/tasks/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = bulkCreateTasksSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid bulk task data", 
          details: parsed.error.errors.map((e, idx) => ({ index: idx, ...e }))
        });
      }
      
      if (parsed.data.tasks.length > 100) {
        return res.status(413).json({
          error: "Too many tasks",
          message: "Maximum 100 tasks per bulk request",
          provided: parsed.data.tasks.length
        });
      }
      
      const goalIds = Array.from(new Set(parsed.data.tasks.filter(t => t.goalId).map(t => t.goalId)));
      for (const goalId of goalIds) {
        const goal = await storage.getGoal(goalId!, userId);
        if (!goal) {
          return res.status(400).json({ error: `Goal ${goalId} not found` });
        }
      }
      
      const tasksData = parsed.data.tasks.map(task => ({ ...task, userId }));
      const createdTasks = await storage.bulkCreateTasks(tasksData);
      
      res.status(201).json({ tasks: createdTasks, count: createdTasks.length });
    } catch (error) {
      console.error("Failed to bulk create tasks:", error);
      res.status(500).json({ error: "Failed to bulk create tasks" });
    }
  });

  app.patch("/api/tasks/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = bulkUpdateTasksSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid bulk update data", 
          details: parsed.error.errors 
        });
      }
      
      for (const update of parsed.data.updates) {
        const task = await storage.getTask(update.id, userId);
        if (!task) {
          return res.status(400).json({ error: `Task ${update.id} not found` });
        }
      }
      
      const updatedTasks = await storage.bulkUpdateTasks(parsed.data.updates, userId);
      res.json({ tasks: updatedTasks, count: updatedTasks.length });
    } catch (error) {
      console.error("Failed to bulk update tasks:", error);
      res.status(500).json({ error: "Failed to bulk update tasks" });
    }
  });

  app.post("/api/tasks/bulk-delete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = bulkDeleteTasksSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid bulk delete data", 
          details: parsed.error.errors 
        });
      }
      
      const deletedCount = await storage.bulkDeleteTasks(parsed.data.taskIds, userId);
      res.json({ deleted: deletedCount });
    } catch (error) {
      console.error("Failed to bulk delete tasks:", error);
      res.status(500).json({ error: "Failed to bulk delete tasks" });
    }
  });

  /**
   * @swagger
   * /api/habits:
   *   get:
   *     summary: Get all habits
   *     tags: [Habits]
   *     responses:
   *       200:
   *         description: List of habits
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Habit'
   *   post:
   *     summary: Create a new habit
   *     tags: [Habits]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name: { type: string }
   *               notes: { type: string }
   *               isOnToday: { type: boolean }
   *     responses:
   *       201:
   *         description: Created habit
   *
   * /api/habits/{id}:
   *   get:
   *     summary: Get habit by ID
   *     tags: [Habits]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Habit details
   *       404:
   *         description: Habit not found
   *   patch:
   *     summary: Update a habit
   *     tags: [Habits]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               notes: { type: string }
   *               completedToday: { type: boolean }
   *               isOnToday: { type: boolean }
   *     responses:
   *       200:
   *         description: Updated habit
   *       404:
   *         description: Habit not found
   *   delete:
   *     summary: Delete a habit
   *     tags: [Habits]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Habit deleted
   *
   * /api/habit-completions:
   *   get:
   *     summary: Get habit completion history
   *     tags: [Habits]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: End date (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: List of habit completions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/HabitCompletion'
   */
  app.get("/api/habits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const habits = await storage.getHabits(userId);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  app.get("/api/habits/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const habit = await storage.getHabit(req.params.id, userId);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit" });
    }
  });

  app.post("/api/habits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check subscription limits
      const subscriptionInfo = await storage.getSubscriptionInfo(userId);
      const limits = TIER_LIMITS[subscriptionInfo.tier];
      if (limits.maxHabits !== null) {
        const currentCount = await storage.countUserHabits(userId);
        if (currentCount >= limits.maxHabits) {
          return res.status(429).json({
            error: "Limit exceeded",
            details: {
              limit: limits.maxHabits,
              current: currentCount,
              feature: "habits",
              tier: subscriptionInfo.tier,
              upgradeRequired: subscriptionInfo.tier === 'free',
            },
          });
        }
      }
      
      const habitData = insertHabitSchema.parse(req.body);
      const habit = await storage.createHabit({ ...habitData, userId });
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid habit data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create habit" });
    }
  });

  app.patch("/api/habits/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = updateHabitSchema.parse(req.body);
      const habit = await storage.updateHabit(req.params.id, userId, updates);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid habit data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteHabit(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  // Bulk Habit Operations
  app.post("/api/habits/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = bulkCreateHabitsSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid bulk habit data", 
          details: parsed.error.errors 
        });
      }
      
      if (parsed.data.habits.length > 100) {
        return res.status(413).json({
          error: "Too many habits",
          message: "Maximum 100 habits per bulk request",
          provided: parsed.data.habits.length
        });
      }
      
      const habitsData = parsed.data.habits.map(habit => ({ ...habit, userId }));
      const createdHabits = await storage.bulkCreateHabits(habitsData);
      
      res.status(201).json({ habits: createdHabits, count: createdHabits.length });
    } catch (error) {
      console.error("Failed to bulk create habits:", error);
      res.status(500).json({ error: "Failed to bulk create habits" });
    }
  });

  /**
   * @swagger
   * /api/today:
   *   get:
   *     summary: Get all items marked for Today view
   *     tags: [Today]
   *     responses:
   *       200:
   *         description: List of today items (habits and tasks)
   *
   * /api/today/reorder:
   *   post:
   *     summary: Reorder items in Today view
   *     tags: [Today]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     id: { type: string }
   *                     type: { type: string, enum: [habit, task] }
   *                     todaySortOrder: { type: integer }
   *     responses:
   *       204:
   *         description: Items reordered
   *
   * /api/goals/reorder:
   *   post:
   *     summary: Reorder goals
   *     tags: [Goals]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/ReorderItem'
   *     responses:
   *       204:
   *         description: Goals reordered
   *
   * /api/tasks/reorder:
   *   post:
   *     summary: Reorder tasks
   *     tags: [Tasks]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               goalId: { type: string, nullable: true }
   *               items:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/ReorderItem'
   *     responses:
   *       204:
   *         description: Tasks reordered
   *
   * /api/habits/reorder:
   *   post:
   *     summary: Reorder habits
   *     tags: [Habits]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/ReorderItem'
   *     responses:
   *       204:
   *         description: Habits reordered
   */
  app.get("/api/today", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const todayItems = await storage.getTodayItems(userId);
      res.json(todayItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today items" });
    }
  });

  // Reordering routes
  app.post("/api/goals/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reorderData = reorderItemsSchema.parse(req.body);
      await storage.reorderGoals(userId, reorderData);
      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reorder data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to reorder goals" });
    }
  });

  app.post("/api/tasks/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { goalId, ...reorderData } = req.body;
      const parsedReorderData = reorderItemsSchema.parse(reorderData);
      await storage.reorderTasks(goalId || null, userId, parsedReorderData);
      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reorder data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to reorder tasks" });
    }
  });

  app.delete("/api/goals/:goalId/tasks/completed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { goalId } = req.params;
      await storage.deleteCompletedTasks(goalId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting completed tasks for goal:", error);
      res.status(500).json({ error: "Failed to delete completed tasks for goal" });
    }
  });

  app.post("/api/habits/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reorderData = reorderItemsSchema.parse(req.body);
      await storage.reorderHabits(userId, reorderData);
      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reorder data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to reorder habits" });
    }
  });

  app.get("/api/habit-completions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }
      const completions = await storage.getHabitCompletionHistory(userId, startDate as string, endDate as string);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching habit completions:", error);
      res.status(500).json({ error: "Failed to fetch habit completions" });
    }
  });

  /**
   * @swagger
   * /api/habit-completions:
   *   post:
   *     summary: Add a habit completion for a specific date
   *     tags: [Habits]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [completionDate]
   *             properties:
   *               completionDate: { type: string, format: date }
   *               habitId: { type: string }
   *               taskId: { type: string }
   *     responses:
   *       201:
   *         description: Completion added
   *   delete:
   *     summary: Remove a habit completion for a specific date
   *     tags: [Habits]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [completionDate]
   *             properties:
   *               completionDate: { type: string, format: date }
   *               habitId: { type: string }
   *               taskId: { type: string }
   *     responses:
   *       204:
   *         description: Completion removed
   */
  app.post("/api/habit-completions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { completionDate, habitId, taskId } = req.body;
      if (!completionDate) {
        return res.status(400).json({ error: "completionDate is required" });
      }
      if (!habitId && !taskId) {
        return res.status(400).json({ error: "Either habitId or taskId is required" });
      }
      if (habitId && taskId) {
        return res.status(400).json({ error: "Cannot specify both habitId and taskId" });
      }
      const completion = await storage.addHabitCompletionForDate(userId, completionDate, habitId, taskId);
      res.status(201).json(completion);
    } catch (error: any) {
      console.error("Error adding habit completion:", error);
      if (error.message?.includes("not found") || error.message?.includes("not owned")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to add habit completion" });
    }
  });

  app.delete("/api/habit-completions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { completionDate, habitId, taskId } = req.body;
      if (!completionDate) {
        return res.status(400).json({ error: "completionDate is required" });
      }
      if (!habitId && !taskId) {
        return res.status(400).json({ error: "Either habitId or taskId is required" });
      }
      if (habitId && taskId) {
        return res.status(400).json({ error: "Cannot specify both habitId and taskId" });
      }
      await storage.removeHabitCompletionForDate(userId, completionDate, habitId, taskId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error removing habit completion:", error);
      if (error.message?.includes("not found") || error.message?.includes("not owned")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to remove habit completion" });
    }
  });

  app.post("/api/today/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reorderData = reorderTodayItemsSchema.parse(req.body);
      await storage.reorderTodayItems(userId, reorderData, reorderData.eventType);
      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reorder data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to reorder today items" });
    }
  });

  app.get("/api/today/learned-position/:itemId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const itemType = req.query.itemType as string;
      if (!itemType || !['task', 'habit'].includes(itemType)) {
        return res.status(400).json({ error: "itemType must be 'task' or 'habit'" });
      }
      const result = await storage.getLearnedPosition(userId, itemId, itemType);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to get learned position" });
    }
  });

  app.post("/api/today/learned-positions/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const body = bulkLearnedPositionsSchema.parse(req.body);
      const positions = await storage.getLearnedPositionsBulk(userId, body.items);
      res.json({ positions });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request body", details: error.errors });
      }
      res.status(500).json({ error: "Failed to get learned positions" });
    }
  });

  /**
   * @swagger
   * /api/countdowns:
   *   get:
   *     summary: Get all countdowns
   *     tags: [Countdowns]
   *     responses:
   *       200:
   *         description: List of countdowns
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Countdown'
   *   post:
   *     summary: Create a countdown
   *     tags: [Countdowns]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, targetDate]
   *             properties:
   *               name: { type: string }
   *               targetDate: { type: string, format: date }
   *     responses:
   *       201:
   *         description: Created countdown
   *
   * /api/countdowns/{id}:
   *   patch:
   *     summary: Update a countdown
   *     tags: [Countdowns]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               targetDate: { type: string, format: date }
   *     responses:
   *       200:
   *         description: Updated countdown
   *       404:
   *         description: Countdown not found
   *   delete:
   *     summary: Delete a countdown
   *     tags: [Countdowns]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Countdown deleted
   */
  app.get("/api/countdowns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const countdowns = await storage.getCountdowns(userId);
      res.json(countdowns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch countdowns" });
    }
  });

  app.post("/api/countdowns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const countdownData = insertCountdownSchema.parse(req.body);
      const countdown = await storage.createCountdown({ ...countdownData, userId });
      res.status(201).json(countdown);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid countdown data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create countdown" });
    }
  });

  app.patch("/api/countdowns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = updateCountdownSchema.parse(req.body);
      const countdown = await storage.updateCountdown(req.params.id, userId, updates);
      if (!countdown) {
        return res.status(404).json({ error: "Countdown not found" });
      }
      res.json(countdown);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid countdown data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update countdown" });
    }
  });

  app.delete("/api/countdowns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteCountdown(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ error: "Countdown not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete countdown" });
    }
  });

  /**
   * @swagger
   * /api/captures:
   *   get:
   *     summary: Get all captures
   *     tags: [Captures]
   *     responses:
   *       200:
   *         description: List of captures
   *   post:
   *     summary: Create a new capture
   *     tags: [Captures]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [content]
   *             properties:
   *               content: { type: string }
   *               source: { type: string }
   *               url: { type: string }
   *     responses:
   *       201:
   *         description: Created capture
   *
   * /api/captures/{id}:
   *   delete:
   *     summary: Delete a capture
   *     tags: [Captures]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Capture deleted
   */
  app.get("/api/captures", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const captures = await storage.getCaptures(userId);
      res.json(captures);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch captures" });
    }
  });

  app.post("/api/captures", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const captureData = insertCaptureSchema.parse(req.body);
      const capture = await storage.createCapture({ ...captureData, userId });
      res.status(201).json(capture);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid capture data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create capture" });
    }
  });

  app.delete("/api/captures/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteCapture(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ error: "Capture not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete capture" });
    }
  });

  // Recipe endpoints
  app.post("/api/recipes/from-url", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "Invalid URL", details: "URL is required" });
      }
      
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL", details: "URL must be a valid HTTP or HTTPS URL" });
      }
      
      const parsedRecipe = await parseRecipeFromUrl(url);
      
      const recipe = await storage.createRecipe({
        ...parsedRecipe,
        userId,
      });
      
      res.status(201).json(recipe);
    } catch (error: any) {
      console.error("Failed to parse recipe:", error);
      
      if (error.message === 'No recipe data found at URL') {
        return res.status(404).json({ 
          error: "No recipe data found at URL", 
          details: "The page doesn't contain schema.org/Recipe structured data" 
        });
      }
      if (error.message.includes('Recipe missing')) {
        return res.status(422).json({ 
          error: "Invalid recipe data", 
          details: error.message 
        });
      }
      if (error.message.includes('Invalid URL')) {
        return res.status(400).json({ error: "Invalid URL", details: error.message });
      }
      if (error.message.includes('timed out') || error.message.includes('Failed to fetch')) {
        return res.status(500).json({ error: "Failed to fetch recipe", details: error.message });
      }
      
      res.status(500).json({ error: "Failed to parse recipe", details: error.message });
    }
  });

  app.get("/api/recipes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recipes = await storage.getRecipes(userId);
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recipe = await storage.getRecipe(req.params.id, userId);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  app.patch("/api/recipes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = updateRecipeSchema.parse(req.body);
      const recipe = await storage.updateRecipe(req.params.id, userId, updates);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid recipe data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteRecipe(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // Shopping List endpoints
  app.post("/api/shopping-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { name, recipeIds } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "Name is required" });
      }
      if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
        return res.status(400).json({ error: "At least one recipe ID is required" });
      }
      
      const list = await storage.createShoppingList(name, recipeIds, userId);
      res.status(201).json(list);
    } catch (error) {
      console.error("Failed to create shopping list:", error);
      res.status(500).json({ error: "Failed to create shopping list" });
    }
  });

  app.get("/api/shopping-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const lists = await storage.getShoppingLists(userId);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shopping lists" });
    }
  });

  app.get("/api/shopping-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const list = await storage.getShoppingList(req.params.id, userId);
      if (!list) {
        return res.status(404).json({ error: "Shopping list not found" });
      }
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shopping list" });
    }
  });

  app.patch("/api/shopping-lists/:id/items/:ingredient", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { checked } = req.body;
      
      if (typeof checked !== 'boolean') {
        return res.status(400).json({ error: "checked must be a boolean" });
      }
      
      const list = await storage.updateShoppingListItem(
        req.params.id, 
        userId, 
        decodeURIComponent(req.params.ingredient), 
        checked
      );
      
      if (!list) {
        return res.status(404).json({ error: "Shopping list not found" });
      }
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to update shopping list item" });
    }
  });

  app.delete("/api/shopping-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteShoppingList(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ error: "Shopping list not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shopping list" });
    }
  });

  // Recipe Queue endpoints
  app.get("/api/recipe-queue", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const queueItems = await storage.getRecipeQueue(userId);
      
      const enrichedItems = await Promise.all(queueItems.map(async (item) => {
        const recipe = await storage.getRecipe(item.recipeId, userId);
        return {
          ...item,
          recipe: recipe || null
        };
      }));
      
      res.json(enrichedItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipe queue" });
    }
  });

  app.post("/api/recipe-queue", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertRecipeQueueSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      
      const recipe = await storage.getRecipe(parsed.data.recipeId, userId);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      
      const item = await storage.addToRecipeQueue({
        ...parsed.data,
        userId,
      });
      
      res.status(201).json({ ...item, recipe });
    } catch (error) {
      res.status(500).json({ error: "Failed to add to recipe queue" });
    }
  });

  app.patch("/api/recipe-queue/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = updateRecipeQueueSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      
      const updated = await storage.updateRecipeQueueItem(
        req.params.id,
        userId,
        parsed.data.servingMultiplier
      );
      
      if (!updated) {
        return res.status(404).json({ error: "Queue item not found" });
      }
      
      const recipe = await storage.getRecipe(updated.recipeId, userId);
      res.json({ ...updated, recipe });
    } catch (error) {
      res.status(500).json({ error: "Failed to update queue item" });
    }
  });

  app.delete("/api/recipe-queue/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.removeFromRecipeQueue(req.params.id, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Queue item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from queue" });
    }
  });

  app.post("/api/recipe-queue/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = reorderRecipeQueueSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      
      await storage.reorderRecipeQueue(userId, parsed.data.orderedIds);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reorder queue" });
    }
  });

  app.post("/api/recipe-queue/build-shopping-list", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { groupName } = req.body;
      
      const queueItems = await storage.getRecipeQueue(userId);
      if (queueItems.length === 0) {
        return res.status(400).json({ error: "No recipes in queue" });
      }
      
      const { categorizeIngredients, scaleAmount, getCategorySortOrder } = await import('./aiCategorizer');
      
      const ingredientsForAI: { ingredient: string; amount: string | null; unit: string | null; recipeName: string }[] = [];
      
      for (const queueItem of queueItems) {
        const recipe = await storage.getRecipe(queueItem.recipeId, userId);
        if (!recipe) continue;
        
        const parsedIngredients = (recipe.parsedIngredients || []) as ParsedIngredient[];
        const multiplier = queueItem.servingMultiplier || 1;
        
        for (const ing of parsedIngredients) {
          const scaledAmount = scaleAmount(ing.amount, multiplier);
          ingredientsForAI.push({
            ingredient: ing.ingredient,
            amount: scaledAmount || null,
            unit: ing.unit || null,
            recipeName: recipe.title,
          });
        }
      }
      
      if (ingredientsForAI.length === 0) {
        return res.status(400).json({ error: "No ingredients found in queued recipes" });
      }
      
      let categorizedIngredients;
      try {
        categorizedIngredients = await categorizeIngredients(ingredientsForAI);
      } catch (aiError) {
        console.error("AI categorization failed:", aiError);
        return res.status(500).json({ error: "Failed to categorize ingredients with AI" });
      }
      
      // STEP 1: Delete old shopping lists first
      await storage.deleteShoppingGoals(userId);
      
      // STEP 2: Group ingredients by category
      const ingredientsByCategory: Record<string, typeof categorizedIngredients> = {};
      for (const item of categorizedIngredients) {
        if (!ingredientsByCategory[item.category]) {
          ingredientsByCategory[item.category] = [];
        }
        ingredientsByCategory[item.category].push(item);
      }
      
      // STEP 3: Create one goal per category
      const CATEGORY_COLORS: Record<string, string> = {
        'Produce': '#10B981',      'Dairy': '#F59E0B',
        'Meat': '#EF4444',         'Seafood': '#3B82F6',
        'Bakery': '#F97316',       'Canned Goods': '#8B5CF6',
        'Dry Goods': '#A78BFA',    'Pasta & Rice': '#FBBF24',
        'Frozen': '#60A5FA',       'Beverages': '#EC4899',
        'Condiments': '#14B8A6',   'Spices': '#F472B6',
        'Baking': '#FB923C',       'Nuts & Seeds': '#84CC16',
        'Other': '#6B7280',
      };
      
      const shoppingListGroupId = crypto.randomUUID();
      const listName = groupName || 'Shopping List';
      const createdGoals = [];
      
      for (const [category, items] of Object.entries(ingredientsByCategory)) {
        const goal = await storage.createGoal({
          title: category,
          description: `${listName} from ${queueItems.length} recipe${queueItems.length === 1 ? '' : 's'}`,
          color: CATEGORY_COLORS[category] || '#10B981',
          userId,
          type: 'shopping',
          shoppingListGroupId,
          sortOrder: getCategorySortOrder(category),
        });
        
        const tasksToCreate = items.map((item, index) => {
          const amountPart = item.amount && item.unit
            ? `${item.amount} ${item.unit}`
            : item.amount || '';
          const title = amountPart
            ? `${amountPart} ${item.ingredient}`
            : item.ingredient;
          
          return {
            title,
            notes: `from ${item.recipeNames.join(', ')}`,
            goalId: goal.id,
            sortOrder: index,
            category: item.category,
            userId,
          };
        });
        
        await storage.bulkCreateTasks(tasksToCreate);
        createdGoals.push(goal);
      }
      
      // STEP 4: Return array of goals (don't clear recipe queue - user can rebuild)
      res.status(200).json(createdGoals);
    } catch (error) {
      console.error("Failed to build shopping list:", error);
      res.status(500).json({ error: "Failed to build shopping list" });
    }
  });

  /**
   * @swagger
   * /api/settings:
   *   get:
   *     summary: Get current user's settings
   *     tags: [Settings]
   *     responses:
   *       200:
   *         description: User settings
   *   put:
   *     summary: Update user's settings (partial update supported)
   *     tags: [Settings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               theme: { type: string, enum: [light, dark, auto] }
   *               startScreen: { type: string, enum: [today, mystuff] }
   *               countdownDaysThreshold: { type: integer, minimum: 1 }
   *     responses:
   *       200:
   *         description: Updated settings
   */
  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Failed to get settings:", error);
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = updateUserSettingsSchema.parse(req.body);
      const settings = await storage.updateUserSettings(userId, updates);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid settings", details: error.errors });
      }
      console.error("Failed to update settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Helper function to get OAuth client with automatic token refresh
  async function getCalendarClient(req: any): Promise<{ calendar: any; error?: string; needsReauth?: boolean }> {
    const accessToken = req.user.googleAccessToken;
    const refreshToken = req.user.googleRefreshToken;
    
    if (!accessToken && !refreshToken) {
      return { calendar: null, error: "Calendar permission not granted. Please log out and log back in.", needsReauth: true };
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    oAuth2Client.setCredentials({ 
      access_token: accessToken,
      refresh_token: refreshToken 
    });

    // Set up automatic token refresh
    oAuth2Client.on('tokens', (tokens) => {
      if (tokens.access_token) {
        req.user.googleAccessToken = tokens.access_token;
        // Update session with new token
        if (req.session) {
          req.session.passport = req.session.passport || {};
          req.session.passport.user = req.session.passport.user || {};
          req.session.passport.user.googleAccessToken = tokens.access_token;
          if (tokens.refresh_token) {
            req.session.passport.user.googleRefreshToken = tokens.refresh_token;
          }
        }
      }
    });

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    return { calendar };
  }

  // Helper to execute calendar API with automatic retry on token refresh
  async function executeWithTokenRefresh<T>(
    req: any,
    apiCall: (calendar: any) => Promise<T>
  ): Promise<{ data?: T; error?: string; needsReauth?: boolean }> {
    const { calendar, error, needsReauth } = await getCalendarClient(req);
    
    if (error) {
      return { error, needsReauth };
    }

    try {
      const data = await apiCall(calendar);
      return { data };
    } catch (err: any) {
      console.error("Calendar API error:", err.message);
      
      // Check if it's an auth error
      if (err.code === 401 || err.code === 403 || err.message?.includes('invalid_grant')) {
        // Try to refresh the token manually
        const refreshToken = req.user.googleRefreshToken;
        if (refreshToken) {
          try {
            const oAuth2Client = new google.auth.OAuth2(
              process.env.GOOGLE_CLIENT_ID,
              process.env.GOOGLE_CLIENT_SECRET
            );
            oAuth2Client.setCredentials({ refresh_token: refreshToken });
            
            const { credentials } = await oAuth2Client.refreshAccessToken();
            
            // Update session with new tokens
            req.user.googleAccessToken = credentials.access_token;
            if (req.session?.passport?.user) {
              req.session.passport.user.googleAccessToken = credentials.access_token;
              if (credentials.refresh_token) {
                req.session.passport.user.googleRefreshToken = credentials.refresh_token;
              }
            }
            
            // Retry the API call with new token
            oAuth2Client.setCredentials(credentials);
            const retryCalendar = google.calendar({ version: 'v3', auth: oAuth2Client });
            const data = await apiCall(retryCalendar);
            return { data };
          } catch (refreshErr: any) {
            console.error("Token refresh failed:", refreshErr.message);
            return { 
              error: "Calendar permission expired. Please log out and log back in to reconnect.", 
              needsReauth: true 
            };
          }
        }
        
        return { 
          error: "Calendar permission expired. Please log out and log back in to reconnect.", 
          needsReauth: true 
        };
      }
      
      throw err;
    }
  }

  /**
   * @swagger
   * /api/calendar/calendars:
   *   get:
   *     summary: List user's Google Calendars
   *     tags: [Calendar]
   *     responses:
   *       200:
   *         description: List of calendars
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Calendar permission not granted
   */
  app.get("/api/calendar/calendars", isAuthenticated, async (req: any, res) => {
    try {
      const result = await executeWithTokenRefresh(req, async (calendar) => {
        const response = await calendar.calendarList.list();
        return (response.data.items || []).map((cal: any) => ({
          id: cal.id,
          name: cal.summary || cal.id,
          description: cal.description || null,
          backgroundColor: cal.backgroundColor || '#4285F4',
          foregroundColor: cal.foregroundColor || '#FFFFFF',
          isPrimary: cal.primary || false,
        }));
      });

      if (result.error) {
        return res.status(403).json({ error: result.error, needsReauth: result.needsReauth });
      }

      res.json({ calendars: result.data });
    } catch (error: any) {
      console.error("Failed to fetch calendars:", error);
      res.status(500).json({ error: "Failed to fetch calendars" });
    }
  });

  /**
   * @swagger
   * /api/calendar/events:
   *   get:
   *     summary: Fetch events from selected calendars
   *     tags: [Calendar]
   *     parameters:
   *       - name: calendarIds
   *         in: query
   *         required: true
   *         schema:
   *           type: string
   *         description: Comma-separated calendar IDs
   *       - name: days
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           default: 7
   *           maximum: 30
   *         description: Number of days to fetch
   *     responses:
   *       200:
   *         description: List of events
   *       400:
   *         description: Missing or invalid calendarIds
   *       401:
   *         description: Not authenticated
   *       403:
   *         description: Calendar permission not granted
   */
  app.get("/api/calendar/events", isAuthenticated, async (req: any, res) => {
    try {
      const calendarIdsParam = req.query.calendarIds as string;
      if (!calendarIdsParam) {
        return res.status(400).json({ error: "calendarIds parameter is required" });
      }

      const calendarIds = calendarIdsParam.split(',').map(id => id.trim()).filter(Boolean);
      if (calendarIds.length === 0) {
        return res.status(400).json({ error: "At least one calendar ID is required" });
      }

      let days = parseInt(req.query.days as string) || 7;
      days = Math.min(Math.max(days, 1), 30); // Clamp between 1 and 30

      const result = await executeWithTokenRefresh(req, async (calendar) => {
        // Get calendar colors for mapping
        const calendarListResponse = await calendar.calendarList.list();
        const calendarColors: Record<string, string> = {};
        (calendarListResponse.data.items || []).forEach((cal: any) => {
          if (cal.id) {
            calendarColors[cal.id] = cal.backgroundColor || '#4285F4';
          }
        });

        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + days);

        const allEvents: any[] = [];

        for (const calendarId of calendarIds) {
          try {
            const response = await calendar.events.list({
              calendarId,
              timeMin: now.toISOString(),
              timeMax: futureDate.toISOString(),
              singleEvents: true,
              orderBy: 'startTime',
              maxResults: 100,
            });

            const calendarColor = calendarColors[calendarId] || '#4285F4';

            (response.data.items || []).forEach((event: any) => {
              allEvents.push({
                id: event.id,
                calendarId,
                title: event.summary || '(No title)',
                description: event.description || null,
                location: event.location || null,
                startTime: event.start?.dateTime || event.start?.date,
                endTime: event.end?.dateTime || event.end?.date,
                isAllDay: !!event.start?.date,
                color: calendarColor,
              });
            });
          } catch (calError: any) {
            console.error(`Failed to fetch events for calendar ${calendarId}:`, calError);
            // Continue with other calendars even if one fails
          }
        }

        // Sort all events by start time
        allEvents.sort((a, b) => {
          const aTime = new Date(a.startTime).getTime();
          const bTime = new Date(b.startTime).getTime();
          return aTime - bTime;
        });

        return allEvents;
      });

      if (result.error) {
        return res.status(403).json({ error: result.error, needsReauth: result.needsReauth });
      }

      res.json({ events: result.data });
    } catch (error: any) {
      console.error("Failed to fetch events:", error);
      if (error.code === 401 || error.code === 403) {
        return res.status(403).json({ error: "Calendar permission not granted or expired. Please log out and log back in." });
      }
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // ==================== SUBSCRIPTION ENDPOINTS ====================

  /**
   * @swagger
   * /api/subscription/status:
   *   get:
   *     summary: Get current user's subscription status
   *     tags: [Subscription]
   *     responses:
   *       200:
   *         description: Subscription status
   *       401:
   *         description: Not authenticated
   */
  app.get("/api/subscription/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscriptionInfo = await storage.getSubscriptionInfo(userId);
      res.json(subscriptionInfo);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });

  /**
   * @swagger
   * /api/subscription/limits:
   *   get:
   *     summary: Get tier limits for the authenticated user
   *     tags: [Subscription]
   *     responses:
   *       200:
   *         description: Tier limits
   *       401:
   *         description: Not authenticated
   */
  app.get("/api/subscription/limits", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscriptionInfo = await storage.getSubscriptionInfo(userId);
      const limits = TIER_LIMITS[subscriptionInfo.tier];
      res.json(limits);
    } catch (error) {
      console.error("Error fetching subscription limits:", error);
      res.status(500).json({ error: "Failed to fetch subscription limits" });
    }
  });

  /**
   * @swagger
   * /api/subscription/validate:
   *   post:
   *     summary: Validate RevenueCat purchase and update subscription
   *     tags: [Subscription]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               purchaserInfo:
   *                 type: object
   *     responses:
   *       200:
   *         description: Subscription updated
   *       400:
   *         description: Invalid purchase data
   *       401:
   *         description: Not authenticated
   */
  app.post("/api/subscription/validate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { purchaserInfo } = req.body;

      if (!purchaserInfo || !purchaserInfo.entitlements) {
        return res.status(400).json({ error: "Invalid purchase data" });
      }

      const premiumEntitlement = purchaserInfo.entitlements?.active?.premium;
      
      if (!premiumEntitlement || !premiumEntitlement.isActive) {
        // No active premium entitlement - ensure user is on free tier
        await storage.updateSubscription(userId, {
          tier: 'free',
          status: 'none',
        });
        const subscriptionInfo = await storage.getSubscriptionInfo(userId);
        return res.json(subscriptionInfo);
      }

      // Update user to premium
      const platform = premiumEntitlement.store === 'app_store' ? 'ios' : 'android';
      const isTrial = premiumEntitlement.periodType === 'trial';
      
      await storage.updateSubscription(userId, {
        tier: 'premium',
        status: isTrial ? 'trial' : 'active',
        expiresAt: premiumEntitlement.expirationDate ? new Date(premiumEntitlement.expirationDate) : null,
        willRenew: premiumEntitlement.willRenew || false,
        platform,
        productId: premiumEntitlement.productIdentifier,
        purchasedAt: premiumEntitlement.latestPurchaseDate ? new Date(premiumEntitlement.latestPurchaseDate) : null,
        isTrial,
        revenuecatUserId: purchaserInfo.originalAppUserId,
      });

      const subscriptionInfo = await storage.getSubscriptionInfo(userId);
      res.json(subscriptionInfo);
    } catch (error) {
      console.error("Error validating subscription:", error);
      res.status(500).json({ error: "Failed to validate subscription" });
    }
  });

  /**
   * @swagger
   * /api/subscription/restore:
   *   post:
   *     summary: Restore subscription after app reinstall
   *     tags: [Subscription]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               revenueCatUserId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Subscription restored
   *       404:
   *         description: No active subscription found
   *       401:
   *         description: Not authenticated
   */
  app.post("/api/subscription/restore", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { revenueCatUserId } = req.body;

      if (!revenueCatUserId) {
        return res.status(400).json({ error: "revenueCatUserId is required" });
      }

      // Check if REVENUECAT_API_KEY is available
      if (!process.env.REVENUECAT_API_KEY) {
        return res.status(503).json({ error: "Subscription service not configured" });
      }

      // Call RevenueCat API to get subscriber info
      const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(revenueCatUserId)}`, {
        headers: {
          'Authorization': `Bearer ${process.env.REVENUECAT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "No active subscription found" });
        }
        throw new Error(`RevenueCat API error: ${response.status}`);
      }

      const data = await response.json();
      const subscriber = data.subscriber;
      
      if (!subscriber || !subscriber.entitlements || !subscriber.entitlements.premium) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      const premiumEntitlement = subscriber.entitlements.premium;
      
      if (!premiumEntitlement.expires_date || new Date(premiumEntitlement.expires_date) < new Date()) {
        // Subscription expired
        await storage.updateSubscription(userId, {
          tier: 'free',
          status: 'expired',
        });
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Restore premium
      await storage.updateSubscription(userId, {
        tier: 'premium',
        status: 'active',
        expiresAt: new Date(premiumEntitlement.expires_date),
        willRenew: premiumEntitlement.unsubscribe_detected_at === null,
        productId: premiumEntitlement.product_identifier,
        purchasedAt: premiumEntitlement.purchase_date ? new Date(premiumEntitlement.purchase_date) : null,
        revenuecatUserId: revenueCatUserId,
      });

      const subscriptionInfo = await storage.getSubscriptionInfo(userId);
      res.json(subscriptionInfo);
    } catch (error) {
      console.error("Error restoring subscription:", error);
      res.status(500).json({ error: "Failed to restore subscription" });
    }
  });

  /**
   * @swagger
   * /api/subscription/webhook:
   *   post:
   *     summary: RevenueCat webhook for subscription events
   *     tags: [Subscription]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Webhook processed
   *       401:
   *         description: Invalid webhook signature
   */
  app.post("/api/subscription/webhook", async (req: any, res) => {
    try {
      // Verify webhook signature if secret is configured
      const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers['revenuecat-signature'] || req.headers['x-revenuecat-signature'];
        if (!signature) {
          console.error("Missing RevenueCat webhook signature");
          return res.status(401).json({ error: "Missing webhook signature" });
        }

        const crypto = await import('crypto');
        // Use raw body if available (from express.raw middleware), otherwise fallback to JSON.stringify
        // Note: For proper signature verification, the webhook endpoint should use express.raw({ type: 'application/json' })
        // Currently falling back to JSON.stringify which may work if RevenueCat sends consistent JSON formatting
        const rawBody = req.rawBody || JSON.stringify(req.body);
        const expectedSignature = crypto.createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');

        if (signature !== expectedSignature) {
          console.error("Invalid RevenueCat webhook signature");
          return res.status(401).json({ error: "Invalid webhook signature" });
        }
      }

      const event = req.body.event;
      if (!event || !event.app_user_id) {
        console.log("Webhook received but missing event data:", req.body);
        return res.json({ success: true });
      }

      const appUserId = event.app_user_id;
      const eventType = event.type;
      console.log(`RevenueCat webhook: ${eventType} for user ${appUserId}`);

      // Find user by RevenueCat ID first, then fallback to regular user ID
      let user = await storage.getUserByRevenueCatId(appUserId);
      if (!user) {
        // Fallback: try to find by regular user ID (in case app_user_id is our user ID)
        user = await storage.getUser(appUserId);
      }
      if (!user) {
        console.log(`User not found for RevenueCat ID: ${appUserId}`);
        return res.json({ success: true }); // Still return success to acknowledge receipt
      }

      const userId = user.id;
      const platform = event.store === 'APP_STORE' ? 'ios' : 'android';

      switch (eventType) {
        case 'INITIAL_PURCHASE':
          await storage.updateSubscription(userId, {
            tier: 'premium',
            status: 'active',
            expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
            willRenew: true,
            platform,
            productId: event.product_id,
            purchasedAt: event.purchased_at_ms ? new Date(event.purchased_at_ms) : null,
            isTrial: event.period_type === 'TRIAL',
          });
          break;

        case 'RENEWAL':
          await storage.updateSubscription(userId, {
            expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
            willRenew: true,
            status: 'active',
          });
          break;

        case 'CANCELLATION':
          await storage.updateSubscription(userId, {
            status: 'cancelled',
            willRenew: false,
            cancelledAt: new Date(),
          });
          break;

        case 'EXPIRATION':
          await storage.updateSubscription(userId, {
            tier: 'free',
            status: 'expired',
            willRenew: false,
          });
          break;

        case 'BILLING_ISSUE':
          await storage.updateSubscription(userId, {
            status: 'grace_period',
          });
          break;

        case 'PRODUCT_CHANGE':
          await storage.updateSubscription(userId, {
            productId: event.new_product_id || event.product_id,
            expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
          });
          break;

        default:
          console.log(`Unhandled webhook event type: ${eventType}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error processing RevenueCat webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}