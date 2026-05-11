"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { assignTask } from "@/db/actions";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

export function AssigneePicker({
  taskId,
  currentAssigneeIds,
  members,
  size = "default",
}: {
  taskId: string;
  currentAssigneeIds: string[];
  members: User[];
  size?: "default" | "small";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const assignees = currentAssigneeIds
    .map((id) => members.find((m) => m.id === id))
    .filter((u): u is User => Boolean(u));

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function toggle(userId: string) {
    const wasAssigned = currentAssigneeIds.includes(userId);
    const next = wasAssigned
      ? currentAssigneeIds.filter((id) => id !== userId)
      : [...currentAssigneeIds, userId];
    const targetName = members.find((m) => m.id === userId)?.name ?? "user";
    startTransition(async () => {
      const result = await assignTask(taskId, next);
      if (result.ok) {
        toast.success(
          wasAssigned ? `Removed ${targetName}` : `Assigned to ${targetName}`
        );
      } else {
        toast.error(result.reason);
      }
      router.refresh();
    });
  }

  function clearAll() {
    startTransition(async () => {
      const result = await assignTask(taskId, []);
      if (result.ok) {
        toast.success("Cleared all assignees");
      } else {
        toast.error(result.reason);
      }
      router.refresh();
      setOpen(false);
    });
  }

  const isSmall = size === "small";

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded border transition-colors",
          isSmall ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-[12px]",
          assignees.length > 0
            ? "border-border bg-surface hover:border-border-strong text-text"
            : "border-dashed border-border-strong bg-bg hover:border-accent text-text-muted hover:text-text"
        )}
      >
        {assignees.length > 0 ? (
          <>
            <AvatarStack users={assignees} size={isSmall ? "xs" : "sm"} />
            <span className="font-medium">
              {assignees.length === 1
                ? assignees[0].name
                : `${assignees.length} assigned`}
            </span>
          </>
        ) : (
          <>
            <UserPlus className="w-3 h-3" strokeWidth={2.25} />
            <span>{members.length === 0 ? "Solo" : "Assign"}</span>
          </>
        )}
        {pending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ChevronDown className="w-3 h-3 text-text-subtle" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-[260px] bg-surface rounded border border-border-strong shadow-lg z-20 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-border bg-bg/40 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-subtle flex items-center justify-between">
            <span>
              Assignees{assignees.length > 0 && ` · ${assignees.length}`}
            </span>
            {assignees.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-text-muted hover:text-warn-text"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-[280px] overflow-y-auto py-1">
            {members.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-text-subtle italic text-center">
                No team members.
                <br />
                <span className="text-[11px]">Add via Settings → Team</span>
              </div>
            ) : (
              members.map((m) => {
                const checked = currentAssigneeIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 flex items-center gap-2 text-[13px] hover:bg-surface-hover transition-colors",
                      checked && "bg-accent/5"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        checked
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border-strong"
                      )}
                    >
                      {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-[10px] font-mono font-bold text-accent shrink-0">
                      {m.name[0]?.toUpperCase()}
                    </span>
                    <span className="flex-1 min-w-0 truncate">{m.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AvatarStack({
  users,
  size = "sm",
  max = 3,
}: {
  users: User[];
  size?: "xs" | "sm" | "md";
  max?: number;
}) {
  const visible = users.slice(0, max);
  const rest = users.length - visible.length;

  const sizeClass =
    size === "xs"
      ? "w-3.5 h-3.5 text-[8px]"
      : size === "sm"
        ? "w-4 h-4 text-[9px]"
        : "w-5 h-5 text-[10px]";

  return (
    <div className="inline-flex -space-x-1">
      {visible.map((u) => (
        <span
          key={u.id}
          className={cn(
            "rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center font-mono font-bold text-accent",
            sizeClass
          )}
          title={u.name}
        >
          {u.name[0]?.toUpperCase()}
        </span>
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "rounded-full bg-surface border border-border-strong flex items-center justify-center font-mono font-bold text-text-muted",
            sizeClass
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
