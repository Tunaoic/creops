import "server-only";
import { db, schema } from "./client";
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import type {
  Channel,
  Deliverable,
  DeliverableChannel,
  SourceAsset,
  Task,
  Topic,
  User,
  ChannelPlatform,
  AssetType,
  DeliverableType,
  DeliverableStatus,
  TaskStatus,
  TaskOutputType,
  TopicStatus,
  UserRole,
} from "@/types";

const WORKSPACE_ID = "ws_1";
/**
 * Legacy export for backward compat — no longer the source of truth.
 * Use getCurrentUserIdAsync() from @/lib/current-user instead.
 */
export const CURRENT_USER_ID = "u_watcher";

import { getCurrentUserIdAsync } from "@/lib/current-user";

/**
 * Resolve current user ID — reads from impersonation cookie first.
 * Used in queries that filter "your notifications", "your tasks", etc.
 */
export async function resolveCurrentActorId(): Promise<string | null> {
  return getCurrentUserIdAsync();
}

// ----------------------------------------------------------------------------
// Mappers (DB row → app type)
// ----------------------------------------------------------------------------

function mapUser(row: typeof schema.users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl ?? undefined,
    roles: (row.roles as UserRole[]) ?? [],
    accessLevel: (row.accessLevel as "full" | "limited" | "readonly") ?? "full",
  };
}

function mapChannel(row: typeof schema.channels.$inferSelect): Channel {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform as ChannelPlatform,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
  };
}

function mapAsset(row: typeof schema.sourceAssets.$inferSelect): SourceAsset {
  return {
    id: row.id,
    topicId: row.topicId,
    type: row.type as AssetType,
    fileName: row.fileName,
    fileUrl: row.fileUrl,
    durationSec: row.durationSec ?? undefined,
    caption: row.caption ?? undefined,
    transcriptStatus: row.transcriptStatus as SourceAsset["transcriptStatus"],
    uploadedBy: row.uploadedBy ?? undefined,
    uploadedAt: row.uploadedAt.toISOString(),
  };
}

function mapTask(row: typeof schema.tasks.$inferSelect): Task {
  return {
    id: row.id,
    deliverableId: row.deliverableId,
    templateItemKey: row.templateItemKey,
    channelId: row.channelId ?? undefined,
    assigneeIds: (row.assigneeIds as string[]) ?? [],
    watcherIds: (row.watcherIds as string[]) ?? [],
    dueDate: row.dueDate ?? undefined,
    status: row.status as TaskStatus,
    outputType: row.outputType as TaskOutputType,
    outputValue: row.outputValue ?? undefined,
    rejectReason: row.rejectReason ?? undefined,
    aiGenerated: row.aiGenerated,
  };
}

function mapDeliverableChannel(
  row: typeof schema.deliverableChannels.$inferSelect
): DeliverableChannel {
  return {
    id: row.id,
    channelId: row.channelId,
    airedLink: row.airedLink ?? undefined,
    airedAt: row.airedAt?.toISOString(),
  };
}

// ----------------------------------------------------------------------------
// Read queries
// ----------------------------------------------------------------------------

/**
 * Returns the current logged-in user. Resolves via impersonation cookie:
 * 1. Cookie-stored user if exists in DB
 * 2. First user in workspace
 * 3. Setup placeholder if workspace has 0 users
 */
export async function getCurrentUser(): Promise<User> {
  const id = await getCurrentUserIdAsync();
  if (id) {
    const row = await db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (row) return mapUser(row);
  }
  // Workspace has zero users — placeholder so UI doesn't crash
  return {
    id: "u_setup",
    name: "Setup",
    email: "—",
    roles: ["watcher"],
    accessLevel: "full",
  };
}

export async function getAllUsers(): Promise<User[]> {
  const rows = await db.select().from(schema.users).all();
  return rows.map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  return row ? mapUser(row) : null;
}

export async function getAllChannels(): Promise<Channel[]> {
  const rows = await db.select().from(schema.channels).all();
  return rows.map(mapChannel);
}

