import { Goal, Task } from "@shared/schema";
import { getGoalColorClasses } from "./add-item-modal";
import { Button } from "./button";
import { TaskItem } from "./task-item";
import { 
  ChevronRight, 
  Edit, 
  Trash2, 
  GripVertical, 
  Target,
  Plus,
  Sun,
  CheckCheck,
  Archive,
  ArchiveRestore
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DroppableList } from "@/lib/drag-drop";

interface GoalItemProps {
  goal: Goal;
  tasks: Task[];
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onArchiveGoal: (id: string, archived: boolean) => void;
  onToggleTaskComplete: (id: string) => void;
  onToggleTaskToday: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTaskToGoal: (goalId: string) => void;
  onDeleteCompletedTasks?: (goalId: string | null) => void;
  onAddAllToToday?: (goalId: string) => void;
  dragHandleProps?: any;
  loadingStates?: {
    taskComplete: Set<string>;
    taskToday: Set<string>;
  };
}

export function GoalItem({
  goal,
  tasks,
  onEditGoal,
  onDeleteGoal,
  onArchiveGoal,
  onToggleTaskComplete,
  onToggleTaskToday,
  onEditTask,
  onDeleteTask,
  onAddTaskToGoal,
  onDeleteCompletedTasks,
  onAddAllToToday,
  dragHandleProps,
  loadingStates,
}: GoalItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasTasksInToday = tasks.some(task => task.isToday);
  const colorClasses = getGoalColorClasses(goal.color || 'blue');

  return (
    <div className={cn("rounded-lg shadow-sm border", colorClasses.bg, colorClasses.border)}>
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
          <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{goal.title}</h3>
              {hasTasksInToday && (
                <Sun className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              )}
            </div>
            {goal.description && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {goal.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
              {/* Habit goals have simpler menu (like habits): Add task, Add all to Today, Edit, Delete */}
              {goal.isHabitGoal ? (
                <>
                  {tasks.some(task => !task.isToday) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-amber-600"
                      onClick={() => onAddAllToToday && onAddAllToToday(goal.id)}
                      title="Add all to Today"
                    >
                      <Sun className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-primary"
                    onClick={() => onAddTaskToGoal(goal.id)}
                    title="Add task to goal"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-primary"
                    onClick={() => onEditGoal(goal)}
                    title="Edit goal"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-danger"
                    onClick={() => onDeleteGoal(goal.id)}
                    title="Delete goal"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </>
              ) : (
                <>
                  {tasks.some(task => task.completed) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-green-600"
                      onClick={() => onDeleteCompletedTasks && onDeleteCompletedTasks(goal.id)}
                      title="Delete all completed tasks"
                      data-testid={`button-delete-completed-goal-${goal.id}`}
                    >
                      <CheckCheck className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-primary"
                    onClick={() => onAddTaskToGoal(goal.id)}
                    title="Add task to goal"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-primary"
                    onClick={() => onEditGoal(goal)}
                    title="Edit goal"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-amber-600"
                    onClick={() => onArchiveGoal(goal.id, !goal.archived)}
                    title={goal.archived ? "Unarchive goal" : "Archive goal"}
                    data-testid={`button-archive-goal-${goal.id}`}
                  >
                    {goal.archived ? (
                      <ArchiveRestore className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <Archive className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-danger"
                    onClick={() => onDeleteGoal(goal.id)}
                    title="Delete goal"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Expandable Tasks within Goal */}
      {isExpanded && (
        <div className="border-t border-blue-200 dark:border-blue-800 bg-blue-100/50 dark:bg-blue-900/30">
          <div className="p-4 space-y-3">
            {tasks.length > 0 ? (
              <DroppableList
                items={tasks}
                droppableId={`goal-tasks-${goal.id}`}
                className="space-y-3"
              >
                {(task, index, dragHandleProps) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleTaskComplete}
                    onToggleToday={onToggleTaskToday}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    dragHandleProps={dragHandleProps}
                    compact
                    isCompleteLoading={loadingStates?.taskComplete.has(task.id) || false}
                    isTodayLoading={loadingStates?.taskToday.has(task.id) || false}
                    isHabitGoal={goal.isHabitGoal}
                  />
                )}
              </DroppableList>
            ) : (
              <p className="text-xs text-gray-500 dark:text-slate-400 text-center py-2">
                No tasks in this goal yet
              </p>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
