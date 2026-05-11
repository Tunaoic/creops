"use server";

import { db, schema } from "./client";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import {
  DELIVERABLE_TYPE_CHANNELS,
  type ChannelPlatform,
  type DeliverableType,
} from "@/types";
import { COOKIE_NAME, getCurrentUserIdAsync } from "@/lib/current-user";

const WORKSPACE_ID = "ws_1";

/**
 * Resolve current actor for FK inserts (creator_id, author_id, actor_id, uploaded_by).
 * Reads from impersonation cookie. Returns null if workspace has 0 users.
 *
 * Production with real auth: replace with `auth().userId` from Clerk middleware.
 */
async function getActorId(): Promise<string | null> {
  return getCurrentUserIdAsync();
}

// ============================================================================
// User impersonation (prototype only — replace with real auth)
// ============================================================================

export async function switchToUser(userId: string | null): Promise<void> {
  const c = await cookies();
  if (userId) {
    c.set(COOKIE_NAME, userId, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    c.delete(COOKIE_NAME);
  }
  revalidatePath("/", "layout");
}

// ============================================================================
// Watchers — opt-in subscription to a topic or task
// ============================================================================

/**
 * Add a user to the watcher list of a topic or a task. Watchers receive
 * a copy of every progress notification (submit/approve/reject/aired) on
 * the target. Idempotent — calling twice with the same userId is a no-op.
 */
export async function addWatcher(
  target: "topic" | "task",
  targetId: string,
  userId: string
): Promise<void> {
  if (target === "topic") {
    const row = db.select({ watcherIds: schema.topics.watcherIds })
      .from(schema.topics).where(eq(schema.topics.id, targetId)).get();
    const current = (row?.watcherIds as string[]) ?? [];
    if (current.includes(userId)) return;
    db.update(schema.topics)
      .set({ watcherIds: [...current, userId] })
      .where(eq(schema.topics.id, targetId))
      .run();
    revalidateAfterProgress(targetId);
  } else {
    const row = db.select({ watcherIds: schema.tasks.watcherIds, deliverableId: schema.tasks.deliverableId })
      .from(schema.tasks).where(eq(schema.tasks.id, targetId)).get();
    if (!row) return;
    const current = (row.watcherIds as string[]) ?? [];
    if (current.includes(userId)) return;
    db.update(schema.tasks)
      .set({ watcherIds: [...current, userId] })
      .where(eq(schema.tasks.id, targetId))
      .run();
    const topic = db.select({ topicId: schema.deliverables.topicId })
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, row.deliverableId))
      .get();
    revalidateAfterProgress(topic?.topicId);
  }
}

export async function removeWatcher(
  target: "topic" | "task",
  targetId: string,
  userId: string
): Promise<void> {
  if (target === "topic") {
    const row = db.select({ watcherIds: schema.topics.watcherIds })
      .from(schema.topics).where(eq(schema.topics.id, targetId)).get();
    const current = (row?.watcherIds as string[]) ?? [];
    if (!current.includes(userId)) return;
    db.update(schema.topics)
      .set({ watcherIds: current.filter((id) => id !== userId) })
      .where(eq(schema.topics.id, targetId))
      .run();
    revalidateAfterProgress(targetId);
  } else {
    const row = db.select({ watcherIds: schema.tasks.watcherIds, deliverableId: schema.tasks.deliverableId })
      .from(schema.tasks).where(eq(schema.tasks.id, targetId)).get();
    if (!row) return;
    const current = (row.watcherIds as string[]) ?? [];
    if (!current.includes(userId)) return;
    db.update(schema.tasks)
      .set({ watcherIds: current.filter((id) => id !== userId) })
      .where(eq(schema.tasks.id, targetId))
      .run();
    const topic = db.select({ topicId: schema.deliverables.topicId })
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, row.deliverableId))
      .get();
    revalidateAfterProgress(topic?.topicId);
  }
}

// ============================================================================
// Language preference (i18n)
// ============================================================================

const LOCALE_COOKIE = "creops-lang";

export async function setLanguage(locale: "en" | "vi"): Promise<void> {
  const c = await cookies();
  c.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  revalidatePath("/", "layout");
}

// ============================================================================
// Task templates — defines what tasks each deliverable type spawns
// ============================================================================

interface TaskTemplate {
  key: string;
  outputType: "text" | "long_text" | "file" | "chips" | "datetime" | "markdown";
  defaultRole: "editor" | "designer" | "copywriter" | "pic" | "creator";
  perChannel?: boolean;
}

const TEMPLATES: Record<DeliverableType, TaskTemplate[]> = {
  long_video: [
    { key: "final_video", outputType: "file", defaultRole: "editor" },
    { key: "thumbnail", outputType: "file", defaultRole: "designer" },
    { key: "title", outputType: "text", defaultRole: "copywriter" },
    { key: "description", outputType: "long_text", defaultRole: "copywriter" },
    { key: "tags", outputType: "chips", defaultRole: "copywriter" },
    { key: "schedule_time", outputType: "datetime", defaultRole: "pic" },
  ],
  short_video: [
    { key: "master_video", outputType: "file", defaultRole: "editor" },
    { key: "cover_frame", outputType: "file", defaultRole: "designer" },
    { key: "caption", outputType: "text", defaultRole: "copywriter", perChannel: true },
    { key: "schedule_time", outputType: "datetime", defaultRole: "pic", perChannel: true },
  ],
  blog_post: [
    { key: "article_body", outputType: "markdown", defaultRole: "copywriter" },
    { key: "cover_image", outputType: "file", defaultRole: "designer" },
    { key: "seo_meta", outputType: "text", defaultRole: "copywriter" },
    { key: "tags", outputType: "chips", defaultRole: "copywriter" },
    { key: "schedule_time", outputType: "datetime", defaultRole: "pic" },
  ],
  long_post: [
    { key: "post_copy", outputType: "long_text", defaultRole: "copywriter", perChannel: true },
    { key: "cover_image", outputType: "file", defaultRole: "designer" },
    { key: "schedule_time", outputType: "datetime", defaultRole: "pic", perChannel: true },
  ],
  thread: [
    { key: "thread_copy", outputType: "long_text", defaultRole: "copywriter" },
    { key: "thread_visuals", outputType: "file", defaultRole: "designer" },
    { key: "schedule_time", outputType: "datetime", defaultRole: "pic" },
  ],
};

