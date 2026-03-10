// Mock API for tasks - simulates real API behavior with mock data
import { Task, CreateTaskDto, UpdateTaskDto } from '../../types/models';
import { mockTasks, simulateApiDelay } from './mockData';

// In-memory storage (persists during app session)
let tasks: Task[] = [...mockTasks];

export const mockTasksApi = {
  /**
   * Get all tasks
   */
  getAll: async (): Promise<Task[]> => {
    await simulateApiDelay();
    return [...tasks];
  },

  /**
   * Get a single task by ID
   */
  getById: async (id: string): Promise<Task> => {
    await simulateApiDelay();
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      throw new Error('Task not found');
    }
    return { ...task };
  },

  /**
   * Create a new task
   */
  create: async (data: CreateTaskDto): Promise<Task> => {
    await simulateApiDelay();

    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 15),
      name: data.name,
      notes: data.notes || null,
      completed: false,
      completedToday: false,
      completionCount: 0,
      goalId: data.goalId || null,
      isOnToday: data.isOnToday || false,
      sortOrder: tasks.length,
      todaySortOrder: data.isOnToday ? tasks.filter((t) => t.isOnToday).length : null,
      userId: 'mock-user-123',
    };

    tasks.push(newTask);
    return { ...newTask };
  },

  /**
   * Update a task
   */
  update: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    await simulateApiDelay();

    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    tasks[index] = {
      ...tasks[index],
      ...data,
      notes: data.notes !== undefined ? data.notes : tasks[index].notes,
    };

    return { ...tasks[index] };
  },

  /**
   * Delete a task
   */
  delete: async (id: string): Promise<void> => {
    await simulateApiDelay();

    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    tasks.splice(index, 1);
  },

  /**
   * Reorder tasks
   */
  reorder: async (taskIds: string[]): Promise<void> => {
    await simulateApiDelay();

    taskIds.forEach((id, index) => {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        task.sortOrder = index;
      }
    });
  },

  /**
   * Batch delete completed tasks
   */
  deleteCompleted: async (): Promise<void> => {
    await simulateApiDelay();

    tasks = tasks.filter((t) => !t.completed);
  },
};
