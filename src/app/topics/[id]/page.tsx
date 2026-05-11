import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Play,
  Image as ImageIcon,
  Mic,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  getTopicById,
  getAllChannels,
  getAllUsers,
  getCurrentUser,
  getBlockReason,
  getWorkspaceSettings,
  getCommentsForTarget,
  getActivityForTopic,
} from "@/db/queries";
import { TopicPipeline } from "@/components/topic-pipeline";
import { CHANNEL_LABEL, DELIVERABLE_TYPE_LABEL } from "@/types";
import {
  DeliverableStatusBadge,
  TopicStatusBadge,
} from "@/components/status-badge";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { AssetType } from "@/types";
import { AddDeliverableButton } from "@/components/add-deliverable-button";
import { MarkAiredButton } from "@/components/mark-aired-button";
import { CommentThread } from "@/components/comment-thread";
import { ActivityFeed } from "@/components/activity-feed";
import { BulkTasksPanel } from "@/components/bulk-tasks-panel";

export const dynamic = "force-dynamic";

const ASSET_ICON: Record<AssetType, typeof Play> = {
  video: Play,
  image: ImageIcon,
  audio: Mic,
  doc: FileText,
};

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [topic, channels, users, currentUser, settings, comments, activity] =
    await Promise.all([
      getTopicById(id),
      getAllChannels(),
      getAllUsers(),
      getCurrentUser(),
      getWorkspaceSettings(),
      getCommentsForTarget("topic", id),
      getActivityForTopic(id, 30),
    ]);
  if (!topic) notFound();

  const channelMap = new Map(channels.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const blockDisplay = settings?.blockReasonDisplay ?? "name";
  const total = topic.deliverables.length;
  const aired = topic.deliverables.filter((d) => d.status === "aired").length;

  // Map deliverable channels to junction IDs (need to query DB for IDs since type doesn't include them)
  // For now derive from channel positions in array since each deliverable_channel maps 1-1
  return (
    <div className="max-w-5xl mx-auto px-6 py-5 space-y-5">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold mb-2">{topic.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
              <TopicStatusBadge status={topic.status} />
              <span>•</span>
              <span>
                {aired}/{total} deliverables aired
              </span>
              {topic.targetPublishDate && (
                <>
                  <span>•</span>
                  <span>Due {formatDate(topic.targetPublishDate)}</span>
                </>
              )}
              <span>•</span>
              <span>by {(topic.creatorId && userMap.get(topic.creatorId)?.name) || "—"}</span>
            </div>
          </div>
          <AddDeliverableButton topicId={topic.id} />
        </div>
      </div>

      <TopicPipeline topic={topic} userMap={userMap} />

      {topic.brief && (
        <section className="bg-surface rounded-lg border border-border p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Brief
          </h2>
          <p className="text-sm leading-relaxed text-text">{topic.brief}</p>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-text-subtle">
            Material Links · {topic.sourceAssets.length}
          </h2>
        </div>
        {topic.sourceAssets.length === 0 ? (
          <p className="text-[13px] text-text-subtle italic px-4 py-3 bg-surface rounded border border-border">
            No materials. Creator paste Drive/Dropbox link để team access.
          </p>
        ) : (
          <div className="grid gap-2">
            {topic.sourceAssets.map((asset) => (
              <a
                key={asset.id}
                href={asset.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-3 py-2.5 bg-surface rounded border border-border hover:border-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ExternalLink className="w-3.5 h-3.5 text-text-subtle group-hover:text-accent shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium truncate">
                      {asset.fileName}
                    </div>
                    <div className="text-[12px] font-mono text-text-subtle truncate">
                      {asset.fileUrl}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-text-subtle group-hover:text-accent shrink-0">
                  OPEN →
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
          Deliverables
        </h2>
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          {topic.deliverables.map((deliverable, idx) => {
            const blockReason = getBlockReason(deliverable, blockDisplay, userMap);
            const isAired = deliverable.status === "aired";
            return (
              <div
                key={deliverable.id}
                className={`px-4 py-4 ${idx > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {isAired ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <Clock className="w-4 h-4 text-text-subtle" />
                    )}
                    <span className="text-sm font-medium">
                      {DELIVERABLE_TYPE_LABEL[deliverable.type]}
                    </span>
                    <DeliverableStatusBadge status={deliverable.status} />
                  </div>
                  {deliverable.airedAt && (
                    <span className="text-xs text-text-muted">
                      Aired {formatRelativeTime(deliverable.airedAt)}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 ml-6">
                  {deliverable.channels.map((dc) => {
                    const channel = channelMap.get(dc.channelId);
                    if (!channel) return null;
                    return (
                      <div
                        key={dc.channelId}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs px-1.5 py-0.5 rounded border border-border bg-bg text-text-muted shrink-0">
                            {CHANNEL_LABEL[channel.platform]}
                          </span>
                          {dc.airedLink ? (
                            <a
                              href={dc.airedLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-info hover:underline truncate"
                            >
                              {dc.airedLink}
                            </a>
                          ) : deliverable.status === "approved" ? (
                            <MarkAiredButton deliverableChannelId={dc.id} />
                          ) : (
                            <span className="text-xs text-text-subtle italic">
                              not yet aired
                            </span>
                          )}
                        </div>
                        {dc.airedLink && (
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={dc.airedLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-text-muted hover:text-text"
                              title="Open"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {blockReason && (
                  <div className="mt-3 ml-6 text-xs text-text-muted italic">
                    ⊙ {blockReason}
                  </div>
                )}

                {deliverable.status === "review" && (
                  <div className="mt-3 ml-6">
                    <Link
                      href={`/topics/${topic.id}/approve/${deliverable.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-warn-text text-white hover:bg-warn/80 transition-colors font-medium"
                    >
                      Review on mobile →
                    </Link>
                  </div>
                )}

                {!isAired && deliverable.tasks.length > 0 && (
                  <div className="mt-3 ml-6">
                    <BulkTasksPanel
                      topicId={topic.id}
                      tasks={deliverable.tasks}
                      members={users}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Comments + Activity side-by-side */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CommentThread
            targetType="topic"
            targetId={topic.id}
            comments={comments}
            members={users}
            currentUserId={currentUser.id}
          />
        </div>
        <div>
          <ActivityFeed entries={activity} members={users} />
        </div>
      </section>
    </div>
  );
}