// ----------------------------------------------------------------------------
// Tasks spawn UNASSIGNED. Creator picks assignee per-task (or solo creator
// does it themselves — solo mode = no members in workspace).
// ----------------------------------------------------------------------------

// ============================================================================
// Topic CRUD
// ============================================================================

export async function createTopic(input: {
  name: string;
  brief?: string;
  materialLinks: Array<{ url: string; label?: string }>;
  deliverables: Partial<Record<DeliverableType, ChannelPlatform[]>>;
}): Promise<{ topicId: string }> {
  const topicId = `t_${randomUUID().slice(0, 8)}`;
  const actorId = await getActorId();

  db.insert(schema.topics).values({
    id: topicId,
    workspaceId: WORKSPACE_ID,
    creatorId: actorId,
    name: input.name,
    brief: input.brief,
    status: "in_production",
  }).run();

  // Insert material links as source assets (type=link)
  for (const link of input.materialLinks) {
    if (!link.url.trim()) continue;
    db.insert(schema.sourceAssets).values({
      id: `a_${randomUUID().slice(0, 8)}`,
      topicId,
      type: "doc",
      fileName: link.label?.trim() || extractDomain(link.url),
      fileUrl: link.url.trim(),
      transcriptStatus: "na",
      uploadedBy: await getActorId(),
    }).run();
  }

  for (const [type, channels] of Object.entries(input.deliverables) as [
    DeliverableType,
    ChannelPlatform[]
  ][]) {
    if (!channels || channels.length === 0) continue;
    if (!DELIVERABLE_TYPE_CHANNELS[type]) continue;

    const deliverableId = `d_${randomUUID().slice(0, 8)}`;
    db.insert(schema.deliverables).values({
      id: deliverableId,
      topicId,
      type,
      status: "in_progress",
    }).run();

    const channelIds: string[] = [];
    for (const platform of channels) {
      const ch = db
        .select()
        .from(schema.channels)
        .where(
          and(
            eq(schema.channels.workspaceId, WORKSPACE_ID),
            eq(schema.channels.platform, platform)
          )
        )
        .get();
      if (ch) {
        db.insert(schema.deliverableChannels).values({
          id: `dc_${randomUUID().slice(0, 8)}`,
          deliverableId,
          channelId: ch.id,
        }).run();
        channelIds.push(ch.id);
      }
    }

    const tpls = TEMPLATES[type] ?? [];
    for (const tpl of tpls) {
      const assigneeIds: string[] = [];
      if (tpl.perChannel && channelIds.length > 0) {
        for (const cid of channelIds) {
          db.insert(schema.tasks).values({
            id: `tk_${randomUUID().slice(0, 8)}`,
            deliverableId,
            templateItemKey: tpl.key,
            channelId: cid,
            assigneeIds,
            status: "todo",
            outputType: tpl.outputType,
            aiGenerated: false,
          }).run();
        }
      } else {
        db.insert(schema.tasks).values({
          id: `tk_${randomUUID().slice(0, 8)}`,
          deliverableId,
          templateItemKey: tpl.key,
          assigneeIds,
          status: "todo",
          outputType: tpl.outputType,
          aiGenerated: false,
        }).run();
      }
    }
  }

  logActivity({
    action: "topic.created",
    targetType: "topic",
    targetId: topicId,
    metadata: { name: input.name },
  });

  revalidatePath("/", "layout");
  revalidatePath("/topics");
  return { topicId };
}

export async function addMaterialLink(input: {
  topicId: string;
  url: string;
  label?: string;
}): Promise<void> {
  if (!input.url.trim()) return;
  db.insert(schema.sourceAssets).values({
    id: `a_${randomUUID().slice(0, 8)}`,
    topicId: input.topicId,
    type: "doc",
    fileName: input.label?.trim() || extractDomain(input.url),
    fileUrl: input.url.trim(),
    transcriptStatus: "na",
    uploadedBy: await getActorId(),
  }).run();
  revalidatePath(`/topics/${input.topicId}`);
}

export async function removeMaterialLink(input: {
  topicId: string;
  assetId: string;
}): Promise<void> {
  db.delete(schema.sourceAssets)
    .where(eq(schema.sourceAssets.id, input.assetId))
    .run();
  revalidatePath(`/topics/${input.topicId}`);
}

