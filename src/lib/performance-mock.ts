/**
 * Deterministic mock data for the Performance dashboard demo.
 *
 * Until Phase 3c wires real metric ingestion, the dashboard renders
 * believable numbers — realistic shape, sane proportions, a Vietnamese
 * creator content mix. Numbers are pseudo-random but deterministic
 * (seeded by date+index) so a reload doesn't shuffle them and the
 * demo feels stable.
 *
 * When real metrics land, swap this for actual queries — the dashboard
 * component reads from a typed shape that mirrors what the real ones
 * will return.
 */

import type { SocialPlatform } from "@/types";

export type RangeKey = "7d" | "30d" | "90d";

export const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export interface DailyPoint {
  /** ISO date (YYYY-MM-DD) at midnight UTC */
  date: string;
  views: number;
  watchTimeMin: number;
}

export interface KpiSummary {
  totalViews: number;
  watchTimeMin: number;
  engagementPct: number;
  topicsAired: number;
  /** % change vs the immediately-previous period of equal length */
  deltaViews: number;
  deltaWatchTime: number;
  deltaEngagement: number;
  deltaTopics: number;
}

export interface TopTopic {
  id: string;
  name: string;
  platform: SocialPlatform;
  deliverableType: "long_video" | "short_video" | "thread" | "blog_post" | "long_post";
  views: number;
  /** Engagement rate as a fraction (0.084 = 8.4%) */
  engagementRate: number;
  airedDaysAgo: number;
}

export interface ChannelMix {
  platform: SocialPlatform;
  views: number;
  /** Share of total views, 0-100 */
  sharePct: number;
}

export interface PerformanceSnapshot {
  range: RangeKey;
  daily: DailyPoint[];
  kpi: KpiSummary;
  topTopics: TopTopic[];
  channelMix: ChannelMix[];
}

// ============================================================================
// Seeded pseudo-random — Mulberry32. Don't need cryptographic randomness,
// just a stable seed so the chart shape doesn't change between reloads.
// ============================================================================
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function rangeDays(range: RangeKey): number {
  return range === "7d" ? 7 : range === "30d" ? 30 : 90;
}

function generateDaily(range: RangeKey): DailyPoint[] {
  const days = rangeDays(range);
  const rand = mulberry32(2026_05_21 + days); // seed varies by range
  const out: DailyPoint[] = [];
  // Baseline grows slightly over time + weekly seasonality + noise.
  // Pretend "today" is May 21, 2026 (matches the demo context).
  const today = new Date(Date.UTC(2026, 4, 21));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const dayOfWeek = d.getUTCDay();
    // Saturday + Sunday spike (creator audience peaks weekends)
    const weekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1.4 : 1;
    // Slight upward trend across the window
    const trend = 1 + (days - i) / (days * 5);
    const noise = 0.75 + rand() * 0.6;
    const views = Math.round(2_400 * weekend * trend * noise);
    const watchTimeMin = Math.round(views * (0.35 + rand() * 0.25));
    out.push({
      date: d.toISOString().slice(0, 10),
      views,
      watchTimeMin,
    });
  }
  return out;
}

const TOPIC_NAMES = [
  "Build-in-public update — week 12",
  "Why we ditched Notion for a custom stack",
  "Side hustle math (the honest version)",
  "5 things I wish I knew before launching",
  "Behind the scenes: shipping in 24 hours",
  "Cold outreach script that booked 40 calls",
  "From 0 to 10k MRR — the chart everyone draws wrong",
  "Designer reacts to my $50 landing page",
];

const PLATFORMS: SocialPlatform[] = ["youtube", "tiktok", "instagram", "facebook"];

function generateTopTopics(rand: () => number, range: RangeKey): TopTopic[] {
  const days = rangeDays(range);
  const types = [
    "long_video",
    "short_video",
    "long_video",
    "short_video",
    "thread",
  ] as const;
  return TOPIC_NAMES.slice(0, 5).map((name, i) => {
    const platform = PLATFORMS[i % PLATFORMS.length];
    // Bigger views for earlier-aired (had more time to accumulate)
    const baseViews =
      [82_400, 54_800, 41_200, 28_900, 19_600][i] ?? 12_000;
    const wiggle = 0.85 + rand() * 0.3;
    return {
      id: `t_demo_${i}`,
      name,
      platform,
      deliverableType: types[i],
      views: Math.round(baseViews * wiggle),
      engagementRate: 0.04 + rand() * 0.09,
      airedDaysAgo: Math.floor(rand() * Math.max(days - 2, 1)) + 1,
    };
  });
}

function generateChannelMix(totalViews: number): ChannelMix[] {
  // Realistic mix for a multi-platform creator: YouTube leads, TikTok
  // second, IG/FB tail.
  const shares = [
    { platform: "youtube" as const, share: 0.62 },
    { platform: "tiktok" as const, share: 0.22 },
    { platform: "instagram" as const, share: 0.11 },
    { platform: "facebook" as const, share: 0.05 },
  ];
  return shares.map((s) => ({
    platform: s.platform,
    views: Math.round(totalViews * s.share),
    sharePct: Math.round(s.share * 1000) / 10,
  }));
}

export function getDemoPerformance(range: RangeKey): PerformanceSnapshot {
  const daily = generateDaily(range);
  const rand = mulberry32(rangeDays(range) * 7919);

  const totalViews = daily.reduce((s, d) => s + d.views, 0);
  const watchTimeMin = daily.reduce((s, d) => s + d.watchTimeMin, 0);

  // Pretend the previous period was 15-25% smaller (gentle growth story).
  const deltaViews = Math.round(8 + rand() * 18); // +8% to +26%
  const deltaWatchTime = Math.round(deltaViews * (0.8 + rand() * 0.4));
  const deltaEngagement = Math.round((rand() * 4 - 1) * 10) / 10; // -1.0 to +3.0
  const days = rangeDays(range);
  const topicsAired = Math.round(days * 0.4); // ~0.4 topics per day
  const deltaTopics = Math.round(rand() * 5) - 1;

  return {
    range,
    daily,
    kpi: {
      totalViews,
      watchTimeMin,
      engagementPct: Math.round((6 + rand() * 4) * 10) / 10, // 6.0% - 10.0%
      topicsAired,
      deltaViews,
      deltaWatchTime,
      deltaEngagement,
      deltaTopics,
    },
    topTopics: generateTopTopics(rand, range),
    channelMix: generateChannelMix(totalViews),
  };
}
