// Tasks store using Zustand
import { create } from 'zustand';
import { Task, CreateTaskDto, UpdateTaskDto } from '../types/models';
import { tasksApi } from '../services/api/tasks';
import { mockTasksApi } from '../services/mock/mockTasksApi';
import { USE_MOCK_DATA } from '../constants/mockConfig';

// Use mock or real API based on config
const api = USE_MOCK_DATA ? mockTasksApi : tasksApi;

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskDto) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskDto) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
  clearError: () => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all standalone tasks
   */
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await api.getAll();
      console.log(`✅ Loaded ${tasks.length} tasks (${USE_MOCK_DATA ? 'MOCK' : 'REAL'} data)`);
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false,
      });
    }
  },

  /**
   * Create a new task
   */
  createTask: async (data: CreateTaskDto) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await api.create(data);
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to create task:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create task',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Update a task
   */
  updateTask: async (id: string, data: UpdateTaskDto) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTask = await api.update(id, data);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? updatedTask : task)),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to update task:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Delete a task
   */
  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Toggle task completion
   */
  toggleComplete: async (id: string, completed: boolean) => {
    try {
      // Optimistic update
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? { ...task, completed } : task)),
      }));

      await api.update(id, { completed });
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? { ...task, completed: !completed } : task)),
        error: error instanceof Error ? error.message : 'Failed to update task',
      }));
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },
}));
