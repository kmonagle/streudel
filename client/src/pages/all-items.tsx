import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Goal, Task, Habit, Countdown, insertGoalSchema, insertTaskSchema, insertHabitSchema } from "@shared/schema";
import { GoalItem } from "@/components/ui/goal-item";
import { TaskItem } from "@/components/ui/task-item";
import { HabitItem } from "@/components/ui/habit-item";
import { HabitsContainer } from "@/components/ui/habits-container";
import { TodosContainer } from "@/components/ui/todos-container";
import { AddItemModal } from "@/components/ui/add-item-modal";
import { CountdownItem } from "@/components/ui/countdown-item";
import { CountdownModal } from "@/components/ui/countdown-modal";
import { Button } from "@/components/ui/button";

import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { DroppableList } from "@/lib/drag-drop";
import { Plus, Filter, Target, CheckSquare, Archive, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { z } from "zod";

export default function AllItems() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTaskToGoalId, setAddTaskToGoalId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  // Simple filter state - only track what's DISABLED (everything else is shown)
  const [disabledFilters, setDisabledFilters] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState<{
    taskComplete: Set<string>;
    taskToday: Set<string>;
    habitComplete: Set<string>;
    habitToday: Set<string>;
  }>({
    taskComplete: new Set(),
    taskToday: new Set(),
    habitComplete: new Set(),
    habitToday: new Set(),
  });
  const { toast } = useToast();

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals", showArchived],
    queryFn: async () => {
      const response = await fetch(`/api/goals?showArchived=${showArchived}`);
      if (!response.ok) throw new Error('Failed to fetch goals');
      return response.json();
    },
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: countdowns = [], isLoading: countdownsLoading } = useQuery<Countdown[]>({
    queryKey: ["/api/countdowns"],
  });

  const [isCountdownModalOpen, setIsCountdownModalOpen] = useState(false);
  const [editingCountdown, setEditingCountdown] = useState<Countdown | null>(null);

  const createGoalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertGoalSchema>) => {
      return apiRequest("POST", "/api/goals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Goal created",
        description: "Your goal has been created successfully.",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertTaskSchema>) => {
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
      setAddTaskToGoalId(null);
    },
  });

  const createHabitMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertHabitSchema>) => {
      return apiRequest("POST", "/api/habits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      toast({
        title: "Habit created",
        description: "Your habit has been created successfully.",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/habits/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Goal deleted",
        description: "The goal and its tasks have been deleted.",
      });
    },
  });

  const archiveGoalMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      return apiRequest("PATCH", `/api/goals/${id}`, { archived });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: variables.archived ? "Goal archived" : "Goal unarchived",
        description: variables.archived
          ? "The goal has been archived."
          : "The goal has been restored.",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      toast({
        title: "Task deleted",
        description: "The task has been deleted.",
      });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/habits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      toast({
        title: "Habit deleted",
        description: "The habit has been deleted.",
      });
    },
  });

  const createCountdownMutation = useMutation({
    mutationFn: async (data: { name: string; targetDate: string }) => {
      return apiRequest("POST", "/api/countdowns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countdowns"] });
      toast({
        title: "Countdown created",
        description: "Your countdown has been created.",
      });
    },
  });

  const updateCountdownMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; targetDate?: string } }) => {
      return apiRequest("PATCH", `/api/countdowns/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countdowns"] });
      toast({
        title: "Countdown updated",
        description: "Your countdown has been updated.",
      });
    },
  });

  const deleteCountdownMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/countdowns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countdowns"] });
      toast({
        title: "Countdown deleted",
        description: "The countdown has been deleted.",
      });
    },
  });

  const reorderGoalsMutation = useMutation({
    mutationFn: async (reorderedGoals: Goal[]) => {
      const items = reorderedGoals.map((goal, index) => ({
        id: goal.id,
        sortOrder: index,
      }));
      return apiRequest("POST", "/api/goals/reorder", { items });
    },
    onMutate: async (reorderedGoals) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/goals"] });
      
      // Snapshot the previous value
      const previousGoals = queryClient.getQueryData(["/api/goals"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["/api/goals"], reorderedGoals);
      
      // Return a context object with the snapshotted value
      return { previousGoals };
    },
    onError: (err, newGoals, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["/api/goals"], context?.previousGoals);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: async ({ goalId, reorderedTasks }: { goalId: string | null; reorderedTasks: Task[] }) => {
      const items = reorderedTasks.map((task, index) => ({
        id: task.id,
        sortOrder: index,
      }));
      return apiRequest("POST", "/api/tasks/reorder", { goalId, items });
    },
    onMutate: async ({ reorderedTasks }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/tasks"] });
      const previousTasks = queryClient.getQueryData(["/api/tasks"]);
      
      // Update tasks optimistically
      queryClient.setQueryData(["/api/tasks"], (old: Task[] = []) => {
        const newTasks = [...old];
        reorderedTasks.forEach((reorderedTask, index) => {
          const taskIndex = newTasks.findIndex(t => t.id === reorderedTask.id);
          if (taskIndex !== -1) {
            newTasks[taskIndex] = { ...newTasks[taskIndex], sortOrder: index };
          }
        });
        return newTasks;
      });
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["/api/tasks"], context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const reorderHabitsMutation = useMutation({
    mutationFn: async (reorderedHabits: Habit[]) => {
      const items = reorderedHabits.map((habit, index) => ({
        id: habit.id,
        sortOrder: index,
      }));
      return apiRequest("POST", "/api/habits/reorder", { items });
    },
    onMutate: async (reorderedHabits) => {
      await queryClient.cancelQueries({ queryKey: ["/api/habits"] });
      const previousHabits = queryClient.getQueryData(["/api/habits"]);
      queryClient.setQueryData(["/api/habits"], reorderedHabits);
      return { previousHabits };
    },
    onError: (err, newHabits, context) => {
      queryClient.setQueryData(["/api/habits"], context?.previousHabits);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    },
  });

  const deleteCompletedTasksMutation = useMutation({
    mutationFn: async (goalId: string | null) => {
      const url = goalId ? `/api/goals/${goalId}/tasks/completed` : "/api/tasks/completed";
      return apiRequest("DELETE", url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const handleAddTaskToGoal = (goalId: string) => {
    setAddTaskToGoalId(goalId);
    setModalContextType("task");
    setIsAddModalOpen(true);
  };

  const handleAddStandaloneTask = () => {
    setAddTaskToGoalId(null);
    setEditingItem(null);
    setModalContextType("task");
    setIsAddModalOpen(true);
  };

  const handleAddHabit = () => {
    setEditingItem(null);
    setModalContextType("habit");
    setIsAddModalOpen(true);
  };

  const addAllHabitsToTodayMutation = useMutation({
    mutationFn: async () => {
      const updates: Promise<any>[] = [];
      // Get current max todaySortOrder from existing today items
      const todayData = await queryClient.fetchQuery<{ tasks: Task[]; habits: Habit[] }>({ 
        queryKey: ["/api/today"] 
      });
      const maxTodaySortOrder = Math.max(
        ...[
          ...(todayData?.tasks || []).map((t: Task) => t.todaySortOrder || 0),
          ...(todayData?.habits || []).map((h: Habit) => h.todaySortOrder || 0),
        ],
        -1
      );

      // Add all habits to today in their current order
      habits.forEach((habit, index) => {
        if (!habit.isToday) {
          updates.push(apiRequest("PATCH", `/api/habits/${habit.id}`, { 
            isToday: true,
            todaySortOrder: maxTodaySortOrder + 1 + index
          }));
        }
      });
      
      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      const addedCount = habits.filter(h => !h.isToday).length;
      if (addedCount > 0) {
        toast({
          title: "Added to Today",
          description: `${addedCount} habit${addedCount !== 1 ? 's' : ''} added to your today list.`,
        });
      }
    },
  });

  const handleAddAllHabitsToToday = () => {
    const habitsNotInToday = habits.filter(h => !h.isToday);
    if (habitsNotInToday.length > 0) {
      addAllHabitsToTodayMutation.mutate();
    }
  };

  const addAllGoalTasksToTodayMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const updates: Promise<any>[] = [];
      // Get current max todaySortOrder from existing today items
      const todayData = await queryClient.fetchQuery<{ tasks: Task[]; habits: Habit[] }>({ 
        queryKey: ["/api/today"] 
      });
      const maxTodaySortOrder = Math.max(
        ...[
          ...(todayData?.tasks || []).map((t: Task) => t.todaySortOrder || 0),
          ...(todayData?.habits || []).map((h: Habit) => h.todaySortOrder || 0),
        ],
        -1
      );

      // Get tasks for this goal
      const goalTasks = getTasksForGoal(goalId);
      
      // Add all tasks from goal to today in their current order
      goalTasks.forEach((task, index) => {
        if (!task.isToday) {
          updates.push(apiRequest("PATCH", `/api/tasks/${task.id}`, { 
            isToday: true,
            todaySortOrder: maxTodaySortOrder + 1 + index
          }));
        }
      });
      
      return Promise.all(updates);
    },
    onSuccess: (_, goalId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      const goalTasks = getTasksForGoal(goalId);
      const addedCount = goalTasks.filter(t => !t.isToday).length;
      if (addedCount > 0) {
        toast({
          title: "Added to Today",
          description: `${addedCount} task${addedCount !== 1 ? 's' : ''} added to your today list.`,
        });
      }
    },
  });

  const handleAddAllGoalTasksToToday = (goalId: string) => {
    const goalTasks = getTasksForGoal(goalId);
    const tasksNotInToday = goalTasks.filter(t => !t.isToday);
    if (tasksNotInToday.length > 0) {
      addAllGoalTasksToTodayMutation.mutate(goalId);
    }
  };

  const handleDeleteCompletedTasks = (goalId: string | null) => {
    deleteCompletedTasksMutation.mutate(goalId);
  };

  // Bulk creation mutations
  const createTasksBulkMutation = useMutation({
    mutationFn: async (tasksData: z.infer<typeof insertTaskSchema>[]) => {
      const startingSortOrder = Math.max(0, ...(tasks.map(t => t.sortOrder || 0))) + 1;
      const requests = tasksData.map((taskData, index) => 
        apiRequest("POST", "/api/tasks", {
          ...taskData,
          sortOrder: startingSortOrder + index, // Maintain order
        })
      );
      return Promise.all(requests);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      toast({
        title: "Tasks created",
        description: "Your tasks have been created successfully.",
      });
    },
  });

  const createHabitsBulkMutation = useMutation({
    mutationFn: async (habitsData: z.infer<typeof insertHabitSchema>[]) => {
      const startingSortOrder = Math.max(0, ...(habits.map(h => h.sortOrder || 0))) + 1;
      const requests = habitsData.map((habitData, index) => 
        apiRequest("POST", "/api/habits", {
          ...habitData,
          sortOrder: startingSortOrder + index, // Maintain order
        })
      );
      return Promise.all(requests);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      toast({
        title: "Habits created",
        description: "Your habits have been created successfully.",
      });
    },
  });

  const handleCreateTasksBulk = (tasksData: z.infer<typeof insertTaskSchema>[]) => {
    createTasksBulkMutation.mutate(tasksData);
  };

  const handleCreateHabitsBulk = (habitsData: z.infer<typeof insertHabitSchema>[]) => {
    createHabitsBulkMutation.mutate(habitsData);
  };

  const handleCreateGoal = (data: z.infer<typeof insertGoalSchema>) => {
    createGoalMutation.mutate(data);
  };

  const handleCreateTask = (data: z.infer<typeof insertTaskSchema>) => {
    const taskData = addTaskToGoalId 
      ? { ...data, goalId: addTaskToGoalId }
      : data;
    createTaskMutation.mutate(taskData);
  };

  const handleCreateHabit = (data: z.infer<typeof insertHabitSchema>) => {
    createHabitMutation.mutate(data);
  };

  // Edit mutations
  const editGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PATCH", `/api/goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PATCH", `/api/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
    },
  });

  const editHabitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PATCH", `/api/habits/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
    },
  });

  // State for edit modal
  const [editingItem, setEditingItem] = useState<{
    type: "goal" | "task" | "habit";
    data: any;
  } | null>(null);
  const [modalContextType, setModalContextType] = useState<"goal" | "task" | "habit" | null>(null);

  const handleEditGoal = (goal: Goal) => {
    setEditingItem({ type: "goal", data: goal });
    setIsAddModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingItem({ type: "task", data: task });
    setIsAddModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingItem({ type: "habit", data: habit });
    setIsAddModalOpen(true);
  };

  const handleUpdateGoal = (id: string, data: any) => {
    editGoalMutation.mutate({ id, data });
  };

  const handleUpdateTask = (id: string, data: any) => {
    editTaskMutation.mutate({ id, data });
  };

  const handleUpdateHabit = (id: string, data: any) => {
    editHabitMutation.mutate({ id, data });
  };

  const handleToggleTaskToday = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setLoadingStates(prev => ({
        ...prev,
        taskToday: new Set(Array.from(prev.taskToday).concat([id]))
      }));
      updateTaskMutation.mutate({
        id,
        data: { isToday: !task.isToday },
      }, {
        onSettled: () => {
          setLoadingStates(prev => ({
            ...prev,
            taskToday: new Set(Array.from(prev.taskToday).filter(loadingId => loadingId !== id))
          }));
        }
      });
      toast({
        title: task.isToday ? "Removed from Today" : "Added to Today",
        description: `Task ${task.isToday ? "removed from" : "added to"} your today list.`,
      });
    }
  };

  const handleToggleHabitToday = (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (habit) {
      setLoadingStates(prev => ({
        ...prev,
        habitToday: new Set(Array.from(prev.habitToday).concat([id]))
      }));
      updateHabitMutation.mutate({
        id,
        data: { isToday: !habit.isToday },
      }, {
        onSettled: () => {
          setLoadingStates(prev => ({
            ...prev,
            habitToday: new Set(Array.from(prev.habitToday).filter(loadingId => loadingId !== id))
          }));
        }
      });
      toast({
        title: habit.isToday ? "Removed from Today" : "Added to Today",
        description: `Habit ${habit.isToday ? "removed from" : "added to"} your today list.`,
      });
    }
  };

  const handleToggleTaskComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      // Check if task belongs to a habit goal
      const goal = task.goalId ? goals.find(g => g.id === task.goalId) : null;
      const isHabitGoal = goal?.isHabitGoal || false;
      
      setLoadingStates(prev => ({
        ...prev,
        taskComplete: new Set(Array.from(prev.taskComplete).concat([id]))
      }));
      
      // For habit goals, toggle completedToday; for regular tasks, toggle completed
      const updateData = isHabitGoal 
        ? { completedToday: !task.completedToday }
        : { completed: !task.completed };
      
      updateTaskMutation.mutate({
        id,
        data: updateData,
      }, {
        onSettled: () => {
          setLoadingStates(prev => ({
            ...prev,
            taskComplete: new Set(Array.from(prev.taskComplete).filter(loadingId => loadingId !== id))
          }));
        }
      });
    }
  };

  const handleToggleHabitComplete = (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (habit) {
      setLoadingStates(prev => ({
        ...prev,
        habitComplete: new Set(Array.from(prev.habitComplete).concat([id]))
      }));
      updateHabitMutation.mutate({
        id,
        data: { completedToday: !habit.completedToday },
      }, {
        onSettled: () => {
          setLoadingStates(prev => ({
            ...prev,
            habitComplete: new Set(Array.from(prev.habitComplete).filter(loadingId => loadingId !== id))
          }));
        }
      });
    }
  };

  const getTasksForGoal = (goalId: string): Task[] => {
    return tasks
      .filter((task) => task.goalId === goalId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  };

  const getStandaloneTasks = (): Task[] => {
    return tasks
      .filter((task) => !task.goalId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  };



  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return; // No change
    }

    // Note: Goal container reordering is temporarily disabled to fix task reordering within goals
    // This prioritizes inner-container sorting over container-level sorting as requested

    // Handle task reordering within goals
    if (source.droppableId.startsWith("goal-tasks-") && source.droppableId === destination.droppableId) {
      console.log("🔄 Reordering tasks within goal:", source.droppableId);
      const goalId = source.droppableId.replace("goal-tasks-", "");
      const goalTasks = getTasksForGoal(goalId);
      console.log("📋 Current goal tasks:", goalTasks.map(t => ({ id: t.id, title: t.title, sortOrder: t.sortOrder })));
      
      const reorderedTasks = Array.from(goalTasks);
      const [removed] = reorderedTasks.splice(source.index, 1);
      reorderedTasks.splice(destination.index, 0, removed);
      const updatedTasks = reorderedTasks.map((task, index) => ({ ...task, sortOrder: index }));
      
      console.log("📋 Updated task order:", updatedTasks.map(t => ({ id: t.id, title: t.title, sortOrder: t.sortOrder })));
      console.log("🚀 Making reorder request with:", { goalId, items: updatedTasks.map(t => ({ id: t.id, sortOrder: t.sortOrder })) });
      
      reorderTasksMutation.mutate({ goalId, reorderedTasks: updatedTasks });
      return; // Important: return early to prevent other handlers from running
    }

    // Handle task reordering within todos container
    if (source.droppableId === "todos-container" && destination.droppableId === "todos-container") {
      const standaloneTasks = getStandaloneTasks();
      const reorderedTasks = Array.from(standaloneTasks);
      const [removed] = reorderedTasks.splice(source.index, 1);
      reorderedTasks.splice(destination.index, 0, removed);
      const updatedTasks = reorderedTasks.map((task, index) => ({ ...task, sortOrder: index }));
      reorderTasksMutation.mutate({ goalId: null, reorderedTasks: updatedTasks });
      return;
    }

    // Handle habit reordering within habits container
    if (source.droppableId === "habits-container" && destination.droppableId === "habits-container") {
      const reorderedHabits = Array.from(habits);
      const [removed] = reorderedHabits.splice(source.index, 1);
      reorderedHabits.splice(destination.index, 0, removed);
      const updatedHabits = reorderedHabits.map((habit, index) => ({ ...habit, sortOrder: index }));
      reorderHabitsMutation.mutate(updatedHabits);
      return;
    }
  };

  // Filter logic - only filter items if their category is disabled
  const getFilteredItems = () => {
    const standaloneTasks = getStandaloneTasks();
    
    // For counting purposes, but we'll show goals individually based on their specific filter status
    const filteredGoals = goals.filter(goal => !disabledFilters.has(goal.id));
    const filteredTasks = standaloneTasks.filter(() => !disabledFilters.has('todos'));
    const filteredHabits = habits.filter(() => !disabledFilters.has('habits'));
    
    return { goals: filteredGoals, tasks: filteredTasks, habits: filteredHabits };
  };

  // Get filter categories for display - show all categories regardless of today status
  const filterCategories: { id: string; name: string; count: number }[] = [];
  
  // Always show habits if any exist
  if (habits.length > 0) {
    filterCategories.push({ id: 'habits', name: 'Habits', count: habits.length });
  }
  
  // Always show todos if any exist
  const standaloneTasksCount = getStandaloneTasks().length;
  if (standaloneTasksCount > 0) {
    filterCategories.push({ id: 'todos', name: 'Todos', count: standaloneTasksCount });
  }
  
  // Always show all goals with their task counts (even if 0 tasks)
  goals.forEach(goal => {
    const goalTasks = getTasksForGoal(goal.id);
    filterCategories.push({ id: goal.id, name: goal.title, count: goalTasks.length });
  });

  const toggleFilter = (filterId: string) => {
    setDisabledFilters(prev => {
      const updated = new Set(prev);
      if (updated.has(filterId)) {
        updated.delete(filterId); // Remove from disabled = show it
      } else {
        updated.add(filterId); // Add to disabled = hide it
      }
      return updated;
    });
  };

  const isolateFilter = (filterId: string) => {
    // Disable all filters except the clicked one
    const allFilterIds = filterCategories.map(cat => cat.id);
    const newDisabled = new Set(allFilterIds.filter(id => id !== filterId));
    setDisabledFilters(newDisabled);
  };

  const isLoading = goalsLoading || tasksLoading || habitsLoading;
  const { goals: filteredGoals, tasks: filteredTasks, habits: filteredHabits } = getFilteredItems();
  
  const totalCount = goals.length + getStandaloneTasks().length + habits.length;
  const filteredCount = filteredGoals.length + filteredTasks.length + filteredHabits.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-200 dark:bg-slate-600 rounded"></div>
              <div className="w-6 h-6 bg-gray-200 dark:bg-slate-600 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">All Items</h2>
            <span className="text-sm text-gray-500 dark:text-slate-400">
              {filteredCount} of {totalCount} item{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className={cn(
                "transition-colors",
                showArchived
                  ? "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
              )}
              title={showArchived ? "Hide archived goals" : "Show archived goals"}
              data-testid="button-toggle-archived"
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => {
                setEditingItem(null);
                setModalContextType(null);
                setAddTaskToGoalId(null);
                setIsAddModalOpen(true);
              }}
              size="sm"
              className="bg-primary text-white hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filter UI */}
        {filterCategories.length > 0 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400 dark:text-slate-500" />
            <span className="text-sm text-gray-600 dark:text-slate-400">Show:</span>
            <div className="flex gap-2 flex-wrap">
              {filterCategories.map((category) => {
                const isActive = !disabledFilters.has(category.id);
                
                let colorClasses = "";
                if (category.id === 'habits') {
                  colorClasses = isActive
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-600";
                } else if (category.id === 'todos') {
                  colorClasses = isActive
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-600";
                } else {
                  colorClasses = isActive
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-600";
                }

                const Icon = category.id === 'habits' ? Target : CheckSquare;

                return (
                  <Button
                    key={category.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFilter(category.id)}
                    onDoubleClick={() => isolateFilter(category.id)}
                    className={cn(
                      "h-7 px-3 text-xs rounded-full border transition-colors",
                      colorClasses
                    )}
                    data-testid={`filter-${category.id}`}
                    title={`Click to toggle, double-click to show only ${category.name}`}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {category.name} ({category.count})
                  </Button>
                );
              })}
            </div>
          </div>
        )}

      {/* Content */}
      <div className="space-y-4">
        {/* Habits Container */}
        {!disabledFilters.has('habits') && (
          <HabitsContainer
            habits={filteredHabits}
            onToggleHabitComplete={handleToggleHabitComplete}
            onToggleHabitToday={handleToggleHabitToday}
            onEditHabit={handleEditHabit}
            onDeleteHabit={(id) => deleteHabitMutation.mutate(id)}
            onAddHabit={handleAddHabit}
            onAddAllToToday={handleAddAllHabitsToToday}
            loadingStates={{
              habitComplete: loadingStates.habitComplete,
              habitToday: loadingStates.habitToday,
            }}
          />
        )}

        {/* Habit Goals - Render right after habits */}
        {goals.filter(goal => goal.isHabitGoal && !disabledFilters.has(goal.id)).length > 0 && (
          <div className="space-y-4 mb-8">
            {goals
              .filter(goal => goal.isHabitGoal && !disabledFilters.has(goal.id))
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((goal) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  tasks={getTasksForGoal(goal.id)}
                  onEditGoal={handleEditGoal}
                  onDeleteGoal={(id) => deleteGoalMutation.mutate(id)}
                  onArchiveGoal={(id, archived) => archiveGoalMutation.mutate({ id, archived })}
                  onToggleTaskComplete={handleToggleTaskComplete}
                  onToggleTaskToday={handleToggleTaskToday}
                  onEditTask={handleEditTask}
                  onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
                  onAddTaskToGoal={handleAddTaskToGoal}
                  onDeleteCompletedTasks={handleDeleteCompletedTasks}
                  onAddAllToToday={handleAddAllGoalTasksToToday}
                  loadingStates={{
                    taskComplete: loadingStates.taskComplete,
                    taskToday: loadingStates.taskToday,
                  }}
                />
              ))}
          </div>
        )}

        {/* Todos Container */}
        {!disabledFilters.has('todos') && (
          <TodosContainer
            tasks={filteredTasks}
            onToggleTaskComplete={handleToggleTaskComplete}
            onToggleTaskToday={handleToggleTaskToday}
            onEditTask={handleEditTask}
            onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
            onAddTask={handleAddStandaloneTask}
            onDeleteCompletedTasks={handleDeleteCompletedTasks}
            loadingStates={{
              taskComplete: loadingStates.taskComplete,
              taskToday: loadingStates.taskToday,
            }}
          />
        )}

        {/* Regular Goals - Render after todos */}
        {goals.filter(goal => !goal.isHabitGoal && !disabledFilters.has(goal.id)).length > 0 && (
          <div className="space-y-4 mb-8">
            {goals
              .filter(goal => !goal.isHabitGoal && !disabledFilters.has(goal.id))
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((goal) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  tasks={getTasksForGoal(goal.id)}
                  onEditGoal={handleEditGoal}
                  onDeleteGoal={(id) => deleteGoalMutation.mutate(id)}
                  onArchiveGoal={(id, archived) => archiveGoalMutation.mutate({ id, archived })}
                  onToggleTaskComplete={handleToggleTaskComplete}
                  onToggleTaskToday={handleToggleTaskToday}
                  onEditTask={handleEditTask}
                  onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
                  onAddTaskToGoal={handleAddTaskToGoal}
                  onDeleteCompletedTasks={handleDeleteCompletedTasks}
                  onAddAllToToday={handleAddAllGoalTasksToToday}
                  loadingStates={{
                    taskComplete: loadingStates.taskComplete,
                    taskToday: loadingStates.taskToday,
                  }}
                />
              ))}
          </div>
        )}

        {/* Countdowns Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Countdowns</h2>
              <span className="text-sm text-gray-500 dark:text-slate-400">({countdowns.length})</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
              onClick={() => {
                setEditingCountdown(null);
                setIsCountdownModalOpen(true);
              }}
              data-testid="button-add-countdown"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          {countdowns.length > 0 ? (
            <div className="space-y-2">
              {countdowns
                .sort((a, b) => {
                  const getNextOccurrence = (monthDay: string): Date => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const currentYear = today.getFullYear();
                    const parts = monthDay.split("-");
                    const month = parts.length === 2 ? parts[0] : parts.length === 3 ? parts[1] : "01";
                    const day = parts.length === 2 ? parts[1] : parts.length === 3 ? parts[2] : "01";
                    let targetDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
                    if (targetDate < today) {
                      targetDate = new Date(currentYear + 1, parseInt(month) - 1, parseInt(day));
                    }
                    return targetDate;
                  };
                  return getNextOccurrence(a.targetDate).getTime() - getNextOccurrence(b.targetDate).getTime();
                })
                .map((countdown) => (
                  <CountdownItem
                    key={countdown.id}
                    countdown={countdown}
                    onEdit={(c) => {
                      setEditingCountdown(c);
                      setIsCountdownModalOpen(true);
                    }}
                    onDelete={(id) => deleteCountdownMutation.mutate(id)}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-lg border border-dashed border-cyan-200 dark:border-cyan-800">
              <Timer className="w-8 h-8 text-cyan-300 dark:text-cyan-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-slate-400">No countdowns yet</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Track important dates and events</p>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredCount === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {totalCount === 0 ? "No items yet" : "No matching items"}
            </h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
              {totalCount === 0 
                ? "Create your first goal, task, or habit to get started."
                : "Try adjusting your filters to see more items."
              }
            </p>
            <Button onClick={() => {
              setEditingItem(null);
              setModalContextType("goal");
              setAddTaskToGoalId(null);
              setIsAddModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>
        )}
      </div>

      <AddItemModal
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setAddTaskToGoalId(null);
            setEditingItem(null);
            setModalContextType(null);
          }
        }}
        onCreateGoal={handleCreateGoal}
        onCreateTask={handleCreateTask}
        onCreateHabit={handleCreateHabit}
        onCreateTasksBulk={handleCreateTasksBulk}
        onCreateHabitsBulk={handleCreateHabitsBulk}
        onEditGoal={handleUpdateGoal}
        onEditTask={handleUpdateTask}
        onEditHabit={handleUpdateHabit}
        goals={goals}
        contextType={addTaskToGoalId ? "task" : modalContextType}
        contextGoalId={addTaskToGoalId}
        editingItem={editingItem}
      />

      <CountdownModal
        open={isCountdownModalOpen}
        onOpenChange={(open) => {
          setIsCountdownModalOpen(open);
          if (!open) {
            setEditingCountdown(null);
          }
        }}
        onSubmit={(data) => {
          if (editingCountdown) {
            updateCountdownMutation.mutate({ id: editingCountdown.id, data });
          } else {
            createCountdownMutation.mutate(data);
          }
        }}
        editingCountdown={editingCountdown}
      />
      </div>
    </DragDropContext>
  );
}
