import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";

const COOKIE_KEY = "cowork-as-user";

/**
 * Resolve the current logged-in user ID for the prototype:
 * 1. Read `cowork-as-user` cookie (set by UserSwitcher) — if user exists in DB
 * 2. Fall back to first user in workspace
 * 3. Return null if workspace has 0 users
 *
 * Production: replace with real auth (Clerk/NextAuth) — `auth().userId`.
 */
export async function getCurrentUserIdAsync(): Promise<string | null> {
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
 * Sync version for use in already-resolved contexts.
 * (For server actions where we already loaded current user.)
 * Reads from DB only — no cookie. Use sparingly.
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