export async function getChannelById(id: string): Promise<Channel | null> {
  const row = await db
    .select()
    .from(schema.channels)
    .where(eq(schema.channels.id, id))
    .get();
  return row ? mapChannel(row) : null;
}

async function loadTopicWithChildren(
  topicRow: typeof schema.topics.$inferSelect
): Promise<Topic> {
  const assetRows = await db
    .select()
    .from(schema.sourceAssets)
    .where(eq(schema.sourceAssets.topicId, topicRow.id))
    .all();

  const deliverableRows = await db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.topicId, topicRow.id))
    .all();

  const deliverableIds = deliverableRows.map((d) => d.id);

  const channelRows = deliverableIds.length
    ? await db
        .select()
        .from(schema.deliverableChannels)
        .where(inArray(schema.deliverableChannels.deliverableId, deliverableIds))
        .all()
    : [];

  const taskRows = deliverableIds.length
    ? await db
        .select()
        .from(schema.tasks)
        .where(inArray(schema.tasks.deliverableId, deliverableIds))
        .all()
    : [];

  const deliverables: Deliverable[] = deliverableRows.map((d) => ({
    id: d.id,
    topicId: d.topicId,
    type: d.type as DeliverableType,
    status: d.status as DeliverableStatus,
    channels: channelRows
      .filter((c) => c.deliverableId === d.id)
      .map(mapDeliverableChannel),
    tasks: taskRows.filter((t) => t.deliverableId === d.id).map(mapTask),
    createdAt: d.createdAt.toISOString(),
    approvedAt: d.approvedAt?.toISOString(),
    airedAt: d.airedAt?.toISOString(),
  }));

  return {
    id: topicRow.id,
    workspaceId: topicRow.workspaceId,
    creatorId: topicRow.creatorId ?? undefined,
    name: topicRow.name,
    brief: topicRow.brief ?? undefined,
    status: topicRow.status as TopicStatus,
    targetPublishDate: topicRow.targetPublishDate ?? undefined,
    watcherIds: (topicRow.watcherIds as string[]) ?? [],
    createdAt: topicRow.createdAt.toISOString(),
    sourceAssets: assetRows.map(mapAsset),
    deliverables,
  };
}

export async function getAllTopics(): Promise<Topic[]> {
  const rows = await db
    .select()
    .from(schema.topics)
    .where(eq(schema.topics.workspaceId, WORKSPACE_ID))
    .orderBy(desc(schema.topics.createdAt))
    .all();
  return Promise.all(rows.map(loadTopicWithChildren));
}

export async function getTopicById(id: string): Promise<Topic | null> {
  const row = await db
    .select()
    .from(schema.topics)
    .where(eq(schema.topics.id, id))
    .get();
  return row ? loadTopicWithChildren(row) : null;
}

// ----------------------------------------------------------------------------
// Dashboard selectors
// ----------------------------------------------------------------------------

export async function getDeliverablesNeedingReview(_userId?: string) {
  const all = await getAllTopics();
  const items: Array<{ topic: Topic; deliverable: Deliverable }> = [];
  for (const t of all) {
    for (const d of t.deliverables) {
      if (d.status === "review") items.push({ topic: t, deliverable: d });
    }
  }
  return items;
}

export async function getInProgressTopics(_userId?: string): Promise<Topic[]> {
  const all = await getAllTopics();
  return all.filter(
    (t) => t.status === "in_production" || t.status === "partially_aired"
  );
}

export async function getAiredThisWeek(_userId?: string): Promise<Topic[]> {
  const all = await getAllTopics();
  const oneWeekAgo = Date.now() - 7 * 86_400_000;
  return all.filter((t) => {
    return t.deliverables.some((d) =>
      d.channels.some(
        (c) => c.airedAt && new Date(c.airedAt).getTime() >= oneWeekAgo
      )
    );
  });
}

