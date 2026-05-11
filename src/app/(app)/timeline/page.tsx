import Link from "next/link";
import { CalendarDays, ArrowLeft } from "lucide-react";
import { getAllTopics } from "@/db/queries";
import { CHANNEL_LABEL, DELIVERABLE_TYPE_LABEL } from "@/types";
import { getAllChannels } from "@/db/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const [topics, channels] = await Promise.all([getAllTopics(), getAllChannels()]);
  const channelMap = new Map(channels.map((c) => [c.id, c]));

  // Group deliverables by week (aired or due date)
  const items = topics.flatMap((t) =>
    t.deliverables.flatMap((d) =>
      d.channels.map((dc) => ({
        topic: t,
        deliverable: d,
        channel: channelMap.get(dc.channelId),
        airedAt: dc.airedAt,
        airedLink: dc.airedLink,
        targetDate: t.targetPublishDate,
      }))
    )
  );

  // Sort by aired date desc, then by target date asc
  const sorted = items.sort((a, b) => {
    if (a.airedAt && b.airedAt) return b.airedAt.localeCompare(a.airedAt);
    if (a.airedAt) return -1;
    if (b.airedAt) return 1;
    return (a.targetDate ?? "").localeCompare(b.targetDate ?? "");
  });

  // Group by date string
  const groups = new Map<string, typeof sorted>();
  for (const item of sorted) {
    const date = item.airedAt
      ? new Date(item.airedAt).toISOString().slice(0, 10)
      : item.targetDate ?? "—";
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(item);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-surface/40 px-6 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-1">
            VIEW <span className="text-accent">·</span> TIMELINE
          </div>
          <h1 className="text-base font-semibold flex items-center gap-2">
            Schedule
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted">
              {sorted.length} items
            </span>
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 max-w-4xl mx-auto w-full">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[88px] top-0 bottom-0 w-px bg-border" />

          {Array.from(groups.entries()).map(([date, dayItems]) => (
            <div key={date} className="mb-4 flex gap-4">
              {/* Date column */}
              <div className="w-[80px] shrink-0 text-right">
                <div className="text-[12px] font-mono text-text-subtle uppercase">
                  {date === "—" ? "Unscheduled" : formatDate(date)}
                </div>
                <div className="text-[10px] font-mono text-text-subtle/60 mt-0.5">
                  {date !== "—" && date}
                </div>
              </div>

              {/* Dot */}
              <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_var(--accent)] mt-1.5 shrink-0 relative left-[-4px]" />

              {/* Items */}
              <div className="flex-1 space-y-2">
                {dayItems.map((item, i) => (
                  <Link
                    key={i}
                    href={`/topics/${item.topic.id}`}
                    className="block bg-surface rounded border border-border hover:border-border-strong p-3 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-text-subtle">
                        {item.airedAt ? "AIRED" : "DUE"}
                      </span>
                      <span className="text-[14px] font-medium">{item.topic.name}</span>
                    </div>
                    <div className="text-[12px] font-mono text-text-muted flex items-center gap-2">
                      <span>{DELIVERABLE_TYPE_LABEL[item.deliverable.type]}</span>
                      <span className="text-text-subtle">→</span>
                      <span className={item.airedLink ? "text-accent" : "text-text-subtle"}>
                        {item.channel ? CHANNEL_LABEL[item.channel.platform] : "?"}
                      </span>
                      {item.airedLink && <span className="text-accent">✓</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
