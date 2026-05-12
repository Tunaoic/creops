import "server-only";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getCurrentUserIdAsync } from "@/lib/current-user";

/**
 * Resolve the workspace ID for the current request.
 *
 * Priority:
 *   1. `users.activeWorkspaceId` — pointer the user last selected
 *   2. If that's null OR the user isn't actually a member of it
 *      anymore (e.g. they got removed from that workspace), fall back
 *      to their oldest membership
 *   3. Authenticated user with ZERO memberships → redirect to /welcome.
 *      This is critical for security: never silently route an authed
 *      user into someone else's workspace via "first row in DB"
 *      fallback. A user without a membership has no business reading
 *      any workspace's data.
 *   4. Unauthenticated (dev mode without cookie / Clerk session not
 *      yet linked) → fall back to first workspace in DB. Keeps the
 *      cookie-impersonation dev flow working out of the box.
 *
 * The redirect short-circuits via Next's NEXT_REDIRECT throwable so
 * callers don't need to handle a "no workspace" return value — they
 * just won't continue executing.
 */
export async function getCurrentWorkspaceId(): Promise<string> {
  const userId = await getCurrentUserIdAsync();

  if (userId) {
    const u = await db
      .select({ activeWorkspaceId: schema.users.activeWorkspaceId })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .get();

    // Verify the active pointer still matches a real membership.
    if (u?.activeWorkspaceId) {
      const stillMember = await db
        .select({ workspaceId: schema.workspaceMembers.workspaceId })
        .from(schema.workspaceMembers)
        .where(
          and(
            eq(schema.workspaceMembers.userId, userId),
            eq(schema.workspaceMembers.workspaceId, u.activeWorkspaceId)
          )
        )
        .get();
      if (stillMember) return u.activeWorkspaceId;
    }

    // Active pointer stale or null — pick oldest membership instead.
    const oldest = await db
      .select({ workspaceId: schema.workspaceMembers.workspaceId })
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.userId, userId))
      .orderBy(schema.workspaceMembers.joinedAt)
      .limit(1)
      .get();
    if (oldest) return oldest.workspaceId;

    // Authenticated, zero memberships. Bounce them to /welcome to
    // create one or accept an invite. Never fall through to "first
    // workspace in DB" — that would leak another tenant's data.
    redirect("/welcome");
  }

  // Unauthenticated path — dev mode without a cookie pick.
  const first = await db
    .select({ id: schema.workspaces.id })
    .from(schema.workspaces)
    .limit(1)
    .get();
  return first?.id ?? "ws_1";
}
