// Mock data service - generates realistic data matching the API schema
import { Task, Goal, Habit, Countdown, HabitCompletion } from '../../types/models';

// Helper to generate realistic IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper to get dates
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

// Mock user ID
const MOCK_USER_ID = 'mock-user-123';

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: generateId(),
    name: 'Review Q1 financial reports',
    notes: 'Focus on revenue growth and operating expenses',
    completed: false,
    completedToday: false,
    completionCount: 0,
    goalId: null,
    isOnToday: true,
    sortOrder: 0,
    todaySortOrder: 0,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Schedule dentist appointment',
    notes: null,
    completed: false,
    completedToday: false,
    completionCount: 0,
    goalId: null,
    isOnToday: true,
    sortOrder: 1,
    todaySortOrder: 1,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Buy groceries',
    notes: 'Milk, eggs, bread, chicken, vegetables',
    completed: false,
    completedToday: false,
    completionCount: 0,
    goalId: null,
    isOnToday: false,
    sortOrder: 2,
    todaySortOrder: null,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Call mom',
    notes: null,
    completed: true,
    completedToday: true,
    completionCount: 12,
    goalId: null,
    isOnToday: true,
    sortOrder: 3,
    todaySortOrder: 2,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Finish project proposal',
    notes: 'Include budget breakdown and timeline',
    completed: false,
    completedToday: false,
    completionCount: 0,
    goalId: null,
    isOnToday: false,
    sortOrder: 4,
    todaySortOrder: null,
    userId: MOCK_USER_ID,
  },
  {
    id: generateId(),
    name: 'Update resume',
    notes: 'Add recent projects and certifications',
    completed: true,
    completedToday: false,
    completionCount: 3,
    goalId: null,
    isOnToday: false,
    sortOrder: 5,
    todaySortOrder: null,
    userId: MOCK_USER_ID,
  },
];

// Mock Goals
export const mockGoals: Goal[] = [
  {
    id: generateId(),
    name: 'Launch mobile app',
    notes: 'Complete MVP with core features: tasks, habits, goals',
    archived: false,
    sortOrder: 0,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  },
  {
    id: generateId(),
    name: 'Get in shape',
    notes: 'Lose 15 lbs, run 5k, improve diet',
    archived: false,
    sortOrder: 1,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
  {
    id: generateId(),
    name: 'Learn Spanish',
    notes: 'Practice daily, complete Duolingo course, watch Spanish shows',
    archived: false,
    sortOrder: 2,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(10),
  },
  {
    id: generateId(),
    name: 'Read 24 books this year',
    notes: '2 books per month - mix of fiction and non-fiction',
    archived: false,
    sortOrder: 3,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(3),
  },
];

// Mock Habits
export const mockHabits: Habit[] = [
  {
    id: generateId(),
    name: 'Morning meditation',
    notes: '10 minutes of mindfulness practice',
    archived: false,
    sortOrder: 0,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(1),
  },
  {
    id: generateId(),
    name: 'Drink 8 glasses of water',
    notes: null,
    archived: false,
    sortOrder: 1,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
  },
  {
    id: generateId(),
    name: 'Exercise',
    notes: '30 min cardio or strength training',
    archived: false,
    sortOrder: 2,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(1),
  },
  {
    id: generateId(),
    name: 'Read for 30 minutes',
    notes: 'Before bed, no screens',
    archived: false,
    sortOrder: 3,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(1),
  },
  {
    id: generateId(),
    name: 'Practice Spanish',
    notes: 'Duolingo + one Spanish podcast episode',
    archived: false,
    sortOrder: 4,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(1),
  },
];

// Mock Countdowns
export const mockCountdowns: Countdown[] = [
  {
    id: generateId(),
    name: 'Wedding anniversary',
    targetDate: daysFromNow(45),
    notes: 'Plan something special!',
    archived: false,
    sortOrder: 0,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(300),
    updatedAt: daysAgo(10),
  },
  {
    id: generateId(),
    name: 'Product launch',
    targetDate: daysFromNow(30),
    notes: 'MVP release date',
    archived: false,
    sortOrder: 1,
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
    sortOrder: 2,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(40),
    updatedAt: daysAgo(3),
  },
  {
    id: generateId(),
    name: 'Marathon race day',
    targetDate: daysFromNow(120),
    notes: 'Training plan in progress',
    archived: false,
    sortOrder: 3,
    userId: MOCK_USER_ID,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(7),
  },
];

// Mock Habit Completions (last 30 days)
export const mockHabitCompletions: HabitCompletion[] = (() => {
  const completions: HabitCompletion[] = [];
  const habitIds = mockHabits.map((h) => h.id);

  // Generate completions for the past 30 days
  for (let day = 0; day < 30; day++) {
    habitIds.forEach((habitId, index) => {
      // Random completion pattern - some habits done more consistently
      const completionRate = [0.9, 0.7, 0.6, 0.8, 0.5][index] || 0.7;
      if (Math.random() < completionRate) {
        completions.push({
          id: generateId(),
          habitId,
          date: daysAgo(day),
          userId: MOCK_USER_ID,
          createdAt: daysAgo(day),
        });
      }
    });
  }

  return completions;
})();

// Helper to simulate API delay
export const simulateApiDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));