/**
 * Tasks assigned to a specific user (active, non-completed).
 * Returned with their parent topic + deliverable for routing in UI.
 * Sorted: in_progress first, then todo; oldest dueDate first within each.
 */
export async function getMyTasks(userId: string): Promise<
  Array<{ topic: Topic; deliverable: Deliverable; task: Task }>
> {
  const all = await getAllTopics();
  const items: Array<{ topic: Topic; deliverable: Deliverable; task: Task }> = [];
  for (const t of all) {
    for (const d of t.deliverables) {
      for (const task of d.tasks) {
        if (
          task.assigneeIds.includes(userId) &&
          (task.status === "todo" || task.status === "in_progress")
        ) {
          items.push({ topic: t, deliverable: d, task });
        }
      }
    }
  }
  items.sort((a, b) => {
    const sa = a.task.status === "in_progress" ? 0 : 1;
    const sb = b.task.status === "in_progress" ? 0 : 1;
    if (sa !== sb) return sa - sb;
    const da = a.task.dueDate ?? "";
    const db = b.task.dueDate ?? "";
    if (da && db) return da.localeCompare(db);
    if (da) return -1;
    if (db) return 1;
    return 0;
  });
  return items;
}

/**
 * Deliverables in `submitted` review status that the current user owns
 * (i.e., they are the topic creator and need to approve/reject).
 */
export async function getDeliverablesAwaitingMyReview(
  userId: string
): Promise<Array<{ topic: Topic; deliverable: Deliverable }>> {
  const all = await getAllTopics();
  const items: Array<{ topic: Topic; deliverable: Deliverable }> = [];
  for (const t of all) {
    if (t.creatorId !== userId) continue;
    for (const d of t.deliverables) {
      if (d.status === "review") items.push({ topic: t, deliverable: d });
    }
  }
  return items;
}

export function getBlockReason(
  deliverable: Deliverable,
  display: "name" | "role",
  userMap: Map<string, User>
): string | null {
  if (deliverable.status === "aired" || deliverable.status === "approved")
    return null;
  const blockingTask = deliverable.tasks.find(
    (t) => t.status === "todo" || t.status === "in_progress"
  );
  if (!blockingTask) return null;
  const taskLabel = blockingTask.templateItemKey.replace(/_/g, " ");
  const assignees = blockingTask.assigneeIds
    .map((id) => userMap.get(id))
    .filter((u): u is User => Boolean(u));
  if (assignees.length === 0) return `waiting — ${taskLabel}`;
  if (display === "role" && assignees[0].roles[0]) {
    return `waiting ${assignees[0].roles[0]} — ${taskLabel}`;
  }
  const names =
    assignees.length === 1
      ? assignees[0].name
      : `${assignees[0].name} +${assignees.length - 1}`;
  return `waiting ${names} — ${taskLabel}`;
}

// ----------------------------------------------------------------------------
// Settings
// ----------------------------------------------------------------------------

export async function getWorkspaceSettings() {
  const row = await db
    .select()
    .from(schema.workspaceSettings)
    .where(eq(schema.workspaceSettings.workspaceId, WORKSPACE_ID))
    .get();
  return row;
}

// ----------------------------------------------------------------------------
// Channel Style Guide
// ----------------------------------------------------------------------------

export async function getChannelStyleGuides(channelId: string) {
  return db
    .select()
    .from(schema.channelStyleGuides)
    .where(eq(schema.channelStyleGuides.channelId, channelId))
    .all();
}

// ----------------------------------------------------------------------------
// Notifications
// ----------------------------------------------------------------------------

export interface NotificationEntry {
  id: string;
  userId: string;
  event: string;
  topicId?: string;
  deliverableId?: string;
  taskId?: string;
  payload: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
  // Hydrated fields:
  topicName?: string;
  actorName?: string;
}

