import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { isClerkEnabled } from "@/lib/auth-config";

const COOKIE_KEY = "cowork-as-user";

/**
 * Resolve the current logged-in user ID. Two modes:
 *
 *  PRODUCTION (CLERK_SECRET_KEY set in env):
 *    1. Read `auth().userId` from Clerk session
 *    2. Look up our `users.clerkUserId` → return our internal `users.id`
 *    3. Return null if not signed in / not yet provisioned
 *
 *  DEVELOPMENT (no Clerk keys):
 *    1. Read `cowork-as-user` impersonation cookie (set by UserSwitcher)
 *    2. Fall back to first user in workspace
 *    3. Return null if workspace has 0 users
 *
 * The dev fallback is what the prototype always used. Once you set
 * Clerk keys + deploy, it auto-switches to real auth.
 */
export async function getCurrentUserIdAsync(): Promise<string | null> {
  if (await isClerkEnabled()) {
    // Real auth via Clerk
    const { auth } = await import("@clerk/nextjs/server");
    const session = await auth();
    if (!session.userId) return null;
    const u = db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.clerkUserId, session.userId))
      .get();
    return u?.id ?? null;
  }

  // Dev mode — impersonation cookie
  const c = await cookies();
  const stored = c.get(COOKIE_KEY)?.value;
  if (stored) {
    const u = db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, stored))
      .get();
    if (u) return u.id;
  }
  // Fallback: first user in workspace
  const any = db
    .select({ id: schema.users.id })
    .from(schema.users)
    .limit(1)
    .get();
  return any?.id ?? null;
}

/**
 * Sync fallback — used in narrow contexts. Returns first user in DB.
 * In production with Clerk, prefer the async version.
 */
export function getCurrentUserIdSync(): string | null {
  const any = db
    .select({ id: schema.users.id })
    .from(schema.users)
    .limit(1)
    .get();
  return any?.id ?? null;
}

export const COOKIE_NAME = COOKIE_KEY;
