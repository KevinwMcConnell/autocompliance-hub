import { useState } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusChip } from "@/components/StatusChip";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  Plus,
  Camera,
  FileText,
  RotateCcw,
  Calendar,
} from "lucide-react";

// Mock data
const mockTasks = [
  {
    id: "1",
    title: "Monthly First Aid Kit Inspection",
    description: "Check all first aid kits in bays 1-4 for expired items",
    dueDate: "Jan 22, 2025",
    daysUntilDue: 0,
    isRecurring: true,
    recurrenceDays: 30,
    status: "pending" as const,
    relatedEvidence: "First Aid Kit Inspection",
  },
  {
    id: "2",
    title: "Weekly Eye Wash Station Test",
    description: "Flush all eye wash stations for 3 minutes, log results",
    dueDate: "Jan 24, 2025",
    daysUntilDue: 2,
    isRecurring: true,
    recurrenceDays: 7,
    status: "pending" as const,
    relatedEvidence: "Eye Wash Station Test",
  },
  {
    id: "3",
    title: "Submit Hazardous Waste Manifest",
    description: "Complete and submit Q4 2024 hazardous waste manifest to EPA",
    dueDate: "Jan 15, 2025",
    daysUntilDue: -7,
    isRecurring: true,
    recurrenceDays: 90,
    status: "overdue" as const,
    relatedEvidence: "Hazardous Waste Manifest",
  },
  {
    id: "4",
    title: "Schedule Lift Inspection",
    description: "Contact SafetyFirst Inc. to schedule annual lift inspection",
    dueDate: "Jan 28, 2025",
    daysUntilDue: 6,
    isRecurring: false,
    status: "pending" as const,
    relatedEvidence: "Lift Equipment Certification",
  },
  {
    id: "5",
    title: "Update SDS Binder",
    description: "Add new chemical SDSs received this month",
    dueDate: "Jan 31, 2025",
    daysUntilDue: 9,
    isRecurring: true,
    recurrenceDays: 30,
    status: "pending" as const,
    relatedEvidence: "SDS Binder",
  },
];

const completedTasks = [
  {
    id: "c1",
    title: "Monthly Fire Extinguisher Inspection",
    completedAt: "Jan 18, 2025",
    completionNotes: "All extinguishers checked, Bay 3 extinguisher needs recharge next month",
    hasPhotos: true,
  },
  {
    id: "c2",
    title: "Weekly Eye Wash Station Test",
    completedAt: "Jan 17, 2025",
    completionNotes: "All stations flushed, no issues",
    hasPhotos: false,
  },
];

export default function Tasks() {
  const { currentFacility } = useFacilities();
  const [activeTab, setActiveTab] = useState("pending");
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<typeof mockTasks[0] | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  const pendingTasks = mockTasks.filter((t) => t.status === "pending");
  const overdueTasks = mockTasks.filter((t) => t.status === "overdue");

  const getDueStatus = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "overdue";
    if (daysUntilDue <= 3) return "due_soon";
    return "ok";
  };

  const handleComplete = (task: typeof mockTasks[0]) => {
    setSelectedTask(task);
    setCompleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Compliance tasks for {currentFacility?.name || "your facility"}
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-status-overdue-muted">
              <Clock className="h-5 w-5 text-status-overdue" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdueTasks.length}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-status-due-soon-muted">
              <CheckSquare className="h-5 w-5 text-status-due-soon" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingTasks.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-status-ok-muted">
              <CheckCircle2 className="h-5 w-5 text-status-ok" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTasks.length}</p>
              <p className="text-sm text-muted-foreground">Completed this month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
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
                <Clock className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-2">
          {completedTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-status-ok-muted">
                    <CheckCircle2 className="h-4 w-4 text-status-ok" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Completed {task.completedAt}
                        </p>
                      </div>
                      {task.hasPhotos && (
                        <Badge variant="secondary" className="gap-1">
                          <Camera className="h-3 w-3" />
                          Photos
                        </Badge>
                      )}
                    </div>
                    {task.completionNotes && (
                      <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {task.completionNotes}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Complete Task Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Completion Notes</label>
              <Textarea
                placeholder="Add any notes about completing this task..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Attach Photos</label>
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
            <Button onClick={() => setCompleteDialogOpen(false)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({
  task,
  onComplete,
}: {
  task: typeof mockTasks[0];
  onComplete: (task: typeof mockTasks[0]) => void;
}) {
  const getDueStatus = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "overdue";
    if (daysUntilDue <= 3) return "due_soon";
    return "ok";
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Checkbox className="mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
              <StatusChip status={getDueStatus(task.daysUntilDue)} />
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Due {task.dueDate}
              </span>
              {task.isRecurring && (
                <span className="flex items-center gap-1">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Every {task.recurrenceDays} days
                </span>
              )}
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {task.relatedEvidence}
              </span>
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
}
