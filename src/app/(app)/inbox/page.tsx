import Link from "next/link";
import {
  Inbox,
  ArrowRight,
  ListTodo,
  Calendar as CalendarIcon,
  CalendarRange,
  Hourglass,
  CircleDot,
  Bell,
} from "lucide-react";
import {
  getDeliverablesAwaitingMyReview,
  getInProgressTopics,
  getMyTasks,
  getCurrentUser,
  getAllUsers,
  getWorkspaceSettings,
  getBlockReason,
  getNotificationsForCurrentUser,
} from "@/db/queries";
import { DELIVERABLE_TYPE_LABEL, type Deliverable } from "@/types";
import { DeliverableStatusBadge, TaskStatusBadge } from "@/components/status-badge";
import { NotificationsList } from "@/components/notifications-list";
import { getLocale, withLocale, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Bucket = "overdue" | "today" | "tomorrow" | "thisWeek" | "later" | "noDate";
type TabKey = "tasks" | "activity";

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
  const t = new Date(today);
  const tomorrow = new Date(t.getTime() + 86400000).toISOString().slice(0, 10);
  if (d === tomorrow) return "tomorrow";
  const dayOfWeek = (t.getDay() + 6) % 7;
  const endOfWeek = new Date(t.getTime() + (6 - dayOfWeek) * 86400000)
    .toISOString()
    .slice(0, 10);
  if (d <= endOfWeek) return "thisWeek";
  return "later";
}

/**
 * Inbox — single surface for "things waiting on you", split into two
 * tabs (Tasks + Activity). Replaces the previous separate
 * /notifications page so users don't have to remember which surface
 * holds which kind of item. The notifications bell in the top bar
 * stays for realtime dropdown; clicking "View all" routes here.
 *
 * Tab state lives in the URL (?tab=activity) so the deep-link
 * behavior is preserved and the page can stay a server component —
 * no client-side tab swap noise.
 */
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab: TabKey = params.tab === "activity" ? "activity" : "tasks";

  const me = await getCurrentUser();
  const locale = await getLocale();
  const tr = withLocale(locale);

  // Always load both tabs' summary data so the tab badges (counts)
  // are accurate without a per-tab fetch. The queries are cheap.
  const [needReview, inProgress, myTasks, users, settings, notifications] =
    await Promise.all([
      getDeliverablesAwaitingMyReview(me.id),
      getInProgressTopics(me.id),
      getMyTasks(me.id),
      getAllUsers(),
      getWorkspaceSettings(),
      getNotificationsForCurrentUser(100),
    ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const blockDisplay = settings?.blockReasonDisplay ?? "name";
  const todayIso = new Date().toISOString().slice(0, 10);

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

  const tasksCount = myTasks.length + blockedOnYou.length;
  const unreadActivity = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-8 pt-7 pb-0">
        <p className="text-[14px] text-text-muted mb-1">{me.name}</p>
        <h1 className="text-title-2 text-text mb-1">
          {tr("inbox_your_queue")}
        </h1>
        <p className="text-[14px] text-text-muted mb-5">
          {tasksCount}{" "}
          {locale === "vi"
            ? "việc cần làm"
            : tasksCount === 1
              ? "action"
              : "actions"}
          {" · "}
          {blockedOnOthers.length}{" "}
          {locale === "vi" ? "đang chờ" : "waiting"}
        </p>

        {/* Tab strip — URL-driven so deep links work */}
        <div className="flex gap-1 -mb-px">
          <TabLink
            href="/inbox?tab=tasks"
            label={locale === "vi" ? "Việc của tôi" : "My queue"}
            badge={tasksCount}
            icon={ListTodo}
            active={tab === "tasks"}
          />
          <TabLink
            href="/inbox?tab=activity"
            label={locale === "vi" ? "Hoạt động" : "Activity"}
            badge={unreadActivity}
            badgeVariant="accent"
            icon={Bell}
            active={tab === "activity"}
          />
        </div>
      </div>

      {tab === "tasks" ? (
        <TasksTab
          locale={locale}
          tr={tr}
          myTasks={myTasks}
          buckets={buckets}
          blockedOnYou={blockedOnYou}
          blockedOnOthers={blockedOnOthers}
        />
      ) : (
        <ActivityTab notifications={notifications} />
      )}
    </div>
  );
}

