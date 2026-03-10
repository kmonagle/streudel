// Updated mock data - Goals with nested tasks
import { Task, Goal, Countdown } from '../../types/models';

const generateId = () => Math.random().toString(36).substring(2, 15);

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const MOCK_USER_ID = 'mock-user-123';

// Create goals first
const habitsGoalId = generateId();
const todosGoalId = generateId();
const workGoalId = generateId();

// Mock Goals
export const mockGoals: Goal[] = [
  {
    id: habitsGoalId,
    name: 'Habits',
    notes: 'Daily habits and routines',
    archived: false,
    sortOrder: 0,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(1),
  },
  {
    id: todosGoalId,
    name: 'Todos',
    notes: null,
    archived: false,
    sortOrder: 1,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(2),
  },
  {
    id: workGoalId,
    name: 'Work',
    notes: 'Work-related tasks and projects',
    archived: false,
    sortOrder: 2,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  },
];

// Mock Tasks - all belong to goals
export const mockTasks: Task[] = [
  // Habits goal tasks (don't disappear when completed)
  {
    id: generateId(),
    name: 'Morning meditation',
    notes: '10 minutes of mindfulness',
    completed: true,
    completedToday: true,
    completionCount: 25,
    goalId: habitsGoalId,
    isOnToday: true,
    sortOrder: 0,
    todaySortOrder: 0,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Drink 8 glasses of water',
    notes: null,
    completed: false,
    completedToday: false,
    completionCount: 18,
    goalId: habitsGoalId,
    isOnToday: true,
    sortOrder: 1,
    todaySortOrder: 1,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Exercise 30 minutes',
    notes: 'Cardio or strength training',
    completed: false,
    completedToday: false,
    completionCount: 22,
    goalId: habitsGoalId,
    isOnToday: true,
    sortOrder: 2,
    todaySortOrder: 2,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Read for 30 minutes',
    notes: 'Before bed, no screens',
    completed: true,
    completedToday: true,
    completionCount: 31,
    goalId: habitsGoalId,
    isOnToday: false,
    sortOrder: 3,
    todaySortOrder: null,
    userId: MOCK_USER_ID,
  },

  // Todos goal tasks (regular tasks)
  {
    id: generateId(),
    name: 'Schedule dentist appointment',
    notes: null,
    completed: false,
    completedToday: false,
    completionCount: 0,
    goalId: todosGoalId,
    isOnToday: true,
    sortOrder: 0,
    todaySortOrder: 3,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Buy groceries',
    notes: 'Milk, eggs, bread, chicken, vegetables',
    completed: false,
    completedToday: false,
    completionCount: 0,
    goalId: todosGoalId,
    isOnToday: false,
    sortOrder: 1,
    todaySortOrder: null,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Call mom',
    notes: null,
    completed: true,
    completedToday: true,
    completionCount: 1,
    goalId: todosGoalId,
    isOnToday: false,
    sortOrder: 2,
    todaySortOrder: null,
    userId: MOCK_USER_ID,
  },

  // Work goal tasks
  {
    id: generateId(),
    name: 'Review Q1 financial reports',
    notes: 'Focus on revenue growth and operating expenses',
    completed: false,
    completedToday: false,
    completionCount: 0,
    goalId: workGoalId,
    isOnToday: true,
    sortOrder: 0,
    todaySortOrder: 4,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Finish project proposal',
    notes: 'Include budget breakdown and timeline',
    completed: false,
    completedToday: false,
    completionCount: 0,
    goalId: workGoalId,
    isOnToday: false,
    sortOrder: 1,
    todaySortOrder: null,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Update resume',
    notes: 'Add recent projects and certifications',
    completed: true,
    completedToday: false,
    completionCount: 1,
    goalId: workGoalId,
    isOnToday: false,
    sortOrder: 2,
    todaySortOrder: null,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Prepare presentation slides',
    notes: 'Team meeting on Friday',
    completed: false,
    completedToday: false,
    completionCount: 0,
    goalId: workGoalId,
    isOnToday: false,
    sortOrder: 3,
    todaySortOrder: null,
    userId: MOCK_USER_ID,
  },
];

// Mock Countdowns
export const mockCountdowns: Countdown[] = [
  {
    id: generateId(),
    name: 'Product launch',
    targetDate: daysFromNow(30),
    notes: 'MVP release date',
    archived: false,
    sortOrder: 0,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
  {
    id: generateId(),
    name: 'Vacation to Hawaii',
    targetDate: daysFromNow(90),
    notes: 'Book flights and hotel soon',
    archived: false,
    sortOrder: 1,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(40),
    updatedAt: daysAgo(3),
  },
  {
    id: generateId(),
    name: 'Wedding anniversary',
    targetDate: daysFromNow(45),
    notes: 'Plan something special!',
    archived: false,
    sortOrder: 2,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(300),
    updatedAt: daysAgo(10),
  },
];

// Helper to simulate API delay
export const simulateApiDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Helper to get tasks by goal
export const getTasksByGoalId = (goalId: string): Task[] => {
  return mockTasks.filter((task) => task.goalId === goalId);
};

// Helper to get today's tasks
export const getTodayTasks = (): Task[] => {
  return mockTasks.filter((task) => task.isOnToday).sort((a, b) => (a.todaySortOrder || 0) - (b.todaySortOrder || 0));
};
