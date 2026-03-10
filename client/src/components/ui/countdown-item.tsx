import { useState } from "react";
import { Countdown } from "@shared/schema";
import { Button } from "./button";
import { 
  Edit, 
  Trash2, 
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownItemProps {
  countdown: Countdown;
  onEdit: (countdown: Countdown) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

function getNextOccurrence(monthDay: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  
  const parts = monthDay.split("-");
  const month = parts.length === 2 ? parts[0] : parts.length === 3 ? parts[1] : "01";
  const day = parts.length === 2 ? parts[1] : parts.length === 3 ? parts[2] : "01";
  
  let targetDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
  targetDate.setHours(0, 0, 0, 0);
  
  if (targetDate < today) {
    targetDate = new Date(currentYear + 1, parseInt(month) - 1, parseInt(day));
    targetDate.setHours(0, 0, 0, 0);
  }
  
  return targetDate;
}

export function CountdownItem({
  countdown,
  onEdit,
  onDelete,
  compact = false,
}: CountdownItemProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = getNextOccurrence(countdown.targetDate);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isToday = diffDays === 0;
  
  const getDaysDisplay = () => {
    if (isToday) return "Today!";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };

  return (
    <div className={cn(
      "bg-cyan-50 dark:bg-cyan-950/30 rounded-lg shadow-sm border border-cyan-200 dark:border-cyan-800 hover:shadow-md transition-shadow duration-200",
      compact ? "p-3" : "p-4"
    )}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-cyan-200 dark:bg-cyan-800/50">
            <Timer className="w-3 h-3 text-cyan-700 dark:text-cyan-300" />
          </div>
          <div className="flex-1">
            <span 
              className={cn(
                "font-medium block",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {countdown.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              {targetDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric'
              })}
            </span>
          </div>
          <div className={cn(
            "text-right px-3 py-1 rounded-lg font-semibold",
            isToday ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" :
            "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300"
          )}>
            <span className={cn(compact ? "text-lg" : "text-xl")}>
              {getDaysDisplay()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-primary"
            onClick={() => onEdit(countdown)}
            data-testid={`button-edit-countdown-${countdown.id}`}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-danger"
            onClick={() => onDelete(countdown.id)}
            data-testid={`button-delete-countdown-${countdown.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
