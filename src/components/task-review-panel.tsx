"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { approveTask, rejectTask } from "@/db/actions";
import { cn } from "@/lib/utils";

/**
 * Review controls shown to the topic creator when a task is in `submitted`
 * state. Pressing Approve fires {@link approveTask}; pressing Reject opens
 * an inline form for the reason and fires {@link rejectTask}.
 *
 * Notification fan-out happens server-side — assignees + watchers + creator
 * all get the appropriate `task_approved` or `task_rejected` event.
 */
export function TaskReviewPanel({
  taskId,
  locale = "en",
}: {
  taskId: string;
  locale?: "en" | "vi";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function handleApprove() {
    startTransition(async () => {
      await approveTask(taskId);
      router.refresh();
    });
  }

  function handleReject() {
    if (!reason.trim()) return;
    startTransition(async () => {
      await rejectTask(taskId, reason.trim());
      router.refresh();
      setRejecting(false);
      setReason("");
    });
  }

  const labels = {
    approve: locale === "vi" ? "Duyệt" : "Approve",
    reject: locale === "vi" ? "Yêu cầu chỉnh sửa" : "Request changes",
    cancel: locale === "vi" ? "Hủy" : "Cancel",
    reasonPlaceholder:
      locale === "vi"
        ? "Cho biết cần chỉnh gì để assignee biết hướng làm lại…"
        : "Tell the assignee what to change so they can revise…",
    reasonLabel: locale === "vi" ? "Lý do" : "Reason for changes",
    submitReject: locale === "vi" ? "Gửi yêu cầu chỉnh" : "Send back for changes",
    instructions:
      locale === "vi"
        ? "Assignee đã submit. Duyệt hoặc yêu cầu chỉnh trước khi sang bước tiếp theo."
        : "The assignee has submitted. Approve or request changes before this moves forward.",
  };

  return (
    <section className="bg-surface rounded-2xl border border-warn/30 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-warn pulse-dot" />
        <h3 className="text-headline text-text">
          {locale === "vi" ? "Cần bạn duyệt" : "Your decision"}
        </h3>
      </div>
      <p className="text-[14px] text-text-muted mb-4">{labels.instructions}</p>

      {!rejecting ? (
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleApprove}
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success text-white text-[14px] font-medium",
              "hover:opacity-88 transition-opacity disabled:opacity-50"
            )}
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" strokeWidth={2.25} />
            )}
            {labels.approve}
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface hover:bg-surface-hover text-[14px] font-medium text-text transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" strokeWidth={2} />
            {labels.reject}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-[13px] font-medium text-text mb-1.5">
              {labels.reasonLabel}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder={labels.reasonPlaceholder}
              className="w-full px-3.5 py-2.5 text-[14px] leading-relaxed resize-y"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setRejecting(false);
                setReason("");
              }}
              disabled={pending}
              className="px-4 py-2 rounded-full text-[14px] text-text-muted hover:text-text hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={!reason.trim() || pending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-danger text-white text-[14px] font-medium hover:opacity-88 transition-opacity disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" strokeWidth={2} />
              )}
              {labels.submitReject}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