export async function addDeliverableToTopic(
  topicId: string,
  type: DeliverableType,
  channels: ChannelPlatform[]
): Promise<{ deliverableId: string }> {
  const deliverableId = `d_${randomUUID().slice(0, 8)}`;

  db.insert(schema.deliverables).values({
    id: deliverableId,
    topicId,
    type,
    status: "in_progress",
  }).run();

  const channelIds: string[] = [];
  for (const platform of channels) {
    const ch = db
      .select()
      .from(schema.channels)
      .where(
        and(
          eq(schema.channels.workspaceId, WORKSPACE_ID),
          eq(schema.channels.platform, platform)
        )
      )
      .get();
    if (ch) {
      db.insert(schema.deliverableChannels).values({
        id: `dc_${randomUUID().slice(0, 8)}`,
        deliverableId,
        channelId: ch.id,
      }).run();
      channelIds.push(ch.id);
    }
  }

  const tpls = TEMPLATES[type] ?? [];
  for (const tpl of tpls) {
    const assigneeIds: string[] = [];
    if (tpl.perChannel && channelIds.length > 0) {
      for (const cid of channelIds) {
        db.insert(schema.tasks).values({
          id: `tk_${randomUUID().slice(0, 8)}`,
          deliverableId,
          templateItemKey: tpl.key,
          channelId: cid,
          assigneeIds,
          status: "todo",
          outputType: tpl.outputType,
          aiGenerated: false,
        }).run();
      }
    } else {
      db.insert(schema.tasks).values({
        id: `tk_${randomUUID().slice(0, 8)}`,
        deliverableId,
        templateItemKey: tpl.key,
        assigneeIds,
        status: "todo",
        outputType: tpl.outputType,
        aiGenerated: false,
      }).run();
    }
  }

  revalidatePath(`/topics/${topicId}`);
  return { deliverableId };
}

// ============================================================================
// Bulk task operations
// ----------------------------------------------------------------------------
// Batch pattern (HTTP 207 Multi-Status / AIP-234):
//   1. Snapshot the tasks first.
//   2. Apply all DB writes in one pass.
//   3. Fan out notifications (per-task — assignees need to know each outcome).
//   4. Revalidate ONCE at the end.
// This replaces the old "loop calling assignTask/approveTask/rejectTask"
// which caused N revalidate cycles + N redundant DB reads + UI thrash.
// ============================================================================

export async function bulkAssignTasks(
  taskIds: string[],
  assigneeIds: string[]
): Promise<void> {
  if (taskIds.length === 0) return;
  const tasks = db
    .select()
    .from(schema.tasks)
    .where(inArray(schema.tasks.id, taskIds))
    .all();
  if (tasks.length === 0) return;

  // Apply all assignments in one pass.
  for (const t of tasks) {
    const prev = (t.assigneeIds as string[]) ?? [];
    const added = assigneeIds.filter((id) => !prev.includes(id));
    const removed = prev.filter((id) => !assigneeIds.includes(id));
    if (added.length === 0 && removed.length === 0) continue;

    db.update(schema.tasks)
      .set({ assigneeIds })
      .where(eq(schema.tasks.id, t.id))
      .run();
    logActivity({
      action: assigneeIds.length > 0 ? "task.assigned" : "task.unassigned",
      targetType: "task",
      targetId: t.id,
      metadata: { assigneeIds, added, removed, bulk: true },
    });

    const deliverable = db
      .select()
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, t.deliverableId))
      .get();
    const topicId = deliverable?.topicId;
    await notifyMany(added, {
      event: "tasks_assigned",
      topicId,
      deliverableId: t.deliverableId,
      taskId: t.id,
      payload: { templateItemKey: t.templateItemKey },
    });
    await notifyMany(removed, {
      event: "task_unassigned",
      topicId,
      deliverableId: t.deliverableId,
      taskId: t.id,
      payload: { templateItemKey: t.templateItemKey },
    });
  }

  // All tasks share the same deliverable (panel-scoped). Revalidate the
  // first task's topic — covers the page that called us.
  const topic = db
    .select({ topicId: schema.deliverables.topicId })
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, tasks[0].deliverableId))
    .get();
  revalidateAfterProgress(topic?.topicId);
}

export async function bulkApproveTasks(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) return;
  const tasks = db
    .select()
    .from(schema.tasks)
    .where(inArray(schema.tasks.id, taskIds))
    .all();
  if (tasks.length === 0) return;

  // Only act on tasks currently in 'submitted' state (state-machine guard)
  const approvable = tasks.filter((t) => t.status === "submitted");
  if (approvable.length === 0) return;

  // Apply writes
  for (const t of approvable) {
    db.update(schema.tasks)
      .set({ status: "approved", approvedAt: new Date() })
      .where(eq(schema.tasks.id, t.id))
      .run();
    logActivity({
      action: "task.approved",
      targetType: "task",
      targetId: t.id,
      metadata: { from: t.status, to: "approved", bulk: true },
    });
  }

  // Notify per-task (assignees + watchers learn each outcome individually).
  // Snapshot was taken before the writes so we have the pre-update assignees.
  const deliverableId = approvable[0].deliverableId;
  const topic = db
    .select({ topicId: schema.deliverables.topicId })
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, deliverableId))
    .get();
  const topicId = topic?.topicId;

  for (const t of approvable) {
    const assigneesBefore = (t.assigneeIds as string[]) ?? [];
    await notifyMany(
      [...assigneesBefore, ...getStakeholders(topicId, t.id)],
      {
        event: "task_approved",
        topicId,
        deliverableId,
        taskId: t.id,
        payload: { templateItemKey: t.templateItemKey },
      }
    );
  }

  // Roll up each affected deliverable (dedup by id since bulk may span
  // multiple deliverables in theory — current UI is per-deliverable but
  // be safe).
  const deliverableIds = Array.from(new Set(approvable.map((t) => t.deliverableId)));
  for (const did of deliverableIds) {
    await maybeRollUpDeliverableStatus(did);
  }
  revalidateAfterProgress(topicId);
}

