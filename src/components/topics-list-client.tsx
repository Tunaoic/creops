"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import {
  TopicStatusBadge,
  ProgressDots,
} from "@/components/status-badge";
import { DELIVERABLE_TYPE_LABEL, type Topic, type Channel, type TopicStatus } from "@/types";
import { cn } from "@/lib/utils";

const FILTERS: { label: string; value: TopicStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "In Production", value: "in_production" },
  { label: "Fully Aired", value: "fully_aired" },
  { label: "Drafts", value: "draft" },
  { label: "Archived", value: "archived" },
];

export function TopicsListClient({
  topics,
  channels,
}: {
  topics: Topic[];
  channels: Channel[];
}) {
  const [filter, setFilter] = useState<TopicStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = topics;
    if (filter !== "all") {
      list = list.filter((t) => t.status === filter);
    }
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">All Topics</h1>
          <p className="text-sm text-text-muted mt-1">
            {topics.length} topics total
          </p>
        </div>
        <Link
          href="/topics/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> New Topic
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics, briefs..."
            className="w-full pl-8 pr-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors",
                filter === f.value
                  ? "bg-accent text-accent-fg"
                  : "text-text-muted hover:bg-surface-hover"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-subtle italic py-4 text-center">
          {topics.length === 0
            ? "Chưa có topic nào. Click + New Topic để bắt đầu."
            : "No topics match — try a different filter."}
        </p>
      ) : (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          {filtered.map((topic, idx) => {
            const total = topic.deliverables.length;
            const aired = topic.deliverables.filter(
              (d) => d.status === "aired"
            ).length;
            const channelsAired = topic.deliverables.flatMap((d) =>
              d.channels.filter((c) => c.airedAt)
            ).length;
            return (
              <Link
                key={topic.id}
                href={`/topics/${topic.id}`}
                className={cn(
                  "block px-4 py-3 hover:bg-surface-hover transition-colors",
                  idx > 0 && "border-t border-border"
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {topic.name}
                      </span>
                      <TopicStatusBadge status={topic.status} />
                    </div>
                    {topic.brief && (
                      <p className="text-xs text-text-muted truncate">
                        {topic.brief}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {total > 0 && (
                      <div className="flex items-center gap-2">
                        <ProgressDots total={total} done={aired} />
                        <span className="text-xs text-text-muted">
                          {aired}/{total}
                        </span>
                      </div>
                    )}
                    {channelsAired > 0 && (
                      <span className="text-xs text-success">
                        {channelsAired} channels aired
                      </span>
                    )}
                  </div>
                </div>
                {topic.deliverables.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {topic.deliverables.map((d) => (
                      <span
                        key={d.id}
                        className="text-xs px-1.5 py-0.5 rounded bg-bg border border-border text-text-muted"
                      >
                        {DELIVERABLE_TYPE_LABEL[d.type]}
                        {d.channels.length > 1 && ` (${d.channels.length})`}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
