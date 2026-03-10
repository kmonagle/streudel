import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Checkbox } from "./checkbox";
import { Switch } from "./switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "./form";
import { insertGoalSchema, insertTaskSchema, insertHabitSchema, Goal } from "@shared/schema";
import { Target, CheckSquare, RotateCcw, List, Plus, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { z } from "zod";

type ItemType = "goal" | "task" | "habit";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGoal: (data: z.infer<typeof insertGoalSchema>) => void;
  onCreateTask: (data: z.infer<typeof insertTaskSchema>) => void;
  onCreateHabit: (data: z.infer<typeof insertHabitSchema>) => void;
  onCreateTasksBulk?: (data: z.infer<typeof insertTaskSchema>[]) => void;
  onCreateHabitsBulk?: (data: z.infer<typeof insertHabitSchema>[]) => void;
  onEditGoal?: (id: string, data: any) => void;
  onEditTask?: (id: string, data: any) => void;
  onEditHabit?: (id: string, data: any) => void;
  goals: Goal[];
  contextType?: ItemType | null; // When set, only allow this type
  contextGoalId?: string | null; // When adding task from within a goal
  editingItem?: {
    type: ItemType;
    data: any;
  } | null;
}

const createItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("goal"),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    color: z.string().default("blue"),
    isHabitGoal: z.boolean().default(false),
    addToToday: z.boolean().default(false),
  }),
  z.object({
    type: z.literal("task"),
    title: z.string().min(1, "Title is required"),
    notes: z.string().nullable().optional(),
    goalId: z.string().nullable().optional(),
    isToday: z.boolean().default(false),
  }),
  z.object({
    type: z.literal("habit"),
    title: z.string().min(1, "Title is required"),
    notes: z.string().nullable().optional(),
    isToday: z.boolean().default(false),
  }),
]);

