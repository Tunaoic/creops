import { Activity } from "lucide-react";
import type { ActivityEntry } from "@/db/queries";
import type { User } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

const ACTION_LABEL: Record<string, string> = {
  "topic.created": "created topic",
  "task.assigned": "assigned task",
  "task.unassigned": "unassigned task",
  "task.submitted": "submitted task",
  "task.approved": "approved task",
  "task.rejected": "rejected task",
  "channel.aired": "marked aired",
};

const ACTION_COLOR: Record<string, string> = {
  "topic.created": "text-info",
  "task.assigned": "text-text-muted",
  "task.unassigned": "text-text-muted",
  "task.submitted": "text-warn",
  "task.approved": "text-accent",
  "task.rejected": "text-warn-text",
  "channel.aired": "text-accent",
};

export function ActivityFeed({
  entries,
  members,
}: {
  entries: ActivityEntry[];
  members: User[];
}) {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <section className="bg-surface rounded border border-border overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-bg/40 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-text-subtle" />
        <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-text-subtle">
          Activity
        </span>
        {entries.length > 0 && (
          <span className="text-[10px] font-mono text-text-subtle px-1.5 py-0.5 rounded bg-surface-elevated">
            {entries.length}
          </span>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="px-3 py-4 text-[12px] text-text-subtle italic text-center">
          No activity yet.
        </p>
      ) : (
        <div className="max-h-[360px] overflow-y-auto">
          <div className="relative pl-6 py-2">
            {/* Vertical timeline line */}
            <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />
            {entries.map((entry) => {
              const actor = entry.actorId ? memberMap.get(entry.actorId) : null;
              const label = ACTION_LABEL[entry.action] ?? entry.action;
              const color = ACTION_COLOR[entry.action] ?? "text-text-muted";
              const reason =
                typeof entry.metadata?.reason === "string"
                  ? (entry.metadata.reason as string)
                  : undefined;
              const link =
                typeof entry.metadata?.link === "string"
                  ? (entry.metadata.link as string)
                  : undefined;
              return (
                <div key={entry.id} className="relative py-1.5 group">
                  {/* Dot */}
                  <span
                    className={`absolute -left-[15px] top-2 w-1.5 h-1.5 rounded-full ${color.replace(
                      "text-",
                      "bg-"
                    )}`}
                    style={{
                      boxShadow: "0 0 0 3px var(--surface)",
                    }}
                  />
                  <div className="text-[12px] leading-tight">
                    <span className="font-medium">
                      {actor?.name ?? "Someone"}
                    </span>{" "}
                    <span className={`font-mono ${color}`}>{label}</span>
                  </div>
                  {reason && (
                    <div className="text-[11px] text-text-subtle italic mt-0.5">
                      "{reason}"
                    </div>
                  )}
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-info hover:underline truncate block mt-0.5"
                    >
                      {link}
                    </a>
                  )}
                  <div className="text-[10px] font-mono text-text-subtle mt-0.5">
                    {formatRelativeTime(entry.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
