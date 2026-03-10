import { useState } from "react";
import { Task } from "@shared/schema";
import { getGoalColorClasses } from "./add-item-modal";
import { Button } from "./button";
import { Badge } from "./badge";
import { 
  Calendar, 
  Edit, 
  Trash2, 
  GripVertical, 
  X, 
  CalendarPlus,
  Sun,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import ReactMarkdown from "react-markdown";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onToggleToday: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: any;
  showTodayAction?: boolean;
  compact?: boolean;
  isCompleteLoading?: boolean;
  isTodayLoading?: boolean;
  isOnTodayPage?: boolean;
  goalName?: string;
  goalColor?: string;
  isHabitGoal?: boolean;
}

export function TaskItem({
  task,
  onToggleComplete,
  onToggleToday,
  onEdit,
  onDelete,
  dragHandleProps,
  showTodayAction = true,
  compact = false,
  isCompleteLoading = false,
  isTodayLoading = false,
  isOnTodayPage = false,
  goalName,
  goalColor,
  isHabitGoal = false,
}: TaskItemProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  
  // For habit goals, use completedToday; for regular tasks, use completed
  const isCompleted = isHabitGoal ? task.completedToday : task.completed;
  // Determine the background color classes
  const getBackgroundClasses = () => {
    // Habit goals always use purple habit styling
    if (isHabitGoal) {
      return "bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800";
    }
    if (task.goalId && goalColor && isOnTodayPage) {
      // Use the goal's color for goal tasks on Today page
      const goalColorClasses = getGoalColorClasses(goalColor);
      return `${goalColorClasses.bg} border ${goalColorClasses.border}`;
    } else if (task.goalId) {
      // Default goal task styling for other pages
      return "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800";
    } else {
      // Regular task styling
      return "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800";
    }
  };

  const taskTitleElement = (
    <div className="flex-1 flex items-center gap-2">
      <span 
        className={cn(
          "font-medium",
          compact ? "text-xs" : "text-sm",
          // Habit goals don't show strikethrough (like habits), regular tasks do
          !isHabitGoal && isCompleted && "line-through text-gray-500 dark:text-slate-400"
        )}
      >
        {task.title}
      </span>
      {/* Show completion count for habit goals (like habits) */}
      {isHabitGoal && (task.completionCount || 0) > 0 && (
        <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
          {task.completionCount}
        </Badge>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <div className={cn(
        "rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200",
        getBackgroundClasses(),
        compact ? "p-3" : "p-4"
      )}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div {...dragHandleProps} className="cursor-move">
            <GripVertical className="w-4 h-4 text-gray-400 dark:text-slate-500" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-5 h-5 p-0 rounded-full border-2 hover:bg-transparent",
              isCompleted
                ? isHabitGoal
                  ? "bg-secondary border-secondary text-white"
                  : "bg-primary border-primary text-white"
                : isHabitGoal
                  ? "border-secondary hover:border-secondary hover:bg-secondary/20"
                  : "border-gray-300 dark:border-slate-500 hover:border-primary dark:hover:border-primary"
            )}
            onClick={() => onToggleComplete(task.id)}
            disabled={isCompleteLoading}
            data-testid={`button-complete-task-${task.id}`}
          >
            {isCompleteLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isCompleted ? (
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : null}
          </Button>
          {/* Show habit icon for habit goals */}
          {isHabitGoal && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-purple-200 dark:bg-purple-800/50">
              <RotateCcw className="w-3 h-3 text-purple-700 dark:text-purple-300" />
            </div>
          )}
          {task.goalId && goalName && isOnTodayPage && !isHabitGoal ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {taskTitleElement}
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                align="start"
                sideOffset={5}
                className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md"
              >
                <p>Goal: {goalName}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            taskTitleElement
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Notes expand/collapse toggle */}
          {task.notes && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-primary"
              onClick={() => setNotesExpanded(!notesExpanded)}
              title={notesExpanded ? "Collapse notes" : "Expand notes"}
              data-testid={`button-toggle-notes-${task.id}`}
            >
              {notesExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
          {showTodayAction && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-1 h-auto",
                task.isToday 
                  ? "text-amber-600 dark:text-amber-500 hover:text-amber-700" 
                  : "text-gray-400 dark:text-slate-500 hover:text-amber-600"
              )}
              onClick={() => onToggleToday(task.id)}
              title={task.isToday ? "Remove from Today" : "Add to Today"}
              disabled={isTodayLoading}
            >
              {isTodayLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-primary"
            onClick={() => onEdit(task)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-danger"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* Notes display with markdown - collapsible */}
      {task.notes && notesExpanded && (
        <div 
          className="mt-2 pl-12 prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-slate-300"
          onClick={(e) => e.stopPropagation()}
        >
          <ReactMarkdown
            components={{
              a: ({ href, children }) => {
                const isHttpLink = href && (href.startsWith('http://') || href.startsWith('https://'));
                return (
                  <a 
                    href={href}
                    target={isHttpLink ? "_blank" : undefined}
                    rel={isHttpLink ? "noopener noreferrer" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (href) {
                        if (isHttpLink) {
                          window.open(href, '_blank');
                        } else {
                          // For custom schemes like bear://, use location.assign
                          window.location.assign(href);
                        }
                      }
                    }}
                  >
                    {children}
                  </a>
                );
              }
            }}
          >
            {task.notes}
          </ReactMarkdown>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
