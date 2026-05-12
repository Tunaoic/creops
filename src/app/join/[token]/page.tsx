import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { acceptInvite } from "@/db/actions";
import { getCurrentUserIdAsync } from "@/lib/current-user";
import { isClerkEnabled } from "@/lib/auth-config";

export const dynamic = "force-dynamic";

/**
 * Invite landing page — destination of the link emailed by `inviteMember`.
 *
 * Three terminal states + one transient one:
 *
 *   1. Invalid / expired / already-accepted token → friendly error card
 *   2. Valid token, not signed in → welcome card with sign-up / sign-in CTAs
 *      (both preserve the token in `redirect_url` so we land back here)
 *   3. Valid token, signed in, internal user row exists → call acceptInvite,
 *      then redirect to /dashboard. Idempotent for re-clicks.
 *   4. Valid token, signed in via Clerk but webhook hasn't created our user
 *      row yet → "setting up" card with auto-refresh meta tag (mirrors the
 *      same race-condition affordance used in /onboarding).
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await db
    .select()
    .from(schema.workspaceInvites)
    .where(eq(schema.workspaceInvites.token, token))
    .get();

  if (!invite) {
    return (
      <InviteShell>
        <InviteCard
          title="Invite not found"
          message="This link may have been mistyped or the invite was cancelled."
          tone="muted"
        />
      </InviteShell>
    );
  }

  if (invite.expiresAt < new Date() && !invite.acceptedAt) {
    return (
      <InviteShell>
        <InviteCard
          title="Invite expired"
          message="Ask your teammate to send a new invite — they last 7 days."
          tone="muted"
        />
      </InviteShell>
    );
  }

  // Workspace + inviter — for the welcome card OR a friendlier "already used" message
  const [workspace, inviter] = await Promise.all([
    db
      .select({ name: schema.workspaces.name })
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, invite.workspaceId))
      .get(),
    invite.invitedBy
      ? db
          .select({ name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.id, invite.invitedBy))
          .get()
      : Promise.resolve(null),
  ]);

  const workspaceName = workspace?.name ?? "your workspace";
  const inviterName = inviter?.name ?? "A teammate";

  // Auth-mode branching
  const clerkOn = await isClerkEnabled();
  const userId = await getCurrentUserIdAsync();

  if (!userId) {
    if (clerkOn) {
      const back = encodeURIComponent(`/join/${token}`);
      return (
        <InviteShell>
          <InviteWelcome
            workspaceName={workspaceName}
            inviterName={inviterName}
            email={invite.email}
            role={invite.role}
            signUpHref={`/sign-up?redirect_url=${back}`}
            signInHref={`/sign-in?redirect_url=${back}`}
            alreadyAccepted={!!invite.acceptedAt}
          />
        </InviteShell>
      );
    }
    // Dev mode without Clerk — there's no sign-up flow to bounce through.
    // Tell the developer plainly; the dev seed already has users so this
    // path is mostly hit when manually testing the link locally.
    return (
      <InviteShell>
        <InviteCard
          title="Sign-in required"
          message="Auth isn't configured in this environment. Set CLERK keys and redeploy."
          tone="muted"
        />
      </InviteShell>
    );
  }

  // Clerk session may exist while our DB user row hasn't been provisioned
  // yet (webhook race). getCurrentUserIdAsync returns null in that case
  // even though the Clerk session is valid — but here userId is non-null,
  // so we're past that. Safe to accept.

  const result = await acceptInvite(token);
  if (!result.ok) {
    return (
      <InviteShell>
        <InviteCard
          title="Couldn't join workspace"
          message={result.reason ?? "Try the link again or ask for a fresh invite."}
          tone="muted"
        />
      </InviteShell>
    );
  }

  redirect("/dashboard");
}

// ============================================================================
// Layout shell — keeps the page chrome consistent with /onboarding
// ============================================================================

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}

function InviteCard({
  title,
  message,
  tone,
}: {
  title: string;
  message: string;
  tone: "muted" | "accent";
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8">
      <p className="text-[14px] text-text-muted mb-1">CreOps</p>
      <h1 className="text-title-2 text-text">{title}</h1>
      <p className="text-[15px] text-text-muted mt-3 leading-relaxed">
        {message}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className={
            tone === "accent"
              ? "btn-primary text-[15px]"
              : "text-[14px] text-text-muted hover:text-text underline underline-offset-4"
          }
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

function InviteWelcome({
  workspaceName,
  inviterName,
  email,
  role,
  signUpHref,
  signInHref,
  alreadyAccepted,
}: {
  workspaceName: string;
  inviterName: string;
  email: string;
  role: string;
  signUpHref: string;
  signInHref: string;
  alreadyAccepted: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8">
      <p className="text-[14px] text-text-muted mb-2">CreOps</p>
      <h1 className="text-title-2 text-text leading-tight">
        {inviterName} invited you to{" "}
        <span className="text-accent">{workspaceName}</span>
      </h1>
      <p className="text-[15px] text-text-muted mt-3">
        Joining as <strong className="text-text">{role}</strong>. Sign up with{" "}
        <span className="text-text">{email}</span> to keep the invite tied to
        your account.
      </p>

      {alreadyAccepted ? (
        <div className="mt-6 rounded-xl border border-border bg-bg px-4 py-3">
          <p className="text-[13px] text-text-muted">
            This invite was already used. Sign in to continue.
          </p>
        </div>
      ) : null}

      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        <Link href={signUpHref} className="btn-primary text-[15px] text-center">
          Create account
        </Link>
        <Link
          href={signInHref}
          className="text-[15px] font-medium text-text px-4 py-2 rounded-full border border-border hover:bg-surface-hover text-center transition-colors"
        >
          I already have an account
        </Link>
      </div>

      <p className="text-[12px] text-text-subtle mt-6 pt-5 border-t border-border">
        Wrong address? Ask {inviterName} to send a new invite to the email you
        actually use.
      </p>
    </div>
  );
}
