"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Eye,
  FileText,
  Flame,
  Heart,
  Info,
  Plug,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import {
  AreaChart,
  HorizontalBar,
  Sparkline,
} from "@/components/charts";
import {
  RANGE_LABEL,
  type PerformanceSnapshot,
  type RangeKey,
  type TopTopic,
} from "@/lib/performance-mock";
import { cn } from "@/lib/utils";
import type { SocialPlatform } from "@/types";

/**
 * The Performance dashboard — Apple HIG-flavored reporting view.
 *
 * Composition:
 *   1. Header — title + range selector (rendered as Link tabs so server
 *      state stays in URL, no client state needed for the swap)
 *   2. Demo banner — shown until at least one real (status="active")
 *      account exists. Sets honest expectations.
 *   3. KPI row — 4 cards (Views, Watch time, Engagement, Topics aired)
 *      with delta vs previous period + sparklines drawn from daily data
 *   4. Trend chart — area chart, views over time
 *   5. Top topics — ranked list with platform glyphs + engagement
 *   6. Channel mix — horizontal bars per platform
 *
 * Mock data shape mirrors the real one we'll wire in Phase 3c so the
 * swap is a single import change.
 */
export function PerformanceClient({
  snapshot,
  hasRealConnections,
}: {
  snapshot: PerformanceSnapshot;
  hasRealConnections: boolean;
}) {
  const { range, daily, kpi, topTopics, channelMix } = snapshot;

  // Sparkline data slice — last N points of each series.
  const sparkViews = daily.map((d) => d.views);
  const sparkWatch = daily.map((d) => d.watchTimeMin);

  // X-axis labels for the trend chart — month/day short form.
  const xLabels = daily.map((d) => {
    const [, m, day] = d.date.split("-").map(Number);
    return `${m}/${day}`;
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-title-2 text-text flex items-center gap-2.5">
            <TrendingUp
              className="w-6 h-6 text-text-muted"
              strokeWidth={1.5}
            />
            Performance
          </h1>
          <p className="text-[14px] text-text-muted mt-1">
            How your content is doing across every connected channel.
          </p>
        </div>
        <RangeTabs current={range} />
      </div>

      {/* Demo banner — shown while no real connection exists */}
      {!hasRealConnections && (
        <div className="rounded-2xl border border-warn-border bg-warn-bg/40 px-4 py-3 text-[13px] text-warn-text flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} />
          <div className="flex-1">
            <strong className="font-semibold">
              You&apos;re viewing demo data.
            </strong>{" "}
            Connect a channel to see your real numbers here.
          </div>
          <Link
            href="/connections"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-warn-text hover:underline shrink-0"
          >
            <Plug className="w-3.5 h-3.5" strokeWidth={2} />
            Connect a platform
          </Link>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total views"
          value={formatBigNumber(kpi.totalViews)}
          delta={kpi.deltaViews}
          deltaSuffix="%"
          icon={Eye}
          spark={sparkViews}
        />
        <KpiCard
          label="Watch time"
          value={formatHours(kpi.watchTimeMin)}
          delta={kpi.deltaWatchTime}
          deltaSuffix="%"
          icon={Video}
          spark={sparkWatch}
        />
        <KpiCard
          label="Engagement"
          value={`${kpi.engagementPct}%`}
          delta={kpi.deltaEngagement}
          deltaSuffix="pp"
          icon={Heart}
          deltaIsAbsolute
        />
        <KpiCard
          label="Topics aired"
          value={kpi.topicsAired.toString()}
          delta={kpi.deltaTopics}
          deltaSuffix=""
          icon={FileText}
          deltaIsAbsolute
        />
      </div>

      {/* Trend chart */}
      <section className="bg-surface rounded-2xl border border-border p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-headline text-text">Views over time</h2>
          <span className="text-[12px] text-text-subtle">
            {RANGE_LABEL[range]}
          </span>
        </div>
        <AreaChart data={sparkViews} xLabels={xLabels} height={220} />
      </section>

      {/* Top topics + channel mix — side by side on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3">
        <section className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-baseline justify-between">
            <h2 className="text-headline text-text flex items-center gap-2">
              <Flame
                className="w-4 h-4 text-text-muted"
                strokeWidth={1.75}
              />
              Top topics
            </h2>
            <span className="text-[12px] text-text-subtle">
              By views, this period
            </span>
          </div>
          <div className="divide-y divide-border">
            {topTopics.map((t, i) => (
              <TopTopicRow key={t.id} topic={t} rank={i + 1} />
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-headline text-text flex items-center gap-2">
              <BarChart3
                className="w-4 h-4 text-text-muted"
                strokeWidth={1.75}
              />
              Channel mix
            </h2>
          </div>
          <div className="space-y-3.5">
            {channelMix.map((c) => (
              <HorizontalBar
                key={c.platform}
                label={PLATFORM_LABEL[c.platform]}
                value={formatBigNumber(c.views)}
                pct={c.sharePct}
                rightLabel={`${c.sharePct}%`}
                colorVar={PLATFORM_COLOR[c.platform]}
              />
            ))}
          </div>
          <p className="text-[11px] text-text-subtle mt-5 pt-4 border-t border-border flex items-start gap-1.5">
            <Info className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={1.75} />
            Mix shifts toward platforms where your recent topics performed
            best.
          </p>
        </section>
      </div>
    </div>
  );
}

// ============================================================================
// Range tabs — Server-state pattern (Link with ?range=...)
// ============================================================================

function RangeTabs({ current }: { current: RangeKey }) {
  const options: RangeKey[] = ["7d", "30d", "90d"];
  return (
    <div className="inline-flex bg-surface border border-border rounded-full p-1 text-[13px]">
      {options.map((opt) => {
        const isCurrent = opt === current;
        return (
          <Link
            key={opt}
            href={`/performance?range=${opt}`}
            replace
            className={cn(
              "px-3 py-1 rounded-full transition-colors",
              isCurrent
                ? "bg-accent text-accent-fg font-medium"
                : "text-text-muted hover:text-text"
            )}
          >
            {opt === "7d" ? "7 days" : opt === "30d" ? "30 days" : "90 days"}
          </Link>
        );
      })}
    </div>
  );
}

// ============================================================================
// KPI card
// ============================================================================

function KpiCard({
  label,
  value,
  delta,
  deltaSuffix,
  deltaIsAbsolute = false,
  icon: Icon,
  spark,
}: {
  label: string;
  value: string;
  delta: number;
  deltaSuffix: string;
  deltaIsAbsolute?: boolean;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  spark?: number[];
}) {
  const positive = delta >= 0;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;
  // Format delta — percentage points use 1 decimal, raw counts use 0
  const deltaText = deltaIsAbsolute
    ? `${positive ? "+" : ""}${delta}${deltaSuffix}`
    : `${positive ? "+" : ""}${delta}${deltaSuffix}`;
  const deltaTone = positive ? "text-success" : "text-danger";

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-text-subtle font-semibold">
          {label}
        </span>
        <Icon className="w-3.5 h-3.5 text-text-subtle" strokeWidth={1.75} />
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[28px] font-semibold tabular-nums text-text leading-none">
          {value}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-[12px] font-medium tabular-nums",
            deltaTone
          )}
        >
          <Arrow className="w-3 h-3" strokeWidth={2.5} />
          {deltaText}
        </span>
        {spark && (
          <Sparkline
            data={spark}
            width={80}
            height={24}
            strokeVar={positive ? "var(--accent)" : "var(--danger)"}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Top topic row
// ============================================================================

function TopTopicRow({ topic, rank }: { topic: TopTopic; rank: number }) {
  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-surface-hover/50 transition-colors">
      <span className="w-6 text-[13px] font-semibold tabular-nums text-text-subtle shrink-0">
        {rank}
      </span>
      <PlatformDot platform={topic.platform} />
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-text truncate">
          {topic.name}
        </div>
        <div className="text-[12px] text-text-subtle mt-0.5">
          {PLATFORM_LABEL[topic.platform]}
          {" · "}
          {DELIVERABLE_LABEL[topic.deliverableType]}
          {" · "}
          {topic.airedDaysAgo}d ago
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[14px] font-semibold tabular-nums text-text">
          {formatBigNumber(topic.views)}
        </div>
        <div className="text-[11px] text-text-subtle tabular-nums">
          {(topic.engagementRate * 100).toFixed(1)}% engagement
        </div>
      </div>
    </div>
  );
}

function PlatformDot({ platform }: { platform: SocialPlatform }) {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ background: PLATFORM_COLOR[platform] }}
      aria-label={PLATFORM_LABEL[platform]}
    />
  );
}

// ============================================================================
// Constants — display metadata per platform.
// Color values use OKLCH for consistent perceptual brightness across
// light/dark themes (matches the platform brand without screaming).
// ============================================================================

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
};

const PLATFORM_COLOR: Record<SocialPlatform, string> = {
  youtube: "oklch(58% 0.21 25)",
  tiktok: "oklch(60% 0.18 200)",
  instagram: "oklch(60% 0.22 340)",
  facebook: "oklch(55% 0.20 260)",
};

const DELIVERABLE_LABEL: Record<TopTopic["deliverableType"], string> = {
  long_video: "Long video",
  short_video: "Short",
  thread: "Thread",
  blog_post: "Blog",
  long_post: "Long post",
};

// ============================================================================
// Formatters
// ============================================================================

function formatBigNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatHours(minutes: number): string {
  const h = minutes / 60;
  if (h >= 1_000) return `${(h / 1_000).toFixed(1)}K hrs`;
  return `${h.toFixed(0)} hrs`;
}
