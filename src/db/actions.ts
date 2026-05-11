"use server";

import { db, schema } from "./client";
import { and, eq, isNull } from "drizzle-orm";
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

  revalidatePath("/");
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
// ============================================================================

export async function bulkAssignTasks(
  taskIds: string[],
  assigneeIds: string[]
): Promise<void> {
  for (const taskId of taskIds) {
    await assignTask(taskId, assigneeIds);
  }
}

export async function bulkApproveTasks(taskIds: string[]): Promise<void> {
  for (const taskId of taskIds) {
    await approveTask(taskId);
  }
}

export async function bulkRejectTasks(
  taskIds: string[],
  reason: string
): Promise<void> {
  for (const taskId of taskIds) {
    await rejectTask(taskId, reason);
  }
}

// ============================================================================
// Task assignment
// ============================================================================

export async function assignTask(
  taskId: string,
  assigneeIds: string[]
): Promise<void> {
  // Read previous assignees to figure out new ones (for notifications)
  const before = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  const prevIds = ((before?.assigneeIds as string[]) ?? []) as string[];
  const newlyAdded = assigneeIds.filter((id) => !prevIds.includes(id));

  db.update(schema.tasks)
    .set({ assigneeIds })
    .where(eq(schema.tasks.id, taskId))
    .run();

  logActivity({
    action: assigneeIds.length > 0 ? "task.assigned" : "task.unassigned",
    targetType: "task",
    targetId: taskId,
    metadata: { assigneeIds },
  });

  const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (task && newlyAdded.length > 0) {
    const deliverable = db
      .select()
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, task.deliverableId))
      .get();
    for (const userId of newlyAdded) {
      notify({
        userId,
        event: "tasks_assigned",
        topicId: deliverable?.topicId,
        deliverableId: task.deliverableId,
        taskId,
        payload: { templateItemKey: task.templateItemKey },
      });
    }
  }
  if (task) {
    const topic = db
      .select({ topicId: schema.deliverables.topicId })
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, task.deliverableId))
      .get();
    revalidatePath("/");
    revalidatePath("/inbox");
    if (topic) revalidatePath(`/topics/${topic.topicId}`);
  }
}

// ============================================================================
// Task workflow
// ============================================================================

export async function submitTask(taskId: string, output: unknown): Promise<void> {
  db.update(schema.tasks)
    .set({
      outputValue: output as never,
      status: "submitted",
      submittedAt: new Date(),
    })
    .where(eq(schema.tasks.id, taskId))
    .run();

  logActivity({
    action: "task.submitted",
    targetType: "task",
    targetId: taskId,
  });

  // Notify topic creator about pending review
  const creatorId = getCreatorOfTask(taskId);
  const submittedTask = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (creatorId && submittedTask) {
    const deliverable = db
      .select()
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, submittedTask.deliverableId))
      .get();
    notify({
      userId: creatorId,
      event: "deliverable_ready_for_review",
      topicId: deliverable?.topicId,
      deliverableId: submittedTask.deliverableId,
      taskId,
      payload: { templateItemKey: submittedTask.templateItemKey },
    });
  }

  const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (task) {
    await maybeRollUpDeliverableStatus(task.deliverableId);
    revalidatePath("/");
    const topic = db
      .select({ topicId: schema.deliverables.topicId })
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, task.deliverableId))
      .get();
    if (topic) revalidatePath(`/topics/${topic.topicId}`);
  }
}

export async function approveTask(taskId: string): Promise<void> {
  db.update(schema.tasks)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(schema.tasks.id, taskId))
    .run();

  logActivity({
    action: "task.approved",
    targetType: "task",
    targetId: taskId,
  });

  const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (task) {
    await maybeRollUpDeliverableStatus(task.deliverableId);
    revalidatePath("/");
    const topic = db
      .select({ topicId: schema.deliverables.topicId })
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, task.deliverableId))
      .get();
    if (topic) revalidatePath(`/topics/${topic.topicId}`);
  }
}

