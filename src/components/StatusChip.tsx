import { CheckCircle2, AlertTriangle, XCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType = "ok" | "due_soon" | "overdue" | "needs_review" | "missing";

interface StatusChipProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; icon: React.ElementType; className: string }> = {
  ok: {
    label: "OK",
    icon: CheckCircle2,
    className: "bg-status-ok-muted text-status-ok",
  },
  due_soon: {
    label: "Due Soon",
    icon: AlertTriangle,
    className: "bg-status-due-soon-muted text-status-due-soon",
  },
  overdue: {
    label: "Overdue",
    icon: XCircle,
    className: "bg-status-overdue-muted text-status-overdue",
  },
  needs_review: {
    label: "Needs Review",
    icon: Eye,
    className: "bg-status-needs-review-muted text-status-needs-review",
  },
  missing: {
    label: "Missing",
    icon: XCircle,
    className: "bg-muted text-muted-foreground",
  },
};

export function StatusChip({ status, className }: StatusChipProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