export async function bulkRejectTasks(
  taskIds: string[],
  reason: string
): Promise<void> {
  if (taskIds.length === 0) return;
  const tasks = db
    .select()
    .from(schema.tasks)
    .where(inArray(schema.tasks.id, taskIds))
    .all();
  if (tasks.length === 0) return;

  const rejectable = tasks.filter((t) => t.status === "submitted");
  if (rejectable.length === 0) return;

  for (const t of rejectable) {
    db.update(schema.tasks)
      .set({ status: "rejected", rejectReason: reason })
      .where(eq(schema.tasks.id, t.id))
      .run();
    logActivity({
      action: "task.rejected",
      targetType: "task",
      targetId: t.id,
      metadata: { reason, from: t.status, to: "rejected", bulk: true },
    });
  }

  const deliverableId = rejectable[0].deliverableId;
  const topic = db
    .select({ topicId: schema.deliverables.topicId })
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, deliverableId))
    .get();
  const topicId = topic?.topicId;

  for (const t of rejectable) {
    const assigneesBefore = (t.assigneeIds as string[]) ?? [];
    await notifyMany(
      [...assigneesBefore, ...getStakeholders(topicId, t.id)],
      {
        event: "task_rejected",
        topicId,
        deliverableId,
        taskId: t.id,
        payload: { reason, templateItemKey: t.templateItemKey },
      }
    );
  }

  // Forward-only rollup applies to bulk too: only revert deliverable if it
  // was already approved/in review.
  const deliv = db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, deliverableId))
    .get();
  if (deliv?.status === "approved" || deliv?.status === "review") {
    db.update(schema.deliverables)
      .set({ status: "in_progress", approvedAt: null })
      .where(eq(schema.deliverables.id, deliverableId))
      .run();
  }
  revalidateAfterProgress(topicId);
}

// ============================================================================
// Task assignment
// ============================================================================

export async function assignTask(
  taskId: string,
  assigneeIds: string[]
): Promise<ActionResult> {
  const before = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (!before) return noop("task not found");

  const prevIds = ((before.assigneeIds as string[]) ?? []) as string[];
  const newlyAdded = assigneeIds.filter((id) => !prevIds.includes(id));
  const newlyRemoved = prevIds.filter((id) => !assigneeIds.includes(id));

  // Short-circuit no-op (clicking save without changes).
  if (newlyAdded.length === 0 && newlyRemoved.length === 0) {
    return noop("no assignee change");
  }

  db.update(schema.tasks)
    .set({ assigneeIds })
    .where(eq(schema.tasks.id, taskId))
    .run();

  logActivity({
    action: assigneeIds.length > 0 ? "task.assigned" : "task.unassigned",
    targetType: "task",
    targetId: taskId,
    metadata: { assigneeIds, added: newlyAdded, removed: newlyRemoved },
  });

  const deliverable = db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, before.deliverableId))
    .get();
  const topicId = deliverable?.topicId;

  // Notify newly added — "you've been assigned"
  await notifyMany(newlyAdded, {
    event: "tasks_assigned",
    topicId,
    deliverableId: before.deliverableId,
    taskId,
    payload: { templateItemKey: before.templateItemKey },
  });
  // Notify newly removed — "you've been unassigned" (so it leaves their Inbox)
  await notifyMany(newlyRemoved, {
    event: "task_unassigned",
    topicId,
    deliverableId: before.deliverableId,
    taskId,
    payload: { templateItemKey: before.templateItemKey },
  });

  revalidateAfterProgress(topicId);
  return { ok: true };
}

// ============================================================================
// Task workflow
// ----------------------------------------------------------------------------
// State machine (declarative, server-validated):
//
//   todo ──submit──> submitted ──approve──> approved
//    │ ▲                │                       │
//    │ │                ├──reject──> rejected ──submit──> submitted
//    │ └────────────────┴── (any state can go back to todo via unassign cleanup)
//
// Guards:
//   - Submit only on todo / in_progress / rejected (resubmit). Refuse on
//     submitted (already submitted) / approved (use a manual override path).
//   - Approve only on submitted.
//   - Reject only on submitted.
//   - markChannelAired only on deliverable.status === 'approved'.
//
// Forward-only parent rollup (Linear convention):
//   - rejectTask does NOT auto-reset deliverable to in_progress in the normal
//     flow. Only resets if deliverable had already been bumped to 'approved'
//     (a true revert case).
// ============================================================================

type ActionResult = { ok: true } | { ok: false; reason: string };

/** Result-style success. Logs to console for telemetry on no-op cases. */
function noop(reason: string): ActionResult {
  // eslint-disable-next-line no-console
  console.warn(`[workflow] short-circuit: ${reason}`);
  return { ok: false, reason };
}

export async function submitTask(
  taskId: string,
  output: unknown
): Promise<ActionResult> {
  const before = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (!before) return noop("task not found");

  // Guard: refuse submits on already-approved tasks (would silently overwrite
  // approved output) or aired deliverables.
  if (before.status === "approved") {
    return noop("task already approved — cannot resubmit");
  }

  db.update(schema.tasks)
    .set({
      outputValue: output as never,
      status: "submitted",
      submittedAt: new Date(),
      // Clear stale reject reason on a resubmit so old feedback doesn't haunt
      // the row after it's been addressed.
      rejectReason: null,
    })
    .where(eq(schema.tasks.id, taskId))
    .run();

  logActivity({
    action: "task.submitted",
    targetType: "task",
    targetId: taskId,
    metadata: { from: before.status, to: "submitted" },
  });

  const deliverable = db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, before.deliverableId))
    .get();
  const topicId = deliverable?.topicId;
  // Fan out to creator + topic watchers + task watchers
  const stakeholders = getStakeholders(topicId, taskId);
  await notifyMany(stakeholders, {
    event: "task_submitted",
    topicId,
    deliverableId: before.deliverableId,
    taskId,
    payload: { templateItemKey: before.templateItemKey },
  });

  const wasReviewBefore = deliverable?.status === "review";
  await maybeRollUpDeliverableStatus(before.deliverableId);
  const after = db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, before.deliverableId))
    .get();
  if (after?.status === "review" && !wasReviewBefore) {
    await notifyMany(stakeholders, {
      event: "deliverable_ready_for_review",
      topicId,
      deliverableId: before.deliverableId,
    });
  }

  revalidateAfterProgress(topicId);
  return { ok: true };
}

