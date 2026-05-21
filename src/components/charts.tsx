/**
 * Hand-rolled SVG chart primitives — no chart library.
 *
 * Why no library: Recharts/visx/chart.js are 80-200KB gzipped each and
 * pull in React-on-React rendering layers. For the small set of shapes
 * the dashboard needs (area + sparkline + horizontal bar), a few SVG
 * paths cost <2KB and give us full control over the Apple HIG
 * aesthetic — thin strokes, soft fills, no chartjunk.
 *
 * All components are server-renderable (no client state) and theme-
 * aware via CSS custom properties (text-accent, border, etc.).
 */

import { cn } from "@/lib/utils";

// ============================================================================
// AreaChart — smooth curve + soft fill underneath. Used for the
// main "views over time" trend.
// ============================================================================

interface AreaChartProps {
  /** Y values, evenly spaced along X. */
  data: number[];
  /** Optional x-axis labels (rendered as a thin row underneath). */
  xLabels?: string[];
  height?: number;
  /** Stroke color CSS custom property reference; default = --accent. */
  strokeVar?: string;
  /** Class applied to the outer wrapper. */
  className?: string;
}

export function AreaChart({
  data,
  xLabels,
  height = 200,
  strokeVar = "var(--accent)",
  className,
}: AreaChartProps) {
  if (data.length < 2) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-text-subtle text-[13px]",
          className
        )}
        style={{ height }}
      >
        Not enough data
      </div>
    );
  }

  // viewBox in 0-1000 wide × 0-300 tall — caller-independent scale.
  const W = 1000;
  const H = 300;
  const padX = 8;
  const padY = 12;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(max - min, 1);

  // Map each point to viewBox space.
  const pts = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * innerW;
    const y = padY + innerH - ((v - min) / range) * innerH;
    return [x, y] as const;
  });

  // Smooth using Catmull-Rom → cubic bezier conversion.
  // (Tighter curve = smaller k value. 0.5 looks natural.)
  const pathD = catmullRomToBezier(pts, 0.4);

  // Closed area = curve + drop to baseline + back to start.
  const baselineY = padY + innerH;
  const areaD = `${pathD} L${pts[pts.length - 1][0]},${baselineY} L${pts[0][0]},${baselineY} Z`;

  // Gridline ticks — 3 horizontal lines for visual rhythm without noise.
  const gridY = [0.25, 0.5, 0.75].map((p) => padY + innerH * p);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Trend chart"
      >
        {/* Gridlines */}
        {gridY.map((y) => (
          <line
            key={y}
            x1={padX}
            x2={W - padX}
            y1={y}
            y2={y}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="2 6"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Area fill */}
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeVar} stopOpacity="0.18" />
            <stop offset="100%" stopColor={strokeVar} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#area-grad)" />

        {/* Line on top */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeVar}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Last-point dot — anchors the eye to the latest value */}
        <circle
          cx={pts[pts.length - 1][0]}
          cy={pts[pts.length - 1][1]}
          r={4}
          fill={strokeVar}
        />
      </svg>

      {xLabels && (
        <div className="flex justify-between mt-2 px-2 text-[11px] text-text-subtle">
          {pickEvenly(xLabels, 5).map((label, i) => (
            <span key={`${label}-${i}`}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sparkline — compact inline trend, used inside KPI cards.
// ============================================================================

export function Sparkline({
  data,
  width = 100,
  height = 28,
  strokeVar = "var(--accent)",
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  strokeVar?: string;
  className?: string;
}) {
  if (data.length < 2) return null;
  const W = width;
  const H = height;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(max - min, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 2) - 1; // 1px pad so stroke doesn't clip
    return [x, y] as const;
  });
  const d = catmullRomToBezier(pts, 0.4);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className={className}
      role="img"
      aria-label="Sparkline"
    >
      <path
        d={d}
        fill="none"
        stroke={strokeVar}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// HorizontalBar — single bar with label, used in channel mix breakdown.
// Pure HTML/CSS so it stays accessible and themable.
// ============================================================================

export function HorizontalBar({
  label,
  value,
  pct,
  colorVar,
  rightLabel,
}: {
  label: string;
  value: string;
  pct: number; // 0-100
  colorVar: string;
  rightLabel?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-medium text-text">{label}</span>
        <span className="tabular-nums text-text-muted">
          {value}
          {rightLabel ? (
            <span className="text-text-subtle ml-1.5">{rightLabel}</span>
          ) : null}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-bg overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.max(2, Math.min(100, pct))}%`,
            background: colorVar,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/** Convert a polyline of points into a smooth cubic bezier SVG path. */
function catmullRomToBezier(
  pts: readonly (readonly [number, number])[],
  tension = 0.5
): string {
  if (pts.length < 2) return "";
  const k = tension;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * k * 2;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * k * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * k * 2;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * k * 2;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Pick N evenly-spaced items from a list (preserving first + last). */
function pickEvenly<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i / (n - 1)) * (items.length - 1));
    out.push(items[idx]);
  }
  return out;
}