export async function getNotificationsForCurrentUser(
  limit = 30
): Promise<NotificationEntry[]> {
  const actorId = await resolveCurrentActorId();
  if (!actorId) return [];
  const rows = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, actorId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .all();

  // Hydrate topic names
  const topicIds = Array.from(
    new Set(rows.map((r) => r.topicId).filter((x): x is string => Boolean(x)))
  );
  const topics = topicIds.length
    ? await db
        .select()
        .from(schema.topics)
        .where(inArray(schema.topics.id, topicIds))
        .all()
    : [];
  const topicMap = new Map(topics.map((t) => [t.id, t.name]));

  // Hydrate actor names from payload.actorId (notify() stashes it there).
  // Old notifications without payload.actorId fall back to undefined → UI
  // shows "Someone".
  const actorIds = Array.from(
    new Set(
      rows
        .map((r) => {
          const p = (r.payload as Record<string, unknown>) ?? {};
          const aid = p.actorId;
          return typeof aid === "string" ? aid : null;
        })
        .filter((x): x is string => Boolean(x))
    )
  );
  const actors = actorIds.length
    ? await db
        .select()
        .from(schema.users)
        .where(inArray(schema.users.id, actorIds))
        .all()
    : [];
  const actorMap = new Map(actors.map((u) => [u.id, u.name]));

  return rows.map((r) => {
    const payload = (r.payload as Record<string, unknown>) ?? {};
    const aid = typeof payload.actorId === "string" ? payload.actorId : undefined;
    return {
      id: r.id,
      userId: r.userId,
      event: r.event,
      topicId: r.topicId ?? undefined,
      deliverableId: r.deliverableId ?? undefined,
      taskId: r.taskId ?? undefined,
      payload,
      readAt: r.readAt?.toISOString(),
      createdAt: r.createdAt.toISOString(),
      topicName: r.topicId ? topicMap.get(r.topicId) : undefined,
      actorName: aid ? actorMap.get(aid) : undefined,
    };
  });
}

export async function getUnreadNotificationCount(): Promise<number> {
  const actorId = await resolveCurrentActorId();
  if (!actorId) return 0;
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, actorId),
        isNull(schema.notifications.readAt)
      )
    )
    .get();
  return Number(row?.count ?? 0);
}

// ----------------------------------------------------------------------------
// Activity log
// ----------------------------------------------------------------------------

