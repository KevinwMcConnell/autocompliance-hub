import { useState } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

export function AddTaskDialog({ open, onOpenChange, onTaskCreated }: AddTaskDialogProps) {
  const { currentFacility } = useFacilities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<number>(30);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setIsRecurring(false);
    setRecurrenceDays(30);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!currentFacility?.id) {
      toast.error("No facility selected");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("tasks").insert({
        facility_id: currentFacility.id,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        is_recurring: isRecurring,
        recurrence_days: isRecurring ? recurrenceDays : null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Task created successfully!");
      resetForm();
      onOpenChange(false);
      onTaskCreated();
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Task</DialogTitle>
            <DialogDescription>
              Create a compliance task for {currentFacility?.name || "your facility"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title" className="text-foreground">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="e.g., Submit quarterly hazwaste manifest"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="task-description"
                placeholder="Add any details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date" className="text-foreground">
                Due Date
              </Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="task-recurring" className="text-foreground">
                  Recurring Task
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically create new task when completed
                </p>
              </div>
              <Switch
                id="task-recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                <Label htmlFor="task-recurrence" className="text-foreground flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Repeat every
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="task-recurrence"
                    type="number"
                    min={1}
                    max={365}
                    value={recurrenceDays}
                    onChange={(e) => setRecurrenceDays(parseInt(e.target.value) || 30)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
