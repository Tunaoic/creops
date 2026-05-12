"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { switchWorkspace } from "@/db/actions";
import { cn } from "@/lib/utils";
import type { WorkspaceSummary } from "@/types";

/**
 * Top-bar dropdown for switching the active workspace.
 *
 * Renders the current workspace name as a pill button. Click → list of
 * every workspace the user is a member of, plus a "Create workspace"
 * link at the bottom that routes to /settings/workspaces.
 *
 * Hidden when the user belongs to only one workspace AND no other
 * affordance is needed — single-workspace users still need a way in
 * to "Create workspace", so we render the trigger as long as there's
 * at least one workspace to display.
 */
export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const current =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

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

  function pick(workspaceId: string) {
    if (workspaceId === activeWorkspaceId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await switchWorkspace(workspaceId);
      router.refresh();
      setOpen(false);
    });
  }

  if (workspaces.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-hover transition-colors text-[13px] max-w-[220px]",
          open && "border-accent"
        )}
        title="Switch workspace"
      >
        <span className="w-5 h-5 rounded-md bg-accent/15 text-accent flex items-center justify-center text-[11px] font-semibold shrink-0">
          {current?.name?.[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="font-medium text-text truncate">
          {current?.name ?? "no workspace"}
        </span>
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-text-subtle shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[300px] bg-surface rounded-2xl border border-border shadow-2xl z-40 overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-border">
            <p className="text-[11px] uppercase tracking-wider text-text-subtle font-semibold">
              Your workspaces
            </p>
          </div>
          <div className="max-h-[360px] overflow-y-auto py-1">
            {workspaces.map((w) => {
              const isCurrent = w.id === activeWorkspaceId;
              const role = w.myRoles[0];
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => pick(w.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 flex items-center gap-3 text-[14px] hover:bg-surface-hover transition-colors",
                    isCurrent && "bg-accent/5"
                  )}
                >
                  <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center text-[13px] font-semibold shrink-0">
                    {w.name[0]?.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      {w.name}
                      {isCurrent && (
                        <Check
                          className="w-3.5 h-3.5 text-accent shrink-0"
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                    <div className="text-[12px] text-text-subtle">
                      {role ? `${role[0].toUpperCase()}${role.slice(1)}` : "Member"}
                      {" · "}
                      {w.memberCount}{" "}
                      {w.memberCount === 1 ? "member" : "members"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <Link
            href="/settings/workspaces"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 border-t border-border text-[14px] text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Create or manage workspaces
          </Link>
        </div>
      )}
    </div>
  );
}
