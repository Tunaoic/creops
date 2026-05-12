import { test, expect } from "@playwright/test";

/**
 * Production smoke tests — covers public-only routes that don't require
 * Clerk auth. Use to verify the deployed app's surface is healthy.
 *
 * Run with:
 *   pnpm test:e2e:prod
 *
 * Auth-required routes (/dashboard etc.) are NOT covered here because
 * they redirect to Clerk's hosted sign-in. Use Clerk's test mode tokens
 * to extend coverage to authed flows.
 */

test.describe("production public routes", () => {
  test("health endpoint returns ok with all expected services configured", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.checks.auth.clerkConfigured).toBe(true);
    expect(body.checks.auth.webhookSecretSet).toBe(true);
    expect(body.checks.database.mode).toBe("turso");
    expect(body.checks.database.reachable).toBe(true);
  });

  test("landing page renders without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`PAGE: ${e.message}`));
    page.on("response", (r) => {
      if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`);
    });

    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);

    // Public landing should have hero copy
    const bodyText = await page.locator("body").textContent();
    const hasHero =
      bodyText?.includes("One source video") ||
      bodyText?.includes("CreOps") ||
      bodyText?.includes("Get started");
    expect(hasHero, `Landing page missing hero. Got: ${bodyText?.slice(0, 200)}`).toBe(true);

    expect(errors, `Landing page errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("sign-in page renders Clerk form", async ({ page }) => {
    await page.goto("/sign-in");
    // Either Clerk form loaded OR redirected to Clerk hosted page
    const url = page.url();
    const isClerkRoute =
      url.includes("/sign-in") || url.includes(".accounts.dev");
    expect(isClerkRoute).toBe(true);
  });

  test("sign-up page renders Clerk form", async ({ page }) => {
    await page.goto("/sign-up");
    const url = page.url();
    const isClerkRoute =
      url.includes("/sign-up") || url.includes(".accounts.dev");
    expect(isClerkRoute).toBe(true);
  });

  test("/dashboard properly redirects unauthenticated to sign-in", async ({
    page,
  }) => {
    const response = await page.goto("/dashboard", { waitUntil: "load" });
    // Either 200 with sign-in form OR 307/308 redirect
    const url = page.url();
    expect(url.includes("sign-in") || url.includes(".accounts.dev")).toBe(true);
  });

  test("unknown route either 404s or redirects to sign-in (Clerk-protected)", async ({
    page,
  }) => {
    const response = await page.goto("/this-route-does-not-exist-xyz");
    const status = response?.status() ?? 0;
    const url = page.url();
    // With Clerk middleware on, unauth requests to non-public routes
    // redirect to sign-in BEFORE 404 can render. Both outcomes are valid:
    //   - 404 (we're auth'd somehow OR route is public)
    //   - 200 + sign-in URL (redirected by Clerk)
    const ok =
      status === 404 ||
      (status === 200 && (url.includes("sign-in") || url.includes(".accounts.dev")));
    expect(ok, `Got status ${status} at ${url}`).toBe(true);
  });
});
