"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveTask, rejectTask } from "@/db/actions";
import { cn } from "@/lib/utils";

/**
 * Review controls shown to the topic creator when a task is in `submitted`
 * state. Pressing Approve fires {@link approveTask}; pressing Reject opens
 * an inline form for the reason and fires {@link rejectTask}.
 *
 * UX architecture (Apple HIG instant-feedback):
 *   1. Click Approve → button immediately swaps to "Approved ✓" green
 *      (useOptimistic) so user sees their action register before the
 *      server roundtrip + revalidatePath cycle completes.
 *   2. Server action returns ActionResult; if not ok, toast the reason
 *      and rollback the optimistic state.
 *   3. router.refresh() pulls fresh data; optimistic state resets cleanly.
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

  // Optimistic state machine for the review buttons themselves.
  // Resets on every render (when server returns + page revalidates).
  const [optimistic, setOptimistic] = useOptimistic<
    "idle" | "approved" | "rejected"
  >("idle");

  const labels = {
    approve: locale === "vi" ? "Duyệt" : "Approve",
    approved: locale === "vi" ? "Đã duyệt" : "Approved",
    reject: locale === "vi" ? "Yêu cầu chỉnh sửa" : "Request changes",
    rejected: locale === "vi" ? "Đã gửi lại" : "Sent back",
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
    toastApproved: locale === "vi" ? "Đã duyệt" : "Task approved",
    toastRejectSent:
      locale === "vi" ? "Đã gửi lại cho assignee" : "Sent back to the assignee",
  };

  function handleApprove() {
    startTransition(async () => {
      setOptimistic("approved");
      const result = await approveTask(taskId);
      if (result.ok) {
        toast.success(labels.toastApproved);
      } else {
        toast.error(result.reason);
      }
      router.refresh();
    });
  }

  function handleReject() {
    if (!reason.trim()) return;
    startTransition(async () => {
      setOptimistic("rejected");
      const result = await rejectTask(taskId, reason.trim());
      if (result.ok) {
        toast.success(labels.toastRejectSent);
      } else {
        toast.error(result.reason);
      }
      router.refresh();
      setRejecting(false);
      setReason("");
    });
  }

  // Optimistic flash — show success state for ~half a second before the
  // server-driven revalidate flips the parent into the new readonly view.
  if (optimistic === "approved") {
    return (
      <section className="bg-success-bg rounded-2xl border border-success/30 p-5">
        <div className="flex items-center gap-2 text-success">
          <Check className="w-5 h-5" strokeWidth={2.25} />
          <span className="text-headline">{labels.approved}</span>
        </div>
      </section>
    );
  }
  if (optimistic === "rejected") {
    return (
      <section className="bg-danger-bg rounded-2xl border border-danger/30 p-5">
        <div className="flex items-center gap-2 text-danger">
          <X className="w-5 h-5" strokeWidth={2.25} />
          <span className="text-headline">{labels.rejected}</span>
        </div>
      </section>
    );
  }

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
