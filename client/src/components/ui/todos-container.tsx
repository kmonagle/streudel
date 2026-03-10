import { Task } from "@shared/schema";
import { Button } from "./button";
import { TaskItem } from "./task-item";
import { 
  ChevronRight, 
  Edit, 
  Trash2, 
  GripVertical, 
  CheckSquare,
  Plus,
  Sun,
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DroppableList } from "@/lib/drag-drop";

interface TodosContainerProps {
  tasks: Task[];
  onToggleTaskComplete: (id: string) => void;
  onToggleTaskToday: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: () => void;
  onDeleteCompletedTasks?: (goalId: string | null) => void;
  dragHandleProps?: any;
  loadingStates?: {
    taskComplete: Set<string>;
    taskToday: Set<string>;
  };
}

export function TodosContainer({
  tasks,
  onToggleTaskComplete,
  onToggleTaskToday,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onDeleteCompletedTasks,
  dragHandleProps,
  loadingStates,
}: TodosContainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasTasksInToday = tasks.some(task => task.isToday);

  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg shadow-sm border border-emerald-200 dark:border-emerald-800">
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
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">Todos</h3>
              {hasTasksInToday && (
                <Sun className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Standalone tasks to complete
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
              {tasks.some(task => task.completed) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-green-600"
                  onClick={() => onDeleteCompletedTasks && onDeleteCompletedTasks(null)}
                  title="Delete all completed tasks"
                  data-testid="button-delete-completed-todos"
                >
                  <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto text-gray-400 dark:text-slate-500 hover:text-emerald-600"
                onClick={onAddTask}
                title="Add new task"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expandable Tasks */}
      {isExpanded && (
        <div className="border-t border-emerald-200 dark:border-emerald-800 bg-emerald-100/50 dark:bg-emerald-900/30">
          <div className="p-4 space-y-3">
            {tasks.length > 0 ? (
              <DroppableList
                items={tasks}
                droppableId="todos-container"
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
                  />
                )}
              </DroppableList>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-slate-400 text-sm">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No todos yet</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-emerald-600 hover:text-emerald-700"
                  onClick={onAddTask}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add your first todo
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}