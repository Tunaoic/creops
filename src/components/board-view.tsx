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
      <div className="border-b border-border bg-surface/40 px-6 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-1">
            VIEW <span className="text-accent">·</span> BOARD
          </div>
          <h1 className="text-base font-semibold flex items-center gap-2">
            All Deliverables
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted">
              {totalCount}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/topics"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border bg-surface hover:border-border-strong text-[13px] text-text-muted hover:text-text"
          >
            <LayoutList className="w-3 h-3" />
            List
          </Link>
          <Link
            href="/timeline"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border bg-surface hover:border-border-strong text-[13px] text-text-muted hover:text-text"
          >
            <CalendarDays className="w-3 h-3" />
            Timeline
          </Link>
          <Link
            href="/topics/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent text-accent-fg text-[13px] font-semibold hover:bg-accent-hover"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            New
          </Link>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-max">
          {COLUMNS.map((col) => {
            const items = byStatus[col.status];
            const Icon = col.icon;
            return (
              <div
                key={col.status}
                className="w-[280px] flex flex-col bg-surface/40 rounded-lg border border-border"
              >
                {/* Column header */}
                <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
                  <Icon className={cn("w-3.5 h-3.5", col.color)} />
                  <span className="text-[12px] font-mono uppercase tracking-[0.15em] font-semibold flex-1">
                    {col.label}
                  </span>
                  <span className="text-[11px] font-mono text-text-subtle px-1.5 py-0.5 rounded bg-surface-elevated">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {items.length === 0 ? (
                    <div className="text-center py-5 text-[12px] text-text-subtle italic">
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
      className="block bg-surface rounded border border-border hover:border-accent/40 hover:shadow-[0_0_0_1px_var(--accent-glow)] transition-all p-2.5 group"
    >
      {/* Topic name */}
      <div className="text-[11px] font-mono uppercase tracking-wider text-text-subtle mb-1 truncate">
        {topic.name}
      </div>

      {/* Deliverable type */}
      <div className="text-[13px] font-medium mb-2 truncate">
        {DELIVERABLE_TYPE_LABEL[deliverable.type]}
      </div>

      {/* Channels */}
      <div className="flex flex-wrap gap-1 mb-2">
        {deliverable.channels.map((dc) => {
          const ch = channelMap.get(dc.channelId);
          if (!ch) return null;
          return (
            <span
              key={dc.channelId}
              className={cn(
                "text-[10px] font-mono px-1 py-0.5 rounded border",
                dc.airedLink
                  ? "bg-accent/10 text-accent border-accent/30"
                  : "bg-bg text-text-muted border-border"
              )}
            >
              {dc.airedLink && "✓ "}
              {CHANNEL_LABEL[ch.platform]}
            </span>
          );
        })}
      </div>

      {/* Footer meta */}
      <div className="flex items-center justify-between text-[10px] font-mono text-text-subtle pt-1.5 border-t border-border">
        {deliverable.tasks.length > 0 && !isAired ? (
          <span>{deliverable.tasks.filter((t) => t.status === "approved").length}/{deliverable.tasks.length} tasks</span>
        ) : isAired && deliverable.airedAt ? (
          <span>{formatRelativeTime(deliverable.airedAt)}</span>
        ) : (
          <span>—</span>
        )}
        {assignee && !isAired && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-[7px] text-accent font-bold">
              {assignee.name[0]}
            </span>
            {assignee.name.toLowerCase()}
          </span>
        )}
        {isReview && (
          <span className="text-warn font-semibold">REVIEW →</span>
        )}
      </div>

      {topic.targetPublishDate && !isAired && (
        <div className="text-[10px] font-mono text-text-subtle mt-1">
          due {formatDate(topic.targetPublishDate)}
        </div>
      )}
    </Link>
  );
}
