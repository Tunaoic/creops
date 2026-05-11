import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserCheck, Sparkles, CheckCircle2, Clock } from "lucide-react";
import {
  getTopicById,
  getChannelById,
  getAllUsers,
  getCurrentUser,
  getCommentsForTarget,
} from "@/db/queries";
import { DELIVERABLE_TYPE_LABEL, CHANNEL_LABEL } from "@/types";
import { TaskMasterVideoView } from "@/components/task-views/master-video";
import { TaskTitleView } from "@/components/task-views/title";
import { TaskDescriptionView } from "@/components/task-views/description";
import { TaskGenericView } from "@/components/task-views/generic";
import { TaskOutputDisplay } from "@/components/task-output-display";
import { TaskReviewPanel } from "@/components/task-review-panel";
import { AssigneePicker } from "@/components/assignee-picker";
import { CommentThread } from "@/components/comment-thread";
import { TaskStatusBadge } from "@/components/status-badge";
import { WatchersPanel } from "@/components/watchers-panel";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const [topic, allUsers, currentUser, comments, locale] = await Promise.all([
    getTopicById(id),
    getAllUsers(),
    getCurrentUser(),
    getCommentsForTarget("task", taskId),
    getLocale(),
  ]);
  if (!topic) notFound();

  let foundTask = null;
  let foundDeliverable = null;
  for (const d of topic.deliverables) {
    const t = d.tasks.find((x) => x.id === taskId);
    if (t) {
      foundTask = t;
      foundDeliverable = d;
      break;
    }
  }
  if (!foundTask || !foundDeliverable) notFound();

  const channel = foundTask.channelId
    ? await getChannelById(foundTask.channelId)
    : null;

  const isAssignedToMe = foundTask.assigneeIds.includes(currentUser.id);
  const isCreator = topic.creatorId === currentUser.id;
  const status = foundTask.status;

  // State machine for what to render:
  //   canEdit       : assignee + (todo / in_progress / rejected) → show input form
  //   canReview     : creator + submitted → show readonly + Approve/Reject panel
  //   isSubmittedRO : submitted + (assignee or other) → readonly + "waiting for review"
  //   isApproved    : approved → readonly + "approved" footer
  const canEdit =
    isAssignedToMe &&
    (status === "todo" || status === "in_progress" || status === "rejected");
  const canReview = isCreator && status === "submitted";

  const renderEditView = () => {
    switch (foundTask!.templateItemKey) {
      case "master_video":
      case "final_video":
        return (
          <TaskMasterVideoView
            taskId={foundTask!.id}
            deliverableId={foundDeliverable!.id}
            currentOutput={foundTask!.outputValue as string | undefined}
            channels={foundDeliverable!.channels.map(
              (c) => CHANNEL_LABEL[c.channelId.includes("yt") ? "youtube_shorts" : "tiktok"]
            )}
            brief={topic.brief}
            sourceAssetNames={topic.sourceAssets
              .filter((a) => a.type === "video")
              .map((a) => a.fileName)}
          />
        );
      case "title":
        return (
          <TaskTitleView
            taskId={foundTask!.id}
            initialValue={foundTask!.outputValue as string | undefined}
          />
        );
      case "description":
        return (
          <TaskDescriptionView
            taskId={foundTask!.id}
            initialValue={foundTask!.outputValue as string | undefined}
          />
        );
      default:
        return (
          <TaskGenericView
            taskId={foundTask!.id}
            templateItemKey={foundTask!.templateItemKey}
            outputType={foundTask!.outputType}
            initialValue={foundTask!.outputValue}
          />
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-7">
      <div className="mb-5">
        <Link
          href={`/topics/${topic.id}`}
          className="inline-flex items-center gap-1.5 text-[14px] text-text-muted hover:text-text mb-4"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          {locale === "vi" ? "Quay lại" : "Back to"} {topic.name}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[13px] text-text-muted mb-1.5">
              {topic.name} / {DELIVERABLE_TYPE_LABEL[foundDeliverable.type]}
              {channel && ` / ${CHANNEL_LABEL[channel.platform]}`}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-title-3 capitalize">
                {foundTask.templateItemKey.replace(/_/g, " ")}
              </h1>
              <TaskStatusBadge status={status} />
              {isAssignedToMe && (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
                  <UserCheck className="w-3 h-3" strokeWidth={1.75} />
                  {locale === "vi" ? "Giao cho bạn" : "Assigned to you"}
                </span>
              )}
              {isCreator && !isAssignedToMe && (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-info-bg text-info">
                  <Sparkles className="w-3 h-3" strokeWidth={1.75} />
                  {locale === "vi" ? "Bạn là creator" : "You're the creator"}
                </span>
              )}
            </div>
          </div>
          <div className="text-right space-y-2 shrink-0">
            <AssigneePicker
              taskId={foundTask.id}
              currentAssigneeIds={foundTask.assigneeIds}
              members={allUsers}
            />
            <div>
              <WatchersPanel
                target="task"
                targetId={foundTask.id}
                watcherIds={foundTask.watcherIds}
                members={allUsers}
                currentUserId={currentUser.id}
                locale={locale}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status banners — context-aware hints above the action area */}
      {canEdit && status !== "rejected" && (
        <div className="mb-4 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium text-accent mb-0.5">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
            {locale === "vi" ? "Đến lượt bạn" : "Your turn"}
          </div>
          <p className="text-[13px] text-text-muted">
            {locale === "vi"
              ? "Điền output bên dưới và bấm Submit khi xong. Creator sẽ duyệt hoặc yêu cầu chỉnh."
              : "Fill in your output below and Submit when ready. The creator will approve or request changes."}
          </p>
        </div>
      )}

      {status === "rejected" && foundTask.rejectReason && (
        <div className="mb-4 rounded-2xl border border-danger/40 bg-danger-bg px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium text-danger mb-1">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
            {locale === "vi" ? "Yêu cầu chỉnh sửa" : "Changes requested"}
          </div>
          <p className="text-[14px] text-text">{foundTask.rejectReason}</p>
          {canEdit && (
            <p className="text-[12px] text-text-muted mt-2">
              {locale === "vi"
                ? "Sửa nội dung bên dưới và gửi lại."
                : "Update the content below and resubmit."}
            </p>
          )}
        </div>
      )}

      {status === "submitted" && !canReview && (
        <div className="mb-4 rounded-2xl border border-info/30 bg-info-bg px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium text-info">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
            {locale === "vi" ? "Đang chờ creator duyệt" : "Waiting for creator's review"}
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="mb-4 rounded-2xl border border-success/30 bg-success-bg px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium text-success">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            {locale === "vi" ? "Đã duyệt" : "Approved"}
          </div>
        </div>
      )}

      {/* Main content area — branches on edit vs review vs readonly */}
      {canEdit ? (
        renderEditView()
      ) : (
        <div className="space-y-4">
          <TaskOutputDisplay
            outputType={foundTask.outputType}
            outputValue={foundTask.outputValue}
            templateItemKey={foundTask.templateItemKey}
            locale={locale}
          />
          {canReview && (
            <TaskReviewPanel taskId={foundTask.id} locale={locale} />
          )}
        </div>
      )}

      {/* Comments */}
      <div className="mt-6">
        <CommentThread
          targetType="task"
          targetId={foundTask.id}
          comments={comments}
          members={allUsers}
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  );
}
