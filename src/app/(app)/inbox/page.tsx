import Link from "next/link";
import {
  Inbox,
  ArrowRight,
  ListTodo,
  Calendar as CalendarIcon,
  CalendarRange,
  Hourglass,
  CircleDot,
} from "lucide-react";
import {
  getDeliverablesAwaitingMyReview,
  getInProgressTopics,
  getMyTasks,
  getCurrentUser,
  getAllUsers,
  getWorkspaceSettings,
  getBlockReason,
} from "@/db/queries";
import { DELIVERABLE_TYPE_LABEL } from "@/types";
import { DeliverableStatusBadge, TaskStatusBadge } from "@/components/status-badge";
import { getLocale, withLocale, type DictKey } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Bucket = "overdue" | "today" | "tomorrow" | "thisWeek" | "later" | "noDate";

const BUCKET_META: Record<
  Bucket,
  { labelKey: DictKey; icon: typeof CalendarIcon; color: string }
> = {
  overdue: { labelKey: "bucket_overdue", icon: Hourglass, color: "text-danger" },
  today: { labelKey: "bucket_today", icon: CircleDot, color: "text-warn" },
  tomorrow: { labelKey: "bucket_tomorrow", icon: CalendarIcon, color: "text-accent" },
  thisWeek: { labelKey: "bucket_this_week", icon: CalendarRange, color: "text-info" },
  later: { labelKey: "bucket_later", icon: CalendarRange, color: "text-text-muted" },
  noDate: { labelKey: "bucket_no_date", icon: ListTodo, color: "text-text-subtle" },
};

const BUCKET_ORDER: Bucket[] = [
  "overdue",
  "today",
  "tomorrow",
  "thisWeek",
  "later",
  "noDate",
];

function bucketFor(dueDate: string | undefined, today: string): Bucket {
  if (!dueDate) return "noDate";
  const d = dueDate.slice(0, 10);
  if (d < today) return "overdue";
  if (d === today) return "today";
  // Compute tomorrow's ISO date
  const t = new Date(today);
  const tomorrow = new Date(t.getTime() + 86400000).toISOString().slice(0, 10);
  if (d === tomorrow) return "tomorrow";
  // End of "this week" — Sunday of current week (Mon-first)
  const dayOfWeek = (t.getDay() + 6) % 7; // 0=Mon..6=Sun
  const endOfWeek = new Date(t.getTime() + (6 - dayOfWeek) * 86400000)
    .toISOString()
    .slice(0, 10);
  if (d <= endOfWeek) return "thisWeek";
  return "later";
}