// Expanded color palette for goals - 21 subtle background colors
const GOAL_COLORS = [
  // Blues and Cyans
  { name: 'blue', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', preview: 'bg-blue-100 dark:bg-blue-900' },
  { name: 'sky', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800', preview: 'bg-sky-100 dark:bg-sky-900' },
  { name: 'cyan', bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', preview: 'bg-cyan-100 dark:bg-cyan-900' },
  { name: 'teal', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', preview: 'bg-teal-100 dark:bg-teal-900' },
  { name: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', preview: 'bg-emerald-100 dark:bg-emerald-900' },
  { name: 'green', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', preview: 'bg-green-100 dark:bg-green-900' },
  { name: 'lime', bg: 'bg-lime-50 dark:bg-lime-950/30', border: 'border-lime-200 dark:border-lime-800', preview: 'bg-lime-100 dark:bg-lime-900' },
  
  // Yellows and Oranges
  { name: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', preview: 'bg-yellow-100 dark:bg-yellow-900' },
  { name: 'amber', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', preview: 'bg-amber-100 dark:bg-amber-900' },
  { name: 'orange', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', preview: 'bg-orange-100 dark:bg-orange-900' },
  { name: 'red', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', preview: 'bg-red-100 dark:bg-red-900' },
  { name: 'rose', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', preview: 'bg-rose-100 dark:bg-rose-900' },
  { name: 'pink', bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-800', preview: 'bg-pink-100 dark:bg-pink-900' },
  { name: 'fuchsia', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30', border: 'border-fuchsia-200 dark:border-fuchsia-800', preview: 'bg-fuchsia-100 dark:bg-fuchsia-900' },
  
  // Purples and Neutrals
  { name: 'purple', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', preview: 'bg-purple-100 dark:bg-purple-900' },
  { name: 'violet', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', preview: 'bg-violet-100 dark:bg-violet-900' },
  { name: 'indigo', bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800', preview: 'bg-indigo-100 dark:bg-indigo-900' },
  { name: 'slate', bg: 'bg-slate-50 dark:bg-slate-950/30', border: 'border-slate-200 dark:border-slate-800', preview: 'bg-slate-100 dark:bg-slate-900' },
  { name: 'gray', bg: 'bg-gray-50 dark:bg-gray-950/30', border: 'border-gray-200 dark:border-gray-800', preview: 'bg-gray-100 dark:bg-gray-900' },
  { name: 'zinc', bg: 'bg-zinc-50 dark:bg-zinc-950/30', border: 'border-zinc-200 dark:border-zinc-800', preview: 'bg-zinc-100 dark:bg-zinc-900' },
  { name: 'stone', bg: 'bg-stone-50 dark:bg-stone-950/30', border: 'border-stone-200 dark:border-stone-800', preview: 'bg-stone-100 dark:bg-stone-900' },
];

// Helper function to get color classes
export function getGoalColorClasses(color: string = 'blue') {
  const colorData = GOAL_COLORS.find(c => c.name === color) || GOAL_COLORS[0];
  return colorData;
}

export function AddItemModal({
  open,
  onOpenChange,
  onCreateGoal,
  onCreateTask,
  onCreateHabit,
  onCreateTasksBulk,
  onCreateHabitsBulk,
  onEditGoal,
  onEditTask,
  onEditHabit,
  goals,
  contextType,
  contextGoalId,
  editingItem,
}: AddItemModalProps) {
  const [selectedType, setSelectedType] = useState<ItemType>(contextType || editingItem?.type || "task");
  const [inputMode, setInputMode] = useState<"single" | "bulk">("single");
  const [bulkText, setBulkText] = useState("");
  const [bulkAddToToday, setBulkAddToToday] = useState(false);
  const [bulkGoalId, setBulkGoalId] = useState<string | null>(null);
  const isEditing = !!editingItem;

  const form = useForm({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      type: editingItem?.type || contextType || "task" as ItemType,
      title: editingItem?.data?.title || "",
      notes: editingItem?.data?.notes || "",
      description: editingItem?.data?.description || "",
      color: editingItem?.data?.color || "blue",
      isHabitGoal: editingItem?.data?.isHabitGoal || false,
      goalId: editingItem?.data?.goalId || "",
      addToToday: false,
      isToday: editingItem?.data?.isToday || false,
    },
  });

  useEffect(() => {
    if (editingItem && editingItem.data) {
      form.reset({
        type: editingItem.type,
        title: editingItem.data.title || "",
        notes: editingItem.data.notes || "",
        description: editingItem.data.description || "",
        color: editingItem.data.color || "blue",
        isHabitGoal: editingItem.data.isHabitGoal || false,
        goalId: editingItem.data.goalId || "",
        addToToday: false,
        isToday: editingItem.data.isToday || false,
      });
      setSelectedType(editingItem.type);
    } else {
      form.reset({
        type: contextType || "task",
        title: "",
        notes: "",
        description: "",
        color: "blue",
        isHabitGoal: false,
        goalId: "",
        addToToday: false,
        isToday: false,
      });
      setSelectedType(contextType || "task");
    }
  }, [editingItem, contextType, form]);

  const itemTypes = [
    {
      type: "goal" as const,
      label: "Goal",
      icon: Target,
      description: "A container for multiple tasks",
    },
    {
      type: "task" as const,
      label: "Task",
      icon: CheckSquare,
      description: "A single actionable item",
    },
    {
      type: "habit" as const,
      label: "Habit",
      icon: RotateCcw,
      description: "A recurring behavior to track",
    },
  ];

  const handleSubmit = form.handleSubmit((data) => {
    if (isEditing && editingItem) {
      // Handle editing
      if (data.type === "goal" && onEditGoal) {
        onEditGoal(editingItem.data.id, {
          title: data.title,
          description: data.description,
          color: data.color,
          isHabitGoal: data.isHabitGoal,
        });
      } else if (data.type === "task" && onEditTask) {
        onEditTask(editingItem.data.id, {
          title: data.title,
          notes: data.notes || null,
          goalId: data.goalId === "none" ? null : data.goalId || null,
          isToday: data.isToday,
        });
      } else if (data.type === "habit" && onEditHabit) {
        onEditHabit(editingItem.data.id, {
          title: data.title,
          notes: data.notes || null,
          isToday: data.isToday,
        });
      }
    } else {
      // Handle creation
      if (data.type === "goal") {
        onCreateGoal({
          title: data.title,
          description: data.description,
          color: data.color,
          isHabitGoal: data.isHabitGoal,
        });
      } else if (data.type === "task") {
        onCreateTask({
          title: data.title,
          notes: data.notes || null,
          goalId: contextGoalId || (data.goalId === "none" ? null : data.goalId || null),
          isToday: data.isToday,
        });
      } else if (data.type === "habit") {
        onCreateHabit({
          title: data.title,
          notes: data.notes || null,
          isToday: data.isToday,
        });
      }
    }
    
    form.reset();
    onOpenChange(false);
  });

  const handleBulkSubmit = () => {
    if (!bulkText.trim()) return;
    
    const lines = bulkText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return;

    if (selectedType === "task" && onCreateTasksBulk) {
      const tasks = lines.map(title => ({
        title,
        goalId: contextGoalId || bulkGoalId,
        isToday: bulkAddToToday,
      }));
      onCreateTasksBulk(tasks);
    } else if (selectedType === "habit" && onCreateHabitsBulk) {
      const habits = lines.map(title => ({ title, isToday: bulkAddToToday }));
      onCreateHabitsBulk(habits);
    }

    setBulkText("");
    setBulkAddToToday(false);
    setBulkGoalId(null);
    setInputMode("single");
    onOpenChange(false);
  };

  const handleTypeSelect = (type: ItemType) => {
    setSelectedType(type);
    form.setValue("type", type);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>

        {/* Item Type Selection - only show if no context type and not editing */}
        {!contextType && !isEditing && (
          <div>
            <Label className="text-sm font-medium mb-3 block">Item Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {itemTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === item.type;
                
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleTypeSelect(item.type)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-colors text-center",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 dark:border-slate-600 hover:border-primary"
                    )}
                  >
                    <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <span className="text-sm font-medium block">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Show goal context info when adding to specific goal */}
        {selectedType === "task" && contextGoalId && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Adding to goal: {goals.find(g => g.id === contextGoalId)?.title}
              </span>
            </div>
          </div>
        )}

        {/* Input Mode Selection for tasks and habits when not editing */}
        {!isEditing && (selectedType === "task" || selectedType === "habit") && (
          <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as "single" | "bulk")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Single
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Bulk
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-4 mt-4">
              <Form {...form}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder={`Enter ${selectedType} title...`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes field for tasks and habits */}
                  {(selectedType === "task" || selectedType === "habit") && (
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional - supports Markdown)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add notes, details, or links..."
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Goal Selection for Tasks */}
                  {selectedType === "task" && !contextGoalId && (
                    <FormField
                      control={form.control}
                      name="goalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal (Optional)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                            defaultValue={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-goal">
                                <SelectValue placeholder="Select a goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No goal</SelectItem>
                              {goals.map((goal) => (
                                <SelectItem key={goal.id} value={goal.id}>
                                  {goal.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="isToday"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Add to Today</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Create {selectedType}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="bulk" className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-medium">Enter multiple {selectedType}s (one per line)</Label>
                <Textarea
                  placeholder={`Enter each ${selectedType} on a new line...\nExample:\nFirst ${selectedType}\nSecond ${selectedType}\nThird ${selectedType}`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="min-h-[120px] mt-2"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Each line will create a separate {selectedType}. They will appear in the order you enter them.
                </p>
              </div>

              {/* Goal Selection for Bulk Tasks */}
              {selectedType === "task" && !contextGoalId && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Goal (Optional)</Label>
                  <Select 
                    onValueChange={(value) => setBulkGoalId(value === "none" ? null : value)} 
                    defaultValue={bulkGoalId || "none"}
                  >
                    <SelectTrigger data-testid="select-bulk-goal">
                      <SelectValue placeholder="Select a goal for all tasks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No goal</SelectItem>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  id="bulk-today"
                  checked={bulkAddToToday}
                  onCheckedChange={(checked) => setBulkAddToToday(checked as boolean)}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="bulk-today" className="text-sm">Add all to Today</Label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  className="flex-1"
                  onClick={handleBulkSubmit}
                  disabled={!bulkText.trim()}
                >
                  Create {bulkText.split('\n').filter(line => line.trim()).length} {selectedType}s
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Single form for goals or when editing */}
        {(isEditing || selectedType === "goal") && (
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder={`Enter ${selectedType} title...`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedType === "goal" && (
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Goal description..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedType === "goal" && (
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Color Theme
                      </FormLabel>
                      <div className="grid grid-cols-7 gap-1.5">
                        {GOAL_COLORS.map((color) => {
                          const isSelected = field.value === color.name;
                          return (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => field.onChange(color.name)}
                              className={cn(
                                "w-8 h-8 rounded-md border-2 transition-all",
                                color.preview,
                                isSelected 
                                  ? "border-primary ring-2 ring-primary/20 scale-110" 
                                  : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                              )}
                              title={color.name}
                            />
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedType === "goal" && (
                <FormField
                  control={form.control}
                  name="isHabitGoal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Habit Goal</FormLabel>
                        <FormDescription className="text-xs">
                          Tasks in this goal will work like habits with daily resets
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-habit-goal"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {/* Notes field for editing tasks and habits */}
              {(selectedType === "task" || selectedType === "habit") && isEditing && (
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional - supports Markdown)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes, details, or links..."
                          rows={3}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedType === "task" && (
                <FormField
                  control={form.control}
                  name="goalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal (Optional)</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? null : value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a goal or leave blank for regular task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No goal (regular task)</SelectItem>
                          {goals.map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(selectedType === "task" || selectedType === "habit") && (
                <FormField
                  control={form.control}
                  name="isToday"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Add to Today</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
