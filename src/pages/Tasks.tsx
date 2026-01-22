import { useState, useEffect, useCallback } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StatusChip } from "@/components/StatusChip";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  Plus,
  Camera,
  RotateCcw,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  is_recurring: boolean;
  recurrence_days: number | null;
  completed_at: string | null;
  completion_notes: string | null;
  facility_id: string;
}

export default function Tasks() {
  const { currentFacility } = useFacilities();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  const fetchTasks = useCallback(async () => {
    if (!currentFacility?.id) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("facility_id", currentFacility.id)
        .order("due_date", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [currentFacility?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getDaysUntilDue = (dueDate: string | null): number => {
    if (!dueDate) return 999;
    return differenceInDays(new Date(dueDate), new Date());
  };

  const getDueStatus = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "overdue";
    if (daysUntilDue <= 3) return "due_soon";
    return "ok";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No date set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const pendingTasks = tasks.filter((t) => {
    if (t.status === "completed") return false;
    const days = getDaysUntilDue(t.due_date);
    return days >= 0;
  });

  const overdueTasks = tasks.filter((t) => {
    if (t.status === "completed") return false;
    const days = getDaysUntilDue(t.due_date);
    return days < 0;
  });

  const completedTasks = tasks.filter((t) => t.status === "completed");

  const handleComplete = (task: Task) => {
    setSelectedTask(task);
    setCompletionNotes("");
    setCompleteDialogOpen(true);
  };

  const submitCompletion = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completion_notes: completionNotes || null,
        })
        .eq("id", selectedTask.id);

      if (error) throw error;

      toast.success(`Task "${selectedTask.title}" marked as complete!`);
      setCompleteDialogOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Failed to complete task");
    }
  };

  const TaskCard = ({ task, onComplete }: { task: Task; onComplete: (task: Task) => void }) => {
    const daysUntilDue = getDaysUntilDue(task.due_date);
    const status = getDueStatus(daysUntilDue);

    return (
      <Card className={daysUntilDue < 0 ? "border-status-overdue/50" : ""}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                </div>
                <StatusChip status={status} />
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Due {formatDate(task.due_date)}
                </span>
                {task.is_recurring && task.recurrence_days && (
                  <span className="flex items-center gap-1">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Every {task.recurrence_days} days
                  </span>
                )}
              </div>
              <div className="mt-3">
                <Button size="sm" onClick={() => onComplete(task)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="text-muted-foreground">
            Compliance tasks for {currentFacility?.name || "your facility"}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddTaskDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-status-overdue/10">
              <AlertTriangle className="h-5 w-5 text-status-overdue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{overdueTasks.length}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-status-due-soon/10">
              <Clock className="h-5 w-5 text-status-due-soon" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingTasks.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-status-ok/10">
              <CheckCircle2 className="h-5 w-5 text-status-ok" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedTasks.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      {tasks.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Pending
              {(pendingTasks.length + overdueTasks.length) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingTasks.length + overdueTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-4">
            {overdueTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-status-overdue flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Overdue
                </h3>
                {overdueTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} />
                ))}
              </div>
            )}

            {pendingTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming
                </h3>
                {pendingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} />
                ))}
              </div>
            )}

            {pendingTasks.length === 0 && overdueTasks.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-status-ok" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">No pending tasks at this time.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-2">
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <Card key={task.id} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-status-ok/10">
                        <CheckCircle2 className="h-4 w-4 text-status-ok" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Completed {formatDate(task.completed_at)}
                            </p>
                          </div>
                        </div>
                        {task.completion_notes && (
                          <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            {task.completion_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No completed tasks yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-6">
              Add a task to start tracking your compliance requirements.
            </p>
            <Button onClick={() => setAddTaskDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        onTaskCreated={fetchTasks}
      />

      {/* Complete Task Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Complete Task</DialogTitle>
            <DialogDescription>
              {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Completion Notes</label>
              <Textarea
                placeholder="Add any notes about completing this task..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Attach Photos</label>
              <Button variant="outline" className="w-full gap-2">
                <Camera className="h-4 w-4" />
                Upload Photos
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCompletion}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
