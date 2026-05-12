"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Briefcase, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { createWorkspace } from "@/db/actions";

/**
 * No-workspace landing UI.
 *
 * Two doors:
 *   - Inline create form (primary CTA)
 *   - Passive copy explaining how invite links work (secondary)
 *
 * Auto-focuses the input. On submit, calls createWorkspace, then the
 * server action revalidates the layout and we push to /dashboard
 * (the new workspace is now active because createWorkspace switches
 * the user's pointer).
 */
export function WelcomeClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  // Sync lock — useTransition's `pending` flips a tick late so a fast
  // double-click could fire submit() twice before the disabled prop
  // catches up.
  const submittingRef = useRef(false);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (submittingRef.current) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Workspace name is required");
      return;
    }
    submittingRef.current = true;
    startTransition(async () => {
      try {
        const result = await createWorkspace({ name: trimmed });
        if (!result.ok) {
          toast.error(result.reason ?? "Couldn't create workspace");
          return;
        }
        toast.success(`Created ${trimmed}`);
        router.push("/dashboard");
      } finally {
        submittingRef.current = false;
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Briefcase className="w-4.5 h-4.5 text-accent" strokeWidth={2} />
            </div>
            <span className="text-[14px] font-medium text-text-muted">
              CreOps
            </span>
          </div>
          <h1 className="text-title-1 text-text leading-tight">
            Welcome. Let&apos;s set up your{" "}
            <span className="text-accent">first workspace.</span>
          </h1>
          <p className="text-[16px] text-text-muted mt-3 leading-relaxed">
            A workspace is a private space for one project, client, or team.
            Topics, tasks, and members all live inside one — switch between
            them anytime from the sidebar.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <label className="block text-[14px] font-medium text-text mb-2">
            Workspace name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Studio · Personal · Client X"
            autoFocus
            maxLength={60}
            className="w-full px-4 py-3 text-[16px] mb-4"
          />
          <button
            type="submit"
            disabled={!name.trim() || pending}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 text-[15px] py-2.5 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
            )}
            Create workspace
          </button>
          <p className="text-[12px] text-text-subtle mt-3">
            You&apos;ll be the owner. Free plan: up to 3 workspaces — invite
            unlimited teammates per workspace.
          </p>
        </form>

        <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-5">
          <div className="flex items-start gap-3">
            <Mail
              className="w-4 h-4 text-text-muted mt-0.5 shrink-0"
              strokeWidth={1.75}
            />
            <div className="text-[13px] text-text-muted leading-relaxed">
              <span className="font-semibold text-text">Joining a team?</span>{" "}
              Ask the workspace owner to send an invite to your email. The
              link drops you straight into their workspace — no separate
              account needed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
