"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Filter,
  ArrowUpDown,
  Plus,
  CheckCircle2,
  Clock,
  CircleDot,
  ExternalLink,
  Search,
  ChevronRight,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import {
  CHANNEL_LABEL,
  DELIVERABLE_TYPE_LABEL,
  type Topic,
  type Channel,
  type User,
  type TopicStatus,
} from "@/types";
import {
  TopicStatusBadge,
  DeliverableStatusBadge,
  ProgressDots,
} from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeTime } from "@/lib/utils";

const FILTERS: { label: string; value: TopicStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "in_production" },
  { label: "Aired", value: "fully_aired" },
  { label: "Drafts", value: "draft" },
];

export function TopicsSplitView({
  topics,
  selected,
  channels,
  users,
  blockReasonDisplay,
}: {
  topics: Topic[];
  selected: Topic | null;
  channels: Channel[];
  users: User[];
  blockReasonDisplay: "name" | "role";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<TopicStatus | "all">("all");
  const [search, setSearch] = useState("");

  const channelMap = new Map(channels.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const filtered = useMemo(() => {
    let list = topics;
    if (filter !== "all") list = list.filter((t) => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.brief?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [topics, filter, search]);

  function selectTopic(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    router.replace(`/topics?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex h-full">
      {/* LEFT: List pane */}
      <div className="w-[380px] border-r border-border flex flex-col bg-bg shrink-0">
        {/* List header */}
        <div className="border-b border-border bg-surface/40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold flex items-center gap-2">
                Topics
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted">
                  {filtered.length}
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/board"
                className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text"
                title="Board view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/topics/new"
                className="p-1.5 rounded bg-accent text-accent-fg hover:bg-accent-hover transition-colors"
                title="New topic"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-subtle" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-7 pr-2 py-1.5 rounded text-[13px] border border-border bg-bg focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Filter chips */}
          <div className="px-3 pb-2 flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider rounded transition-colors",
                  filter === f.value
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-text-subtle hover:text-text border border-transparent"
                )}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              className="ml-auto p-1 text-text-subtle hover:text-text"
              title="Sort"
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-5 text-center text-[13px] text-text-subtle italic">
              No topics match
            </div>
          ) : (
            filtered.map((topic) => {
              const isSelected = selected?.id === topic.id;
              const total = topic.deliverables.length;
              const aired = topic.deliverables.filter((d) => d.status === "aired").length;
              const reviewCount = topic.deliverables.filter((d) => d.status === "review").length;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => selectTopic(topic.id)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 border-l-2 transition-colors",
                    isSelected
                      ? "bg-surface-hover border-accent"
                      : "border-transparent hover:bg-surface/60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span
                      className={cn(
                        "text-[14px] font-medium truncate",
                        isSelected ? "text-text" : "text-text-muted"
                      )}
                    >
                      {topic.name}
                    </span>
                    {reviewCount > 0 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-warn-bg text-warn border border-warn-border shrink-0">
                        {reviewCount} REVIEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-text-subtle">
                    <ProgressDots total={total} done={aired} />
                    <span>{aired}/{total}</span>
                    <span>·</span>
                    <span>{topic.status === "fully_aired" ? "AIRED" : topic.status === "in_production" ? "ACTIVE" : "DRAFT"}</span>
                    {topic.targetPublishDate && (
                      <>
                        <span>·</span>
                        <span>{formatDate(topic.targetPublishDate)}</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Detail pane */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {!selected ? (
          <EmptyState />
        ) : (
          <TopicDetailPane
            topic={selected}
            channelMap={channelMap}
            userMap={userMap}
            blockReasonDisplay={blockReasonDisplay}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      <LayoutList className="w-10 h-10 text-text-subtle/40 mb-3" />
      <p className="text-sm text-text-muted mb-1">Select a topic to view</p>
      <p className="text-xs text-text-subtle">or create a new one</p>
    </div>
  );
}

function TopicDetailPane({
  topic,
  channelMap,
  userMap,
  blockReasonDisplay,
}: {
  topic: Topic;
  channelMap: Map<string, Channel>;
  userMap: Map<string, User>;
  blockReasonDisplay: "name" | "role";
}) {
  const total = topic.deliverables.length;
  const aired = topic.deliverables.filter((d) => d.status === "aired").length;

  return (
    <div className="px-6 py-4 max-w-4xl">
      {/* Header */}
      <div className="border-b border-border pb-5 mb-4">
        <div className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle">
          <span>TOPIC</span>
          <span className="text-text-subtle/60">·</span>
          <TopicStatusBadge status={topic.status} />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight mb-2">{topic.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-text-muted font-mono">
              <span>{aired}/{total} aired</span>
              {topic.targetPublishDate && (
                <>
                  <span className="text-text-subtle">·</span>
                  <span>due {formatDate(topic.targetPublishDate)}</span>
                </>
              )}
              {topic.creatorId && userMap.get(topic.creatorId) && (
                <>
                  <span className="text-text-subtle">·</span>
                  <span>by {userMap.get(topic.creatorId)?.name}</span>
                </>
              )}
            </div>
          </div>
          <Link
            href={`/topics/${topic.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border bg-surface hover:border-accent text-[13px] text-text-muted hover:text-text"
          >
            Open full
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Brief */}
      {topic.brief && (
        <section className="mb-4">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-2">
            Brief
          </h2>
          <p className="text-sm leading-relaxed text-text-muted">{topic.brief}</p>
        </section>
      )}

      {/* Material Links */}
      {topic.sourceAssets.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-text-subtle mb-2">
            Material Links · {topic.sourceAssets.length}
          </h2>
          <div className="space-y-1.5">
            {topic.sourceAssets.map((a) => (
              <a
                key={a.id}
                href={a.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-surface hover:border-accent/50 transition-colors group"
              >
                <ExternalLink className="w-3.5 h-3.5 text-text-subtle group-hover:text-accent shrink-0" />
                <span className="text-[13px] font-medium truncate">
                  {a.fileName}
                </span>
                <span className="flex-1 truncate text-[12px] font-mono text-text-subtle">
                  {a.fileUrl}
                </span>
                <span className="text-[11px] font-mono text-text-subtle group-hover:text-accent shrink-0">
                  OPEN
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Deliverables */}
      <section>
        <h2 className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-2">
          Deliverables · {topic.deliverables.length}
        </h2>
        <div className="space-y-1.5">
          {topic.deliverables.map((d) => {
            const isAired = d.status === "aired";
            const blockingTask = d.tasks.find(
              (t) => t.status === "todo" || t.status === "in_progress"
            );
            const assignees = (blockingTask?.assigneeIds ?? [])
              .map((id) => userMap.get(id))
              .filter((u): u is User => Boolean(u));
            const assignee = assignees[0] ?? null;
            return (
              <div
                key={d.id}
                className="rounded border border-border bg-surface hover:border-border-strong transition-colors"
              >
                <div className="px-3 py-2.5 flex items-center gap-3">
                  <span className="shrink-0">
                    {isAired ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                    ) : d.status === "review" ? (
                      <CircleDot className="w-3.5 h-3.5 text-warn" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-text-subtle" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium">
                        {DELIVERABLE_TYPE_LABEL[d.type]}
                      </span>
                      <DeliverableStatusBadge status={d.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-text-subtle flex-wrap">
                      {d.channels.map((dc) => {
                        const ch = channelMap.get(dc.channelId);
                        if (!ch) return null;
                        if (dc.airedLink) {
                          return (
                            <a
                              key={dc.channelId}
                              href={dc.airedLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-info hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {CHANNEL_LABEL[ch.platform]}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          );
                        }
                        return (
                          <span key={dc.channelId} className="text-text-subtle">
                            {CHANNEL_LABEL[ch.platform]}
                          </span>
                        );
                      })}
                      {assignee && !isAired && d.status !== "review" && (
                        <>
                          <span>·</span>
                          <span>waiting {assignee.name.toLowerCase()}</span>
                        </>
                      )}
                      {d.airedAt && (
                        <>
                          <span>·</span>
                          <span>{formatRelativeTime(d.airedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {d.status === "review" && (
                    <Link
                      href={`/topics/${topic.id}/approve/${d.id}`}
                      className="text-[12px] font-semibold px-2.5 py-1 rounded bg-warn-bg text-warn border border-warn-border hover:bg-warn/15 transition-colors"
                    >
                      Review →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