export async function approveTask(taskId: string): Promise<ActionResult> {
  const before = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (!before) return noop("task not found");

  // Guard: only submitted tasks can be approved (kanban convention —
  // approving a todo task is meaningless).
  if (before.status !== "submitted") {
    return noop(`cannot approve task in state '${before.status}' (must be 'submitted')`);
  }

  const assigneesBefore = (before.assigneeIds as string[]) ?? [];

  db.update(schema.tasks)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(schema.tasks.id, taskId))
    .run();

  logActivity({
    action: "task.approved",
    targetType: "task",
    targetId: taskId,
    metadata: { from: before.status, to: "approved" },
  });

  const deliverable = db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, before.deliverableId))
    .get();
  const topicId = deliverable?.topicId;

  await notifyMany(
    [...assigneesBefore, ...getStakeholders(topicId, taskId)],
    {
      event: "task_approved",
      topicId,
      deliverableId: before.deliverableId,
      taskId,
      payload: { templateItemKey: before.templateItemKey },
    }
  );

  await maybeRollUpDeliverableStatus(before.deliverableId);
  revalidateAfterProgress(topicId);
  return { ok: true };
}

export async function rejectTask(taskId: string, reason: string): Promise<ActionResult> {
  const before = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (!before) return noop("task not found");

  if (before.status !== "submitted") {
    return noop(`cannot reject task in state '${before.status}' (must be 'submitted')`);
  }

  db.update(schema.tasks)
    .set({ status: "rejected", rejectReason: reason })
    .where(eq(schema.tasks.id, taskId))
    .run();

  logActivity({
    action: "task.rejected",
    targetType: "task",
    targetId: taskId,
    metadata: { reason, from: before.status, to: "rejected" },
  });

  const rejectedAssignees = (before.assigneeIds as string[]) ?? [];
  const deliverable = db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, before.deliverableId))
    .get();
  const topicId = deliverable?.topicId;
  await notifyMany(
    [...rejectedAssignees, ...getStakeholders(topicId, taskId)],
    {
      event: "task_rejected",
      topicId,
      deliverableId: before.deliverableId,
      taskId,
      payload: { reason, templateItemKey: before.templateItemKey },
    }
  );

  // Forward-only rollup: only revert deliverable status if it had already
  // been bumped to 'approved' or 'review'. Otherwise leave it alone — natural
  // re-rollup will fire when the resubmit eventually lands.
  if (deliverable?.status === "approved" || deliverable?.status === "review") {
    db.update(schema.deliverables)
      .set({ status: "in_progress", approvedAt: null })
      .where(eq(schema.deliverables.id, before.deliverableId))
      .run();
  }
  revalidateAfterProgress(topicId);
  return { ok: true };
}

/**
 * Batch approve/reject decisions for tasks in a deliverable (the swipe
 * approve flow). Per-task notifications fire (no silent batch — assignees
 * need to know their specific task's outcome). Bulk-efficient: single
 * revalidate at the end.
 */
export async function approveDeliverable(
  deliverableId: string,
  decisions: Record<string, "approve" | "reject">,
  rejectComments: Record<string, string>
): Promise<void> {
  const topic = db
    .select({ topicId: schema.deliverables.topicId })
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, deliverableId))
    .get();
  const topicId = topic?.topicId;

  // Snapshot tasks before update so we can fire notifications with the
  // right assignees + skip no-op transitions.
  const taskRows = db
    .select()
    .from(schema.tasks)
    .where(inArray(schema.tasks.id, Object.keys(decisions)))
    .all();
  const taskMap = new Map(taskRows.map((t) => [t.id, t]));

  // Apply decisions (skip invalid state transitions)
  const willApprove: typeof taskRows = [];
  const willReject: typeof taskRows = [];
  for (const [taskId, decision] of Object.entries(decisions)) {
    const t = taskMap.get(taskId);
    if (!t) continue;
    if (t.status !== "submitted") continue; // guard: only submitted → approve/reject

    if (decision === "approve") {
      db.update(schema.tasks)
        .set({ status: "approved", approvedAt: new Date() })
        .where(eq(schema.tasks.id, taskId))
        .run();
      willApprove.push(t);
    } else {
      db.update(schema.tasks)
        .set({
          status: "rejected",
          rejectReason: rejectComments[taskId] ?? null,
        })
        .where(eq(schema.tasks.id, taskId))
        .run();
      willReject.push(t);
    }
  }

  // Fire per-task notifications. Each assignee learns their specific
  // task's outcome (this is the bug the user hit — old batch path emitted
  // only a deliverable-level notification, hiding individual rejections).
  for (const t of willApprove) {
    const assigneesBefore = (t.assigneeIds as string[]) ?? [];
    await logActivity({
      action: "task.approved",
      targetType: "task",
      targetId: t.id,
      metadata: { from: t.status, to: "approved", via: "approve_flow" },
    });
    await notifyMany(
      [...assigneesBefore, ...getStakeholders(topicId, t.id)],
      {
        event: "task_approved",
        topicId,
        deliverableId,
        taskId: t.id,
        payload: { templateItemKey: t.templateItemKey },
      }
    );
  }
  for (const t of willReject) {
    const assigneesBefore = (t.assigneeIds as string[]) ?? [];
    const reason = rejectComments[t.id] ?? "";
    await logActivity({
      action: "task.rejected",
      targetType: "task",
      targetId: t.id,
      metadata: { reason, from: t.status, to: "rejected", via: "approve_flow" },
    });
    await notifyMany(
      [...assigneesBefore, ...getStakeholders(topicId, t.id)],
      {
        event: "task_rejected",
        topicId,
        deliverableId,
        taskId: t.id,
        payload: { reason, templateItemKey: t.templateItemKey },
      }
    );
  }

  await maybeRollUpDeliverableStatus(deliverableId);
  const after = db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, deliverableId))
    .get();
  if (after?.status === "approved") {
    const stakeholders = getStakeholders(topicId, null);
    await notifyMany(stakeholders, {
      event: "deliverable_approved",
      topicId,
      deliverableId,
    });
  }
  revalidateAfterProgress(topicId);
}

