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
  tasks_assigned: "assigned a task",
  task_rejected: "rejected your task",
  deliverable_ready_for_review: "submitted a task — review needed",
  deliverable_aired: "marked aired",
  mentioned: "mentioned you",
};

const EVENT_ICON: Record<string, typeof Bell> = {
  tasks_assigned: CircleDot,
  task_rejected: AlertCircle,
  deliverable_ready_for_review: Send,
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
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value as "all" | "unread")}
            className={cn(
              "px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded border transition-colors",
              filter === f.value
                ? "border-accent text-accent bg-accent/5"
                : "border-transparent text-text-subtle hover:text-text"
            )}
          >
            {f.label}
            {f.value === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 px-1 rounded bg-accent text-accent-fg">
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
            className="ml-auto text-[11px] font-mono text-text-muted hover:text-text disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length > 0 && (
        <div className="bg-surface rounded border border-border overflow-hidden divide-y divide-border">
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
                  "block px-4 py-3 hover:bg-surface-hover transition-colors group",
                  unread && "bg-accent/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 mt-0.5 shrink-0",
                      unread ? "text-accent" : "text-text-subtle"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px]">
                      <span className="text-text font-medium">
                        {n.actorName ?? "Someone"}
                      </span>{" "}
                      <span className="text-text-muted">{label}</span>
                      {n.topicName && (
                        <>
                          {" "}
                          <span className="text-text-muted">·</span>{" "}
                          <span className="text-accent font-semibold">
                            {n.topicName}
                          </span>
                        </>
                      )}
                    </div>
                    {reason && (
                      <div className="text-[12px] text-text-subtle italic mt-1">
                        "{reason}"
                      </div>
                    )}
                    <div className="text-[11px] font-mono text-text-subtle mt-1">
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
                      className="p-1 text-text-subtle hover:text-text opacity-0 group-hover:opacity-100"
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
