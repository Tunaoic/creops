"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Plus,
  LayoutGrid,
  Calendar,
  Settings,
  ExternalLink,
  ArrowRight,
  FolderOpen,
  CircleDot,
} from "lucide-react";
import type { Topic } from "@/types";
import { DELIVERABLE_TYPE_LABEL } from "@/types";

export function CommandPalette({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-surface rounded-xl border border-border-strong shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px var(--border-strong)" }}
          >
            <Command className="flex flex-col" loop>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-text-subtle" />
                <Command.Input
                  placeholder="Search topics, deliverables, run commands..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-subtle text-text"
                  autoFocus
                />
                <kbd className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-text-subtle border border-border">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="text-sm text-text-subtle text-center py-5">
                  No results.
                </Command.Empty>

                <Command.Group heading="Quick Actions">
                  <Item
                    onSelect={() => go("/topics/new")}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    label="Create new topic"
                    hint="⌘N"
                  />
                  <Item
                    onSelect={() => go("/board")}
                    icon={<LayoutGrid className="w-3.5 h-3.5" />}
                    label="Open Kanban board"
                    hint="⌘B"
                  />
                  <Item
                    onSelect={() => go("/timeline")}
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    label="Open timeline view"
                  />
                  <Item
                    onSelect={() => go("/settings")}
                    icon={<Settings className="w-3.5 h-3.5" />}
                    label="Open settings"
                    hint="⌘,"
                  />
                </Command.Group>

                {topics.length > 0 && (
                  <Command.Group heading="Topics">
                    {topics.slice(0, 12).map((t) => (
                      <Item
                        key={t.id}
                        value={`topic-${t.id}-${t.name}`}
                        onSelect={() => go(`/topics/${t.id}`)}
                        icon={<FolderOpen className="w-3.5 h-3.5" />}
                        label={t.name}
                        right={
                          <span className="text-[11px] font-mono uppercase text-text-subtle tracking-wider">
                            {t.deliverables.length} deliverables
                          </span>
                        }
                      />
                    ))}
                  </Command.Group>
                )}

                {topics.length > 0 && (
                  <Command.Group heading="Deliverables Needing Review">
                    {topics
                      .flatMap((t) =>
                        t.deliverables
                          .filter((d) => d.status === "review")
                          .map((d) => ({ topic: t, deliverable: d }))
                      )
                      .slice(0, 8)
                      .map(({ topic, deliverable }) => (
                        <Item
                          key={deliverable.id}
                          value={`review-${deliverable.id}-${topic.name}`}
                          onSelect={() =>
                            go(`/topics/${topic.id}/approve/${deliverable.id}`)
                          }
                          icon={<CircleDot className="w-3.5 h-3.5 text-warn" />}
                          label={`${topic.name} → ${DELIVERABLE_TYPE_LABEL[deliverable.type]}`}
                          right={
                            <span className="text-[11px] font-mono uppercase text-warn tracking-wider">
                              REVIEW
                            </span>
                          }
                        />
                      ))}
                  </Command.Group>
                )}
              </Command.List>

              <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-bg/50 text-[11px] font-mono text-text-subtle">
                <span>CreOps v0.2</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 rounded bg-surface-elevated border border-border">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 rounded bg-surface-elevated border border-border">↵</kbd>
                    select
                  </span>
                </div>
              </div>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}

function Item({
  onSelect,
  icon,
  label,
  hint,
  right,
  value,
}: {
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  right?: React.ReactNode;
  value?: string;
}) {
  return (
    <Command.Item
      value={value ?? label}
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-surface-hover aria-selected:border-l-2 aria-selected:border-accent text-text-muted aria-selected:text-text transition-colors"
    >
      <span className="text-text-subtle">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {right}
      {hint && (
        <kbd className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-text-subtle border border-border">
          {hint}
        </kbd>
      )}
    </Command.Item>
  );
}