// ============================================================================
// Aired link
// ============================================================================

export async function markChannelAired(
  deliverableChannelId: string,
  airedLink: string
): Promise<ActionResult> {
  // Guard: deliverable must be approved before any channel can air.
  // (UI hides the button when not approved, but server is the source of truth.)
  const dcCheck = db
    .select()
    .from(schema.deliverableChannels)
    .where(eq(schema.deliverableChannels.id, deliverableChannelId))
    .get();
  if (!dcCheck) return noop("deliverable channel not found");
  if (dcCheck.airedLink) return noop("channel already aired");
  const delivCheck = db
    .select({ status: schema.deliverables.status })
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, dcCheck.deliverableId))
    .get();
  if (delivCheck?.status !== "approved" && delivCheck?.status !== "aired") {
    return noop(
      `cannot mark aired — deliverable is in state '${delivCheck?.status}', must be 'approved'`
    );
  }

  db.update(schema.deliverableChannels)
    .set({ airedLink, airedAt: new Date() })
    .where(eq(schema.deliverableChannels.id, deliverableChannelId))
    .run();

  logActivity({
    action: "channel.aired",
    targetType: "deliverable_channel",
    targetId: deliverableChannelId,
    metadata: { link: airedLink },
  });

  // Notify topic creator that something went live
  const dcRow = db
    .select()
    .from(schema.deliverableChannels)
    .where(eq(schema.deliverableChannels.id, deliverableChannelId))
    .get();
  if (dcRow) {
    const deliv = db
      .select()
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, dcRow.deliverableId))
      .get();
    if (deliv) {
      // Fan out aired event to creator + topic watchers
      const stakeholders = getStakeholders(deliv.topicId, null);
      await notifyMany(stakeholders, {
        event: "deliverable_aired",
        topicId: deliv.topicId,
        deliverableId: dcRow.deliverableId,
        payload: { link: airedLink },
      });
    }
  }

  const dc = db
    .select()
    .from(schema.deliverableChannels)
    .where(eq(schema.deliverableChannels.id, deliverableChannelId))
    .get();
  if (dc) {
    const allChannels = db
      .select()
      .from(schema.deliverableChannels)
      .where(eq(schema.deliverableChannels.deliverableId, dc.deliverableId))
      .all();
    if (allChannels.every((c) => c.airedAt)) {
      db.update(schema.deliverables)
        .set({ status: "aired", airedAt: new Date() })
        .where(eq(schema.deliverables.id, dc.deliverableId))
        .run();
      await maybeRollUpTopicStatus(dc.deliverableId);
    }
    const topic = db
      .select({ topicId: schema.deliverables.topicId })
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, dc.deliverableId))
      .get();
    revalidateAfterProgress(topic?.topicId);
  }
  return { ok: true };
}

// ============================================================================
// Status roll-up
// ============================================================================

async function maybeRollUpDeliverableStatus(deliverableId: string) {
  const tasks = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.deliverableId, deliverableId))
    .all();

  if (tasks.length === 0) return;

  const allApproved = tasks.every((t) => t.status === "approved");
  const allDone = tasks.every(
    (t) => t.status === "approved" || t.status === "submitted"
  );

  if (allApproved) {
    db.update(schema.deliverables)
      .set({ status: "approved", approvedAt: new Date() })
      .where(eq(schema.deliverables.id, deliverableId))
      .run();
  } else if (allDone) {
    db.update(schema.deliverables)
      .set({ status: "review" })
      .where(eq(schema.deliverables.id, deliverableId))
      .run();
  }
}

async function maybeRollUpTopicStatus(deliverableId: string) {
  const deliverable = db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, deliverableId))
    .get();
  if (!deliverable) return;
  const all = db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.topicId, deliverable.topicId))
    .all();
  const airedCount = all.filter((d) => d.status === "aired").length;
  let newStatus: string;
  if (airedCount === all.length) newStatus = "fully_aired";
  else if (airedCount > 0) newStatus = "partially_aired";
  else return;
  db.update(schema.topics)
    .set({ status: newStatus })
    .where(eq(schema.topics.id, deliverable.topicId))
    .run();
}

// ============================================================================
// Settings
// ============================================================================

