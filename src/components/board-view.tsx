"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  CheckCircle2,
  CircleDot,
  Clock,
  ExternalLink,
  LayoutList,
  Plus,
  CalendarDays,
} from "lucide-react";
import {
  CHANNEL_LABEL,
  DELIVERABLE_TYPE_LABEL,
  type Topic,
  type Channel,
  type User,
  type Deliverable,
  type DeliverableStatus,
} from "@/types";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeTime } from "@/lib/utils";

const COLUMNS: Array<{
  status: DeliverableStatus;
  label: string;
  description: string;
  icon: typeof Clock;
  color: string;
}> = [
  {
    status: "draft",
    label: "Draft",
    description: "Not started",
    icon: Clock,
    color: "text-text-subtle",
  },
  {
    status: "in_progress",
    label: "In Progress",
    description: "Team working",
    icon: Clock,
    color: "text-info",
  },
  {
    status: "review",
    label: "Review",
    description: "Awaiting approval",
    icon: CircleDot,
    color: "text-warn",
  },
  {
    status: "approved",
    label: "Approved",
    description: "Ready to publish",
    icon: CheckCircle2,
    color: "text-accent",
  },
  {
    status: "aired",
    label: "Aired",
    description: "Live",
    icon: CheckCircle2,
    color: "text-accent",
  },
];

interface DeliverableWithTopic {
  topic: Topic;
  deliverable: Deliverable;
}

export function BoardView({
  topics,
  channels,
  users,
}: {
  topics: Topic[];
  channels: Channel[];
  users: User[];
}) {
  const channelMap = new Map(channels.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const allDeliverables: DeliverableWithTopic[] = useMemo(
    () =>
      topics.flatMap((t) =>
        t.deliverables.map((d) => ({ topic: t, deliverable: d }))
      ),
    [topics]
  );

  const byStatus = useMemo(() => {
    const map: Record<DeliverableStatus, DeliverableWithTopic[]> = {
      draft: [],
      in_progress: [],
      review: [],
      approved: [],
      aired: [],
    };
    for (const item of allDeliverables) {
      map[item.deliverable.status].push(item);
    }
    return map;
  }, [allDeliverables]);

  const totalCount = allDeliverables.length;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border px-8 pt-6 pb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[14px] text-text-muted mb-1">Board view</p>
          <h1 className="text-title-2 text-text flex items-baseline gap-2.5">
            All deliverables
            <span className="text-[15px] text-text-subtle font-normal tabular-nums">
              {totalCount}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <Link
            href="/topics"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-hover text-[13px] text-text-muted hover:text-text transition-colors"
          >
            <LayoutList className="w-3.5 h-3.5" strokeWidth={1.75} />
            List
          </Link>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-hover text-[13px] text-text-muted hover:text-text transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.75} />
            Calendar
          </Link>
          <Link
            href="/topics/new"
            className="inline-flex items-center gap-1.5 pl-3.5 pr-4 py-1.5 rounded-full bg-accent text-accent-fg text-[13px] font-medium hover:opacity-88 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            New topic
          </Link>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-5 h-full min-w-max">
          {COLUMNS.map((col) => {
            const items = byStatus[col.status];
            const Icon = col.icon;
            return (
              <div
                key={col.status}
                className="w-[300px] flex flex-col bg-surface/60 rounded-2xl border border-border"
              >
                {/* Column header */}
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", col.color)} strokeWidth={1.75} />
                  <span className="text-[15px] font-medium flex-1">
                    {col.label}
                  </span>
                  <span className="text-[13px] text-text-subtle tabular-nums">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {items.length === 0 ? (
                    <div className="text-center py-6 text-[13px] text-text-subtle">
                      Empty
                    </div>
                  ) : (
                    items.map(({ topic, deliverable }) => (
                      <DeliverableCard
                        key={deliverable.id}
                        topic={topic}
                        deliverable={deliverable}
                        channelMap={channelMap}
                        userMap={userMap}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DeliverableCard({
  topic,
  deliverable,
  channelMap,
  userMap,
}: {
  topic: Topic;
  deliverable: Deliverable;
  channelMap: Map<string, Channel>;
  userMap: Map<string, User>;
}) {
  const blockingTask = deliverable.tasks.find(
    (t) => t.status === "todo" || t.status === "in_progress"
  );
  const assignees = (blockingTask?.assigneeIds ?? [])
    .map((id) => userMap.get(id))
    .filter((u): u is User => Boolean(u));
  const assignee = assignees[0] ?? null;
  const isAired = deliverable.status === "aired";
  const isReview = deliverable.status === "review";

  return (
    <Link
      href={
        isReview
          ? `/topics/${topic.id}/approve/${deliverable.id}`
          : `/topics/${topic.id}`
      }
      className="block bg-surface rounded-xl border border-border hover:bg-surface-hover transition-colors p-3.5 group"
    >
      {/* Topic name */}
      <div className="text-[12px] text-text-muted mb-1 truncate">
        {topic.name}
      </div>

      {/* Deliverable type */}
      <div className="text-[15px] font-medium mb-2.5 truncate text-text">
        {DELIVERABLE_TYPE_LABEL[deliverable.type]}
      </div>

      {/* Channels */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {deliverable.channels.map((dc) => {
          const ch = channelMap.get(dc.channelId);
          if (!ch) return null;
          return (
            <span
              key={dc.channelId}
              className={cn(
                "text-[11px] font-medium px-2 py-0.5 rounded-full",
                dc.airedLink
                  ? "bg-accent/15 text-accent"
                  : "bg-surface-elevated text-text-muted"
              )}
            >
              {dc.airedLink && "✓ "}
              {CHANNEL_LABEL[ch.platform]}
            </span>
          );
        })}
      </div>

      {/* Footer meta */}
      <div className="flex items-center justify-between text-[12px] text-text-subtle pt-2 border-t border-border tabular-nums">
        {deliverable.tasks.length > 0 && !isAired ? (
          <span>{deliverable.tasks.filter((t) => t.status === "approved").length}/{deliverable.tasks.length} tasks</span>
        ) : isAired && deliverable.airedAt ? (
          <span>{formatRelativeTime(deliverable.airedAt)}</span>
        ) : (
          <span>—</span>
        )}
        {assignee && !isAired && (
          <span className="flex items-center gap-1.5 text-text-muted">
            <span className="w-4 h-4 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[9px] font-medium text-text">
              {assignee.name[0]}
            </span>
            {assignee.name}
          </span>
        )}
        {isReview && (
          <span className="text-warn font-medium">Review →</span>
        )}
      </div>

      {topic.targetPublishDate && !isAired && (
        <div className="text-[12px] text-text-subtle mt-1.5">
          Due {formatDate(topic.targetPublishDate)}
        </div>
      )}
    </Link>
  );
}