function TabLink({
  href,
  label,
  badge,
  badgeVariant = "muted",
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  badge: number;
  badgeVariant?: "muted" | "accent";
  icon: typeof ListTodo;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 text-[14px] border-b-2 transition-colors",
        active
          ? "border-accent text-text font-medium"
          : "border-transparent text-text-muted hover:text-text"
      )}
    >
      <Icon
        className="w-3.5 h-3.5"
        strokeWidth={active ? 2 : 1.75}
      />
      {label}
      {badge > 0 && (
        <span
          className={cn(
            "text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded-full",
            badgeVariant === "accent" && !active
              ? "bg-accent text-accent-fg"
              : "bg-bg text-text-subtle border border-border"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function TasksTab({
  locale,
  tr,
  myTasks,
  buckets,
  blockedOnYou,
  blockedOnOthers,
}: {
  locale: string;
  tr: (k: DictKey) => string;
  myTasks: Awaited<ReturnType<typeof getMyTasks>>;
  buckets: Record<
    Bucket,
    Map<string, { topicName: string; topicId: string; tasks: typeof myTasks }>
  >;
  blockedOnYou: Awaited<ReturnType<typeof getDeliverablesAwaitingMyReview>>;
  blockedOnOthers: Array<{
    topic: { id: string; name: string };
    deliverable: Pick<Deliverable, "id" | "type" | "status">;
    block: string | null;
  }>;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto w-full space-y-8">
      {/* MY TASKS — bucketed by date */}
      <section>
        <h2 className="text-headline text-text mb-4 flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-text-muted" strokeWidth={1.75} />
          {tr("inbox_my_tasks")}
          <span className="text-text-subtle font-normal tabular-nums">
            {myTasks.length}
          </span>
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
                    <Icon
                      className={`w-3.5 h-3.5 ${meta.color}`}
                      strokeWidth={1.75}
                    />
                    <span className={`text-[14px] font-medium ${meta.color}`}>
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
                          <span className="font-medium text-text">
                            {group.topicName}
                          </span>
                          <span className="text-text-subtle ml-2">
                            · {group.tasks.length}{" "}
                            {locale === "vi"
                              ? "task"
                              : group.tasks.length === 1
                                ? "task"
                                : "tasks"}
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
                                  {task.dueDate &&
                                    ` · ${task.dueDate.slice(0, 10)}`}
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

      {/* Awaiting your review */}
      {blockedOnYou.length > 0 && (
        <section>
          <h2 className="text-headline text-text mb-4">
            {tr("inbox_awaiting_review")}
            <span className="text-text-subtle font-normal tabular-nums ml-2">
              {blockedOnYou.length}
            </span>
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
                      {locale === "vi"
                        ? "sẵn sàng để duyệt"
                        : "ready for approval"}
                    </div>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-text-subtle group-hover:text-accent transition-colors"
                    strokeWidth={1.75}
                  />
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
          <span className="text-text-subtle font-normal tabular-nums ml-2">
            {blockedOnOthers.length}
          </span>
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
  );
}

function ActivityTab({
  notifications,
}: {
  notifications: Awaited<ReturnType<typeof getNotificationsForCurrentUser>>;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto w-full space-y-5">
      <NotificationsList initial={notifications} />

      {notifications.length === 0 && (
        <div className="bg-surface rounded-2xl border border-border px-5 py-12 text-center">
          <Bell
            className="w-8 h-8 text-text-subtle mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-[15px] text-text mb-1">No activity yet</p>
          <p className="text-[13px] text-text-muted max-w-sm mx-auto">
            You&apos;ll see updates here when teammates assign, submit,
            approve, reject, or air things.
          </p>
        </div>
      )}
    </div>
  );
}