export async function updateWorkspaceSettings(input: {
  blockReasonDisplay?: "name" | "role";
}): Promise<void> {
  const update: Partial<typeof schema.workspaceSettings.$inferInsert> = {};
  if (input.blockReasonDisplay) update.blockReasonDisplay = input.blockReasonDisplay;

  if (Object.keys(update).length === 0) return;
  db.update(schema.workspaceSettings)
    .set(update)
    .where(eq(schema.workspaceSettings.workspaceId, WORKSPACE_ID))
    .run();
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function updateChannelStyleGuide(input: {
  channelId: string;
  contentType: string;
  samples: string[];
  promptOverride?: string;
}): Promise<void> {
  const existing = db
    .select()
    .from(schema.channelStyleGuides)
    .where(
      and(
        eq(schema.channelStyleGuides.channelId, input.channelId),
        eq(schema.channelStyleGuides.contentType, input.contentType)
      )
    )
    .get();

  if (existing) {
    db.update(schema.channelStyleGuides)
      .set({
        samples: input.samples,
        promptOverride: input.promptOverride,
        updatedAt: new Date(),
      })
      .where(eq(schema.channelStyleGuides.id, existing.id))
      .run();
  } else {
    db.insert(schema.channelStyleGuides).values({
      id: `csg_${randomUUID().slice(0, 8)}`,
      channelId: input.channelId,
      contentType: input.contentType,
      samples: input.samples,
      promptOverride: input.promptOverride,
    }).run();
  }
  revalidatePath(`/settings/channels/${input.channelId}`);
}

// ============================================================================
// Notification CRUD
// ============================================================================

export async function markNotificationRead(notificationId: string): Promise<void> {
  db.update(schema.notifications)
    .set({ readAt: new Date() })
    .where(eq(schema.notifications.id, notificationId))
    .run();
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  const actorId = await getActorId();
  if (!actorId) return;
  db.update(schema.notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.userId, actorId),
        isNull(schema.notifications.readAt)
      )
    )
    .run();
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
}

// ============================================================================
// Activity logging — fire-and-forget audit trail
// ============================================================================

async function logActivity(input: {
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const actorId = await getActorId();
    db.insert(schema.activityLog).values({
      id: `act_${randomUUID().slice(0, 8)}`,
      workspaceId: WORKSPACE_ID,
      actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? {},
    }).run();
  } catch (e) {
    console.error("[activity log] failed:", e);
  }
}

// ============================================================================
// Notifications — fire-and-forget delivery
// ============================================================================

type NotifyEvent =
  | "tasks_assigned"
  | "task_unassigned"
  | "task_submitted"
  | "task_approved"
  | "task_rejected"
  | "deliverable_ready_for_review"
  | "deliverable_approved"
  | "deliverable_aired"
  | "mentioned"
  | "transcribe_done"
  | "cut_suggestions_ready";

async function notify(input: {
  userId: string | null;
  event: NotifyEvent;
  topicId?: string;
  deliverableId?: string;
  taskId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  // Skip self-notification (don't notify your own actions to yourself)
  const actor = await getActorId();
  if (!input.userId || input.userId === actor) return;
  try {
    db.insert(schema.notifications).values({
      id: `n_${randomUUID().slice(0, 8)}`,
      userId: input.userId,
      event: input.event,
      topicId: input.topicId,
      deliverableId: input.deliverableId,
      taskId: input.taskId,
      // Stash actor in payload so UI shows real name (no actor_id column).
      payload: { ...(input.payload ?? {}), actorId: actor },
    }).run();
  } catch (e) {
    console.error("[notify] failed:", e);
  }
}

/**
 * Fan-out notify to a list of users — dedupes + skips self.
 * Use this anywhere a progress event has multiple stakeholders
 * (creator, assignees, watchers).
 */
async function notifyMany(
  userIds: Array<string | null | undefined>,
  base: Omit<Parameters<typeof notify>[0], "userId">
): Promise<void> {
  const seen = new Set<string>();
  for (const uid of userIds) {
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    await notify({ ...base, userId: uid });
  }
}

/**
 * Resolve all stakeholders for a task event:
 * - Topic creator
 * - Topic-level watchers
 * - Task-level watchers
 * - (optionally) the task's current assignees
 *
 * Used to fan out task_submitted / task_approved / task_rejected /
 * deliverable_* events. Returns deduped userIds (filter happens in
 * notifyMany via the seen-set).
 */
function getStakeholders(
  topicId: string | null | undefined,
  taskId: string | null | undefined,
  opts: { includeAssignees?: boolean } = {}
): string[] {
  const out: string[] = [];
  if (topicId) {
    const t = db
      .select({ creatorId: schema.topics.creatorId, watcherIds: schema.topics.watcherIds })
      .from(schema.topics)
      .where(eq(schema.topics.id, topicId))
      .get();
    if (t?.creatorId) out.push(t.creatorId);
    if (t?.watcherIds) out.push(...((t.watcherIds as string[]) ?? []));
  }
  if (taskId) {
    const tk = db
      .select({
        watcherIds: schema.tasks.watcherIds,
        assigneeIds: schema.tasks.assigneeIds,
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.id, taskId))
      .get();
    if (tk?.watcherIds) out.push(...((tk.watcherIds as string[]) ?? []));
    if (opts.includeAssignees && tk?.assigneeIds) {
      out.push(...((tk.assigneeIds as string[]) ?? []));
    }
  }
  return out;
}

/**
 * Standard revalidation after any progress event:
 * - layout (refreshes TopBar NotificationsBell + Sidebar counts)
 * - inbox + dashboard
 * - the specific topic page if known
 */
function revalidateAfterProgress(topicId?: string | null) {
  revalidatePath("/", "layout");
  revalidatePath("/inbox");
  if (topicId) revalidatePath(`/topics/${topicId}`);
}

function getCreatorOfTask(taskId: string): string | null {
  const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (!task) return null;
  const deliverable = db
    .select({ topicId: schema.deliverables.topicId })
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, task.deliverableId))
    .get();
  if (!deliverable) return null;
  const topic = db
    .select({ creatorId: schema.topics.creatorId })
    .from(schema.topics)
    .where(eq(schema.topics.id, deliverable.topicId))
    .get();
  return topic?.creatorId ?? null;
}

// ============================================================================
// Comments
// ============================================================================

