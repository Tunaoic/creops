import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ============================================================================
// Workspaces & Users
// ============================================================================

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  roles: text("roles", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  accessLevel: text("access_level").notNull().default("full"), // full | limited | readonly
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const workspaceSettings = sqliteTable("workspace_settings", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  blockReasonDisplay: text("block_reason_display", { enum: ["name", "role"] })
    .notNull()
    .default("name"),
  defaultAssignees: text("default_assignees", { mode: "json" })
    .$type<Record<string, string>>()
    .notNull()
    .default(sql`'{}'`),
  aiCutRegenPerDay: integer("ai_cut_regen_per_day").notNull().default(3),
});

// ============================================================================
// Channels & Style Guides
// ============================================================================

export const channels = sqliteTable("channels", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  platform: text("platform").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const channelStyleGuides = sqliteTable("channel_style_guides", {
  id: text("id").primaryKey(),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(), // 'title' | 'description' | 'caption' | 'tags'
  samples: text("samples", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  promptOverride: text("prompt_override"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================================
// Topics & Source Assets
// ============================================================================

export const topics = sqliteTable("topics", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  // Nullable so workspaces with 0 members can still own topics (orphan = system-created)
  creatorId: text("creator_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  brief: text("brief"),
  status: text("status").notNull().default("draft"),
  targetPublishDate: text("target_publish_date"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const sourceAssets = sqliteTable("source_assets", {
  id: text("id").primaryKey(),
  topicId: text("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'video' | 'image' | 'audio' | 'doc'
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  mimeType: text("mime_type"),
  durationSec: real("duration_sec"),
  caption: text("caption"),
  transcript: text("transcript", { mode: "json" }),
  transcriptStatus: text("transcript_status").notNull().default("pending"),
  uploadedBy: text("uploaded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================================
// Deliverables & Channels Junction
// ============================================================================

export const deliverables = sqliteTable("deliverables", {
  id: text("id").primaryKey(),
  topicId: text("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  airedAt: integer("aired_at", { mode: "timestamp" }),
});

export const deliverableChannels = sqliteTable("deliverable_channels", {
  id: text("id").primaryKey(),
  deliverableId: text("deliverable_id")
    .notNull()
    .references(() => deliverables.id, { onDelete: "cascade" }),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id),
  airedLink: text("aired_link"),
  airedAt: integer("aired_at", { mode: "timestamp" }),
});

// ============================================================================
// Tasks
// ============================================================================

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  deliverableId: text("deliverable_id")
    .notNull()
    .references(() => deliverables.id, { onDelete: "cascade" }),
  templateItemKey: text("template_item_key").notNull(),
  channelId: text("channel_id").references(() => channels.id),
  assigneeIds: text("assignee_ids", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  dueDate: text("due_date"),
  status: text("status").notNull().default("todo"),
  outputType: text("output_type").notNull(),
  outputValue: text("output_value", { mode: "json" }),
  rejectReason: text("reject_reason"),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
});

// ============================================================================
// AI Cut Suggestions & Regen Log
// ============================================================================

export const aiCutSuggestions = sqliteTable("ai_cut_suggestions", {
  id: text("id").primaryKey(),
  deliverableId: text("deliverable_id")
    .notNull()
    .references(() => deliverables.id, { onDelete: "cascade" }),
  sourceAssetId: text("source_asset_id")
    .notNull()
    .references(() => sourceAssets.id, { onDelete: "cascade" }),
  startSec: real("start_sec").notNull(),
  endSec: real("end_sec").notNull(),
  hookText: text("hook_text").notNull(),
  reason: text("reason").notNull(),
  bestFor: text("best_for").notNull().default("all"),
  generationId: text("generation_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const aiCutRegenLog = sqliteTable("ai_cut_regen_log", {
  id: text("id").primaryKey(),
  deliverableId: text("deliverable_id")
    .notNull()
    .references(() => deliverables.id, { onDelete: "cascade" }),
  triggeredBy: text("triggered_by")
    .notNull()
    .references(() => users.id),
  triggeredAt: integer("triggered_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================================
// Comments & Notifications & Activity (lightweight for MVP)
// ============================================================================

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(), // 'topic' | 'deliverable' | 'task' | 'asset'
  targetId: text("target_id").notNull(),
  authorId: text("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  body: text("body").notNull(),
  mentions: text("mentions", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  event: text("event").notNull(), // tasks_assigned | task_rejected | deliverable_ready_for_review | deliverable_aired | mentioned | transcribe_done | cut_suggestions_ready
  topicId: text("topic_id").references(() => topics.id, { onDelete: "cascade" }),
  deliverableId: text("deliverable_id").references(() => deliverables.id, { onDelete: "cascade" }),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>().notNull().default(sql`'{}'`),
  readAt: integer("read_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const activityLog = sqliteTable("activity_log", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  actorId: text("actor_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
