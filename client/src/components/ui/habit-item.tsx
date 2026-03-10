import { useState } from "react";
import { useLocation } from "wouter";
import { Habit } from "@shared/schema";
import { Button } from "./button";
import { Badge } from "./badge";
import { 
  Edit, 
  Trash2, 
  GripVertical, 
  X, 
  CalendarPlus,
  CalendarDays,
  RotateCcw,
  Sun,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface HabitItemProps {
  habit: Habit;
  onMarkComplete: (id: string) => void;
  onToggleToday: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: any;
  showTodayAction?: boolean;
  compact?: boolean;
  isCompleteLoading?: boolean;
  isTodayLoading?: boolean;
}

export function HabitItem({
  habit,
  onMarkComplete,
  onToggleToday,
  onEdit,
  onDelete,
  dragHandleProps,
  showTodayAction = true,
  compact = false,
  isCompleteLoading = false,
  isTodayLoading = false,
}: HabitItemProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [, setLocation] = useLocation();
  
  return (
    <div className={cn(
      "bg-purple-50 dark:bg-purple-950/30 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow duration-200",
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
              habit.completedToday
                ? "bg-secondary border-secondary text-white"
                : "border-secondary hover:border-secondary hover:bg-secondary/20"
            )}
            onClick={() => onMarkComplete(habit.id)}
            disabled={isCompleteLoading}
          >
            {isCompleteLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : habit.completedToday ? (
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : null}
          </Button>
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-purple-200 dark:bg-purple-800/50">
            <RotateCcw className="w-3 h-3 text-purple-700 dark:text-purple-300" />
          </div>
          <div className="flex-1 flex items-center gap-2">
            <span 
              className={cn(
                "font-medium",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {habit.title}
            </span>
            {(habit.completionCount || 0) > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                {habit.completionCount}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notes expand/collapse toggle */}
          {habit.notes && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-primary"
              onClick={() => setNotesExpanded(!notesExpanded)}
              title={notesExpanded ? "Collapse notes" : "Expand notes"}
              data-testid={`button-toggle-notes-${habit.id}`}
            >
              {notesExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-primary"
            onClick={() => setLocation(`/habit-calendar?habit=${habit.id}`)}
            title="View completion calendar"
            data-testid={`button-calendar-${habit.id}`}
          >
            <CalendarDays className="w-4 h-4" />
          </Button>
          {showTodayAction && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-1 h-auto",
                habit.isToday 
                  ? "text-amber-600 dark:text-amber-500 hover:text-amber-700" 
                  : "text-gray-400 dark:text-slate-500 hover:text-amber-600"
              )}
              onClick={() => onToggleToday(habit.id)}
              title={habit.isToday ? "Remove from Today" : "Add to Today"}
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
            onClick={() => onEdit(habit)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-danger"
            onClick={() => onDelete(habit.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* Notes display with markdown - collapsible */}
      {habit.notes && notesExpanded && (
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
            {habit.notes}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
