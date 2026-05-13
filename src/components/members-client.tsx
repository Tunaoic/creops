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
  Clock,
  Send,
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
import { toast } from "sonner";
import {
  updateMember,
  removeMember,
  inviteMember,
  resendInvite,
  cancelInvite,
} from "@/db/actions";
import type { PendingInvite } from "@/db/queries";
import { cn } from "@/lib/utils";

const ROLE_ACCENT: Record<string, string> = {
  creator: "border-accent text-accent",
  operation: "border-info text-info",
  designer: "border-warn text-warn",
  watcher: "border-text-muted text-text-muted",
};

export function MembersClient({
  initialUsers,
  initialPendingInvites,
}: {
  initialUsers: User[];
  initialPendingInvites: PendingInvite[];
}) {
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const inviteCount = initialPendingInvites.length;

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
              <Users className="w-6 h-6 text-text-muted" strokeWidth={1.5} />
              Team members
            </h1>
            <p className="text-[14px] text-text-muted mt-1">
              {initialUsers.length}{" "}
              {initialUsers.length === 1 ? "member" : "members"}
              {inviteCount > 0 ? (
                <>
                  {" · "}
                  {inviteCount} pending {inviteCount === 1 ? "invite" : "invites"}
                </>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInviting(true)}
            className="btn-primary inline-flex items-center gap-2 text-[14px]"
          >
            <Send className="w-4 h-4" strokeWidth={2} />
            Invite member
          </button>
        </div>
      </div>

      {/* How invites work */}
      <div className="bg-info-bg/60 rounded-2xl px-4 py-3 text-[13px] text-info">
        <strong className="font-semibold">Invites send a real email.</strong>{" "}
        <span className="text-info/85">
          Teammates click the link, sign up with that email, and land in this
          workspace automatically. Roles are display labels — they don&apos;t
          restrict access.
        </span>
      </div>

      {/* Pending invites */}
      {(inviting || initialPendingInvites.length > 0) && (
        <section className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-headline text-text flex items-baseline gap-2">
              Pending invites
              <span className="text-[14px] text-text-subtle font-normal tabular-nums">
                {initialPendingInvites.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-border">
            {inviting && <InviteRow onClose={() => setInviting(false)} />}
            {initialPendingInvites.map((invite) => (
              <PendingInviteRow key={invite.token} invite={invite} />
            ))}
            {initialPendingInvites.length === 0 && !inviting && (
              <p className="px-5 py-6 text-[13px] text-text-muted text-center">
                No invites waiting.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Member list */}
      <section className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-headline text-text flex items-baseline gap-2">
            Members
            <span className="text-[14px] text-text-subtle font-normal tabular-nums">
              {initialUsers.length}
            </span>
          </h2>
        </div>
        <div className="divide-y divide-border">
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
          {initialUsers.length === 0 && (
            <div className="px-5 py-12 text-center">
              <Users
                className="w-8 h-8 text-text-subtle mx-auto mb-3"
                strokeWidth={1.5}
              />
              <p className="text-[15px] text-text mb-1">No team members yet</p>
              <p className="text-[13px] text-text-muted mb-5 max-w-xs mx-auto">
                Send an invite — your teammate gets an email with a join link.
              </p>
              <button
                type="button"
                onClick={() => setInviting(true)}
                className="btn-primary inline-flex items-center gap-2 text-[14px]"
              >
                <Send className="w-4 h-4" strokeWidth={2} />
                Send first invite
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
      toast.success(`Removed ${user.name}`);
      router.refresh();
    });
  }

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-surface-hover/50 transition-colors group">
      <div className="w-9 h-9 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-[13px] font-semibold text-accent shrink-0">
        {user.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold truncate">{user.name}</span>
          <span
            className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0",
              ROLE_ACCENT[role] ?? "border-border text-text-muted"
            )}
          >
            {ROLE_LABEL[role as UserRole] ?? role}
          </span>
          {user.accessLevel !== "full" && (
            <span
              className={cn(
                "text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0",
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
        <div className="text-[12px] text-text-subtle flex items-center gap-1.5 mt-0.5">
          <Mail className="w-3 h-3" />
          {user.email}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {removing ? (
          <>
            <span className="text-[12px] text-warn mr-1">Sure?</span>
            <button
              type="button"
              onClick={confirmRemove}
              disabled={pending}
              className="p-1.5 rounded text-warn hover:bg-warn-bg disabled:opacity-50"
              title="Confirm remove"
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
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

function InviteRow({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("creator");
  const [pending, startTransition] = useTransition();

  function copyJoinLink(joinUrl: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard unavailable — copy the URL from the address bar");
      return;
    }
    navigator.clipboard
      .writeText(joinUrl)
      .then(() => toast.success("Join link copied — paste it to your teammate"))
      .catch(() => toast.error("Couldn't copy — try selecting the URL manually"));
  }

  function submit() {
    const cleaned = email.trim().toLowerCase();
    if (!cleaned || !cleaned.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    startTransition(async () => {
      const result = await inviteMember({ email: cleaned, role });

      // Email send failed but invite row exists → offer manual copy.
      // The invite is real, it just couldn't be delivered (Resend
      // restrictions, bounced address, etc.). Don't leave the user
      // stuck.
      if (!result.ok) {
        if (result.joinUrl) {
          toast.error(result.reason ?? "Email couldn't be sent", {
            description:
              "Invite is created — copy the link and send it manually.",
            duration: 12000,
            action: {
              label: "Copy link",
              onClick: () => copyJoinLink(result.joinUrl!),
            },
          });
          router.refresh();
          onClose();
          return;
        }
        toast.error(result.reason ?? "Could not send invite");
        return;
      }

      if (result.delivered) {
        toast.success(`Invite sent to ${cleaned}`);
      } else {
        // Dev fallback — no Resend key, link logged to server console.
        // Also offer a copy action so the dev can grab it from UI.
        toast.success("Invite created (dev mode — email not sent)", {
          description: "Copy the join link to share manually.",
          duration: 12000,
          action: result.joinUrl
            ? {
                label: "Copy link",
                onClick: () => copyJoinLink(result.joinUrl!),
              }
            : undefined,
        });
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="px-4 py-4 bg-accent/5 space-y-3">
      <div className="flex items-center gap-2 text-[13px] text-accent font-semibold">
        <Send className="w-3.5 h-3.5" strokeWidth={2} /> New invite
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="teammate@email.com"
          autoFocus
          className="px-3 py-2 rounded-lg border border-border bg-bg text-[14px] focus:outline-none focus:border-accent"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="px-3 py-2 rounded-lg border border-border bg-bg text-[14px] focus:outline-none focus:border-accent"
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[12px] text-text-subtle">
        {ROLE_DESCRIPTION[role] ?? ""}
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
          disabled={!email.trim() || pending}
          className="btn-primary inline-flex items-center gap-1.5 text-[14px] disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Send invite
        </button>
      </div>
    </div>
  );
}

function PendingInviteRow({ invite }: { invite: PendingInvite }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isExpired = invite.expiresAt < new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil((invite.expiresAt.getTime() - Date.now()) / 86400_000)
  );

  function copyJoinLink(joinUrl: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard unavailable — copy the URL from the address bar");
      return;
    }
    navigator.clipboard
      .writeText(joinUrl)
      .then(() => toast.success("Join link copied"))
      .catch(() => toast.error("Couldn't copy"));
  }

  function handleResend() {
    startTransition(async () => {
      const result = await resendInvite(invite.token);

      // Same fallback as the create-invite flow: email-send failure
      // shouldn't strand the user — the invite row is real, just offer
      // the link to copy manually.
      if (!result.ok) {
        if (result.joinUrl) {
          toast.error(result.reason ?? "Email couldn't be sent", {
            description: "Copy the link and send it manually.",
            duration: 12000,
            action: {
              label: "Copy link",
              onClick: () => copyJoinLink(result.joinUrl!),
            },
          });
          router.refresh();
          return;
        }
        toast.error(result.reason ?? "Could not resend");
        return;
      }

      if (result.delivered) {
        toast.success(`Resent to ${invite.email}`);
      } else {
        toast.success("Invite extended (email not sent — dev mode)", {
          description: "Copy the join link to share manually.",
          duration: 12000,
          action: result.joinUrl
            ? {
                label: "Copy link",
                onClick: () => copyJoinLink(result.joinUrl!),
              }
            : undefined,
        });
      }
      router.refresh();
    });
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelInvite(invite.token);
      toast.success(`Cancelled invite for ${invite.email}`);
      router.refresh();
    });
  }

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-surface-hover/50 transition-colors group">
      <div className="w-9 h-9 rounded-full bg-bg border border-border flex items-center justify-center text-text-subtle shrink-0">
        <Mail className="w-4 h-4" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-medium truncate text-text">
            {invite.email}
          </span>
          <span
            className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0",
              ROLE_ACCENT[invite.role] ?? "border-border text-text-muted"
            )}
          >
            {ROLE_LABEL[invite.role as UserRole] ?? invite.role}
          </span>
        </div>
        <div className="text-[12px] text-text-subtle flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3 h-3" />
          {isExpired ? (
            <span className="text-warn">Expired — resend to extend</span>
          ) : (
            <span>
              Expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}
              {invite.invitedByName ? ` · invited by ${invite.invitedByName}` : ""}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {confirmCancel ? (
          <>
            <span className="text-[12px] text-warn mr-1">Cancel?</span>
            <button
              type="button"
              onClick={handleCancel}
              disabled={pending}
              className="p-1.5 rounded text-warn hover:bg-warn-bg disabled:opacity-50"
              title="Confirm cancel"
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(false)}
              className="p-1.5 rounded text-text-subtle hover:bg-surface-hover"
              title="Keep invite"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleResend}
              disabled={pending}
              className="text-[12px] text-text-muted hover:text-accent hover:bg-accent/10 px-2 py-1 rounded disabled:opacity-50 inline-flex items-center gap-1"
              title="Resend email + extend expiry"
            >
              {pending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Resend
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="p-1.5 rounded text-text-muted hover:text-warn hover:bg-warn-bg"
              title="Cancel invite"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
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
    <div className="px-4 py-3 bg-accent/5 space-y-2">
      <div className="flex items-center gap-2 text-[13px] text-accent font-semibold">
        <Pencil className="w-3.5 h-3.5" /> Edit member
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

      <div>
        <div className="text-[12px] font-medium text-text-subtle mb-1">
          Access permission
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
