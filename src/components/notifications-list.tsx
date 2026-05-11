"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  AlertCircle,
  CircleDot,
  Send,
  Sparkles,
  Bell,
} from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/db/actions";
import type { NotificationEntry } from "@/db/queries";
import { formatRelativeTime, cn } from "@/lib/utils";

const EVENT_LABEL: Record<string, string> = {
  tasks_assigned: "assigned a task to you",
  task_submitted: "submitted a task",
  task_approved: "approved your task",
  task_rejected: "needs changes on your task",
  deliverable_ready_for_review: "submitted a deliverable for review",
  deliverable_approved: "approved a deliverable",
  deliverable_aired: "marked aired",
  mentioned: "mentioned you",
};

const EVENT_ICON: Record<string, typeof Bell> = {
  tasks_assigned: CircleDot,
  task_submitted: Send,
  task_approved: Sparkles,
  task_rejected: AlertCircle,
  deliverable_ready_for_review: Send,
  deliverable_approved: Sparkles,
  deliverable_aired: Sparkles,
  mentioned: Bell,
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

export function NotificationsList({
  initial,
}: {
  initial: NotificationEntry[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pending, startTransition] = useTransition();

  const filtered =
    filter === "unread" ? initial.filter((n) => !n.readAt) : initial;
  const unreadCount = initial.filter((n) => !n.readAt).length;

  function dismiss(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  function dismissAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <>
      {/* Filter chips */}
      <div className="flex items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value as "all" | "unread")}
            className={cn(
              "px-3 py-1 text-[13px] font-medium rounded-full transition-colors",
              filter === f.value
                ? "bg-accent/15 text-accent"
                : "text-text-muted hover:bg-surface-hover hover:text-text"
            )}
          >
            {f.label}
            {f.value === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-accent text-accent-fg text-[11px] tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={dismissAll}
            disabled={pending}
            className="ml-auto text-[13px] text-text-muted hover:text-text disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {filtered.map((n) => {
            const Icon = EVENT_ICON[n.event] ?? Bell;
            const label = EVENT_LABEL[n.event] ?? n.event;
            const unread = !n.readAt;
            const reason =
              typeof n.payload?.reason === "string"
                ? (n.payload.reason as string)
                : undefined;
            const link = n.topicId
              ? n.taskId
                ? `/topics/${n.topicId}/tasks/${n.taskId}`
                : `/topics/${n.topicId}`
              : "/";
            return (
              <Link
                key={n.id}
                href={link}
                onClick={() => unread && dismiss(n.id)}
                className={cn(
                  "block px-5 py-3.5 hover:bg-surface-hover transition-colors group",
                  unread && "bg-accent/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 mt-0.5 shrink-0",
                      unread ? "text-accent" : "text-text-subtle"
                    )}
                    strokeWidth={1.75}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px]">
                      <span className="text-text font-medium">
                        {n.actorName ?? "Someone"}
                      </span>{" "}
                      <span className="text-text-muted">{label}</span>
                      {n.topicName && (
                        <>
                          <span className="text-text-subtle"> · </span>
                          <span className="text-accent font-medium">
                            {n.topicName}
                          </span>
                        </>
                      )}
                    </div>
                    {reason && (
                      <div className="text-[13px] text-text-muted mt-1">
                        &ldquo;{reason}&rdquo;
                      </div>
                    )}
                    <div className="text-[12px] text-text-subtle mt-1">
                      {formatRelativeTime(n.createdAt)}
                    </div>
                  </div>
                  {unread && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dismiss(n.id);
                      }}
                      className="p-1.5 rounded-full text-text-subtle hover:text-text hover:bg-surface-hover opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Mark read"
                    >
                      {pending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
