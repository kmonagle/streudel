import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Input } from "./input";
import { insertCountdownSchema, Countdown } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

interface CountdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; targetDate: string }) => void;
  editingCountdown?: Countdown | null;
}

const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const getDaysInMonth = (month: string) => {
  const daysMap: Record<string, number> = {
    "01": 31, "02": 29, "03": 31, "04": 30, "05": 31, "06": 30,
    "07": 31, "08": 31, "09": 30, "10": 31, "11": 30, "12": 31
  };
  return daysMap[month] || 31;
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  month: z.string().min(1, "Month is required"),
  day: z.string().min(1, "Day is required"),
});

export function CountdownModal({
  open,
  onOpenChange,
  onSubmit,
  editingCountdown,
}: CountdownModalProps) {
  const isEditing = !!editingCountdown;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      month: "",
      day: "",
    },
  });

  const selectedMonth = form.watch("month");
  const daysInMonth = getDaysInMonth(selectedMonth);

  useEffect(() => {
    if (editingCountdown) {
      const parts = editingCountdown.targetDate.split("-");
      const month = parts.length === 2 ? parts[0] : parts.length === 3 ? parts[1] : "";
      const day = parts.length === 2 ? parts[1] : parts.length === 3 ? parts[2] : "";
      form.reset({
        name: editingCountdown.name,
        month,
        day,
      });
    } else {
      form.reset({
        name: "",
        month: "",
        day: "",
      });
    }
  }, [editingCountdown, form]);

  const handleSubmit = form.handleSubmit((data) => {
    const targetDate = `${data.month}-${data.day}`;
    onSubmit({ name: data.name, targetDate });
    form.reset();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Countdown' : 'Add Countdown'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter countdown name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Month</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-countdown-month">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormLabel>Day</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-countdown-day">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = String(i + 1).padStart(2, "0");
                          return (
                            <SelectItem key={day} value={day}>
                              {i + 1}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <Button type="submit" className="flex-1">
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
