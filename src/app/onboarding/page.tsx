import { redirect } from "next/navigation";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { getCurrentUserIdAsync } from "@/lib/current-user";
import { isClerkEnabled } from "@/lib/auth-config";
import { OnboardingForm } from "@/components/onboarding-form";

export const dynamic = "force-dynamic";

/**
 * First-run page after sign-up. The Clerk webhook auto-creates the
 * workspace + user, so by the time the user lands here they already
 * have a default workspace named "{Name}'s Workspace". This page lets
 * them rename it + see "what's next" guidance.
 *
 * Routes:
 *   - Not logged in (Clerk on) → middleware redirects to /sign-in
 *   - Logged in but no workspace yet → render the rename form
 *   - Logged in + already onboarded (renamed once) → redirect to /
 */
export default async function OnboardingPage() {
  if (!(await isClerkEnabled())) {
    // Dev mode — onboarding doesn't apply, send back to dashboard
    redirect("/dashboard");
  }

  const userId = await getCurrentUserIdAsync();
  if (!userId) {
    // Webhook hasn't run yet — user signed up just now, race condition.
    // Show a friendly "setting up your workspace" state.
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="text-center">
          <p className="text-[15px] text-text-muted">Setting up your workspace…</p>
          <p className="text-[13px] text-text-subtle mt-2">
            Refresh in a moment if this takes more than 5 seconds.
          </p>
        </div>
      </div>
    );
  }

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();
  if (!user) redirect("/dashboard");

  const workspace = await db
    .select()
    .from(schema.workspaces)
    .where(eq(schema.workspaces.id, user.workspaceId))
    .get();
  if (!workspace) redirect("/dashboard");

  // Skip onboarding if user has already renamed away from the default
  const isDefaultName = workspace.name.endsWith("'s Workspace");
  if (!isDefaultName) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <p className="text-[14px] text-text-muted mb-1">Welcome to CreOps</p>
          <h1 className="text-title-2 text-text">Name your workspace</h1>
          <p className="text-[15px] text-text-muted mt-2">
            This is where your team will create topics, assign tasks, and ship
            content. You can change the name later in Settings.
          </p>
        </div>
        <OnboardingForm workspaceId={workspace.id} initialName={workspace.name} />
      </div>
    </div>
  );
}
