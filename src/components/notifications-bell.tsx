"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Loader2,
  AlertCircle,
  CircleDot,
  Send,
  Sparkles,
} from "lucide-react";
import {
  markNotificationRead,
  markAllNotificationsRead,
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
  transcribe_done: "transcribe completed",
  cut_suggestions_ready: "AI cuts ready",
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

export function NotificationsBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationEntry[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors",
          open && "bg-surface-hover text-text"
        )}
        title="Notifications"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-accent text-accent-fg text-[9px] font-mono font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-[360px] bg-surface rounded border border-border-strong shadow-2xl z-40 overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-bg/40 flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-text-subtle">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 text-accent">· {unreadCount} new</span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={dismissAll}
                disabled={pending}
                className="text-[11px] font-mono text-text-muted hover:text-text disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px] text-text-subtle italic">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => {
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
                      onClick={() => {
                        if (unread) dismiss(n.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "block px-3 py-2.5 hover:bg-surface-hover transition-colors group",
                        unread && "bg-accent/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Icon
                          className={cn(
                            "w-3.5 h-3.5 mt-0.5 shrink-0",
                            unread ? "text-accent" : "text-text-subtle"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px]">
                            <span className="text-text font-medium">
                              {n.actorName ?? "Someone"}
                            </span>{" "}
                            <span className="text-text-muted">{label}</span>
                            {n.topicName && (
                              <>
                                {" "}
                                <span className="text-text-muted">·</span>{" "}
                                <span className="text-accent">{n.topicName}</span>
                              </>
                            )}
                          </div>
                          {reason && (
                            <div className="text-[11px] text-text-subtle italic truncate mt-0.5">
                              "{reason}"
                            </div>
                          )}
                          <div className="text-[10px] font-mono text-text-subtle mt-0.5">
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
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-3 py-1.5 border-t border-border bg-bg/40 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-[11px] font-mono text-text-muted hover:text-text"
            >
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
