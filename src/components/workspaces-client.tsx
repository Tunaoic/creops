"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronRight,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createWorkspace,
  deleteWorkspace,
  leaveWorkspace,
  renameWorkspace,
  switchWorkspace,
} from "@/db/actions";
import { cn } from "@/lib/utils";
import type { WorkspaceSummary } from "@/types";

/**
 * Manage the workspaces the current user belongs to.
 *
 * Three concerns on one page:
 *   1. List of memberships — switch between, see member counts, see role
 *   2. Owner-only actions per workspace: rename, delete
 *   3. Create new workspace (free plan limit = 3)
 *
 * Non-owner members get the row + a "Leave" affordance instead of edit/delete.
 */
export function WorkspacesClient({
  workspaces,
  activeWorkspaceId,
  currentUserId,
}: {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
  currentUserId: string;
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-6 py-5 space-y-5">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-[14px] text-text-muted hover:text-text mb-4"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Back to Settings
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-title-2 text-text flex items-center gap-2.5">
              <Briefcase
                className="w-6 h-6 text-text-muted"
                strokeWidth={1.5}
              />
              Workspaces
            </h1>
            <p className="text-[14px] text-text-muted mt-1">
              {workspaces.length}{" "}
              {workspaces.length === 1 ? "workspace" : "workspaces"} · switch in
              the top-bar dropdown
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="btn-primary inline-flex items-center gap-2 text-[14px]"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            New workspace
          </button>
        </div>
      </div>

      <div className="bg-info-bg/60 rounded-2xl px-4 py-3 text-[13px] text-info">
        <strong className="font-semibold">One identity, many spaces.</strong>{" "}
        <span className="text-info/85">
          Use separate workspaces for separate clients or projects. Each is
          private — members of one can&apos;t see another. Free plan: up to 3
          workspaces.
        </span>
      </div>

      <section className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {creating && <CreateRow onClose={() => setCreating(false)} />}
          {workspaces.map((w) =>
            editing === w.id ? (
              <EditRow
                key={w.id}
                workspace={w}
                onClose={() => setEditing(null)}
              />
            ) : (
              <WorkspaceRow
                key={w.id}
                workspace={w}
                isActive={w.id === activeWorkspaceId}
                isOwner={w.ownerId === currentUserId}
                onEdit={() => setEditing(w.id)}
              />
            )
          )}
          {workspaces.length === 0 && !creating && (
            <div className="px-5 py-12 text-center">
              <Briefcase
                className="w-8 h-8 text-text-subtle mx-auto mb-3"
                strokeWidth={1.5}
              />
              <p className="text-[15px] text-text mb-1">No workspaces yet</p>
              <p className="text-[13px] text-text-muted mb-5 max-w-xs mx-auto">
                Create one to start organizing topics and inviting your team.
              </p>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="btn-primary inline-flex items-center gap-2 text-[14px]"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                Create first workspace
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function WorkspaceRow({
  workspace,
  isActive,
  isOwner,
  onEdit,
}: {
  workspace: WorkspaceSummary;
  isActive: boolean;
  isOwner: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const role = workspace.myRoles[0];

  function handleSwitch() {
    if (isActive) return;
    startTransition(async () => {
      await switchWorkspace(workspace.id);
      router.refresh();
    });
  }

  function handleLeave() {
    startTransition(async () => {
      const result = await leaveWorkspace(workspace.id);
      if (!result.ok) {
        toast.error(result.reason ?? "Couldn't leave");
        return;
      }
      toast.success(`Left ${workspace.name}`);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteWorkspace(workspace.id);
      if (!result.ok) {
        toast.error(result.reason ?? "Couldn't delete");
        return;
      }
      toast.success(`Deleted ${workspace.name}`);
      router.refresh();
    });
  }

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-surface-hover/50 transition-colors group">
      <button
        type="button"
        onClick={handleSwitch}
        disabled={pending || isActive}
        className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-[14px] font-semibold text-accent shrink-0 disabled:opacity-100"
        title={isActive ? "Currently active" : "Switch to this workspace"}
      >
        {workspace.name[0]?.toUpperCase()}
      </button>
      <button
        type="button"
        onClick={handleSwitch}
        disabled={pending || isActive}
        className="flex-1 min-w-0 text-left disabled:cursor-default"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-text truncate">
            {workspace.name}
          </span>
          {isActive && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-accent text-accent shrink-0 inline-flex items-center gap-1">
              <Check className="w-3 h-3" strokeWidth={2.5} />
              Active
            </span>
          )}
          {isOwner && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-info/40 text-info shrink-0">
              Owner
            </span>
          )}
        </div>
        <div className="text-[12px] text-text-subtle mt-0.5">
          {role ? `${role[0].toUpperCase()}${role.slice(1)}` : "Member"}
          {" · "}
          {workspace.memberCount}{" "}
          {workspace.memberCount === 1 ? "member" : "members"}
          {" · "}
          {workspace.plan === "free" ? "Free plan" : workspace.plan}
        </div>
      </button>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isOwner ? (
          // Owner-only actions: Rename, Delete
          confirmDelete ? (
            <>
              <span className="text-[12px] text-warn mr-1">Delete?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="p-1.5 rounded text-warn hover:bg-warn-bg disabled:opacity-50"
                title="Confirm delete"
              >
                {pending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="p-1.5 rounded text-text-subtle hover:bg-surface-hover"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-hover"
                title="Rename workspace"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded text-text-muted hover:text-warn hover:bg-warn-bg"
                title="Delete workspace"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )
        ) : confirmLeave ? (
          <>
            <span className="text-[12px] text-warn mr-1">Leave?</span>
            <button
              type="button"
              onClick={handleLeave}
              disabled={pending}
              className="p-1.5 rounded text-warn hover:bg-warn-bg disabled:opacity-50"
              title="Confirm leave"
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirmLeave(false)}
              className="p-1.5 rounded text-text-subtle hover:bg-surface-hover"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmLeave(true)}
            className="p-1.5 rounded text-text-muted hover:text-warn hover:bg-warn-bg"
            title="Leave workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function CreateRow({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      const result = await createWorkspace({ name: trimmed });
      if (!result.ok) {
        toast.error(result.reason ?? "Couldn't create");
        return;
      }
      toast.success(`Created ${trimmed}`);
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="px-4 py-4 bg-accent/5 space-y-3">
      <div className="flex items-center gap-2 text-[13px] text-accent font-semibold">
        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        New workspace
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Acme Studio"
        autoFocus
        maxLength={60}
        className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-[14px] focus:outline-none focus:border-accent"
      />
      <p className="text-[12px] text-text-subtle">
        Private space for your team. You&apos;ll be the owner — invite teammates
        from <span className="text-text">Settings → Members</span> after creating.
      </p>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-[14px] text-text-muted hover:text-text px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || pending}
          className="btn-primary inline-flex items-center gap-1.5 text-[14px] disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          Create workspace
        </button>
      </div>
    </div>
  );
}

function EditRow({
  workspace,
  onClose,
}: {
  workspace: WorkspaceSummary;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [pending, startTransition] = useTransition();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await renameWorkspace({
        workspaceId: workspace.id,
        name: trimmed,
      });
      if (!result.ok) {
        toast.error(result.reason ?? "Couldn't rename");
        return;
      }
      toast.success("Renamed");
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="px-4 py-4 bg-accent/5 space-y-3">
      <div className="flex items-center gap-2 text-[13px] text-accent font-semibold">
        <Pencil className="w-3.5 h-3.5" />
        Rename workspace
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        autoFocus
        maxLength={60}
        className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-[14px] focus:outline-none focus:border-accent"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-[14px] text-text-muted hover:text-text px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || pending}
          className="btn-primary inline-flex items-center gap-1.5 text-[14px] disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Save
        </button>
      </div>
    </div>
  );
}
