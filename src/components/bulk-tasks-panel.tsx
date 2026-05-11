"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Loader2,
  UserPlus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  bulkApproveTasks,
  bulkAssignTasks,
  bulkRejectTasks,
} from "@/db/actions";
import { AssigneeMultiSelect } from "@/components/assignee-multi-select";
import { AssigneePicker } from "@/components/assignee-picker";
import type { Task, User } from "@/types";
import { cn } from "@/lib/utils";

export function BulkTasksPanel({
  topicId,
  tasks,
  members,
}: {
  topicId: string;
  tasks: Task[];
  members: User[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const memberMap = new Map(members.map((m) => [m.id, m]));

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === tasks.length) setSelected(new Set());
    else setSelected(new Set(tasks.map((t) => t.id)));
  }

  function clear() {
    setSelected(new Set());
    setShowRejectInput(false);
    setShowAssign(false);
  }

  function bulkApprove() {
    const count = selected.size;
    startTransition(async () => {
      await bulkApproveTasks(Array.from(selected));
      toast.success(`Approved ${count} ${count === 1 ? "task" : "tasks"}`);
      clear();
      router.refresh();
    });
  }

  function bulkReject() {
    if (!rejectReason.trim()) return;
    const count = selected.size;
    startTransition(async () => {
      await bulkRejectTasks(Array.from(selected), rejectReason);
      toast.success(`Sent back ${count} ${count === 1 ? "task" : "tasks"}`);
      setRejectReason("");
      clear();
      router.refresh();
    });
  }

  function bulkAssign(ids: string[]) {
    const count = selected.size;
    startTransition(async () => {
      await bulkAssignTasks(Array.from(selected), ids);
      toast.success(
        ids.length === 0
          ? `Cleared ${count} ${count === 1 ? "assignee" : "assignees"}`
          : `Assigned ${count} ${count === 1 ? "task" : "tasks"}`
      );
      clear();
      router.refresh();
    });
  }

  const selectedCount = selected.size;
  const allSelected = selectedCount > 0 && selectedCount === tasks.length;

  return (
    <div className="space-y-1">
      {/* Selection header */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-mono text-text-subtle">
          <button
            type="button"
            onClick={selectAll}
            className="inline-flex items-center gap-1.5 hover:text-text"
          >
            <span
              className={cn(
                "w-3.5 h-3.5 rounded border flex items-center justify-center",
                allSelected
                  ? "border-accent bg-accent text-accent-fg"
                  : selectedCount > 0
                    ? "border-accent bg-accent/30"
                    : "border-border-strong"
              )}
            >
              {allSelected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
              {!allSelected && selectedCount > 0 && (
                <span className="w-1.5 h-0.5 bg-accent" />
              )}
            </span>
            {selectedCount === 0
              ? "Select all"
              : `${selectedCount} selected`}
          </button>
        </div>
      )}

      {/* Task rows with checkboxes */}
      {tasks.map((t) => {
        const checked = selected.has(t.id);
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded transition-colors",
              checked
                ? "bg-accent/5 border-l-2 border-accent -ml-px pl-[7px]"
                : "hover:bg-surface-hover/50"
            )}
          >
            <button
              type="button"
              onClick={() => toggle(t.id)}
              className={cn(
                "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                checked
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-border-strong hover:border-accent"
              )}
            >
              {checked && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
            </button>
            <span
              className={
                t.status === "approved"
                  ? "text-success"
                  : t.status === "submitted"
                    ? "text-warn-text"
                    : t.status === "rejected"
                      ? "text-warn-text"
                      : "text-text-muted"
              }
            >
              ●
            </span>
            <Link
              href={`/topics/${topicId}/tasks/${t.id}`}
              className="text-[13px] capitalize hover:text-accent flex-1 min-w-0 truncate"
            >
              {t.templateItemKey.replace(/_/g, " ")}
            </Link>
            <AssigneePicker
              taskId={t.id}
              currentAssigneeIds={t.assigneeIds}
              members={members}
              size="small"
            />
          </div>
        );
      })}

      {/* Sticky action bar */}
      {selectedCount > 0 && (
        <div className="sticky bottom-2 mt-3 z-10">
          <div className="bg-surface border-2 border-accent rounded-lg shadow-2xl px-3 py-2 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[12px] font-mono font-semibold text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_4px_var(--accent)]" />
              {selectedCount} selected
            </div>

            <div className="h-4 w-px bg-border" />

            {showAssign ? (
              <AssigneeMultiSelect
                members={members}
                onConfirm={bulkAssign}
                onCancel={() => setShowAssign(false)}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowAssign(true)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-bg hover:border-accent text-[12px] disabled:opacity-50"
                >
                  <UserPlus className="w-3 h-3" />
                  Assign
                </button>

                <button
                  type="button"
                  onClick={bulkApprove}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-success/15 border border-success/40 text-success hover:bg-success/25 text-[12px] disabled:opacity-50"
                >
                  {pending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Approve all
                </button>

                <button
                  type="button"
                  onClick={() => setShowRejectInput((v) => !v)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-warn-bg border border-warn-border text-warn hover:bg-warn-bg/80 text-[12px] disabled:opacity-50"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Reject
                </button>

                <button
                  type="button"
                  onClick={clear}
                  className="ml-auto p-1 text-text-muted hover:text-text"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Inline reject reason input */}
          {showRejectInput && !showAssign && (
            <div className="bg-warn-bg border border-warn-border rounded-lg px-3 py-2 mt-2">
              <input
                type="text"
                autoFocus
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") bulkReject();
                  if (e.key === "Escape") setShowRejectInput(false);
                }}
                placeholder="Reject reason — applied to all selected..."
                className="w-full px-2 py-1 rounded border border-warn-border bg-surface text-[12px] focus:outline-none focus:border-warn-text"
              />
              <div className="flex justify-end gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(false)}
                  className="text-[11px] text-text-muted px-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={bulkReject}
                  disabled={!rejectReason.trim() || pending}
                  className="text-[11px] px-3 py-0.5 rounded bg-warn-text text-white disabled:opacity-50"
                >
                  Reject {selectedCount}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
