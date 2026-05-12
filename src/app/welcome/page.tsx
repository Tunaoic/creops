import { redirect } from "next/navigation";
import { getMyWorkspaces } from "@/db/queries";
import { getCurrentUserIdAsync } from "@/lib/current-user";
import { isClerkEnabled } from "@/lib/auth-config";
import { WelcomeClient } from "@/components/welcome-client";

export const dynamic = "force-dynamic";

/**
 * No-workspace landing.
 *
 * Reached when an authenticated user has zero memberships — fresh
 * post-signup race, post-leave-all-workspaces, or any state where
 * `getCurrentWorkspaceId` would otherwise fall through to a tenant
 * the user shouldn't see.
 *
 * Forces them through one of two doors:
 *   - Create a new workspace (inline form)
 *   - Wait for an invite link from a teammate (passive)
 *
 * Lives OUTSIDE the `(app)` route group → no sidebar / topbar chrome.
 * Once they create a workspace, the create action redirects to
 * /dashboard via revalidatePath + the resolver picks it up.
 */
export default async function WelcomePage() {
  // Not signed in → push to sign-in (only matters in Clerk-enabled prod;
  // dev mode falls through with a synthetic user from the cookie).
  const userId = await getCurrentUserIdAsync();
  if (!userId && (await isClerkEnabled())) {
    redirect("/sign-in");
  }

  // Already a member of something → don't sit on the welcome screen.
  // The resolver would route them straight to their active workspace
  // anyway, so just send them to the dashboard.
  const workspaces = await getMyWorkspaces();
  if (workspaces.length > 0) {
    redirect("/dashboard");
  }

  return <WelcomeClient />;
}
