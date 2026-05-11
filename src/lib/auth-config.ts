import "server-only";

/**
 * Single source of truth for whether Clerk auth is configured.
 *
 * If both publishable + secret keys are set in env, the app runs in
 * production auth mode (Clerk session, /sign-in /sign-up pages, real
 * users). Otherwise it stays in dev impersonation mode (cookie-based,
 * UserSwitcher visible in TopBar).
 *
 * This lets the codebase ship the Clerk integration without breaking
 * local dev — anyone cloning + running `pnpm dev` keeps the prototype
 * experience until they add keys.
 */
export async function isClerkEnabled(): Promise<boolean> {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
}

/** Sync version where awaited contexts aren't available. */
export function isClerkEnabledSync(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
}
