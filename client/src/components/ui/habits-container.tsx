import { Habit } from "@shared/schema";
import { Button } from "./button";
import { HabitItem } from "./habit-item";
import { 
  ChevronRight, 
  Edit, 
  Trash2, 
  GripVertical, 
  Zap,
  Plus,
  Sun,
  CalendarPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DroppableList } from "@/lib/drag-drop";

interface HabitsContainerProps {
  habits: Habit[];
  onToggleHabitComplete: (id: string) => void;
  onToggleHabitToday: (id: string) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onAddHabit: () => void;
  onAddAllToToday?: () => void;
  dragHandleProps?: any;
  loadingStates?: {
    habitComplete: Set<string>;
    habitToday: Set<string>;
  };
}

export function HabitsContainer({
  habits,
  onToggleHabitComplete,
  onToggleHabitToday,
  onEditHabit,
  onDeleteHabit,
  onAddHabit,
  onAddAllToToday,
  dragHandleProps,
  loadingStates,
}: HabitsContainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasHabitsInToday = habits.some(habit => habit.isToday);

  return (
    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div {...dragHandleProps} className="cursor-move">
            <GripVertical className="w-4 h-4 text-gray-400 dark:text-slate-500" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronRight 
              className={cn(
                "w-4 h-4 text-gray-400 dark:text-slate-500 transform transition-transform duration-200",
                isExpanded && "rotate-90"
              )} 
            />
          </Button>
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">Habits</h3>
              {hasHabitsInToday && (
                <Sun className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Build positive daily routines
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">
              {habits.length} habit{habits.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
              {habits.length > 0 && onAddAllToToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-amber-600"
                  onClick={onAddAllToToday}
                  title="Add all habits to Today"
                >
                  <CalendarPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-purple-600"
                onClick={onAddHabit}
                title="Add new habit"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expandable Habits */}
      {isExpanded && (
        <div className="border-t border-purple-200 dark:border-purple-800 bg-purple-100/50 dark:bg-purple-900/30">
          <div className="p-4 space-y-3">
            {habits.length > 0 ? (
              <DroppableList
                items={habits}
                droppableId="habits-container"
                className="space-y-3"
              >
                {(habit, index, dragHandleProps) => (
                  <HabitItem
                    key={habit.id}
                    habit={habit}
                    onMarkComplete={onToggleHabitComplete}
                    onToggleToday={onToggleHabitToday}
                    onEdit={onEditHabit}
                    onDelete={onDeleteHabit}
                    dragHandleProps={dragHandleProps}
                    compact
                    isCompleteLoading={loadingStates?.habitComplete.has(habit.id) || false}
                    isTodayLoading={loadingStates?.habitToday.has(habit.id) || false}
                  />
                )}
              </DroppableList>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-slate-400 text-sm">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No habits yet</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-purple-600 hover:text-purple-700"
                  onClick={onAddHabit}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add your first habit
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}