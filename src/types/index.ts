// Data model types matching db-schema.sql

export type UserRole =
  | "creator"
  | "operation"
  | "designer"
  | "watcher"
  | "editor"
  | "copywriter"
  | "pic";

export type TopicStatus =
  | "draft"
  | "in_production"
  | "partially_aired"
  | "fully_aired"
  | "archived";

export type DeliverableType =
  | "long_video"
  | "short_video"
  | "blog_post"
  | "long_post"
  | "thread";

export type DeliverableStatus =
  | "draft"
  | "in_progress"
  | "review"
  | "approved"
  | "aired";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected";

export type TaskOutputType =
  | "text"
  | "long_text"
  | "file"
  | "chips"
  | "datetime"
  | "markdown";

export type AssetType = "video" | "image" | "audio" | "doc";

export type ChannelPlatform =
  | "youtube"
  | "youtube_shorts"
  | "tiktok"
  | "ig_reel"
  | "fb_group"
  | "fb_page"
  | "linkedin"
  | "x_twitter"
  | "blog";

export type AccessLevel = "full" | "limited" | "readonly";

export const ACCESS_LABEL: Record<AccessLevel, string> = {
  full: "Full",
  limited: "Limited",
  readonly: "Read-only",
};

export const ACCESS_DESCRIPTION: Record<AccessLevel, string> = {
  full: "See & edit everything in workspace",
  limited: "Only topics where they have an assigned task",
  readonly: "See everything but can't edit / approve / reject",
};

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: UserRole[];
  accessLevel: AccessLevel;
}

export interface Channel {
  id: string;
  name: string;
  platform: ChannelPlatform;
  metadata?: Record<string, unknown>;
}

export interface SourceAsset {
  id: string;
  topicId: string;
  type: AssetType;
  fileName: string;
  fileUrl: string;
  durationSec?: number;
  caption?: string;
  transcriptStatus: "pending" | "processing" | "done" | "failed" | "na";
  uploadedBy?: string;
  uploadedAt: string;
}

export interface DeliverableChannel {
  id: string;
  channelId: string;
  airedLink?: string;
  airedAt?: string;
}

export interface Task {
  id: string;
  deliverableId: string;
  templateItemKey: string;
  channelId?: string;
  assigneeIds: string[];
  dueDate?: string;
  status: TaskStatus;
  outputType: TaskOutputType;
  outputValue?: unknown;
  rejectReason?: string;
  aiGenerated: boolean;
}

export interface Deliverable {
  id: string;
  topicId: string;
  type: DeliverableType;
  status: DeliverableStatus;
  channels: DeliverableChannel[];
  tasks: Task[];
  createdAt: string;
  approvedAt?: string;
  airedAt?: string;
}

export interface Topic {
  id: string;
  workspaceId: string;
  creatorId?: string;
  name: string;
  brief?: string;
  status: TopicStatus;
  targetPublishDate?: string;
  createdAt: string;
  sourceAssets: SourceAsset[];
  deliverables: Deliverable[];
}

// Display helpers
export const DELIVERABLE_TYPE_LABEL: Record<DeliverableType, string> = {
  long_video: "Long-form Video",
  short_video: "Short-form Video",
  blog_post: "Blog Post",
  long_post: "Long-form Post",
  thread: "Thread",
};

export const DELIVERABLE_TYPE_CHANNELS: Record<DeliverableType, ChannelPlatform[]> = {
  long_video: ["youtube"],
  short_video: ["youtube_shorts", "tiktok", "ig_reel"],
  blog_post: ["blog"],
  long_post: ["fb_group", "fb_page", "linkedin"],
  thread: ["x_twitter"],
};

export const CHANNEL_LABEL: Record<ChannelPlatform, string> = {
  youtube: "YouTube",
  youtube_shorts: "YT Shorts",
  tiktok: "TikTok",
  ig_reel: "IG Reel",
  fb_group: "FB Group",
  fb_page: "FB Page",
  linkedin: "LinkedIn",
  x_twitter: "X / Twitter",
  blog: "Blog",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  creator: "Creator",
  operation: "Operation",
  designer: "Designer",
  watcher: "Watcher",
  editor: "Editor",
  copywriter: "Copywriter",
  pic: "PIC",
};

export const ROLE_DESCRIPTION: Record<UserRole, string> = {
  creator: "Talent — creates content, final approver",
  operation: "Handles edit, copy, schedule — the doer",
  designer: "Visuals — thumbnails, covers, graphics",
  watcher: "Read-only oversight — follows up on everything",
  editor: "Video editor",
  copywriter: "Title, description, captions",
  pic: "Person in charge — schedules, marks aired",
};

// Roles users can actually be assigned (for member management UI)
export const ASSIGNABLE_ROLES: UserRole[] = [
  "creator",
  "operation",
  "designer",
  "watcher",
];
