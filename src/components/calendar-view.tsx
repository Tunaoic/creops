"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Filter,
  ListTodo,
  Radio,
  User as UserIcon,
} from "lucide-react";
import {
  CHANNEL_LABEL,
  type Channel,
  type ChannelPlatform,
  type TaskStatus,
  type User,
} from "@/types";
import type { ScheduledItem, ProductionItem } from "@/db/queries";
import { cn } from "@/lib/utils";

const CHANNEL_COLOR: Partial<Record<ChannelPlatform, string>> = {
  youtube: "bg-red-500/15 text-red-400 border-red-500/40",
  youtube_shorts: "bg-red-500/15 text-red-400 border-red-500/40",
  tiktok: "bg-pink-500/15 text-pink-400 border-pink-500/40",
  ig_reel: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/40",
  fb_group: "bg-sky-500/15 text-sky-400 border-sky-500/40",
  fb_page: "bg-sky-500/15 text-sky-400 border-sky-500/40",
  linkedin: "bg-blue-500/15 text-blue-400 border-blue-500/40",
  x_twitter: "bg-stone-500/15 text-stone-300 border-stone-500/40",
  blog: "bg-amber-500/15 text-amber-400 border-amber-500/40",
};

const TASK_COLOR: Record<TaskStatus, string> = {
  todo: "bg-surface-elevated text-text-muted border-border-strong",
  in_progress: "bg-info-bg text-info border-info/40",
  submitted: "bg-warn-bg text-warn-text border-warn-border",
  approved: "bg-success-bg text-success border-success/40",
  rejected: "bg-danger-bg text-danger border-danger/40",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Mode = "air" | "production";

export function CalendarView({
  airItems,
  prodItems,
  channels,
  users,
  currentUserId,
  month,
  year,
  initialMode = "air",
  initialMine = false,
}: {
  airItems: ScheduledItem[];
  prodItems: ProductionItem[];
  channels: Channel[];
  users: User[];
  currentUserId: string;
  month: number;
  year: number;
  initialMode?: Mode;
  initialMine?: boolean;
}) {
  const channelMap = useMemo(
    () => new Map(channels.map((c) => [c.id, c])),
    [channels]
  );
  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users]
  );
  const [mode, setMode] = useState<Mode>(initialMode);
  const [mineOnly, setMineOnly] = useState<boolean>(initialMine);
  const [filterPlatform, setFilterPlatform] = useState<ChannelPlatform | "all">("all");

  // Build month grid (Mon-first)
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const weeks: Array<Array<{ day: number; iso: string } | null>> = [];

    let current: Array<{ day: number; iso: string } | null> = [];
    for (let i = 0; i < firstWeekday; i++) current.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      current.push({ day, iso });
      if (current.length === 7) {
        weeks.push(current);
        current = [];
      }
    }
    while (current.length > 0 && current.length < 7) current.push(null);
    if (current.length > 0) weeks.push(current);
    return weeks;
  }, [month, year]);

  // Group items by date based on current mode
  const itemsByDate = useMemo(() => {
    const map = new Map<string, Array<AirCell | ProdCell>>();
    if (mode === "air") {
      for (const item of airItems) {
        const ch = channelMap.get(item.channelId);
        if (filterPlatform !== "all" && ch?.platform !== filterPlatform) continue;
        const arr = map.get(item.date) ?? [];
        arr.push({ kind: "air", item });
        map.set(item.date, arr);
      }
    } else {
      for (const item of prodItems) {
        if (mineOnly && !item.assigneeIds.includes(currentUserId)) continue;
        const arr = map.get(item.date) ?? [];
        arr.push({ kind: "prod", item });
        map.set(item.date, arr);
      }
    }
    return map;
  }, [mode, mineOnly, airItems, prodItems, filterPlatform, channelMap, currentUserId]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;
  let monthCount = 0;
  for (const [date, arr] of itemsByDate) {
    if (date >= monthStart && date <= monthEnd) monthCount += arr.length;
  }

  // Prev/next month nav (preserve filters via query string)
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const qs = (m: number, y: number) =>
    `m=${m}&y=${y}&mode=${mode}${mineOnly ? "&mine=1" : ""}`;

  // Distinct platforms in air items (filter chips)
  const platformsInItems = useMemo(
    () =>
      Array.from(
        new Set(
          airItems
            .map((i) => channelMap.get(i.channelId)?.platform)
            .filter((p): p is ChannelPlatform => Boolean(p))
        )
      ),
    [airItems, channelMap]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border bg-surface/40 px-6 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-1">
            <CalendarDays className="w-3 h-3" /> CALENDAR · {mode.toUpperCase()}
          </div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            {MONTHS[month]} {year}
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted">
              {monthCount} {mode === "air" ? "scheduled" : "due"}
            </span>
          </h1>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 bg-bg/40 rounded border border-border p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setMode("air")}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-mono uppercase tracking-wider transition-colors",
              mode === "air"
                ? "bg-accent/15 text-accent border border-accent/40"
                : "text-text-subtle hover:text-text border border-transparent"
            )}
            title="Show scheduled & aired publish dates"
          >
            <Radio className="w-3 h-3" />
            Air
          </button>
          <button
            type="button"
            onClick={() => setMode("production")}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-mono uppercase tracking-wider transition-colors",
              mode === "production"
                ? "bg-info-bg text-info border border-info/40"
                : "text-text-subtle hover:text-text border border-transparent"
            )}
            title="Show task due dates"
          >
            <ListTodo className="w-3 h-3" />
            Production
          </button>
        </div>

        <div className="flex items-center gap-2">
          {mode === "production" && (
            <button
              type="button"
              onClick={() => setMineOnly((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1.5 rounded border text-[12px] font-mono transition-colors",
                mineOnly
                  ? "border-accent text-accent bg-accent/5"
                  : "border-border bg-surface text-text-subtle hover:text-text hover:border-border-strong"
              )}
              title="Show only tasks assigned to current user"
            >
              <UserIcon className="w-3 h-3" />
              MINE
            </button>
          )}
          <Link
            href={`/calendar?${qs(prevMonth, prevYear)}`}
            className="p-1.5 rounded border border-border bg-surface hover:border-border-strong text-text-muted hover:text-text"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/calendar?mode=${mode}${mineOnly ? "&mine=1" : ""}`}
            className="px-2.5 py-1.5 rounded border border-border bg-surface hover:border-accent text-[12px] font-mono text-text-muted hover:text-text"
          >
            Today
          </Link>
          <Link
            href={`/calendar?${qs(nextMonth, nextYear)}`}
            className="p-1.5 rounded border border-border bg-surface hover:border-border-strong text-text-muted hover:text-text"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter chips (AIR mode only) */}
      {mode === "air" && platformsInItems.length > 1 && (
        <div className="border-b border-border bg-bg/40 px-6 py-2 flex items-center gap-2 overflow-x-auto">
          <Filter className="w-3 h-3 text-text-subtle shrink-0" />
          <button
            type="button"
            onClick={() => setFilterPlatform("all")}
            className={cn(
              "text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border transition-colors",
              filterPlatform === "all"
                ? "border-accent text-accent bg-accent/5"
                : "border-transparent text-text-subtle hover:text-text"
            )}
          >
            ALL
          </button>
          {platformsInItems.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPlatform(p)}
              className={cn(
                "text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border transition-colors whitespace-nowrap",
                filterPlatform === p
                  ? "border-accent text-accent bg-accent/5"
                  : "border-transparent text-text-subtle hover:text-text"
              )}
            >
              {CHANNEL_LABEL[p]}
            </button>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-7 gap-px mb-px">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-text-subtle px-2 py-1.5"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden border border-border">
          {grid.flat().map((cell, i) => {
            if (!cell) {
              return <div key={i} className="bg-bg/50 min-h-[110px]" />;
            }
            const dayItems = itemsByDate.get(cell.iso) ?? [];
            const isToday = cell.iso === todayIso;
            const isPast = cell.iso < todayIso;
            return (
              <div
                key={i}
                className={cn(
                  "bg-surface min-h-[110px] p-1.5 flex flex-col gap-1 transition-colors",
                  isToday && "bg-accent/5 ring-1 ring-accent ring-inset",
                  isPast && !isToday && "bg-bg/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[11px] font-mono font-semibold tabular-nums",
                      isToday
                        ? "text-accent"
                        : isPast
                          ? "text-text-subtle"
                          : "text-text-muted"
                    )}
                  >
                    {cell.day}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="text-[9px] font-mono text-text-subtle">
                      {dayItems.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayItems.slice(0, 3).map((cellItem, j) => {
                    if (cellItem.kind === "air") {
                      const item = cellItem.item;
                      const ch = channelMap.get(item.channelId);
                      if (!ch) return null;
                      const colorClass =
                        CHANNEL_COLOR[ch.platform] ??
                        "bg-surface-elevated text-text-muted border-border";
                      return (
                        <Link
                          key={j}
                          href={item.airedLink ?? `/topics/${item.topic.id}`}
                          target={item.airedLink ? "_blank" : undefined}
                          rel={item.airedLink ? "noopener noreferrer" : undefined}
                          className={cn(
                            "block text-[10px] font-medium px-1 py-0.5 rounded border truncate hover:opacity-90 transition-opacity",
                            colorClass
                          )}
                          title={`${item.topic.name} → ${CHANNEL_LABEL[ch.platform]} (${item.status})`}
                        >
                          <div className="flex items-center gap-1">
                            {item.status === "aired" ? (
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                            )}
                            <span className="truncate">{item.topic.name}</span>
                          </div>
                        </Link>
                      );
                    }
                    // prod cell
                    const p = cellItem.item;
                    const colorClass = TASK_COLOR[p.status];
                    const initials = p.assigneeIds
                      .map((id) => userMap.get(id)?.name[0]?.toUpperCase())
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("");
                    return (
                      <Link
                        key={j}
                        href={`/topics/${p.topic.id}/tasks/${p.task.id}`}
                        className={cn(
                          "block text-[10px] font-medium px-1 py-0.5 rounded border truncate hover:opacity-90 transition-opacity",
                          colorClass
                        )}
                        title={`${p.topic.name} · ${p.task.templateItemKey.replace(/_/g, " ")}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="truncate flex-1 capitalize">
                            {p.task.templateItemKey.replace(/_/g, " ")}
                          </span>
                          {initials && (
                            <span className="font-mono text-[8px] opacity-80 shrink-0">
                              {initials}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <div className="text-[9px] font-mono text-text-subtle px-1">
                      +{dayItems.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-text-subtle flex-wrap">
          {mode === "air" ? (
            <>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>SCHEDULED</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-accent" />
                <span>AIRED</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <span>Color = platform</span>
              </div>
            </>
          ) : (
            <>
              <span className="px-1 py-0.5 rounded border bg-surface-elevated text-text-muted border-border-strong">
                TODO
              </span>
              <span className="px-1 py-0.5 rounded border bg-info-bg text-info border-info/40">
                DOING
              </span>
              <span className="px-1 py-0.5 rounded border bg-warn-bg text-warn-text border-warn-border">
                REVIEW
              </span>
              <span className="ml-auto">Color = task status · Initials = assignees</span>
            </>
          )}
        </div>

        {/* Empty state */}
        {monthCount === 0 && (
          <div className="text-center py-8 text-[13px] text-text-subtle italic">
            {mode === "air"
              ? `Chưa có schedule nào trong ${MONTHS[month]} {year}.`
              : mineOnly
                ? "Bạn không có task nào due trong tháng này."
                : "Không có task nào có due date trong tháng này."}
            <br />
            <span className="text-[12px]">
              {mode === "air"
                ? "Approve schedule_time tasks → aired sẽ tự lên."
                : "Set due date trên task để chúng hiện ở đây."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

type AirCell = { kind: "air"; item: ScheduledItem };
type ProdCell = { kind: "prod"; item: ProductionItem };
