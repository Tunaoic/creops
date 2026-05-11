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
        <div className="border-b border-border">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h1 className="text-headline text-text flex items-baseline gap-2">
              Topics
              <span className="text-[14px] text-text-subtle font-normal tabular-nums">
                {filtered.length}
              </span>
            </h1>
            <div className="flex items-center gap-1">
              <Link
                href="/board"
                className="p-2 rounded-full hover:bg-surface-hover text-text-muted hover:text-text transition-colors"
                title="Board view"
              >
                <LayoutGrid className="w-4 h-4" strokeWidth={1.75} />
              </Link>
              <Link
                href="/topics/new"
                className="p-2 rounded-full bg-accent text-accent-fg hover:opacity-88 transition-opacity"
                title="New topic"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle" strokeWidth={1.75} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics"
                className="w-full pl-9 pr-3 py-2 rounded-full text-[14px] border border-border bg-surface focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Filter chips */}
          <div className="px-4 pb-3 flex items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-3 py-1 text-[13px] rounded-full transition-colors",
                  filter === f.value
                    ? "bg-accent/15 text-accent font-medium"
                    : "text-text-muted hover:bg-surface-hover hover:text-text"
                )}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              className="ml-auto p-1.5 rounded-full text-text-subtle hover:text-text hover:bg-surface-hover transition-colors"
              title="Sort"
            >
              <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-text-subtle">
              No topics match
            </div>
          ) : (
            filtered.map((topic) => {
              const isSelected = selected?.id === topic.id;
              const total = topic.deliverables.length;
              const aired = topic.deliverables.filter((d) => d.status === "aired").length;
              const reviewCount = topic.deliverables.filter((d) => d.status === "review").length;
              const statusLabel =
                topic.status === "fully_aired"
                  ? "Aired"
                  : topic.status === "in_production"
                    ? "Active"
                    : topic.status === "partially_aired"
                      ? "Partial"
                      : topic.status === "archived"
                        ? "Archived"
                        : "Draft";
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => selectTopic(topic.id)}
                  className={cn(
                    "w-full text-left px-5 py-3 border-l-[3px] transition-colors",
                    isSelected
                      ? "bg-accent/5 border-accent"
                      : "border-transparent hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span
                      className={cn(
                        "text-[15px] truncate",
                        isSelected ? "text-text font-medium" : "text-text"
                      )}
                    >
                      {topic.name}
                    </span>
                    {reviewCount > 0 && (
                      <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-warn-bg text-warn shrink-0">
                        {reviewCount} review
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-text-muted">
                    <ProgressDots total={total} done={aired} />
                    <span className="tabular-nums">{aired}/{total}</span>
                    <span className="text-text-subtle">·</span>
                    <span>{statusLabel}</span>
                    {topic.targetPublishDate && (
                      <>
                        <span className="text-text-subtle">·</span>
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
    <div className="px-8 py-7 max-w-4xl">
      {/* Header — Apple style: small label above big title, generous space */}
      <div className="border-b border-border pb-6 mb-6">
        <div className="flex items-center gap-2.5 mb-3 text-[13px] text-text-muted">
          <span>Topic</span>
          <TopicStatusBadge status={topic.status} />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-title-2 text-text mb-2">{topic.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-[14px] text-text-muted">
              <span className="tabular-nums">{aired}/{total} aired</span>
              {topic.targetPublishDate && (
                <>
                  <span className="text-text-subtle">·</span>
                  <span>Due {formatDate(topic.targetPublishDate)}</span>
                </>
              )}
              {topic.creatorId && userMap.get(topic.creatorId) && (
                <>
                  <span className="text-text-subtle">·</span>
                  <span>By {userMap.get(topic.creatorId)?.name}</span>
                </>
              )}
            </div>
          </div>
          <Link
            href={`/topics/${topic.id}`}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-hover text-[13px] text-text-muted hover:text-text transition-colors shrink-0"
          >
            Open full
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Brief */}
      {topic.brief && (
        <section className="mb-6">
          <h2 className="text-headline text-text mb-2">Brief</h2>
          <p className="text-[15px] leading-relaxed text-text-muted">{topic.brief}</p>
        </section>
      )}

      {/* Material Links */}
      {topic.sourceAssets.length > 0 && (
        <section className="mb-6">
          <h2 className="text-headline text-text mb-3 flex items-baseline gap-2">
            Material links
            <span className="text-text-subtle font-normal text-[14px] tabular-nums">
              {topic.sourceAssets.length}
            </span>
          </h2>
          <div className="space-y-2">
            {topic.sourceAssets.map((a) => (
              <a
                key={a.id}
                href={a.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors group"
              >
                <ExternalLink className="w-4 h-4 text-text-subtle group-hover:text-accent shrink-0" strokeWidth={1.75} />
                <span className="text-[14px] font-medium truncate text-text">
                  {a.fileName}
                </span>
                <span className="flex-1 truncate text-[13px] text-text-subtle">
                  {a.fileUrl}
                </span>
                <span className="text-[13px] text-text-subtle group-hover:text-accent shrink-0">
                  Open
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Deliverables */}
      <section>
        <h2 className="text-headline text-text mb-3 flex items-baseline gap-2">
          Deliverables
          <span className="text-text-subtle font-normal text-[14px] tabular-nums">
            {topic.deliverables.length}
          </span>
        </h2>
        <div className="space-y-2">
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
                className="rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors"
              >
                <div className="px-4 py-3 flex items-center gap-3">
                  <span className="shrink-0">
                    {isAired ? (
                      <CheckCircle2 className="w-4 h-4 text-accent" strokeWidth={1.75} />
                    ) : d.status === "review" ? (
                      <CircleDot className="w-4 h-4 text-warn" strokeWidth={1.75} />
                    ) : (
                      <Clock className="w-4 h-4 text-text-subtle" strokeWidth={1.75} />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-medium text-text">
                        {DELIVERABLE_TYPE_LABEL[d.type]}
                      </span>
                      <DeliverableStatusBadge status={d.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[13px] text-text-muted flex-wrap">
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
                              <ExternalLink className="w-3 h-3" />
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
                          <span className="text-text-subtle">·</span>
                          <span>Waiting on {assignee.name}</span>
                        </>
                      )}
                      {d.airedAt && (
                        <>
                          <span className="text-text-subtle">·</span>
                          <span>{formatRelativeTime(d.airedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {d.status === "review" && (
                    <Link
                      href={`/topics/${topic.id}/approve/${d.id}`}
                      className="text-[13px] font-medium px-3 py-1.5 rounded-full bg-warn-bg text-warn hover:opacity-88 transition-opacity"
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
