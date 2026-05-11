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
  task_unassigned: "unassigned you from a task",
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
  task_unassigned: CircleDot,
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
          "relative p-2 rounded-full text-text-muted hover:text-text hover:bg-surface-hover transition-colors",
          open && "bg-surface-hover text-text"
        )}
        title="Notifications"
      >
        <Bell className="w-4 h-4" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-accent-fg text-[10px] font-semibold flex items-center justify-center leading-none tabular-nums">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-surface rounded-2xl border border-border shadow-2xl z-40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[15px] font-semibold text-text">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-[13px] text-accent font-normal">
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={dismissAll}
                disabled={pending}
                className="text-[13px] text-text-muted hover:text-text disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[440px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[14px] text-text-subtle">
                No notifications yet
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
                          strokeWidth={1.75}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px]">
                            <span className="text-text font-medium">
                              {n.actorName ?? "Someone"}
                            </span>{" "}
                            <span className="text-text-muted">{label}</span>
                            {n.topicName && (
                              <>
                                <span className="text-text-subtle"> · </span>
                                <span className="text-accent font-medium">{n.topicName}</span>
                              </>
                            )}
                          </div>
                          {reason && (
                            <div className="text-[12px] text-text-muted truncate mt-1">
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
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-border text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-[13px] text-accent hover:opacity-80 transition-opacity"
            >
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
