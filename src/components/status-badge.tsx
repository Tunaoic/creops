import { cn } from "@/lib/utils";
import type { DeliverableStatus, TopicStatus, TaskStatus } from "@/types";

/**
 * Status badges — Apple HIG style:
 * - rounded-full pill (signature Apple shape)
 * - sentence case (no UPPERCASE TRACKING)
 * - sans-serif (no font-mono)
 * - colored fill, no heavy border
 * - tinted bg with stronger fg, mirrors macOS system labels
 */

const PILL_BASE =
  "inline-flex items-center px-2.5 py-0.5 text-[12px] font-medium rounded-full leading-tight";

// ----------------------------------------------------------------------------
// TaskStatus
// ----------------------------------------------------------------------------

const TASK_STYLES: Record<TaskStatus, string> = {
  todo: "bg-surface-elevated text-text-muted",
  in_progress: "bg-info-bg text-info",
  submitted: "bg-warn-bg text-warn",
  approved: "bg-success-bg text-success",
  rejected: "bg-danger-bg text-danger",
};

const TASK_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  submitted: "In review",
  approved: "Done",
  rejected: "Needs changes",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn(PILL_BASE, TASK_STYLES[status])}>
      {TASK_LABELS[status]}
    </span>
  );
}

// ----------------------------------------------------------------------------
// DeliverableStatus
// ----------------------------------------------------------------------------

const DELIVERABLE_STYLES: Record<DeliverableStatus, string> = {
  draft: "bg-surface-elevated text-text-muted",
  in_progress: "bg-info-bg text-info",
  review: "bg-warn-bg text-warn",
  approved: "bg-success-bg text-success",
  aired: "bg-accent/15 text-accent",
};

const DELIVERABLE_LABELS: Record<DeliverableStatus, string> = {
  draft: "Draft",
  in_progress: "In progress",
  review: "In review",
  approved: "Approved",
  aired: "Aired",
};

export function DeliverableStatusBadge({ status }: { status: DeliverableStatus }) {
  return (
    <span className={cn(PILL_BASE, DELIVERABLE_STYLES[status])}>
      {DELIVERABLE_LABELS[status]}
    </span>
  );
}

// ----------------------------------------------------------------------------
// TopicStatus
// ----------------------------------------------------------------------------

const TOPIC_STYLES: Record<TopicStatus, string> = {
  draft: "bg-surface-elevated text-text-muted",
  in_production: "bg-info-bg text-info",
  partially_aired: "bg-warn-bg text-warn",
  fully_aired: "bg-accent/15 text-accent",
  archived: "bg-surface-elevated text-text-subtle",
};

const TOPIC_LABELS: Record<TopicStatus, string> = {
  draft: "Draft",
  in_production: "In production",
  partially_aired: "Partial",
  fully_aired: "Aired",
  archived: "Archived",
};

export function TopicStatusBadge({ status }: { status: TopicStatus }) {
  return (
    <span className={cn(PILL_BASE, TOPIC_STYLES[status])}>
      {TOPIC_LABELS[status]}
    </span>
  );
}

// ----------------------------------------------------------------------------
// ProgressDots — kept, but lightweight (no glow shadow)
// ----------------------------------------------------------------------------

export function ProgressDots({ total, done }: { total: number; done: number }) {
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors",
            i < done ? "bg-accent" : "bg-border-strong"
          )}
        />
      ))}
    </div>
  );
}
