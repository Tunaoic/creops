"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Users,
  Mail,
  X,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  ACCESS_LABEL,
  ACCESS_DESCRIPTION,
  type AccessLevel,
  type User,
  type UserRole,
} from "@/types";
import { createMember, updateMember, removeMember } from "@/db/actions";
import { cn } from "@/lib/utils";

const ROLE_ACCENT: Record<string, string> = {
  creator: "border-accent text-accent",
  operation: "border-info text-info",
  designer: "border-warn text-warn",
  watcher: "border-text-muted text-text-muted",
};

export function MembersClient({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-6 py-5 space-y-5">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-text mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members
            </h1>
            <p className="text-[13px] text-text-muted mt-1">
              {initialUsers.length} member{initialUsers.length !== 1 ? "s" : ""}{" "}
              · solo OK · assign per-task ở topic
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 rounded text-[13px]"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Add Member
          </button>
        </div>
      </div>


      {/* How assignment works */}
      <div className="bg-info-bg/40 border border-info/30 rounded px-3 py-2.5 text-[12px] text-info">
        <strong className="text-info">Solo OK.</strong>{" "}
        <span className="text-info/85">
          Tasks spawn unassigned. Pick assignee per-task ở topic detail (mỗi task có dropdown assign).
          Role chỉ là label hiển thị, không enforce gì cả.
        </span>
      </div>

      {/* Member list */}
      <section className="bg-surface rounded border border-border overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-bg/40 flex items-center justify-between">
          <h2 className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-text-subtle">
            Members · {initialUsers.length}
          </h2>
        </div>
        <div className="divide-y divide-border">
          {adding && (
            <AddRow onClose={() => setAdding(false)} />
          )}
          {initialUsers.map((user) =>
            editing === user.id ? (
              <EditRow
                key={user.id}
                user={user}
                onClose={() => setEditing(null)}
              />
            ) : (
              <DisplayRow
                key={user.id}
                user={user}
                onEdit={() => setEditing(user.id)}
              />
            )
          )}
          {initialUsers.length === 0 && !adding && (
            <div className="px-4 py-10 text-center">
              <Users className="w-8 h-8 text-text-subtle/50 mx-auto mb-2" />
              <p className="text-[14px] text-text-muted mb-1">
                Workspace chưa có member nào
              </p>
              <p className="text-[12px] text-text-subtle mb-4">
                Add từng người với name + email + role để bắt đầu giao task.
              </p>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 rounded text-[13px]"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Add First Member
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DisplayRow({ user, onEdit }: { user: User; onEdit: () => void }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [pending, startTransition] = useTransition();
  const role = user.roles[0] ?? "watcher";

  function confirmRemove() {
    startTransition(async () => {
      await removeMember(user.id);
      router.refresh();
    });
  }

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-surface-hover/50 transition-colors group">
      <div className="w-9 h-9 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-[13px] font-mono font-bold text-accent shrink-0">
        {user.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold truncate">{user.name}</span>
          <span
            className={cn(
              "text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0",
              ROLE_ACCENT[role] ?? "border-border text-text-muted"
            )}
          >
            {ROLE_LABEL[role as UserRole] ?? role}
          </span>
          {user.accessLevel !== "full" && (
            <span
              className={cn(
                "text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0",
                user.accessLevel === "readonly"
                  ? "border-warn-border text-warn"
                  : "border-info/40 text-info"
              )}
              title={ACCESS_DESCRIPTION[user.accessLevel]}
            >
              {ACCESS_LABEL[user.accessLevel]}
            </span>
          )}
        </div>
        <div className="text-[12px] font-mono text-text-subtle flex items-center gap-1.5 mt-0.5">
          <Mail className="w-3 h-3" />
          {user.email}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {removing ? (
          <>
            <span className="text-[11px] text-warn font-mono mr-1">Sure?</span>
            <button
              type="button"
              onClick={confirmRemove}
              disabled={pending}
              className="p-1.5 rounded text-warn hover:bg-warn-bg disabled:opacity-50"
              title="Confirm remove"
            >
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setRemoving(false)}
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
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setRemoving(true)}
              className="p-1.5 rounded text-text-muted hover:text-warn hover:bg-warn-bg"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AddRow({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim() || !email.trim()) return;
    startTransition(async () => {
      await createMember({ name, email, role: role || "watcher" });
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="px-4 py-3 bg-accent/5 border-l-2 border-accent">
      <div className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-wider text-accent">
        <Plus className="w-3 h-3" /> NEW MEMBER
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          autoFocus
          className="px-2.5 py-1.5 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@team.com"
          className="px-2.5 py-1.5 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole | "")}
          className="px-2.5 py-1.5 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent"
        >
          <option value="">— Role (optional) —</option>
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="text-[12px] text-text-muted hover:text-text px-2 py-1"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || !email.trim() || pending}
          className="btn-primary inline-flex items-center gap-1 px-3 py-1 rounded text-[12px] disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
          Add
        </button>
      </div>
    </div>
  );
}

function EditRow({ user, onClose }: { user: User; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(
    (user.roles[0] as UserRole) ?? "watcher"
  );
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(user.accessLevel);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      await updateMember({
        userId: user.id,
        name,
        email,
        role,
        accessLevel,
      });
      router.refresh();
      onClose();
    });
  }

  const accessOptions: AccessLevel[] = ["full", "limited", "readonly"];

  return (
    <div className="px-4 py-3 bg-accent/5 border-l-2 border-accent space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-accent">
        <Pencil className="w-3 h-3" /> EDIT MEMBER
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-2.5 py-1.5 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-2.5 py-1.5 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="px-2.5 py-1.5 rounded border border-border bg-bg text-[13px] focus:outline-none focus:border-accent"
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      {/* Access level row */}
      <div>
        <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-subtle mb-1">
          Access Permission
        </div>
        <div className="flex flex-wrap gap-1.5">
          {accessOptions.map((al) => (
            <button
              key={al}
              type="button"
              onClick={() => setAccessLevel(al)}
              className={cn(
                "px-2 py-1 rounded border text-[11px] text-left transition-colors",
                accessLevel === al
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-bg hover:border-accent text-text-muted"
              )}
            >
              <div className="font-semibold">{ACCESS_LABEL[al]}</div>
              <div className="text-[10px] text-text-subtle">
                {ACCESS_DESCRIPTION[al]}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="text-[12px] text-text-muted hover:text-text px-2 py-1"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="btn-primary inline-flex items-center gap-1 px-3 py-1 rounded text-[12px] disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
          Save
        </button>
      </div>
    </div>
  );
}
