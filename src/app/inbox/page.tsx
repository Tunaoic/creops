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

export const dynamic = "force-dynamic";

type Bucket = "overdue" | "today" | "tomorrow" | "thisWeek" | "later" | "noDate";

const BUCKET_META: Record<
  Bucket,
  { label: string; icon: typeof CalendarIcon; color: string }
> = {
  overdue: { label: "Overdue", icon: Hourglass, color: "text-danger" },
  today: { label: "Today", icon: CircleDot, color: "text-warn" },
  tomorrow: { label: "Tomorrow", icon: CalendarIcon, color: "text-accent" },
  thisWeek: { label: "This Week", icon: CalendarRange, color: "text-info" },
  later: { label: "Later", icon: CalendarRange, color: "text-text-muted" },
  noDate: { label: "No Due Date", icon: ListTodo, color: "text-text-subtle" },
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
      <div className="border-b border-border bg-surface/40 px-6 py-3">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-1">
          INBOX <span className="text-accent">·</span> {me.name}
        </div>
        <h1 className="text-base font-semibold flex items-center gap-2">
          <Inbox className="w-4 h-4" />
          Your Queue
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted">
            {totalAction} action · {blockedOnOthers.length} waiting
          </span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 max-w-3xl mx-auto w-full space-y-6">
        {/* MY TASKS — bucketed by date */}
        <section>
          <h2 className="text-[12px] font-mono uppercase tracking-[0.2em] text-warn mb-3 flex items-center gap-2">
            <ListTodo className="w-3.5 h-3.5" />
            MY TASKS · {myTasks.length}
          </h2>
          {myTasks.length === 0 ? (
            <p className="text-[13px] text-text-subtle italic px-3 py-3 bg-surface rounded border border-border">
              No tasks assigned to you. ✓
            </p>
          ) : (
            <div className="space-y-4">
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
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-3 h-3 ${meta.color}`} />
                      <span
                        className={`text-[10px] font-mono uppercase tracking-[0.18em] font-semibold ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-mono text-text-subtle">
                        · {totalInBucket}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="space-y-3">
                      {Array.from(groupMap.values()).map((group) => (
                        <div
                          key={group.topicId}
                          className="rounded border border-border overflow-hidden bg-surface/60"
                        >
                          <Link
                            href={`/topics/${group.topicId}`}
                            className="block px-3 py-1.5 bg-bg/40 border-b border-border text-[11px] font-mono uppercase tracking-wider text-text-muted hover:text-text"
                          >
                            <span className="text-text-subtle">@ </span>
                            {group.topicName}
                            <span className="text-text-subtle ml-1.5">
                              · {group.tasks.length} task{group.tasks.length !== 1 && "s"}
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
            <h2 className="text-[12px] font-mono uppercase tracking-[0.2em] text-warn mb-3">
              AWAITING YOUR REVIEW · {blockedOnYou.length}
            </h2>
            <div className="space-y-1.5">
              {blockedOnYou.map(({ topic, deliverable }) => (
                <Link
                  key={deliverable.id}
                  href={`/topics/${topic.id}/approve/${deliverable.id}`}
                  className="block bg-surface rounded border border-warn-border hover:bg-surface-hover transition-colors px-3 py-2.5 group"
                >
                  <div className="flex items-center gap-3">
                    <DeliverableStatusBadge status={deliverable.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium truncate">
                        {topic.name}
                      </div>
                      <div className="text-[12px] font-mono text-text-subtle">
                        {DELIVERABLE_TYPE_LABEL[deliverable.type]} · ready for approval
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-subtle group-hover:text-accent transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Waiting on team */}
        <section>
          <h2 className="text-[12px] font-mono uppercase tracking-[0.2em] text-info mb-3">
            WAITING ON TEAM · {blockedOnOthers.length}
          </h2>
          {blockedOnOthers.length === 0 ? (
            <p className="text-[13px] text-text-subtle italic px-3 py-3 bg-surface rounded border border-border">
              No team blockers.
            </p>
          ) : (
            <div className="space-y-1.5">
              {blockedOnOthers.map(({ topic, deliverable, block }) => (
                <Link
                  key={deliverable.id}
                  href={`/topics/${topic.id}`}
                  className="block bg-surface rounded border border-border hover:border-border-strong px-3 py-2.5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-0.5">
                    <span className="text-[14px] font-medium truncate">
                      {topic.name}
                    </span>
                    <DeliverableStatusBadge status={deliverable.status} />
                  </div>
                  <div className="text-[12px] font-mono text-text-subtle">
                    {DELIVERABLE_TYPE_LABEL[deliverable.type]} · ⊙ {block}
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
