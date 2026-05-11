"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  CHANNEL_LABEL,
  DELIVERABLE_TYPE_LABEL,
  type Channel,
  type Deliverable,
  type Task,
} from "@/types";
import { approveDeliverable } from "@/db/actions";
import { cn } from "@/lib/utils";

export function ApproveFlowClient({
  topicId,
  topicName,
  deliverable,
  channels,
  userNames,
}: {
  topicId: string;
  topicName: string;
  deliverable: Deliverable;
  channels: Channel[];
  userNames: Record<string, string>;
}) {
  const router = useRouter();
  // Filter to tasks that need creator decision (submitted) — these are the cards
  const submittedTasks = deliverable.tasks.filter(
    (t) => t.status === "submitted"
  );
  // If nothing submitted, show all tasks (so creator can scroll through context)
  const cards: Task[] = submittedTasks.length > 0 ? submittedTasks : deliverable.tasks;

  const [idx, setIdx] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, "approve" | "reject">>({});
  const [rejectComments, setRejectComments] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [pendingComment, setPendingComment] = useState("");
  const [submitting, startSubmit] = useTransition();

  const channelMap = new Map(channels.map((c) => [c.id, c]));
  const current = cards[idx];

  if (!current) {
    return (
      <div className="max-w-md mx-auto px-4 py-4 text-center">
        <p className="text-text-muted">No tasks to review for this deliverable.</p>
        <Link
          href={`/topics/${topicId}`}
          className="text-sm text-info hover:underline mt-3 inline-block"
        >
          ← Back to topic
        </Link>
      </div>
    );
  }

  const allDone = idx === cards.length - 1 && decisions[current.id];

  function decide(decision: "approve" | "reject") {
    if (decision === "reject") {
      setShowRejectInput(true);
      return;
    }
    setDecisions({ ...decisions, [current.id]: "approve" });
    if (idx < cards.length - 1) {
      setTimeout(() => setIdx(idx + 1), 200);
    }
  }

  function submitReject() {
    if (!pendingComment.trim()) return;
    setDecisions({ ...decisions, [current.id]: "reject" });
    setRejectComments({ ...rejectComments, [current.id]: pendingComment });
    setPendingComment("");
    setShowRejectInput(false);
    if (idx < cards.length - 1) {
      setTimeout(() => setIdx(idx + 1), 200);
    }
  }

  function finish() {
    startSubmit(async () => {
      await approveDeliverable(deliverable.id, decisions, rejectComments);
      router.push(`/topics/${topicId}`);
    });
  }

  function renderCardContent(task: Task) {
    const output = task.outputValue;
    if (task.outputType === "text" || task.outputType === "long_text") {
      return (
        <div className="bg-bg rounded-lg p-4 border border-border max-h-[50vh] overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
            {(output as string) || <em className="text-text-subtle">No content yet.</em>}
          </pre>
        </div>
      );
    }
    if (task.outputType === "markdown") {
      return (
        <div className="bg-bg rounded-lg p-4 border border-border max-h-[50vh] overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {(output as string) || <em className="text-text-subtle">No content yet.</em>}
          </pre>
        </div>
      );
    }
    if (task.outputType === "file") {
      return (
        <div className="aspect-[9/16] max-h-[50vh] w-auto mx-auto rounded-lg bg-surface-elevated border border-border-strong flex items-center justify-center text-text-muted text-xs font-mono">
          {output ? `📁 ${output as string}` : "No file"}
        </div>
      );
    }
    if (task.outputType === "datetime") {
      return (
        <div className="bg-bg rounded-lg p-4 border border-border text-center">
          <p className="text-lg font-medium">{(output as string) || "Not scheduled"}</p>
        </div>
      );
    }
    if (task.outputType === "chips") {
      const tags = typeof output === "string" ? output.split(",").map((t) => t.trim()) : [];
      return (
        <div className="bg-bg rounded-lg p-4 border border-border">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded border border-border bg-surface">
                {t}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  const channel = current.channelId ? channelMap.get(current.channelId) : null;

  return (
    <div className="max-w-md mx-auto px-4 py-4 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/topics/${topicId}`}
          className="text-sm text-text-muted hover:text-text"
        >
          ← Cancel
        </Link>
        <div className="text-xs text-text-muted">
          {idx + 1} / {cards.length}
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-xs text-text-muted">{topicName}</div>
        <div className="text-sm font-semibold">
          {DELIVERABLE_TYPE_LABEL[deliverable.type]}
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {cards.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              decisions[c.id] === "approve" && "bg-success",
              decisions[c.id] === "reject" && "bg-warn-text",
              !decisions[c.id] && i === idx && "bg-text",
              !decisions[c.id] && i !== idx && "bg-border-strong"
            )}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="text-xs uppercase tracking-wider text-text-muted text-center mb-3 capitalize">
          {current.templateItemKey.replace(/_/g, " ")}
          {channel && (
            <span className="text-text-subtle">
              {" "}· {CHANNEL_LABEL[channel.platform]}
            </span>
          )}
          {current.assigneeIds.length > 0 && (
            <span className="text-text-subtle">
              {" "}· by{" "}
              {current.assigneeIds
                .map((id) => userNames[id])
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
        </div>
        <div className="flex-1 mb-4">{renderCardContent(current)}</div>

        {showRejectInput && (
          <div className="mb-4 bg-warn-bg border border-warn-border rounded-lg p-3">
            <div className="text-xs font-medium text-warn-text mb-2">
              Why reject? (assignee sẽ thấy)
            </div>
            <textarea
              value={pendingComment}
              onChange={(e) => setPendingComment(e.target.value)}
              rows={3}
              placeholder="vd: Đổi title thành ..."
              className="w-full px-3 py-2 rounded-md border border-warn-border bg-surface text-sm focus:outline-none focus:border-warn-text resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="text-xs px-2 py-1 text-text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReject}
                disabled={!pendingComment.trim()}
                className="text-xs px-3 py-1 rounded bg-warn-text text-white disabled:opacity-50"
              >
                Submit Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {!allDone ? (
        <div className="flex items-center gap-3 pb-4">
          <button
            type="button"
            onClick={() => decide("reject")}
            disabled={!!decisions[current.id]}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-warn-text text-warn-text font-medium hover:bg-warn-bg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            {decisions[current.id] === "reject" ? "Rejected" : "Reject"}
          </button>
          <button
            type="button"
            onClick={() => decide("approve")}
            disabled={!!decisions[current.id]}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-success text-white bg-success font-medium hover:bg-success/80 transition-colors disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            {decisions[current.id] === "approve" ? "Approved" : "Approve"}
          </button>
        </div>
      ) : (
        <div className="pb-4">
          <div className="text-center mb-3 text-sm text-text-muted">
            Reviewed all {cards.length} items
          </div>
          <button
            type="button"
            onClick={finish}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-accent text-accent-fg font-medium hover:bg-accent-hover disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save decisions →
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-text-muted">
        <button
          type="button"
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="flex items-center gap-1 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          type="button"
          onClick={() => setIdx(Math.min(cards.length - 1, idx + 1))}
          disabled={idx === cards.length - 1}
          className="flex items-center gap-1 disabled:opacity-30"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
