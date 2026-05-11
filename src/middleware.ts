import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — runs on every request before routing.
 *
 * MODE A (Clerk keys set in env):
 *   Enforces auth via Clerk for every route except sign-in / sign-up /
 *   webhooks. Logged-out users hitting protected routes bounce to /sign-in.
 *
 * MODE B (no Clerk keys — local dev / prototype):
 *   No-op. Cookie-based impersonation downstream handles "current user".
 *
 * Lazy-import @clerk/nextjs only in MODE A so the dev experience stays
 * zero-dependency for contributors who don't want to set up Clerk yet.
 */
export default async function middleware(req: NextRequest) {
  const clerkEnabled = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
  );

  if (!clerkEnabled) {
    return NextResponse.next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
  ]);

  const handler = clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  });

  return handler(req, { waitUntil: () => Promise.resolve() } as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
