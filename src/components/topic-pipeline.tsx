import { Link2, ListTodo, Eye, Radio, CheckCircle2 } from "lucide-react";
import type { Topic, User } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Horizontal pipeline summary for a Topic.
 * Stages: Material → Production → Review → Aired
 *
 * Visualizes where in the lifecycle the topic currently is, with counts
 * and the active assignees per stage.
 */
export function TopicPipeline({
  topic,
  userMap,
}: {
  topic: Topic;
  userMap: Map<string, User>;
}) {
  // MATERIAL — source assets count
  const materialCount = topic.sourceAssets.length;

  // PRODUCTION — tasks not approved (todo + in_progress + rejected)
  const productionTasks = topic.deliverables.flatMap((d) =>
    d.tasks.filter(
      (t) =>
        t.status === "todo" ||
        t.status === "in_progress" ||
        t.status === "rejected"
    )
  );
  const productionAssignees = uniqueAssignees(productionTasks.flatMap((t) => t.assigneeIds));

  // REVIEW — tasks submitted OR deliverables in review
  const reviewTasks = topic.deliverables.flatMap((d) =>
    d.tasks.filter((t) => t.status === "submitted")
  );
  const reviewDeliverables = topic.deliverables.filter((d) => d.status === "review");
  const reviewCount = reviewTasks.length + reviewDeliverables.length;

  // AIRED — channels aired
  const airedChannels = topic.deliverables.flatMap((d) =>
    d.channels.filter((c) => c.airedAt)
  );
  const totalChannels = topic.deliverables.flatMap((d) => d.channels).length;

  // Determine "current" stage — the rightmost stage with active items, or first if none
  let currentStage: 0 | 1 | 2 | 3 = 0;
  if (airedChannels.length === totalChannels && totalChannels > 0) currentStage = 3;
  else if (reviewCount > 0) currentStage = 2;
  else if (productionTasks.length > 0) currentStage = 1;
  else if (materialCount > 0) currentStage = 1;

  const stages = [
    {
      key: "material",
      label: "Material",
      icon: Link2,
      count: materialCount,
      sub: materialCount === 0 ? "no links" : `${materialCount} link${materialCount !== 1 ? "s" : ""}`,
      active: currentStage >= 0,
    },
    {
      key: "production",
      label: "Production",
      icon: ListTodo,
      count: productionTasks.length,
      sub:
        productionTasks.length === 0
          ? "—"
          : productionAssignees.length === 0
            ? "unassigned"
            : assigneeNames(productionAssignees, userMap),
      active: productionTasks.length > 0,
    },
    {
      key: "review",
      label: "Review",
      icon: Eye,
      count: reviewCount,
      sub:
        reviewCount === 0
          ? "—"
          : reviewDeliverables.length > 0
            ? `${reviewDeliverables.length} ready`
            : `${reviewTasks.length} submitted`,
      active: reviewCount > 0,
    },
    {
      key: "aired",
      label: "Aired",
      icon: airedChannels.length === totalChannels && totalChannels > 0 ? CheckCircle2 : Radio,
      count: airedChannels.length,
      sub:
        totalChannels === 0
          ? "—"
          : `${airedChannels.length}/${totalChannels} channels`,
      active: airedChannels.length > 0,
    },
  ] as const;

  return (
    <section className="rounded-lg border border-border bg-surface/40 overflow-hidden">
      <div className="flex">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          const isCurrent = i === currentStage;
          return (
            <div
              key={stage.key}
              className={cn(
                "flex-1 px-3 py-2.5 flex items-center gap-2.5 relative",
                i > 0 && "border-l border-border",
                isCurrent && "bg-accent/5"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full border flex items-center justify-center shrink-0",
                  stage.active
                    ? isCurrent
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border-strong bg-surface text-text"
                    : "border-border bg-bg/40 text-text-subtle"
                )}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "text-[11px] font-mono uppercase tracking-[0.15em] font-semibold",
                      isCurrent
                        ? "text-accent"
                        : stage.active
                          ? "text-text"
                          : "text-text-subtle"
                    )}
                  >
                    {stage.label}
                  </span>
                  {stage.count > 0 && (
                    <span className="text-[12px] font-mono tabular-nums font-semibold text-text">
                      {stage.count}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-text-subtle truncate">
                  {stage.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function uniqueAssignees(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function assigneeNames(ids: string[], userMap: Map<string, User>): string {
  const names = ids.map((id) => userMap.get(id)?.name).filter(Boolean) as string[];
  if (names.length === 0) return "unassigned";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} + ${names[1]}`;
  return `${names[0]} +${names.length - 1}`;
}
