import { defineConfig, devices } from "@playwright/test";

/**
 * E2E test config — two modes:
 *
 * LOCAL (default): runs smoke.spec.ts against `pnpm dev` on :3001
 *   with Clerk DISABLED so the cookie-impersonation fallback kicks in.
 *   Use to test all UX flows without dealing with Clerk's hosted forms.
 *
 * PROD: PW_BASE_URL=https://creops-ruddy.vercel.app pnpm test:e2e:prod
 *   Runs prod-public.spec.ts (only public routes, no auth required).
 *   To test authed flows in prod, you'd need Clerk testing tokens —
 *   not wired yet.
 */
const useExternalServer = !!process.env.PW_BASE_URL;
const baseURL = process.env.PW_BASE_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "./tests/e2e",
  // Scope test files by mode — local runs smoke only, prod runs prod-public only
  testMatch: useExternalServer ? "**/prod-public.spec.ts" : "**/smoke.spec.ts",
  fullyParallel: false, // shared local DB — serial avoids races
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(useExternalServer
    ? {}
    : {
        webServer: {
          // Force dev-mode fallback by passing empty Clerk keys.
          command:
            "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= CLERK_SECRET_KEY= PORT=3001 pnpm dev",
          url: "http://localhost:3001",
          reuseExistingServer: false,
          timeout: 60_000,
          stdout: "pipe",
          stderr: "pipe",
        },
      }),
});
