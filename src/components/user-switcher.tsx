"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, UserCog, Check } from "lucide-react";
import { switchToUser } from "@/db/actions";
import { ROLE_LABEL, ACCESS_LABEL, type User, type UserRole } from "@/types";
import { cn } from "@/lib/utils";

export function UserSwitcher({
  members,
  currentUserId,
}: {
  members: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const current = members.find((m) => m.id === currentUserId);

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

  function pick(userId: string) {
    if (userId === currentUserId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await switchToUser(userId);
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending || members.length === 0}
        className={cn(
          "inline-flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-surface hover:border-border-strong text-text-muted hover:text-text transition-colors text-[12px]",
          open && "border-accent text-text",
          members.length === 0 && "opacity-40 cursor-not-allowed"
        )}
        title="Switch user (impersonation)"
      >
        <UserCog className="w-3 h-3 text-warn" />
        <span className="font-mono uppercase tracking-wider text-[10px] text-text-subtle">
          AS
        </span>
        <span className="font-medium">
          {current?.name ?? "no member"}
        </span>
        {pending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ChevronDown className="w-3 h-3 text-text-subtle" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-[280px] bg-surface rounded border border-border-strong shadow-2xl z-40 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-border bg-bg/40 flex items-center gap-1.5">
            <UserCog className="w-3 h-3 text-warn" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-subtle">
              IMPERSONATE
            </span>
            <span className="text-[10px] text-text-subtle ml-auto">
              prototype only
            </span>
          </div>
          <div className="max-h-[320px] overflow-y-auto py-1">
            {members.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-text-subtle italic text-center">
                No members. Add via Settings → Team
              </div>
            ) : (
              members.map((m) => {
                const isMe = m.id === currentUserId;
                const role = m.roles[0] as UserRole | undefined;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pick(m.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 flex items-center gap-2 text-[13px] hover:bg-surface-hover transition-colors",
                      isMe && "bg-accent/5"
                    )}
                  >
                    <span className="w-6 h-6 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-[11px] font-mono font-bold text-accent shrink-0">
                      {m.name[0]?.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate flex items-center gap-1.5">
                        {m.name}
                        {isMe && <Check className="w-3 h-3 text-accent" />}
                      </div>
                      <div className="text-[10px] font-mono text-text-subtle">
                        {role ? ROLE_LABEL[role] : "no role"}
                        {m.accessLevel !== "full" && (
                          <span className="ml-1">
                            · {ACCESS_LABEL[m.accessLevel].toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="px-3 py-1.5 border-t border-border bg-bg/40 text-[10px] font-mono text-text-subtle">
            Cookie: <code>cowork-as-user</code> · 30 days
          </div>
        </div>
      )}
    </div>
  );
}
