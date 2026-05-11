import { cn } from "@/lib/utils";
import type { DeliverableStatus, TopicStatus, TaskStatus } from "@/types";

const TASK_STYLES: Record<TaskStatus, string> = {
  todo: "bg-surface-elevated text-text-muted border-border-strong",
  in_progress: "bg-info-bg text-info border-info/30",
  submitted: "bg-warn-bg text-warn-text border-warn-border",
  approved: "bg-success-bg text-success border-success/30",
  rejected: "bg-danger-bg text-danger border-danger/30",
};

const TASK_LABELS: Record<TaskStatus, string> = {
  todo: "TO DO",
  in_progress: "DOING",
  submitted: "REVIEW",
  approved: "DONE",
  rejected: "REDO",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono font-medium rounded border tracking-wider",
        TASK_STYLES[status]
      )}
    >
      {TASK_LABELS[status]}
    </span>
  );
}

const DELIVERABLE_STYLES: Record<DeliverableStatus, string> = {
  draft: "bg-surface-elevated text-text-muted border-border-strong",
  in_progress: "bg-info-bg text-info border-info/30",
  review: "bg-warn-bg text-warn-text border-warn-border",
  approved: "bg-success-bg text-success border-success/30",
  aired: "bg-accent/10 text-accent border-accent/30",
};

const DELIVERABLE_LABELS: Record<DeliverableStatus, string> = {
  draft: "DRAFT",
  in_progress: "IN PROGRESS",
  review: "REVIEW",
  approved: "APPROVED",
  aired: "AIRED",
};

const TOPIC_STYLES: Record<TopicStatus, string> = {
  draft: "bg-surface-elevated text-text-muted border-border-strong",
  in_production: "bg-info-bg text-info border-info/30",
  partially_aired: "bg-warn-bg text-warn-text border-warn-border",
  fully_aired: "bg-accent/10 text-accent border-accent/30",
  archived: "bg-surface-elevated text-text-subtle border-border-strong",
};

const TOPIC_LABELS: Record<TopicStatus, string> = {
  draft: "DRAFT",
  in_production: "IN PRODUCTION",
  partially_aired: "PARTIAL",
  fully_aired: "AIRED",
  archived: "ARCHIVED",
};

export function DeliverableStatusBadge({ status }: { status: DeliverableStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono font-medium rounded border tracking-wider",
        DELIVERABLE_STYLES[status]
      )}
    >
      {DELIVERABLE_LABELS[status]}
    </span>
  );
}

export function TopicStatusBadge({ status }: { status: TopicStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono font-medium rounded border tracking-wider",
        TOPIC_STYLES[status]
      )}
    >
      {TOPIC_LABELS[status]}
    </span>
  );
}

export function ProgressDots({ total, done }: { total: number; done: number }) {
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors",
            i < done ? "bg-accent shadow-[0_0_4px_var(--accent)]" : "bg-border-strong"
          )}
        />
      ))}
    </div>
  );
}
