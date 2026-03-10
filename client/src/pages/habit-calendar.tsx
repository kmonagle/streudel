import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Habit, Task, Goal, HabitCompletion } from "@shared/schema";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, subMonths, addMonths, isSameDay, parseISO, startOfDay } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TimeRange = "1" | "3" | "6" | "12";

interface CalendarMonthProps {
  month: Date;
  completionDates: Set<string>;
  onDayClick?: (dateStr: string, hasCompletion: boolean) => void;
  isClickable: boolean;
}

function CalendarMonth({ month, completionDates, onDayClick, isClickable }: CalendarMonthProps) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  
  const startDayOfWeek = start.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);
  
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
        {format(month, "MMMM yyyy")}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-xs text-gray-400 dark:text-gray-500 py-1">
            {day}
          </div>
        ))}
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const hasCompletion = completionDates.has(dateStr);
          const isCurrentDay = isToday(day);
          
          return (
            <div
              key={dateStr}
              onClick={() => isClickable && onDayClick?.(dateStr, hasCompletion)}
              className={`aspect-square flex items-center justify-center text-xs rounded-full relative
                ${isCurrentDay ? "ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-800" : ""}
                ${hasCompletion ? "bg-green-500 text-white font-medium" : "text-gray-600 dark:text-gray-400"}
                ${isClickable ? "cursor-pointer hover:opacity-80 active:scale-95 transition-all" : ""}
              `}
              data-testid={`calendar-day-${dateStr}`}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HabitCalendar() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [timeRange, setTimeRange] = useState<TimeRange>("1");
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [viewOffset, setViewOffset] = useState(0);
  const { toast } = useToast();
  
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const habitParam = params.get("habit");
    const taskParam = params.get("task");
    if (habitParam) {
      setSelectedHabitId(habitParam);
    } else if (taskParam) {
      setSelectedTaskId(taskParam);
    }
  }, [searchString]);

  const addCompletionMutation = useMutation({
    mutationFn: async ({ completionDate, habitId, taskId }: { completionDate: string; habitId?: string; taskId?: string }) => {
      return apiRequest("POST", "/api/habit-completions", { completionDate, habitId, taskId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-completions"] });
    },
    onError: () => {
      toast({ title: "Failed to add completion", variant: "destructive" });
    },
  });

  const removeCompletionMutation = useMutation({
    mutationFn: async ({ completionDate, habitId, taskId }: { completionDate: string; habitId?: string; taskId?: string }) => {
      return apiRequest("DELETE", "/api/habit-completions", { completionDate, habitId, taskId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-completions"] });
    },
    onError: () => {
      toast({ title: "Failed to remove completion", variant: "destructive" });
    },
  });

  const handleDayClick = (dateStr: string, hasCompletion: boolean) => {
    if (!selectedHabitId && !selectedTaskId) return;
    
    if (hasCompletion) {
      removeCompletionMutation.mutate({
        completionDate: dateStr,
        habitId: selectedHabitId || undefined,
        taskId: selectedTaskId || undefined,
      });
    } else {
      addCompletionMutation.mutate({
        completionDate: dateStr,
        habitId: selectedHabitId || undefined,
        taskId: selectedTaskId || undefined,
      });
    }
  };

  const isClickable = !!(selectedHabitId || selectedTaskId);
  
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });
  
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });
  
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  const habitGoalTasks = useMemo(() => {
    const habitGoalIds = new Set(goals.filter(g => g.isHabitGoal).map(g => g.id));
    return tasks.filter(t => t.goalId && habitGoalIds.has(t.goalId));
  }, [goals, tasks]);
  
  const monthsToShow = parseInt(timeRange);
  const baseDate = useMemo(() => {
    let date = new Date();
    for (let i = 0; i < viewOffset; i++) {
      date = subMonths(date, monthsToShow);
    }
    return date;
  }, [viewOffset, monthsToShow]);
  
  const monthsArray = useMemo(() => {
    const months: Date[] = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      months.push(subMonths(baseDate, i));
    }
    return months;
  }, [baseDate, monthsToShow]);
  
  const dateRange = useMemo(() => {
    const startDate = format(startOfMonth(monthsArray[0]), "yyyy-MM-dd");
    const endDate = format(endOfMonth(monthsArray[monthsArray.length - 1]), "yyyy-MM-dd");
    return { startDate, endDate };
  }, [monthsArray]);
  
  const { data: completions = [] } = useQuery<HabitCompletion[]>({
    queryKey: ["/api/habit-completions", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await fetch(`/api/habit-completions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch completions");
      return response.json();
    },
  });
  
  const completionDates = useMemo(() => {
    const dates = new Set<string>();
    completions.forEach((c) => {
      if (selectedHabitId && c.habitId === selectedHabitId) {
        dates.add(c.completionDate);
      } else if (selectedTaskId && c.taskId === selectedTaskId) {
        dates.add(c.completionDate);
      } else if (!selectedHabitId && !selectedTaskId) {
        dates.add(c.completionDate);
      }
    });
    return dates;
  }, [completions, selectedHabitId, selectedTaskId]);
  
  const handleSelectionChange = (value: string) => {
    if (value === "all") {
      setSelectedHabitId("");
      setSelectedTaskId("");
    } else if (value.startsWith("habit-")) {
      setSelectedHabitId(value.replace("habit-", ""));
      setSelectedTaskId("");
    } else if (value.startsWith("task-")) {
      setSelectedTaskId(value.replace("task-", ""));
      setSelectedHabitId("");
    }
  };
  
  const currentValue = selectedHabitId ? `habit-${selectedHabitId}` : selectedTaskId ? `task-${selectedTaskId}` : "all";
  
  const completionCount = completionDates.size;
  const totalDays = monthsArray.reduce((sum, month) => {
    const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
    return sum + days.filter(d => d <= new Date()).length;
  }, 0);
  
  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/all-items")}
          className="p-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Habit Calendar</h1>
      </div>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
            Select Habit
          </label>
          <Select value={currentValue} onValueChange={handleSelectionChange}>
            <SelectTrigger data-testid="select-habit">
              <SelectValue placeholder="All habits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All habits</SelectItem>
              {habits.map((habit) => (
                <SelectItem key={habit.id} value={`habit-${habit.id}`}>
                  {habit.title}
                </SelectItem>
              ))}
              {habitGoalTasks.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs text-gray-500 font-medium">Habit Goal Tasks</div>
                  {habitGoalTasks.map((task) => (
                    <SelectItem key={task.id} value={`task-${task.id}`}>
                      {task.title}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">
            Time Range
          </label>
          <div className="flex gap-2">
            {(["1", "3", "6", "12"] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTimeRange(range);
                  setViewOffset(0);
                }}
                className="flex-1"
                data-testid={`button-range-${range}`}
              >
                {range === "1" ? "1M" : range === "3" ? "3M" : range === "6" ? "6M" : "1Y"}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewOffset(viewOffset + 1)}
            data-testid="button-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-500">{completionCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">days completed</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewOffset(Math.max(0, viewOffset - 1))}
            disabled={viewOffset === 0}
            data-testid="button-next"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        <div className={timeRange === "1" ? "" : "grid grid-cols-2 gap-4"}>
          {monthsArray.map((month) => (
            <CalendarMonth
              key={format(month, "yyyy-MM")}
              month={month}
              completionDates={completionDates}
              onDayClick={handleDayClick}
              isClickable={isClickable}
            />
          ))}
        </div>
        
        {!isClickable && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            Select a specific habit to add or remove completions
          </p>
        )}
      </div>
    </div>
  );
}