export interface ActivityEntry {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function getActivityForTopic(
  topicId: string,
  limit = 50
): Promise<ActivityEntry[]> {
  // Collect all relevant target IDs for this topic:
  // - the topic itself
  // - its deliverables
  // - its tasks
  // - its deliverable_channels
  const deliverables = await db
    .select()
    .from(schema.deliverables)
    .where(eq(schema.deliverables.topicId, topicId))
    .all();
  const deliverableIds = deliverables.map((d) => d.id);

  const tasks = deliverableIds.length
    ? await db
        .select()
        .from(schema.tasks)
        .where(inArray(schema.tasks.deliverableId, deliverableIds))
        .all()
    : [];
  const taskIds = tasks.map((t) => t.id);

  const channels = deliverableIds.length
    ? await db
        .select()
        .from(schema.deliverableChannels)
        .where(inArray(schema.deliverableChannels.deliverableId, deliverableIds))
        .all()
    : [];
  const channelIds = channels.map((c) => c.id);

  // Query all activity matching any of these
  const allTargetIds = [topicId, ...deliverableIds, ...taskIds, ...channelIds];
  if (allTargetIds.length === 0) return [];

  const rows = await db
    .select()
    .from(schema.activityLog)
    .where(inArray(schema.activityLog.targetId, allTargetIds))
    .orderBy(desc(schema.activityLog.createdAt))
    .limit(limit)
    .all();

  return rows.map((r) => ({
    id: r.id,
    actorId: r.actorId,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.createdAt.toISOString(),
  }));
}

// ----------------------------------------------------------------------------
// Comments
// ----------------------------------------------------------------------------

export interface Comment {
  id: string;
  targetType: "topic" | "deliverable" | "task" | "asset";
  targetId: string;
  authorId: string | null;
  body: string;
  mentions: string[];
  createdAt: string;
}

export async function getCommentsForTarget(
  targetType: "topic" | "deliverable" | "task" | "asset",
  targetId: string
): Promise<Comment[]> {
  const rows = await db
    .select()
    .from(schema.comments)
    .where(
      and(
        eq(schema.comments.targetType, targetType),
        eq(schema.comments.targetId, targetId)
      )
    )
    .orderBy(schema.comments.createdAt)
    .all();
  return rows.map((r) => ({
    id: r.id,
    targetType: r.targetType as Comment["targetType"],
    targetId: r.targetId,
    authorId: r.authorId,
    body: r.body,
    mentions: (r.mentions as string[]) ?? [],
    createdAt: r.createdAt.toISOString(),
  }));
}

// ----------------------------------------------------------------------------
// Calendar — scheduled + aired items by date
// ----------------------------------------------------------------------------

export interface ScheduledItem {
  date: string; // ISO date YYYY-MM-DD
  datetime: string; // full ISO datetime if known
  topic: Topic;
  deliverable: Deliverable;
  channelId: string;
  status: "scheduled" | "aired";
  airedLink?: string;
}

/** Production deadline item — a task with a dueDate, used for "PRODUCTION" calendar mode. */
export interface ProductionItem {
  date: string; // ISO date YYYY-MM-DD
  topic: Topic;
  deliverable: Deliverable;
  task: Task;
  assigneeIds: string[];
  status: TaskStatus;
}

export async function getProductionItems(): Promise<ProductionItem[]> {
  const all = await getAllTopics();
  const items: ProductionItem[] = [];
  for (const topic of all) {
    for (const deliverable of topic.deliverables) {
      for (const task of deliverable.tasks) {
        if (!task.dueDate) continue;
        if (task.status === "approved") continue; // hide done tasks
        items.push({
          date: task.dueDate.slice(0, 10),
          topic,
          deliverable,
          task,
          assigneeIds: task.assigneeIds,
          status: task.status,
        });
      }
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getScheduledItems(): Promise<ScheduledItem[]> {
  const all = await getAllTopics();
  const items: ScheduledItem[] = [];

  for (const topic of all) {
    for (const deliverable of topic.deliverables) {
      for (const dc of deliverable.channels) {
        // Already aired
        if (dc.airedAt) {
          items.push({
            date: new Date(dc.airedAt).toISOString().slice(0, 10),
            datetime: dc.airedAt,
            topic,
            deliverable,
            channelId: dc.channelId,
            status: "aired",
            airedLink: dc.airedLink,
          });
          continue;
        }

        // Find scheduled_time task — per-channel first, then deliverable-level
        const scheduledTask = deliverable.tasks.find((t) => {
          if (t.templateItemKey !== "schedule_time") return false;
          if (t.channelId && t.channelId !== dc.channelId) return false;
          return (
            (t.status === "approved" || t.status === "submitted") &&
            t.outputValue
          );
        });

        if (scheduledTask?.outputValue) {
          const dt = String(scheduledTask.outputValue);
          if (dt) {
            items.push({
              date: dt.slice(0, 10),
              datetime: dt,
              topic,
              deliverable,
              channelId: dc.channelId,
              status: "scheduled",
            });
          }
        }
      }
    }
  }

  return items.sort((a, b) => a.datetime.localeCompare(b.datetime));
}

// ----------------------------------------------------------------------------
// AI Cut Suggestions
// ----------------------------------------------------------------------------

export async function getCutSuggestions(deliverableId: string) {
  return db
    .select()
    .from(schema.aiCutSuggestions)
    .where(eq(schema.aiCutSuggestions.deliverableId, deliverableId))
    .orderBy(schema.aiCutSuggestions.startSec)
    .all();
}

export async function getRegensToday(deliverableId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.aiCutRegenLog)
    .where(
      and(
        eq(schema.aiCutRegenLog.deliverableId, deliverableId),
        gte(schema.aiCutRegenLog.triggeredAt, startOfDay)
      )
    )
    .get();
  return Number(rows?.count ?? 0);
}