export async function rejectTask(taskId: string, reason: string): Promise<void> {
  db.update(schema.tasks)
    .set({ status: "rejected", rejectReason: reason })
    .where(eq(schema.tasks.id, taskId))
    .run();

  logActivity({
    action: "task.rejected",
    targetType: "task",
    targetId: taskId,
    metadata: { reason },
  });

  // Notify all assignees about rejection
  const rejectedTask = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  const rejectedAssignees = (rejectedTask?.assigneeIds as string[]) ?? [];
  if (rejectedAssignees.length > 0 && rejectedTask) {
    const deliverable = db
      .select()
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, rejectedTask.deliverableId))
      .get();
    for (const userId of rejectedAssignees) {
      notify({
        userId,
        event: "task_rejected",
        topicId: deliverable?.topicId,
        deliverableId: rejectedTask.deliverableId,
        taskId,
        payload: { reason, templateItemKey: rejectedTask.templateItemKey },
      });
    }
  }

  const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (task) {
    db.update(schema.deliverables)
      .set({ status: "in_progress", approvedAt: null })
      .where(eq(schema.deliverables.id, task.deliverableId))
      .run();
    revalidatePath("/");
    const topic = db
      .select({ topicId: schema.deliverables.topicId })
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, task.deliverableId))
      .get();
    if (topic) revalidatePath(`/topics/${topic.topicId}`);
  }
}

export async function approveDeliverable(
  deliverableId: string,
  decisions: Record<string, "approve" | "reject">,
  rejectComments: Record<string, string>
): Promise<void> {
  for (const [taskId, decision] of Object.entries(decisions)) {
    if (decision === "approve") {
      db.update(schema.tasks)
        .set({ status: "approved", approvedAt: new Date() })
        .where(eq(schema.tasks.id, taskId))
        .run();
    } else {
      db.update(schema.tasks)
        .set({
          status: "rejected",
          rejectReason: rejectComments[taskId] ?? null,
        })
        .where(eq(schema.tasks.id, taskId))
        .run();
    }
  }
  await maybeRollUpDeliverableStatus(deliverableId);
  const topic = db
    .select({ topicId: schema.deliverables.topicId })
    .from(schema.deliverables)
    .where(eq(schema.deliverables.id, deliverableId))
    .get();
  revalidatePath("/");
  if (topic) revalidatePath(`/topics/${topic.topicId}`);
}

// ============================================================================
// Aired link
// ============================================================================

export async function markChannelAired(
  deliverableChannelId: string,
  airedLink: string
): Promise<void> {
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
      const topic = db
        .select({ creatorId: schema.topics.creatorId })
        .from(schema.topics)
        .where(eq(schema.topics.id, deliv.topicId))
        .get();
      if (topic?.creatorId) {
        notify({
          userId: topic.creatorId,
          event: "deliverable_aired",
          topicId: deliv.topicId,
          deliverableId: dcRow.deliverableId,
          payload: { link: airedLink },
        });
      }
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
    revalidatePath("/");
    const topic = db
      .select({ topicId: schema.deliverables.topicId })
      .from(schema.deliverables)
      .where(eq(schema.deliverables.id, dc.deliverableId))
      .get();
    if (topic) revalidatePath(`/topics/${topic.topicId}`);
  }
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
  revalidatePath("/");
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
  revalidatePath("/");
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
  revalidatePath("/");
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

async function notify(input: {
  userId: string | null;
  event:
    | "tasks_assigned"
    | "task_rejected"
    | "deliverable_ready_for_review"
    | "deliverable_aired"
    | "mentioned"
    | "transcribe_done"
    | "cut_suggestions_ready";
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
      // Stash the actor that triggered this notification so the UI can show
      // a real name instead of "Someone". Schema has no actor_id column yet,
      // so this lives in payload — cheap and back-compat.
      payload: { ...(input.payload ?? {}), actorId: actor },
    }).run();
  } catch (e) {
    console.error("[notify] failed:", e);
  }
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
