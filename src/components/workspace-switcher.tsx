"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Settings as SettingsIcon,
} from "lucide-react";
import { switchWorkspace } from "@/db/actions";
import { cn } from "@/lib/utils";
import type { WorkspaceSummary } from "@/types";

/**
 * Sidebar workspace switcher.
 *
 * Sits at the very top of the left sidebar — workspace is the highest-
 * level container in the app, so its identity belongs above all
 * navigation. Click → dropdown listing every workspace the user
 * belongs to + a "Manage workspaces" link.
 *
 * Mirrors Notion / Slack / Gamma's sidebar-top placement.
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

  if (workspaces.length === 0) {
    // No workspace yet (post-leave / fresh user) — link to settings to create one
    return (
      <Link
        href="/settings/workspaces"
        className="mx-3 mt-3 mb-2 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border-strong text-[14px] text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
        Create workspace
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative px-3 pt-3 pb-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className={cn(
          "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-border bg-bg hover:bg-surface-hover transition-colors text-left",
          open && "border-accent bg-surface-hover"
        )}
        title="Switch workspace"
      >
        <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center text-[14px] font-semibold shrink-0">
          {current?.name?.[0]?.toUpperCase() ?? "?"}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold text-text truncate leading-tight">
            {current?.name ?? "Pick a workspace"}
          </span>
          <span className="block text-[11px] text-text-subtle truncate leading-tight mt-0.5">
            {current
              ? `${current.memberCount} ${current.memberCount === 1 ? "member" : "members"}`
              : ""}
          </span>
        </span>
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted shrink-0" />
        ) : (
          <ChevronsUpDown
            className="w-3.5 h-3.5 text-text-subtle shrink-0"
            strokeWidth={2}
          />
        )}
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-surface rounded-2xl border border-border shadow-2xl z-40 overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-border">
            <p className="text-[11px] uppercase tracking-wider text-text-subtle font-semibold">
              Your workspaces
            </p>
          </div>
          <div className="max-h-[320px] overflow-y-auto py-1">
            {workspaces.map((w) => {
              const isCurrent = w.id === activeWorkspaceId;
              const role = w.myRoles[0];
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => pick(w.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 flex items-center gap-2.5 text-[14px] hover:bg-surface-hover transition-colors",
                    isCurrent && "bg-accent/5"
                  )}
                >
                  <span className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center text-[12px] font-semibold shrink-0">
                    {w.name[0]?.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="font-medium truncate flex items-center gap-1.5">
                      {w.name}
                      {isCurrent && (
                        <Check
                          className="w-3.5 h-3.5 text-accent shrink-0"
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                    <div className="text-[11px] text-text-subtle mt-0.5">
                      {role
                        ? `${role[0].toUpperCase()}${role.slice(1)}`
                        : "Member"}
                      {" · "}
                      {w.memberCount}{" "}
                      {w.memberCount === 1 ? "member" : "members"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t border-border">
            <Link
              href="/settings/workspaces"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              New workspace
            </Link>
            <Link
              href="/settings/workspaces"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            >
              <SettingsIcon className="w-3.5 h-3.5" strokeWidth={2} />
              Manage workspaces
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
