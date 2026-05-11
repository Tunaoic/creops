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
import { getLocale, withLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const tr = withLocale(locale);
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
      {/* Onboarding for fresh workspace — Apple welcome card */}
      {isEmptyWorkspace && (
        <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/5 px-6 py-5">
          <div className="flex items-center gap-2 text-[13px] text-accent mb-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
            {locale === "vi" ? "Chào mừng" : "Welcome"}
          </div>
          <h2 className="text-title-3 text-text mb-1.5">
            {locale === "vi"
              ? "Workspace mới — thiết lập team"
              : "Fresh workspace — set up your team"}
          </h2>
          <p className="text-[15px] text-text-muted mb-5 max-w-xl">
            {locale === "vi"
              ? "Thêm thành viên trước để có thể assign task khi tạo chủ đề."
              : "Add team members first so you can assign tasks when you create topics."}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/settings/members"
              className="btn-primary inline-flex items-center gap-2 text-[14px]"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              {locale === "vi" ? "Thêm thành viên" : "Add team members"}
            </Link>
            <Link
              href="/topics/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface hover:bg-surface-hover text-[14px] text-text-muted hover:text-text transition-colors"
            >
              {locale === "vi" ? "Bỏ qua — tạo chủ đề" : "Skip — create a topic"}
            </Link>
          </div>
        </div>
      )}

      {/* Hero header — Apple style: large H1, subtle date subline, generous spacing */}
      <div className="flex items-end justify-between gap-6 mb-8 pt-2">
        <div>
          <p className="text-[15px] text-text-muted mb-2">
            {(() => {
              const dateLabel = new Date().toLocaleDateString(
                locale === "vi" ? "vi-VN" : "en-US",
                { weekday: "long", day: "numeric", month: "long" }
              );
              const greet = locale === "vi" ? "Xin chào" : "Hi";
              return `${greet}, ${user.name} · ${dateLabel}`;
            })()}
          </p>
          <h1 className="text-title-1 text-text">{tr("mission_control")}</h1>
        </div>
        <div className="flex items-center gap-2.5 pb-1">
          <Link
            href="/inbox"
            className="inline-flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full border border-border bg-surface hover:bg-surface-hover text-[14px] text-text-muted hover:text-text transition-colors"
          >
            <Inbox className="w-4 h-4" strokeWidth={1.75} />
            {tr("nav_inbox")}
            {myTasks.length + needReview.length > 0 && (
              <span className="text-[12px] font-medium px-1.5 py-0.5 rounded-full bg-warn-bg text-warn">
                {myTasks.length + needReview.length}
              </span>
            )}
          </Link>
          <Link
            href="/topics/new"
            className="inline-flex items-center gap-2 pl-3.5 pr-4 py-2 rounded-full bg-accent text-accent-fg text-[14px] font-medium transition-opacity hover:opacity-88"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            {tr("new_topic")}
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard
          label={tr("kpi_my_tasks")}
          value={myTasks.length}
          delta={
            myTasks.length === 0
              ? tr("all_clear")
              : `${myTasks.filter((x) => x.task.status === "in_progress").length} ${tr("in_progress_short")}`
          }
          deltaColor={myTasks.length === 0 ? "success" : "info"}
          icon={<ListTodo className="w-3 h-3" />}
          accent={myTasks.length > 0}
        />
        <KpiCard
          label={tr("kpi_active_topics")}
          value={inProgress.length}
          delta={null}
          icon={<Target className="w-3 h-3" />}
        />
        <KpiCard
          label={tr("kpi_needs_review")}
          value={needReview.length}
          delta={needReview.length > 0 ? tr("blocking") : tr("clear")}
          deltaColor={needReview.length > 0 ? "warn" : "success"}
          icon={<AlertCircle className="w-3 h-3" />}
        />
        <KpiCard
          label={tr("kpi_aired_7d")}
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
              label={`${tr("tasks_for")} ${user.name}`}
              accent="accent"
              count={myTasks.length}
              cta={{ href: "/inbox", label: tr("nav_inbox") + " →" }}
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
              label={tr("section_awaiting_review")}
              accent="warn"
              count={needReview.length}
              cta={{ href: "/inbox", label: (locale === "vi" ? "Tất cả" : "All") + " →" }}
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
            label={tr("section_in_progress")}
            accent="info"
            count={inProgress.length}
            cta={{ href: "/board", label: tr("nav_board") + " →" }}
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
          <Section num="03" label={tr("section_aired_7d")} accent="accent" count={airedTopics.length}>
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

          <Section num="04" label={tr("section_system")} accent="text-muted">
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
  // Sentence case label — mirror Apple's "Mail · Inbox" style not "INBOX · MAIL"
  const labelTitleCase = label
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/(\d)d\b/i, "$1d"); // keep "7d" lowercase
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface p-5 transition-colors hover:bg-surface-hover",
        accent && "border-accent/30"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] text-text-muted">
          {labelTitleCase}
        </span>
        <span className={cn("text-text-subtle", accent && "text-accent")}>
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-[34px] font-semibold tabular-nums tracking-tight leading-none", accent && "text-accent")}>
          {value}
        </span>
        {deltaSuffix && (
          <span className="text-[14px] text-text-subtle">{deltaSuffix}</span>
        )}
      </div>
      {delta && (
        <div className={cn("text-[13px] mt-2", dc)}>{delta}</div>
      )}
    </div>
  );
}

function Section({
  num: _num,
  label,
  count,
  cta,
  children,
  accent: _accent = "text-muted",
}: {
  num: string;
  label: string;
  count?: number;
  cta?: { href: string; label: string };
  children: React.ReactNode;
  accent?: "warn" | "info" | "accent" | "text-muted" | string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[17px] font-semibold text-text">{label}</span>
          {count !== undefined && (
            <span className="text-[14px] text-text-subtle tabular-nums">{count}</span>
          )}
        </div>
        {cta && (
          <Link
            href={cta.href}
            className="text-[14px] text-accent hover:opacity-80 transition-opacity"
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
