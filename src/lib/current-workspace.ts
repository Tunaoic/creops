import "server-only";
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
 *   3. If they have zero memberships → fall back to first workspace
 *      in DB (dev-mode), then "ws_1" (legacy seed default)
 *
 * Important: this function does NOT auto-heal `users.activeWorkspaceId`
 * when it's stale. Server components that depend on it being correct
 * should call `ensureActiveWorkspaceMembership()` (server action) when
 * the user takes a write action — keeps reads side-effect free.
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
    // (User could have left or been removed since the cookie was last set.)
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
  }

  // Last-resort fallback for dev mode + legacy seeded data.
  const first = await db
    .select({ id: schema.workspaces.id })
    .from(schema.workspaces)
    .limit(1)
    .get();
  return first?.id ?? "ws_1";
}
