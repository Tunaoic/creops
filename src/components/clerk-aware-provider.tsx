import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

/**
 * Conditional ClerkProvider wrap.
 *
 * - PRODUCTION (Clerk keys set): wraps children in <ClerkProvider> so
 *   `useUser()` / `useAuth()` etc. work in client components.
 * - DEV (no keys): renders children directly, the prototype dev-mode
 *   impersonation flow takes over.
 *
 * Server component — env detection happens at render time. The check
 * lives in the parent layout (RootLayout), this component just receives
 * the boolean and applies it.
 */
export function ClerkAwareProvider({
  clerkEnabled,
  children,
}: {
  clerkEnabled: boolean;
  children: ReactNode;
}) {
  if (!clerkEnabled) {
    return <>{children}</>;
  }
  return <ClerkProvider>{children}</ClerkProvider>;
}
