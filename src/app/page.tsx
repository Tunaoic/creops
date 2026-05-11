import Link from "next/link";
import {
  ArrowRight,
  Plus,
  TrendingUp,
  AlertCircle,
  Zap,
  Target,
  Inbox,
  ListTodo,
} from "lucide-react";
import {
  getCurrentUser,
  getAllUsers,
  getAllChannels,
  getAiredThisWeek,
  getDeliverablesAwaitingMyReview,
  getInProgressTopics,
  getMyTasks,
} from "@/db/queries";
import { CHANNEL_LABEL, DELIVERABLE_TYPE_LABEL } from "@/types";
import {
  DeliverableStatusBadge,
  ProgressDots,
  TaskStatusBadge,
} from "@/components/status-badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [users, channels, needReview, inProgress, airedTopics, myTasks] =
    await Promise.all([
      getAllUsers(),
      getAllChannels(),
      getDeliverablesAwaitingMyReview(user.id),
      getInProgressTopics(user.id),
      getAiredThisWeek(user.id),
      getMyTasks(user.id),
    ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const channelMap = new Map(channels.map((c) => [c.id, c]));

  const totalAiredChannels = airedTopics.reduce(
    (acc, t) =>
      acc +
      t.deliverables.reduce(
        (a, d) => a + d.channels.filter((c) => c.airedAt).length,
        0
      ),
    0
  );

  const totalDeliverables = inProgress.reduce(
    (acc, t) => acc + t.deliverables.length,
    0
  );
  const completionRate =
    totalDeliverables > 0
      ? Math.round(
          (inProgress.reduce(
            (acc, t) =>
              acc + t.deliverables.filter((d) => d.status === "aired").length,
            0
          ) /
            totalDeliverables) *
            100
        )
      : 0;

  // Recent activity feed
  const activity = inProgress.flatMap((t) =>
    t.deliverables
      .filter((d) => d.airedAt || d.status === "review")
      .map((d) => ({ topic: t, deliverable: d }))
  );

  const isEmptyWorkspace = users.length === 0;

  return (
    <div className="px-6 py-4 max-w-[1280px] mx-auto">
      {/* Onboarding for fresh workspace */}
      {isEmptyWorkspace && (
        <div className="mb-4 rounded-lg border border-accent/40 bg-accent/5 px-5 py-4">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-accent mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)] pulse-dot" />
            WELCOME · SETUP
          </div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">
            Workspace mới — bắt đầu setup team
          </h2>
          <p className="text-[13px] text-text-muted mb-4">
            Add team members trước → app sẽ auto-assign tasks theo role khi mày tạo topic.
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/settings/members"
              className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 rounded text-[13px]"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Add Team Members
            </Link>
            <Link
              href="/topics/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-border bg-surface hover:border-border-strong text-[13px] text-text-muted hover:text-text"
            >
              Skip — create topic first
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[13px] font-mono uppercase tracking-[0.2em] text-accent">
              ↑ {user.name.toUpperCase()} · {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <span className="w-1 h-1 rounded-full bg-accent shadow-[0_0_4px_var(--accent)] animate-pulse" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Mission Control</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/inbox"
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md border border-border bg-surface hover:border-border-strong text-[13px] text-text-muted hover:text-text"
          >
            <Inbox className="w-3.5 h-3.5" />
            Inbox
            {myTasks.length + needReview.length > 0 && (
              <span className="text-[11px] font-mono px-1 py-0.5 rounded bg-warn-bg text-warn border border-warn-border">
                {myTasks.length + needReview.length}
              </span>
            )}
          </Link>
          <Link
            href="/topics/new"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent text-accent-fg text-[13px] font-semibold hover:bg-accent-hover hover:shadow-[0_0_0_3px_var(--accent-glow)]"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            New Topic
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard
          label="MY TASKS"
          value={myTasks.length}
          delta={
            myTasks.length === 0
              ? "all clear"
              : `${myTasks.filter((x) => x.task.status === "in_progress").length} in progress`
          }
          deltaColor={myTasks.length === 0 ? "success" : "info"}
          icon={<ListTodo className="w-3 h-3" />}
          accent={myTasks.length > 0}
        />
        <KpiCard
          label="ACTIVE TOPICS"
          value={inProgress.length}
          delta={null}
          icon={<Target className="w-3 h-3" />}
        />
        <KpiCard
          label="NEEDS REVIEW"
          value={needReview.length}
          delta={needReview.length > 0 ? "blocking" : "clear"}
          deltaColor={needReview.length > 0 ? "warn" : "success"}
          icon={<AlertCircle className="w-3 h-3" />}
        />
        <KpiCard
          label="AIRED · 7D"
          value={totalAiredChannels}
          deltaSuffix=" channels"
          delta="live"
          deltaColor="success"
          icon={<Zap className="w-3 h-3" />}
        />
      </div>

      {/* Two-column main grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* LEFT 2/3: Active topics */}
        <div className="col-span-2 space-y-4">
          {myTasks.length > 0 && (
            <Section
              num="00"
              label={`Tasks for ${user.name}`}
              accent="accent"
              count={myTasks.length}
              cta={{ href: "/inbox", label: "Inbox →" }}
            >
              <div className="divide-y divide-border">
                {myTasks.slice(0, 5).map(({ topic, deliverable, task }) => (
                  <Link
                    key={task.id}
                    href={`/topics/${topic.id}/tasks/${task.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover transition-colors group"
                  >
                    <TaskStatusBadge status={task.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium truncate capitalize">
                        {task.templateItemKey.replace(/_/g, " ")}
                      </div>
                      <div className="text-[13px] font-mono text-text-subtle truncate">
                        {topic.name} · {DELIVERABLE_TYPE_LABEL[deliverable.type]}
                        {task.dueDate && ` · due ${task.dueDate}`}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-subtle group-hover:text-accent" />
                  </Link>
                ))}
                {myTasks.length > 5 && (
                  <Link
                    href="/inbox"
                    className="block px-3 py-2 text-[12px] font-mono text-text-subtle hover:text-accent text-center"
                  >
                    +{myTasks.length - 5} more in Inbox →
                  </Link>
                )}
              </div>
            </Section>
          )}

          {needReview.length > 0 && (
            <Section
              num="01"
              label="Awaiting Your Review"
              accent="warn"
              count={needReview.length}
              cta={{ href: "/inbox", label: "All →" }}
            >
              <div className="divide-y divide-border">
                {needReview.slice(0, 3).map(({ topic, deliverable }) => (
                  <Link
                    key={deliverable.id}
                    href={`/topics/${topic.id}/approve/${deliverable.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover transition-colors group"
                  >
                    <DeliverableStatusBadge status={deliverable.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium truncate">
                        {topic.name}
                      </div>
                      <div className="text-[13px] font-mono text-text-subtle">
                        {DELIVERABLE_TYPE_LABEL[deliverable.type]} · awaiting review
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-subtle group-hover:text-accent" />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <Section
            num="02"
            label="In Progress"
            accent="info"
            count={inProgress.length}
            cta={{ href: "/board", label: "Board →" }}
          >
            <div className="divide-y divide-border">
              {inProgress.slice(0, 6).map((topic) => {
                const total = topic.deliverables.length;
                const aired = topic.deliverables.filter(
                  (d) => d.status === "aired"
                ).length;

                // Find the "next action" task: prefer in_progress > submitted > todo
                const allTasks = topic.deliverables.flatMap((d) => d.tasks);
                const nextTask =
                  allTasks.find((t) => t.status === "in_progress") ??
                  allTasks.find((t) => t.status === "submitted") ??
                  allTasks.find((t) => t.status === "todo");
                const nextAssignees =
                  nextTask?.assigneeIds
                    .map((id) => userMap.get(id))
                    .filter((u): u is NonNullable<typeof u> => Boolean(u)) ?? [];
                const nextHref = nextTask
                  ? `/topics/${topic.id}/tasks/${nextTask.id}`
                  : `/topics/${topic.id}`;
                return (
                  <Link
                    key={topic.id}
                    href={nextHref}
                    className="block px-3 py-2.5 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[14px] font-medium truncate">
                        {topic.name}
                      </span>
                      <span className="text-[12px] font-mono text-text-subtle shrink-0 inline-flex items-center gap-1.5">
                        <ProgressDots total={total} done={aired} />
                        {aired}/{total}
                      </span>
                    </div>
                    {nextTask ? (
                      <div className="flex items-center gap-1.5 text-[12px] font-mono text-text-muted">
                        <ArrowRight className="w-3 h-3 text-accent shrink-0" />
                        <span className="capitalize truncate">
                          {nextTask.templateItemKey.replace(/_/g, " ")}
                        </span>
                        <span className="text-text-subtle">·</span>
                        <span
                          className={
                            nextAssignees.length === 0
                              ? "text-warn"
                              : "text-text"
                          }
                        >
                          {nextAssignees.length === 0
                            ? "unassigned"
                            : nextAssignees.length === 1
                              ? nextAssignees[0].name
                              : `${nextAssignees[0].name} +${nextAssignees.length - 1}`}
                        </span>
                        <span className="text-text-subtle ml-auto uppercase text-[10px]">
                          {nextTask.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[12px] font-mono text-text-subtle">
                        all tasks complete · waiting to air
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </Section>
        </div>

        {/* RIGHT 1/3: Activity feed + Aired */}
        <div className="space-y-4">
          <Section num="03" label="Aired · 7d" accent="accent" count={airedTopics.length}>
            <div className="divide-y divide-border">
              {airedTopics.slice(0, 5).map((topic) => {
                const channelsAired = topic.deliverables.flatMap((d) =>
                  d.channels.filter((c) => c.airedAt)
                );
                return (
                  <div key={topic.id} className="px-3 py-2">
                    <div className="text-[13px] font-medium truncate mb-1">
                      {topic.name}
                    </div>
                    <div className="flex flex-wrap gap-0.5">
                      {channelsAired.slice(0, 4).map((c) => {
                        const ch = channelMap.get(c.channelId);
                        if (!ch) return null;
                        return (
                          <a
                            key={c.channelId}
                            href={c.airedLink ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono uppercase px-1 py-0.5 rounded border border-accent/30 bg-accent/5 text-accent hover:bg-accent/15"
                          >
                            ✓ {CHANNEL_LABEL[ch.platform]}
                          </a>
                        );
                      })}
                      {channelsAired.length > 4 && (
                        <span className="text-[11px] font-mono text-text-subtle py-0.5">
                          +{channelsAired.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section num="04" label="System" accent="text-muted">
            <div className="px-3 py-2.5 space-y-2 text-[13px] font-mono">
              <Row label="DB" value="SQLite · local" valueColor="text-text" />
              <Row label="Active" value={`${inProgress.length} topics`} valueColor="text-text" />
              <Row label="Latency" value="<50ms" valueColor="text-accent" />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  deltaSuffix,
  deltaColor = "text-text-muted",
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  delta?: string | null;
  deltaSuffix?: string;
  deltaColor?: "warn" | "success" | "info" | string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  const colorMap: Record<string, string> = {
    warn: "text-warn",
    success: "text-success",
    info: "text-info",
  };
  const dc = colorMap[deltaColor] ?? deltaColor;
  return (
    <div
      className={cn(
        "rounded-lg border bg-surface p-3 transition-colors hover:border-border-strong",
        accent && "border-accent/30"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-mono uppercase tracking-[0.15em] text-text-subtle">
          {label}
        </span>
        <span className={cn("text-text-subtle", accent && "text-accent")}>
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-2xl font-semibold tabular-nums", accent && "text-accent")}>
          {value}
        </span>
        {deltaSuffix && (
          <span className="text-[13px] text-text-subtle font-mono">{deltaSuffix}</span>
        )}
      </div>
      {delta && (
        <div className={cn("text-[13px] font-mono mt-1", dc)}>{delta}</div>
      )}
    </div>
  );
}

function Section({
  num,
  label,
  count,
  cta,
  children,
  accent = "text-muted",
}: {
  num: string;
  label: string;
  count?: number;
  cta?: { href: string; label: string };
  children: React.ReactNode;
  accent?: "warn" | "info" | "accent" | "text-muted" | string;
}) {
  const colorMap: Record<string, string> = {
    warn: "text-warn",
    info: "text-info",
    accent: "text-accent",
    "text-muted": "text-text-muted",
  };
  const c = colorMap[accent] ?? accent;
  return (
    <section className="rounded-lg border border-border bg-surface/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-bg/40">
        <div className="flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.15em]">
          <span className="text-text-subtle">{num}</span>
          <span className={c}>·</span>
          <span className={cn("font-semibold", c)}>{label}</span>
          {count !== undefined && (
            <span className="px-1 rounded bg-surface-elevated text-text-subtle border border-border">
              {count}
            </span>
          )}
        </div>
        {cta && (
          <Link
            href={cta.href}
            className="text-[13px] font-mono text-text-subtle hover:text-accent"
          >
            {cta.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-subtle">{label}</span>
      <span className={valueColor}>{value}</span>
    </div>
  );
}
