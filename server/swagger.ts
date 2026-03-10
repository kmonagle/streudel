import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Life | Ordered API',
      version: '1.0.0',
      description: 'API documentation for Life | Ordered - a mobile-optimized todo application with goals, tasks, habits, and countdown tracking.',
    },
    servers: [
      {
        url: '/',
        description: 'Current server'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session-based authentication via Google OAuth'
        }
      },
      schemas: {
        Goal: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            name: { type: 'string', description: 'Goal name' },
            description: { type: 'string', nullable: true, description: 'Goal description' },
            color: { type: 'string', description: 'Display color' },
            isArchived: { type: 'boolean', description: 'Whether goal is archived' },
            isHabitGoal: { type: 'boolean', description: 'If true, tasks in this goal behave like habits' },
            sortOrder: { type: 'integer', description: 'Display order' },
            userId: { type: 'string', description: 'Owner user ID' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            name: { type: 'string', description: 'Task name' },
            notes: { type: 'string', nullable: true, description: 'Markdown notes' },
            completed: { type: 'boolean', description: 'Completion status' },
            completedToday: { type: 'boolean', description: 'For habit-goal tasks, daily completion' },
            completionCount: { type: 'integer', description: 'Total times completed' },
            goalId: { type: 'string', nullable: true, description: 'Parent goal ID' },
            isOnToday: { type: 'boolean', description: 'Whether on Today view' },
            sortOrder: { type: 'integer', description: 'Display order' },
            todaySortOrder: { type: 'integer', nullable: true, description: 'Order in Today view' },
            userId: { type: 'string', description: 'Owner user ID' }
          }
        },
        Habit: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            name: { type: 'string', description: 'Habit name' },
            notes: { type: 'string', nullable: true, description: 'Markdown notes' },
            completedToday: { type: 'boolean', description: 'Daily completion status' },
            completionCount: { type: 'integer', description: 'Total times completed' },
            isOnToday: { type: 'boolean', description: 'Whether on Today view' },
            sortOrder: { type: 'integer', description: 'Display order' },
            todaySortOrder: { type: 'integer', nullable: true, description: 'Order in Today view' },
            userId: { type: 'string', description: 'Owner user ID' }
          }
        },
        Countdown: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            name: { type: 'string', description: 'Countdown name' },
            targetDate: { type: 'string', format: 'date', description: 'Target date (YYYY-MM-DD)' },
            sortOrder: { type: 'integer', description: 'Display order' },
            userId: { type: 'string', description: 'Owner user ID' }
          }
        },
        HabitCompletion: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique identifier' },
            habitId: { type: 'string', nullable: true, description: 'Habit ID if from habit' },
            taskId: { type: 'string', nullable: true, description: 'Task ID if from habit-goal task' },
            completedAt: { type: 'string', format: 'date-time', description: 'Completion timestamp' },
            completionDate: { type: 'string', format: 'date', description: 'Completion date' },
            userId: { type: 'string', description: 'Owner user ID' }
          }
        },
        ReorderItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sortOrder: { type: 'integer' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            details: { type: 'array', items: { type: 'object' }, description: 'Validation error details' }
          }
        }
      }
    },
    security: [{ sessionAuth: [] }]
  },
  apis: ['./server/routes.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
