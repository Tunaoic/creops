"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Plus, Loader2, Check, X } from "lucide-react";
import { addWatcher, removeWatcher } from "@/db/actions";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

/**
 * WatchersPanel — Apple-style chip + dropdown.
 *
 * Lets the current user (and anyone with access) opt in/out of receiving
 * notifications on this topic or task. Watcher = passive subscriber to
 * every progress event (submit/approve/reject/aired). Optional — empty
 * by default. Topic creator is implicitly always notified, separately.
 *
 * Self-actions: clicking the eye icon toggles the current user's own
 * watch state (most common case). The dropdown also lets you add/remove
 * other team members as watchers.
 */
export function WatchersPanel({
  target,
  targetId,
  watcherIds,
  members,
  currentUserId,
  locale = "en",
}: {
  target: "topic" | "task";
  targetId: string;
  watcherIds: string[];
  members: User[];
  currentUserId: string;
  locale?: "en" | "vi";
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

  const watcherSet = new Set(watcherIds);
  const watchers = members.filter((m) => watcherSet.has(m.id));
  const youAreWatching = watcherSet.has(currentUserId);

  function toggleSelf() {
    startTransition(async () => {
      if (youAreWatching) {
        await removeWatcher(target, targetId, currentUserId);
      } else {
        await addWatcher(target, targetId, currentUserId);
      }
      router.refresh();
    });
  }

  function toggle(userId: string) {
    startTransition(async () => {
      if (watcherSet.has(userId)) {
        await removeWatcher(target, targetId, userId);
      } else {
        await addWatcher(target, targetId, userId);
      }
      router.refresh();
    });
  }

  const labels = {
    watching: locale === "vi" ? "Đang theo dõi" : "Watching",
    notWatching: locale === "vi" ? "Theo dõi" : "Watch",
    title: locale === "vi" ? "Người theo dõi" : "Watchers",
    description:
      locale === "vi"
        ? "Watcher nhận noti khi có thay đổi (submit / duyệt / từ chối / đăng)."
        : "Watchers get a notification on every progress event (submit / approve / reject / aired).",
    addWatcher: locale === "vi" ? "Thêm người theo dõi" : "Add watcher",
    noOthers: locale === "vi" ? "Không còn ai để thêm" : "No more members to add",
    none: locale === "vi" ? "Chưa có watcher" : "No watchers yet",
  };

  const others = members.filter((m) => m.id !== currentUserId);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full border transition-colors text-[13px]",
          youAreWatching
            ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/15"
            : "border-border bg-surface hover:bg-surface-hover text-text-muted hover:text-text"
        )}
        title={labels.title}
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : youAreWatching ? (
          <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
        ) : (
          <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />
        )}
        <span className="font-medium">
          {youAreWatching ? labels.watching : labels.notWatching}
        </span>
        {watchers.length > 0 && (
          <span className="text-text-subtle tabular-nums">{watchers.length}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[300px] bg-surface rounded-xl border border-border shadow-2xl z-40 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-border">
            <div className="text-[13px] font-medium text-text">{labels.title}</div>
            <div className="text-[12px] text-text-muted mt-0.5 leading-snug">
              {labels.description}
            </div>
          </div>

          {/* Self toggle row */}
          <button
            type="button"
            onClick={toggleSelf}
            disabled={pending}
            className="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-surface-hover transition-colors border-b border-border"
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium border",
              youAreWatching ? "bg-accent/15 border-accent/40 text-accent" : "bg-surface-elevated border-border text-text"
            )}>
              {(members.find((m) => m.id === currentUserId)?.name[0] ?? "?").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-text">
                {locale === "vi" ? "Bạn" : "You"}
              </div>
              <div className="text-[12px] text-text-muted">
                {youAreWatching
                  ? locale === "vi" ? "Đang theo dõi" : "Watching"
                  : locale === "vi" ? "Bấm để theo dõi" : "Click to watch"}
              </div>
            </div>
            {youAreWatching && <Check className="w-4 h-4 text-accent" />}
          </button>

          {/* Other members */}
          <div className="max-h-[280px] overflow-y-auto">
            {others.length === 0 ? (
              <div className="px-3.5 py-3 text-[13px] text-text-subtle">
                {labels.noOthers}
              </div>
            ) : (
              others.map((m) => {
                const isWatching = watcherSet.has(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.id)}
                    disabled={pending}
                    className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-surface-hover transition-colors"
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium border",
                      isWatching ? "bg-accent/15 border-accent/40 text-accent" : "bg-surface-elevated border-border text-text"
                    )}>
                      {m.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] truncate text-text">{m.name}</div>
                    </div>
                    {isWatching ? (
                      <X className="w-3.5 h-3.5 text-text-subtle" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-text-subtle" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
