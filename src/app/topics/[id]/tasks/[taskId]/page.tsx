import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserCheck, Sparkles } from "lucide-react";
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
import { AssigneePicker } from "@/components/assignee-picker";
import { CommentThread } from "@/components/comment-thread";
import { TaskStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const [topic, allUsers, currentUser, comments] = await Promise.all([
    getTopicById(id),
    getAllUsers(),
    getCurrentUser(),
    getCommentsForTarget("task", taskId),
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

  const renderView = () => {
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
    <div className="max-w-3xl mx-auto px-6 py-5">
      <div className="mb-4">
        <Link
          href={`/topics/${topic.id}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {topic.name}
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-text-muted mb-1">
              {topic.name} / {DELIVERABLE_TYPE_LABEL[foundDeliverable.type]}
              {channel && ` / ${CHANNEL_LABEL[channel.platform]}`}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold capitalize">
                {foundTask.templateItemKey.replace(/_/g, " ")}
              </h1>
              <TaskStatusBadge status={foundTask.status} />
              {isAssignedToMe && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent/40 bg-accent/10 text-accent">
                  <UserCheck className="w-3 h-3" />
                  ASSIGNED TO YOU
                </span>
              )}
              {isCreator && !isAssignedToMe && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-info/40 bg-info-bg text-info">
                  <Sparkles className="w-3 h-3" />
                  YOU&apos;RE THE CREATOR
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-text-muted space-y-1.5">
            <div>
              <AssigneePicker
                taskId={foundTask.id}
                currentAssigneeIds={foundTask.assigneeIds}
                members={allUsers}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit flow hint for assignees */}
      {isAssignedToMe &&
        (foundTask.status === "todo" || foundTask.status === "in_progress") && (
          <div className="mb-3 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] text-text">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-accent mb-0.5">
              <Sparkles className="w-3 h-3" />
              YOUR TURN
            </div>
            <p className="text-text-muted">
              Fill in your output below and click <strong className="text-text">Submit</strong>{" "}
              when ready. The creator will then approve or request changes.
            </p>
          </div>
        )}
      {isAssignedToMe && foundTask.status === "rejected" && foundTask.rejectReason && (
        <div className="mb-3 rounded-md border border-danger/40 bg-danger-bg px-3 py-2 text-[12px]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-danger mb-0.5">
            CHANGES REQUESTED
          </div>
          <p className="text-text">{foundTask.rejectReason}</p>
        </div>
      )}

      {renderView()}

      {/* Comments */}
      <div className="mt-5">
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
