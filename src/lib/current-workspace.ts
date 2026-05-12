import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getCurrentUserIdAsync } from "@/lib/current-user";

/**
 * Resolve the workspace ID for the current request.
 *
 * Production (Clerk on):
 *   1. Get current user via Clerk session → users.workspaceId
 *
 * Dev mode (Clerk off):
 *   1. Cookie-impersonated user → users.workspaceId
 *   2. Fall back to first workspace in DB
 *   3. Fall back to legacy "ws_1" (seed default)
 *
 * Cached per-request via React's `cache()` would be ideal but adds noise.
 * The DB queries here are cheap (~2ms) so we don't memoize yet.
 */
export async function getCurrentWorkspaceId(): Promise<string> {
  const userId = await getCurrentUserIdAsync();
  if (userId) {
    const u = await db
      .select({ workspaceId: schema.users.workspaceId })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .get();
    if (u?.workspaceId) return u.workspaceId;
  }

  // Fall back to first workspace in DB (handles dev mode w/ no users
  // OR misconfigured Clerk session). Last-resort: "ws_1" (seed default).
  const first = await db
    .select({ id: schema.workspaces.id })
    .from(schema.workspaces)
    .limit(1)
    .get();
  return first?.id ?? "ws_1";
}
