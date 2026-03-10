import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Task, Habit, ReorderTodayItems, Goal, insertGoalSchema, insertTaskSchema, insertHabitSchema } from "@shared/schema";
import { TaskItem } from "@/components/ui/task-item";
import { HabitItem } from "@/components/ui/habit-item";
import { Button } from "@/components/ui/button";
import { TodayDragDropList } from "@/lib/drag-drop";
import { CalendarDays, ArrowRight, X, Plus, Filter, Target, CheckSquare, Play, Eye, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AddItemModal } from "@/components/ui/add-item-modal";
import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { z } from "zod";

type TodayItem = (Task & { type: 'task' }) | (Habit & { type: 'habit' });

export default function Today() {
  const { toast } = useToast();
  
  // State for modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: "task" | "habit";
    data: any;
  } | null>(null);

  // Simple filter state - only track what's DISABLED (everything else is shown)
  const [disabledFilters, setDisabledFilters] = useState<Set<string>>(new Set());
  
  // Execution mode state
  const [isExecutionMode, setIsExecutionMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [initialItemCount, setInitialItemCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);


  
  // Loading states
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

  // Timer effect for execution mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExecutionMode && currentItemId) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isExecutionMode, currentItemId]);

  const { data: todayData, isLoading } = useQuery<{ tasks: Task[]; habits: Habit[] }>({
    queryKey: ["/api/today"],
  });

  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/habits/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    },
  });

  const reorderTodayMutation = useMutation({
    mutationFn: async (data: ReorderTodayItems) => {
      return apiRequest("POST", "/api/today/reorder", data);
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["/api/today"] });
      const previousTodayData = queryClient.getQueryData(["/api/today"]);
      
      // Optimistically update today items order
      queryClient.setQueryData(["/api/today"], (old: { tasks: Task[]; habits: Habit[] } = { tasks: [], habits: [] }) => {
        const updatedTasks = [...old.tasks];
        const updatedHabits = [...old.habits];
        
        data.items.forEach((item) => {
          if (item.type === 'task') {
            const taskIndex = updatedTasks.findIndex(t => t.id === item.id);
            if (taskIndex !== -1) {
              updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], todaySortOrder: item.todaySortOrder };
            }
          } else if (item.type === 'habit') {
            const habitIndex = updatedHabits.findIndex(h => h.id === item.id);
            if (habitIndex !== -1) {
              updatedHabits[habitIndex] = { ...updatedHabits[habitIndex], todaySortOrder: item.todaySortOrder };
            }
          }
        });
        
        // Sort by new todaySortOrder
        updatedTasks.sort((a, b) => (a.todaySortOrder || 0) - (b.todaySortOrder || 0));
        updatedHabits.sort((a, b) => (a.todaySortOrder || 0) - (b.todaySortOrder || 0));
        
        return { tasks: updatedTasks, habits: updatedHabits };
      });
      
      return { previousTodayData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["/api/today"], context?.previousTodayData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    },
  });

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

  const createTasksBulkMutation = useMutation({
    mutationFn: async (tasksData: z.infer<typeof insertTaskSchema>[]) => {
      const requests = tasksData.map((taskData, index) => 
        apiRequest("POST", "/api/tasks", {
          ...taskData,
          sortOrder: index,
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
      const requests = habitsData.map((habitData, index) => 
        apiRequest("POST", "/api/habits", {
          ...habitData,
          sortOrder: index,
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

  const handleToggleTaskComplete = (id: string) => {
    const task = todayData?.tasks.find((t: Task) => t.id === id);
    if (task) {
      // Check if task belongs to a habit goal
      const goal = task.goalId ? goals?.find(g => g.id === task.goalId) : null;
      const isHabitGoal = goal?.isHabitGoal || false;
      
      setLoadingStates(prev => ({
        ...prev,
        taskComplete: new Set([...Array.from(prev.taskComplete), id])
      }));
      
      // For habit goals, toggle completedToday; for regular tasks, toggle completed
      const updateData = isHabitGoal 
        ? { completedToday: !task.completedToday }
        : { completed: !task.completed };
      
      updateTaskMutation.mutate({
        id,
        data: updateData,
      }, {
        onSuccess: () => {
          // In execution mode, advance to next item when completing
          const wasNotCompleted = isHabitGoal ? !task.completedToday : !task.completed;
          if (isExecutionMode && wasNotCompleted) {
            advanceToNextItem();
          }
        },
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
    const habit = todayData?.habits.find((h: Habit) => h.id === id);
    if (habit) {
      setLoadingStates(prev => ({
        ...prev,
        habitComplete: new Set([...Array.from(prev.habitComplete), id])
      }));
      updateHabitMutation.mutate({
        id,
        data: { completedToday: !habit.completedToday },
      }, {
        onSuccess: () => {
          // In execution mode, advance to next item when completing
          if (isExecutionMode && !habit.completedToday) {
            advanceToNextItem();
          }
        },
        onSettled: () => {
          setLoadingStates(prev => ({
            ...prev,
            habitComplete: new Set(Array.from(prev.habitComplete).filter(loadingId => loadingId !== id))
          }));
        }
      });
    }
  };

  const handleRemoveFromToday = (id: string, type: 'task' | 'habit') => {
    if (type === 'task') {
      setLoadingStates(prev => ({
        ...prev,
        taskToday: new Set([...Array.from(prev.taskToday), id])
      }));
      updateTaskMutation.mutate({
        id,
        data: { isToday: false },
      }, {
        onSettled: () => {
          setLoadingStates(prev => ({
            ...prev,
            taskToday: new Set(Array.from(prev.taskToday).filter(loadingId => loadingId !== id))
          }));
        }
      });
    } else {
      setLoadingStates(prev => ({
        ...prev,
        habitToday: new Set([...Array.from(prev.habitToday), id])
      }));
      updateHabitMutation.mutate({
        id,
        data: { isToday: false },
      }, {
        onSettled: () => {
          setLoadingStates(prev => ({
            ...prev,
            habitToday: new Set(Array.from(prev.habitToday).filter(loadingId => loadingId !== id))
          }));
        }
      });
    }
    toast({
      title: "Removed from Today",
      description: `${type} removed from your today list.`,
    });
  };

  const handleReorderTodayItems = (items: TodayItem[]) => {
    const reorderData: ReorderTodayItems = {
      items: items.map((item, index) => ({
        id: item.id,
        type: item.type,
        todaySortOrder: index,
      })),
    };
    reorderTodayMutation.mutate(reorderData);
  };

  // Edit handlers
  const handleEditTask = (task: Task) => {
    setEditingItem({ type: "task", data: task });
    setIsEditModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingItem({ type: "habit", data: habit });
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = (id: string, data: any) => {
    updateTaskMutation.mutate({ id, data });
  };

  const handleUpdateHabit = (id: string, data: any) => {
    updateHabitMutation.mutate({ id, data });
  };



  const handleCreateGoal = (data: z.infer<typeof insertGoalSchema>) => {
    createGoalMutation.mutate(data);
  };

  const handleCreateTask = (data: z.infer<typeof insertTaskSchema>) => {
    createTaskMutation.mutate(data);
  };

  const handleCreateHabit = (data: z.infer<typeof insertHabitSchema>) => {
    createHabitMutation.mutate(data);
  };

  const handleCreateTasksBulk = (tasksData: z.infer<typeof insertTaskSchema>[]) => {
    createTasksBulkMutation.mutate(tasksData);
  };

  const handleCreateHabitsBulk = (habitsData: z.infer<typeof insertHabitSchema>[]) => {
    createHabitsBulkMutation.mutate(habitsData);
  };

  // Clear all items from Today
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const updates = [];
      // Remove all tasks from today
      for (const task of todayTasks) {
        updates.push(apiRequest("PATCH", `/api/tasks/${task.id}`, { isToday: false }));
      }
      // Remove all habits from today
      for (const habit of todayHabits) {
        updates.push(apiRequest("PATCH", `/api/habits/${habit.id}`, { isToday: false }));
      }
      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Cleared Today",
        description: "All items removed from your today list.",
      });
    },
  });

  const handleClearAll = () => {
    if (allTodayItems.length > 0) {
      clearAllMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-200 dark:bg-slate-600 rounded"></div>
              <div className="w-5 h-5 bg-gray-200 dark:bg-slate-600 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const todayTasks: Task[] = todayData?.tasks || [];
  const todayHabits: Habit[] = todayData?.habits || [];

  // Combine and sort by todaySortOrder
  const allTodayItems: TodayItem[] = [
    ...todayTasks.map(task => ({ ...task, type: 'task' as const })),
    ...todayHabits.map(habit => ({ ...habit, type: 'habit' as const })),
  ].sort((a, b) => (a.todaySortOrder || 0) - (b.todaySortOrder || 0));

  // Simple filtering - just check if item type is NOT in disabled set
  const filteredItems = allTodayItems.filter(item => {
    if (item.type === 'habit') return !disabledFilters.has('habits');
    if (item.type === 'task' && !item.goalId) return !disabledFilters.has('todos');
    if (item.type === 'task' && item.goalId) return !disabledFilters.has(item.goalId);
    return true;
  });

  const totalCount = allTodayItems.length;
  const filteredCount = filteredItems.length;

  // Get filter categories for display
  const filterCategories: { id: string; name: string; count: number }[] = [];
  if (todayHabits.length > 0) {
    filterCategories.push({ id: 'habits', name: 'Habits', count: todayHabits.length });
  }
  const standaloneTasksCount = todayTasks.filter(t => !t.goalId).length;
  if (standaloneTasksCount > 0) {
    filterCategories.push({ id: 'todos', name: 'Todos', count: standaloneTasksCount });
  }
  
  // Add goal categories
  const goalCounts = new Map<string, { name: string; count: number }>();
  todayTasks.forEach(task => {
    if (task.goalId) {
      const goal = goals?.find(g => g.id === task.goalId);
      const existing = goalCounts.get(task.goalId) || { name: goal?.title || 'Unknown Goal', count: 0 };
      goalCounts.set(task.goalId, { ...existing, count: existing.count + 1 });
    }
  });
  
  goalCounts.forEach((data, goalId) => {
    filterCategories.push({ id: goalId, name: data.name, count: data.count });
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

  // Execution mode functions
  const incompleteItems = filteredItems.filter(item => {
    if (item.type === 'task') return !item.completed;
    if (item.type === 'habit') return !item.completedToday;
    return true;
  });

  // Use the original filtered items for execution mode to maintain consistent indexing
  const executionItems = filteredItems;

  // Find current item by ID
  const currentItemIndex = currentItemId ? executionItems.findIndex(item => item.id === currentItemId) : -1;
  const currentItem = currentItemIndex >= 0 ? executionItems[currentItemIndex] : null;
  const currentItemIncompleteCount = incompleteItems.length;
  
  // Cache button states to prevent flickering
  const canGoPrevious = (() => {
    if (!currentItemId || currentItemIndex <= 0) return false;
    
    for (let i = currentItemIndex - 1; i >= 0; i--) {
      const item = executionItems[i];
      const isIncomplete = item.type === 'task' ? !item.completed : !item.completedToday;
      if (isIncomplete) return true;
    }
    return false;
  })();

  const canGoNext = (() => {
    if (!currentItemId || currentItemIndex === -1) return false;
    
    for (let i = currentItemIndex + 1; i < executionItems.length; i++) {
      const item = executionItems[i];
      const isIncomplete = item.type === 'task' ? !item.completed : !item.completedToday;
      if (isIncomplete) return true;
    }
    return false;
  })();

  const advanceToNextItem = () => {
    setTimeout(() => {
      if (!currentItemId) return;
      
      // Find current item index
      const currentIndex = executionItems.findIndex(item => item.id === currentItemId);
      if (currentIndex === -1) return;
      
      // Find the next incomplete item
      let nextIndex = currentIndex + 1;
      while (nextIndex < executionItems.length) {
        const item = executionItems[nextIndex];
        const isIncomplete = item.type === 'task' ? !item.completed : !item.completedToday;
        if (isIncomplete) {
          setCurrentItemId(item.id);
          setTimerSeconds(0); // Reset timer for auto-advance
          return;
        }
        nextIndex++;
      }
      
      // No more incomplete items, exit execution mode
      setIsExecutionMode(false);
      setCurrentItemId(null);
      setInitialItemCount(0);
      setTimerSeconds(0);
      toast({
        title: "🎉 All done!",
        description: "You've completed all your today items. Great work!",
      });
    }, 800); // Longer delay for smoother transition
  };

  const enterExecutionMode = () => {
    if (incompleteItems.length === 0) {
      toast({
        title: "No items to execute",
        description: "All your today items are already completed!",
      });
      return;
    }
    
    // Store the initial count for progress calculation
    setInitialItemCount(executionItems.length);
    
    // Find the first incomplete item
    let firstIncompleteIndex = 0;
    while (firstIncompleteIndex < executionItems.length) {
      const item = executionItems[firstIncompleteIndex];
      const isIncomplete = item.type === 'task' ? !item.completed : !item.completedToday;
      if (isIncomplete) {
        setIsExecutionMode(true);
        setCurrentItemId(item.id);
        setTimerSeconds(0); // Reset timer for first item
        return;
      }
      firstIncompleteIndex++;
    }
  };

  const exitExecutionMode = () => {
    setIsExecutionMode(false);
    setCurrentItemId(null);
    setInitialItemCount(0);
    setTimerSeconds(0);
  };

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const goToPreviousItem = () => {
    if (!currentItemId) return;
    
    const currentIndex = executionItems.findIndex(item => item.id === currentItemId);
    if (currentIndex === -1) return;
    
    // Find the previous incomplete item
    let prevIndex = currentIndex - 1;
    while (prevIndex >= 0) {
      const item = executionItems[prevIndex];
      const isIncomplete = item.type === 'task' ? !item.completed : !item.completedToday;
      if (isIncomplete) {
        setCurrentItemId(item.id);
        setTimerSeconds(0); // Reset timer for new item
        return;
      }
      prevIndex--;
    }
  };

  const goToNextItem = () => {
    if (!currentItemId) return;
    
    const currentIndex = executionItems.findIndex(item => item.id === currentItemId);
    if (currentIndex === -1) return;
    
    // Find the next incomplete item
    let nextIndex = currentIndex + 1;
    while (nextIndex < executionItems.length) {
      const item = executionItems[nextIndex];
      const isIncomplete = item.type === 'task' ? !item.completed : !item.completedToday;
      if (isIncomplete) {
        setCurrentItemId(item.id);
        setTimerSeconds(0); // Reset timer for new item
        return;
      }
      nextIndex++;
    }
  };





  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">Today</h2>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {filteredCount} of {totalCount} item{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!isExecutionMode && incompleteItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={enterExecutionMode}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2"
              title="Execute Mode"
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
          {!isExecutionMode && totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={clearAllMutation.isPending}
              className="text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 p-2"
              title="Clear Today"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          {!isExecutionMode && (
            <Button
              onClick={() => {
                setEditingItem(null);
                setIsAddModalOpen(true);
              }}
              size="sm"
              className="bg-primary text-white hover:bg-blue-600 p-2"
              title="Add new item"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Simple Filter UI */}
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

      {isExecutionMode ? (
        // Execution Mode UI
        <div className="max-w-2xl mx-auto">
          {/* Execution Mode Header */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exitExecutionMode}
                  className="text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Exit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousItem}
                  disabled={!canGoPrevious}
                  className="p-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">Execution Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextItem}
                  disabled={!canGoNext}
                  className="p-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  {currentItemIncompleteCount} remaining
                </div>
              </div>
            </div>
            
            {/* Timer display */}
            <div className="text-center mb-2">
              <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                {formatTimer(timerSeconds)}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ 
                  width: `${initialItemCount > 0 ? ((initialItemCount - currentItemIncompleteCount) / initialItemCount) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Current Item */}
          {currentItem && (
            <div className="mb-8 transition-all duration-500 ease-in-out transform" key={currentItem.id}>
              {currentItem.type === 'task' ? (
                (() => {
                  const goal = currentItem.goalId 
                    ? goals?.find(goal => goal.id === currentItem.goalId)
                    : undefined;
                  const goalName = goal?.title;
                  const goalColor = goal?.color;
                  
                  return (
                    <div className="animate-in slide-in-from-right-10 fade-in duration-500">
                      <TaskItem
                        task={currentItem}
                        onToggleComplete={handleToggleTaskComplete}
                        onToggleToday={(id) => handleRemoveFromToday(id, 'task')}
                        onEdit={handleEditTask}
                        onDelete={() => {}}
                        showTodayAction={false}
                        compact={false}
                        isCompleteLoading={loadingStates.taskComplete.has(currentItem.id)}
                        isTodayLoading={loadingStates.taskToday.has(currentItem.id)}
                        isOnTodayPage={true}
                        goalName={goalName}
                        goalColor={goalColor || undefined}
                        isHabitGoal={goal?.isHabitGoal || false}
                      />
                    </div>
                  );
                })()
              ) : (
                <div className="animate-in slide-in-from-right-10 fade-in duration-500">
                  <HabitItem
                    habit={currentItem}
                    onMarkComplete={handleToggleHabitComplete}
                    onToggleToday={(id) => handleRemoveFromToday(id, 'habit')}
                    onEdit={handleEditHabit}
                    onDelete={() => {}}
                    showTodayAction={false}
                    compact={false}
                    isCompleteLoading={loadingStates.habitComplete.has(currentItem.id)}
                    isTodayLoading={loadingStates.habitToday.has(currentItem.id)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Optional: Show keyboard shortcuts hint */}
          <div className="flex items-center justify-center">
            <div className="text-xs text-gray-400 dark:text-slate-500">
              Use arrow buttons above or complete item to advance
            </div>
          </div>
        </div>
      ) : filteredItems.length > 0 ? (
        // Normal List View
        <TodayDragDropList
          items={filteredItems}
          onReorder={handleReorderTodayItems}
          droppableId="today-items"
          className="space-y-3"
        >
          {(item, index, dragHandleProps) => {
            // Find goal name and color for tasks that belong to a goal
            const goal = item.type === 'task' && item.goalId 
              ? goals?.find(goal => goal.id === item.goalId)
              : undefined;
            const goalName = goal?.title;
            const goalColor = goal?.color;
            
            return item.type === 'task' ? (
              <TaskItem
                key={item.id}
                task={item}
                onToggleComplete={handleToggleTaskComplete}
                onToggleToday={(id) => handleRemoveFromToday(id, 'task')}
                onEdit={handleEditTask}
                onDelete={() => {}}
                dragHandleProps={dragHandleProps}
                showTodayAction={true}
                compact={true}
                isCompleteLoading={loadingStates.taskComplete.has(item.id)}
                isTodayLoading={loadingStates.taskToday.has(item.id)}
                isOnTodayPage={true}
                goalName={goalName}
                goalColor={goalColor || undefined}
                isHabitGoal={goal?.isHabitGoal || false}
              />
            ) : (
              <HabitItem
                key={item.id}
                habit={item}
                onMarkComplete={handleToggleHabitComplete}
                onToggleToday={(id) => handleRemoveFromToday(id, 'habit')}
                onEdit={handleEditHabit}
                onDelete={() => {}}
                dragHandleProps={dragHandleProps}
                showTodayAction={true}
                compact={true}
                isCompleteLoading={loadingStates.habitComplete.has(item.id)}
                isTodayLoading={loadingStates.habitToday.has(item.id)}
              />
            );
          }}
        </TodayDragDropList>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-6 h-6 text-gray-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {totalCount === 0 ? "No items for today" : "No matching items"}
          </h3>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
            {totalCount === 0 
              ? "Add some tasks and habits to get started with your day!"
              : "Try adjusting your filters to see more items."
            }
          </p>
          {(totalCount === 0 || filteredCount === 0) && (
            <Link href="/all-items">
              <Button variant="ghost" className="text-primary hover:text-blue-600">
                Browse all items <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      )}

      <AddItemModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setEditingItem(null);
          }
        }}
        onCreateGoal={handleCreateGoal}
        onCreateTask={handleCreateTask}
        onCreateHabit={handleCreateHabit}
        onCreateTasksBulk={handleCreateTasksBulk}
        onCreateHabitsBulk={handleCreateHabitsBulk}
        onEditTask={handleUpdateTask}
        onEditHabit={handleUpdateHabit}
        goals={goals || []}
        editingItem={editingItem}
      />

      <AddItemModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onCreateGoal={handleCreateGoal}
        onCreateTask={handleCreateTask}
        onCreateHabit={handleCreateHabit}
        onCreateTasksBulk={handleCreateTasksBulk}
        onCreateHabitsBulk={handleCreateHabitsBulk}
        goals={goals || []}
      />
    </div>
  );
}
