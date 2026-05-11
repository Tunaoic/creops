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
import { WatchersPanel } from "@/components/watchers-panel";
import { getLocale } from "@/lib/i18n";
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
  const [topic, channels, users, currentUser, settings, comments, activity, locale] =
    await Promise.all([
      getTopicById(id),
      getAllChannels(),
      getAllUsers(),
      getCurrentUser(),
      getWorkspaceSettings(),
      getCommentsForTarget("topic", id),
      getActivityForTopic(id, 30),
      getLocale(),
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
    <div className="max-w-5xl mx-auto px-8 py-7 space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[14px] text-text-muted hover:text-text mb-4"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          {locale === "vi" ? "Quay lại Tổng quan" : "Back to Dashboard"}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-title-2 text-text mb-3">{topic.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-[14px] text-text-muted">
              <TopicStatusBadge status={topic.status} />
              <span className="text-text-subtle">·</span>
              <span className="tabular-nums">
                {aired}/{total} {locale === "vi" ? "đã đăng" : "deliverables aired"}
              </span>
              {topic.targetPublishDate && (
                <>
                  <span className="text-text-subtle">·</span>
                  <span>{locale === "vi" ? "Hạn" : "Due"} {formatDate(topic.targetPublishDate)}</span>
                </>
              )}
              {topic.creatorId && userMap.get(topic.creatorId) && (
                <>
                  <span className="text-text-subtle">·</span>
                  <span>{locale === "vi" ? "Bởi" : "By"} {userMap.get(topic.creatorId)?.name}</span>
                </>
              )}
            </div>
            <div className="mt-4">
              <WatchersPanel
                target="topic"
                targetId={topic.id}
                watcherIds={topic.watcherIds}
                members={users}
                currentUserId={currentUser.id}
                locale={locale}
              />
            </div>
          </div>
          <AddDeliverableButton topicId={topic.id} />
        </div>
      </div>

      <TopicPipeline topic={topic} userMap={userMap} />

      {topic.brief && (
        <section className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-headline text-text mb-2">Brief</h2>
          <p className="text-[15px] leading-relaxed text-text">{topic.brief}</p>
        </section>
      )}

      <section>
        <h2 className="text-headline text-text mb-3 flex items-baseline gap-2">
          {locale === "vi" ? "Tài liệu" : "Material links"}
          <span className="text-text-subtle font-normal text-[14px] tabular-nums">
            {topic.sourceAssets.length}
          </span>
        </h2>
        {topic.sourceAssets.length === 0 ? (
          <p className="text-[14px] text-text-subtle px-4 py-4 bg-surface rounded-2xl border border-border">
            {locale === "vi"
              ? "Chưa có tài liệu. Creator paste Drive/Dropbox link để team access."
              : "No materials yet. Creator pastes Drive/Dropbox link so the team can access."}
          </p>
        ) : (
          <div className="space-y-2">
            {topic.sourceAssets.map((asset) => (
              <a
                key={asset.id}
                href={asset.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surface rounded-xl border border-border hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ExternalLink className="w-4 h-4 text-text-subtle group-hover:text-accent shrink-0" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium truncate text-text">
                      {asset.fileName}
                    </div>
                    <div className="text-[13px] text-text-subtle truncate">
                      {asset.fileUrl}
                    </div>
                  </div>
                </div>
                <span className="text-[13px] text-text-subtle group-hover:text-accent shrink-0">
                  {locale === "vi" ? "Mở" : "Open"} →
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-headline text-text mb-3">
          {locale === "vi" ? "Sản phẩm" : "Deliverables"}
        </h2>
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {topic.deliverables.map((deliverable, idx) => {
            const blockReason = getBlockReason(deliverable, blockDisplay, userMap);
            const isAired = deliverable.status === "aired";
            return (
              <div
                key={deliverable.id}
                className={`px-5 py-4 ${idx > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {isAired ? (
                      <CheckCircle2 className="w-4 h-4 text-accent" strokeWidth={1.75} />
                    ) : (
                      <Clock className="w-4 h-4 text-text-subtle" strokeWidth={1.75} />
                    )}
                    <span className="text-[15px] font-medium text-text">
                      {DELIVERABLE_TYPE_LABEL[deliverable.type]}
                    </span>
                    <DeliverableStatusBadge status={deliverable.status} />
                  </div>
                  {deliverable.airedAt && (
                    <span className="text-[13px] text-text-muted">
                      {locale === "vi" ? "Đăng" : "Aired"} {formatRelativeTime(deliverable.airedAt)}
                    </span>
                  )}
                </div>

                <div className="space-y-2 ml-6.5">
                  {deliverable.channels.map((dc) => {
                    const channel = channelMap.get(dc.channelId);
                    if (!channel) return null;
                    return (
                      <div
                        key={dc.channelId}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted shrink-0">
                            {CHANNEL_LABEL[channel.platform]}
                          </span>
                          {dc.airedLink ? (
                            <a
                              href={dc.airedLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[13px] text-info hover:underline truncate"
                            >
                              {dc.airedLink}
                            </a>
                          ) : deliverable.status === "approved" ? (
                            <MarkAiredButton deliverableChannelId={dc.id} />
                          ) : (
                            <span className="text-[13px] text-text-subtle">
                              {locale === "vi" ? "Chưa đăng" : "Not yet aired"}
                            </span>
                          )}
                        </div>
                        {dc.airedLink && (
                          <a
                            href={dc.airedLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full text-text-muted hover:text-text hover:bg-surface-hover transition-colors shrink-0"
                            title="Open"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>

                {blockReason && (
                  <div className="mt-3 ml-6.5 text-[13px] text-text-muted">
                    {blockReason}
                  </div>
                )}

                {deliverable.status === "review" && (
                  <div className="mt-3 ml-6.5">
                    <Link
                      href={`/topics/${topic.id}/approve/${deliverable.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] rounded-full bg-warn-bg text-warn hover:opacity-88 transition-opacity font-medium"
                    >
                      {locale === "vi" ? "Duyệt trên mobile" : "Review on mobile"} →
                    </Link>
                  </div>
                )}

                {!isAired && deliverable.tasks.length > 0 && (
                  <div className="mt-3 ml-6.5">
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