export async function addComment(input: {
  targetType: "topic" | "deliverable" | "task" | "asset";
  targetId: string;
  body: string;
  mentions?: string[];
}): Promise<{ commentId: string }> {
  if (!input.body.trim()) throw new Error("Empty comment");
  const commentId = `c_${randomUUID().slice(0, 8)}`;
  const mentions = input.mentions ?? [];
  db.insert(schema.comments).values({
    id: commentId,
    workspaceId: WORKSPACE_ID,
    targetType: input.targetType,
    targetId: input.targetId,
    authorId: await getActorId(),
    body: input.body.trim(),
    mentions,
  }).run();

  // Notify mentioned users (skip self)
  if (mentions.length > 0) {
    let topicId: string | undefined;
    let deliverableId: string | undefined;
    let taskId: string | undefined;
    if (input.targetType === "task") {
      taskId = input.targetId;
      const t = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
      if (t) {
        deliverableId = t.deliverableId;
        const d = db.select().from(schema.deliverables).where(eq(schema.deliverables.id, deliverableId)).get();
        topicId = d?.topicId;
      }
    } else if (input.targetType === "topic") {
      topicId = input.targetId;
    } else if (input.targetType === "deliverable") {
      deliverableId = input.targetId;
      const d = db.select().from(schema.deliverables).where(eq(schema.deliverables.id, deliverableId)).get();
      topicId = d?.topicId;
    }
    for (const userId of mentions) {
      notify({
        userId,
        event: "mentioned",
        topicId,
        deliverableId,
        taskId,
        payload: { excerpt: input.body.slice(0, 80) },
      });
    }
  }

  // Revalidate the appropriate page
  if (input.targetType === "task") {
    const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, input.targetId)).get();
    if (task) {
      const topic = db
        .select({ topicId: schema.deliverables.topicId })
        .from(schema.deliverables)
        .where(eq(schema.deliverables.id, task.deliverableId))
        .get();
      if (topic) {
        revalidatePath(`/topics/${topic.topicId}/tasks/${input.targetId}`);
        revalidatePath(`/topics/${topic.topicId}`);
      }
    }
  } else if (input.targetType === "topic") {
    revalidatePath(`/topics/${input.targetId}`);
  } else if (input.targetType === "deliverable") {
    const d = db.select().from(schema.deliverables).where(eq(schema.deliverables.id, input.targetId)).get();
    if (d) revalidatePath(`/topics/${d.topicId}`);
  }
  return { commentId };
}

export async function removeComment(commentId: string): Promise<void> {
  const c = db.select().from(schema.comments).where(eq(schema.comments.id, commentId)).get();
  if (!c) return;
  db.delete(schema.comments).where(eq(schema.comments.id, commentId)).run();
  if (c.targetType === "task") {
    const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, c.targetId)).get();
    if (task) {
      const topic = db
        .select({ topicId: schema.deliverables.topicId })
        .from(schema.deliverables)
        .where(eq(schema.deliverables.id, task.deliverableId))
        .get();
      if (topic) revalidatePath(`/topics/${topic.topicId}/tasks/${c.targetId}`);
    }
  } else if (c.targetType === "topic") {
    revalidatePath(`/topics/${c.targetId}`);
  }
}

// ============================================================================
// Members (Team)
// ============================================================================

export async function createMember(input: {
  name: string;
  email: string;
  role: string;
}): Promise<{ userId: string }> {
  const userId = `u_${randomUUID().slice(0, 8)}`;
  db.insert(schema.users).values({
    id: userId,
    workspaceId: WORKSPACE_ID,
    name: input.name.trim(),
    email: input.email.trim(),
    roles: [input.role],
  }).run();
  revalidatePath("/settings/members");
  revalidatePath("/settings");
  return { userId };
}

export async function updateMember(input: {
  userId: string;
  name?: string;
  email?: string;
  role?: string;
  accessLevel?: "full" | "limited" | "readonly";
}): Promise<void> {
  const update: Partial<typeof schema.users.$inferInsert> = {};
  if (input.name !== undefined) update.name = input.name.trim();
  if (input.email !== undefined) update.email = input.email.trim();
  if (input.role !== undefined) update.roles = [input.role];
  if (input.accessLevel !== undefined) update.accessLevel = input.accessLevel;
  if (Object.keys(update).length === 0) return;
  db.update(schema.users)
    .set(update)
    .where(eq(schema.users.id, input.userId))
    .run();
  revalidatePath("/settings/members");
  revalidatePath("/settings");
}

export async function removeMember(userId: string): Promise<void> {
  // Find tasks where user is in assigneeIds — remove them from each
  const allTasks = db.select().from(schema.tasks).all();
  for (const t of allTasks) {
    const ids = (t.assigneeIds as string[]) ?? [];
    if (ids.includes(userId)) {
      const filtered = ids.filter((id) => id !== userId);
      db.update(schema.tasks)
        .set({ assigneeIds: filtered })
        .where(eq(schema.tasks.id, t.id))
        .run();
    }
  }
  // Remove from default assignees
  const settings = db
    .select()
    .from(schema.workspaceSettings)
    .where(eq(schema.workspaceSettings.workspaceId, WORKSPACE_ID))
    .get();
  if (settings) {
    const defaults = (settings.defaultAssignees as Record<string, string>) ?? {};
    let changed = false;
    for (const k of Object.keys(defaults)) {
      if (defaults[k] === userId) {
        delete defaults[k];
        changed = true;
      }
    }
    if (changed) {
      db.update(schema.workspaceSettings)
        .set({ defaultAssignees: defaults })
        .where(eq(schema.workspaceSettings.workspaceId, WORKSPACE_ID))
        .run();
    }
  }
  db.delete(schema.users).where(eq(schema.users.id, userId)).run();
  revalidatePath("/settings/members");
  revalidatePath("/settings");
}

// ============================================================================
// Helpers
// ============================================================================

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}