export default async function InboxPage() {
  const me = await getCurrentUser();
  const locale = await getLocale();
  const tr = withLocale(locale);
  const [needReview, inProgress, myTasks, users, settings] = await Promise.all([
    getDeliverablesAwaitingMyReview(me.id),
    getInProgressTopics(me.id),
    getMyTasks(me.id),
    getAllUsers(),
    getWorkspaceSettings(),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const blockDisplay = settings?.blockReasonDisplay ?? "name";
  const todayIso = new Date().toISOString().slice(0, 10);

  // Bucket my tasks by date, then group by topic within each bucket
  const buckets: Record<
    Bucket,
    Map<string, { topicName: string; topicId: string; tasks: typeof myTasks }>
  > = {
    overdue: new Map(),
    today: new Map(),
    tomorrow: new Map(),
    thisWeek: new Map(),
    later: new Map(),
    noDate: new Map(),
  };

  for (const item of myTasks) {
    const b = bucketFor(item.task.dueDate, todayIso);
    const existing = buckets[b].get(item.topic.id);
    if (existing) {
      existing.tasks.push(item);
    } else {
      buckets[b].set(item.topic.id, {
        topicName: item.topic.name,
        topicId: item.topic.id,
        tasks: [item],
      });
    }
  }

  const blockedOnYou = needReview;
  const blockedOnOthers = inProgress.flatMap((t) =>
    t.deliverables
      .filter((d) => d.status === "in_progress")
      .map((d) => ({
        topic: t,
        deliverable: d,
        block: getBlockReason(d, blockDisplay, userMap),
      }))
      .filter((x) => x.block !== null)
  );

  const totalAction = myTasks.length + blockedOnYou.length;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-8 pt-7 pb-5">
        <p className="text-[14px] text-text-muted mb-1">
          {me.name}
        </p>
        <h1 className="text-title-2 text-text mb-1">
          {tr("inbox_your_queue")}
        </h1>
        <p className="text-[14px] text-text-muted">
          {totalAction} {locale === "vi" ? "việc cần làm" : totalAction === 1 ? "action" : "actions"}
          {" · "}
          {blockedOnOthers.length} {locale === "vi" ? "đang chờ" : "waiting"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto w-full space-y-8">
        {/* MY TASKS — bucketed by date */}
        <section>
          <h2 className="text-headline text-text mb-4 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-text-muted" strokeWidth={1.75} />
            {tr("inbox_my_tasks")}
            <span className="text-text-subtle font-normal tabular-nums">{myTasks.length}</span>
          </h2>
          {myTasks.length === 0 ? (
            <p className="text-[15px] text-text-subtle px-4 py-4 bg-surface rounded-2xl border border-border">
              {tr("inbox_no_tasks")}
            </p>
          ) : (
            <div className="space-y-5">
              {BUCKET_ORDER.map((b) => {
                const groupMap = buckets[b];
                if (groupMap.size === 0) return null;
                const meta = BUCKET_META[b];
                const Icon = meta.icon;
                const totalInBucket = Array.from(groupMap.values()).reduce(
                  (acc, g) => acc + g.tasks.length,
                  0
                );
                return (
                  <div key={b}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} strokeWidth={1.75} />
                      <span
                        className={`text-[14px] font-medium ${meta.color}`}
                      >
                        {tr(meta.labelKey)}
                      </span>
                      <span className="text-[13px] text-text-subtle tabular-nums">
                        {totalInBucket}
                      </span>
                      <div className="flex-1 h-px bg-border ml-1" />
                    </div>
                    <div className="space-y-3">
                      {Array.from(groupMap.values()).map((group) => (
                        <div
                          key={group.topicId}
                          className="rounded-2xl border border-border overflow-hidden bg-surface"
                        >
                          <Link
                            href={`/topics/${group.topicId}`}
                            className="block px-4 py-2.5 border-b border-border text-[13px] text-text-muted hover:text-text bg-surface-hover/40"
                          >
                            <span className="font-medium text-text">{group.topicName}</span>
                            <span className="text-text-subtle ml-2">
                              · {group.tasks.length} {locale === "vi" ? "task" : group.tasks.length === 1 ? "task" : "tasks"}
                            </span>
                          </Link>
                          <div className="divide-y divide-border">
                            {group.tasks.map(({ topic, deliverable, task }) => (
                              <Link
                                key={task.id}
                                href={`/topics/${topic.id}/tasks/${task.id}`}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-surface-hover transition-colors group"
                              >
                                <TaskStatusBadge status={task.status} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-medium truncate capitalize">
                                    {task.templateItemKey.replace(/_/g, " ")}
                                  </div>
                                  <div className="text-[11px] font-mono text-text-subtle truncate">
                                    {DELIVERABLE_TYPE_LABEL[deliverable.type]}
                                    {task.dueDate && ` · ${task.dueDate.slice(0, 10)}`}
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-text-subtle group-hover:text-accent transition-colors" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Awaiting your review (creator only) */}
        {blockedOnYou.length > 0 && (
          <section>
            <h2 className="text-headline text-text mb-4">
              {tr("inbox_awaiting_review")}
              <span className="text-text-subtle font-normal tabular-nums ml-2">{blockedOnYou.length}</span>
            </h2>
            <div className="space-y-2">
              {blockedOnYou.map(({ topic, deliverable }) => (
                <Link
                  key={deliverable.id}
                  href={`/topics/${topic.id}/approve/${deliverable.id}`}
                  className="block bg-surface rounded-2xl border border-warn-border/60 hover:bg-surface-hover transition-colors px-4 py-3 group"
                >
                  <div className="flex items-center gap-3">
                    <DeliverableStatusBadge status={deliverable.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium truncate text-text">
                        {topic.name}
                      </div>
                      <div className="text-[13px] text-text-muted">
                        {DELIVERABLE_TYPE_LABEL[deliverable.type]} ·{" "}
                        {locale === "vi" ? "sẵn sàng để duyệt" : "ready for approval"}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-subtle group-hover:text-accent transition-colors" strokeWidth={1.75} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Waiting on team */}
        <section>
          <h2 className="text-headline text-text mb-4">
            {tr("inbox_waiting_team")}
            <span className="text-text-subtle font-normal tabular-nums ml-2">{blockedOnOthers.length}</span>
          </h2>
          {blockedOnOthers.length === 0 ? (
            <p className="text-[15px] text-text-subtle px-4 py-4 bg-surface rounded-2xl border border-border">
              {tr("inbox_no_blockers")}
            </p>
          ) : (
            <div className="space-y-2">
              {blockedOnOthers.map(({ topic, deliverable, block }) => (
                <Link
                  key={deliverable.id}
                  href={`/topics/${topic.id}`}
                  className="block bg-surface rounded-2xl border border-border hover:bg-surface-hover px-4 py-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-0.5">
                    <span className="text-[15px] font-medium truncate text-text">
                      {topic.name}
                    </span>
                    <DeliverableStatusBadge status={deliverable.status} />
                  </div>
                  <div className="text-[13px] text-text-muted">
                    {DELIVERABLE_TYPE_LABEL[deliverable.type]} · {block}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
