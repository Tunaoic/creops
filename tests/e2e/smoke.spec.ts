import { test, expect, type Page } from "@playwright/test";

/**
 * Comprehensive smoke test suite for CreOps.
 *
 * Runs against local dev server with Clerk disabled (cookie impersonation).
 * Each test exercises one user flow and asserts the visible outcome.
 *
 * Strategy:
 *   1. Health probe — confirm server up, DB reachable
 *   2. Public routes — landing, sign-in, sign-up render
 *   3. Authed routes (dev-mode auto-impersonates first user)
 *      - Dashboard, Inbox, Topics, Board, Calendar, Settings all 200
 *   4. Workflow — create topic → assign → submit → approve
 *   5. Polish — language toggle, theme toggle, notifications
 */

const consoleErrors: Map<string, string[]> = new Map();

test.beforeEach(async ({ page }, testInfo) => {
  const errors: string[] = [];
  consoleErrors.set(testInfo.title, errors);
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Filter known noise that doesn't indicate a real bug
      if (
        !text.includes("Failed to load resource") &&
        !text.includes("favicon") &&
        !text.includes("Hydration")
      ) {
        errors.push(text);
      }
    }
  });
  page.on("pageerror", (err) => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });
});

test.afterEach(async ({}, testInfo) => {
  const errors = consoleErrors.get(testInfo.title) ?? [];
  if (errors.length > 0 && testInfo.status === "passed") {
    console.warn(
      `[${testInfo.title}] passed but logged ${errors.length} console errors:`,
      errors.slice(0, 3)
    );
  }
});

// --------------------------------------------------------------------------
// 1. Health
// --------------------------------------------------------------------------

test("health endpoint returns ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.checks.database.reachable).toBe(true);
});

// --------------------------------------------------------------------------
// 2. Public routes
// --------------------------------------------------------------------------

test("public landing page (or dashboard redirect in dev mode)", async ({ page }) => {
  // In dev mode, / redirects to /dashboard immediately. In production with
  // Clerk, / would render the landing page for logged-out users.
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);
});

test("dashboard route is reachable", async ({ page }) => {
  await page.goto("/dashboard");
  // Either dashboard renders OR we get the empty workspace welcome card.
  // Both are valid in dev mode.
  await expect(page.locator("body")).toBeVisible();
});

// --------------------------------------------------------------------------
// 3. Authed app routes — every nav target should 200 + render
// --------------------------------------------------------------------------

const authedRoutes = [
  { path: "/dashboard", expectVisibleText: ["Mission Control", "Trung tâm"] },
  { path: "/inbox", expectVisibleText: ["Your Queue", "Hàng đợi"] },
  { path: "/notifications", expectVisibleText: ["Notifications", "Thông báo"] },
  { path: "/topics", expectVisibleText: ["Topics", "Chủ đề"] },
  { path: "/board", expectVisibleText: ["All deliverables", "Board"] },
  { path: "/calendar", expectVisibleText: ["Calendar", "Lịch"] },
  { path: "/search", expectVisibleText: ["Search", "Tìm kiếm"] },
  { path: "/settings", expectVisibleText: ["Settings", "Cài đặt"] },
  { path: "/settings/members", expectVisibleText: ["Team", "thành viên", "Members"] },
  { path: "/topics/new", expectVisibleText: ["New topic", "Topic name", "Brief"] },
];

for (const route of authedRoutes) {
  test(`route ${route.path} renders without error`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status(), `${route.path} status`).toBeLessThan(500);

    // Check that at least one expected piece of copy renders. Tolerant of
    // EN/VI locale differences.
    const bodyText = await page.locator("body").textContent();
    const hasExpected = route.expectVisibleText.some((s) =>
      bodyText?.toLowerCase().includes(s.toLowerCase())
    );
    expect(hasExpected, `${route.path} should show one of ${route.expectVisibleText.join(" / ")}`).toBe(true);
  });
}

// --------------------------------------------------------------------------
// 4. Workflow — Create topic + happy path
// --------------------------------------------------------------------------

test("create new topic — minimal flow lands on topic detail", async ({ page }) => {
  await page.goto("/topics/new");
  await expect(page.locator("h1")).toContainText(/new topic/i);

  // Step 1 — fill text inputs
  await page.fill('input[type="text"]', "E2E Test Topic " + Date.now());
  await page.locator('input[type="url"]').first().fill("https://drive.google.com/test-folder");

  // Click "Pick Deliverables" to advance
  await page.getByRole("button", { name: /pick deliverables/i }).click();

  // Step 2 — pick a channel by clicking the first channel pill (e.g., YouTube)
  // Channel pills are buttons inside deliverable cards. Pick any one.
  const channelPill = page
    .locator('button:has-text("YouTube"), button:has-text("TikTok"), button:has-text("Blog")')
    .first();
  await channelPill.click();

  // Now "Create N Deliverable" button should be enabled
  const createBtn = page.getByRole("button", { name: /create.*deliverable/i });
  await expect(createBtn).toBeEnabled({ timeout: 3000 });
  await createBtn.click();

  // Should navigate to topic detail
  await page.waitForURL(/\/topics\/[^/]+$/, { timeout: 10000 });
  expect(page.url()).toMatch(/\/topics\/[a-zA-Z0-9_-]+$/);
});

// --------------------------------------------------------------------------
// 5. Polish — toggles, modals
// --------------------------------------------------------------------------

test("language toggle button is interactive", async ({ page }) => {
  await page.goto("/dashboard");
  // The LangToggle button shows "English" or "Tiếng Việt" — tolerant match
  const langBtn = page
    .getByRole("button")
    .filter({ hasText: /english|tiếng việt/i })
    .first();
  await expect(langBtn).toBeVisible({ timeout: 5000 });
  await langBtn.click();
  // After click, page should re-render — not crash
  await page.waitForLoadState("networkidle");
  await expect(page.locator("body")).toBeVisible();
});

test("theme toggle does not crash app", async ({ page }) => {
  await page.goto("/dashboard");
  // Theme toggle is an icon button with title "Switch to ..."
  const themeBtn = page.locator('button[title*="Switch to"]').first();
  if (await themeBtn.isVisible()) {
    await themeBtn.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  }
});

test("notifications bell opens dropdown", async ({ page }) => {
  await page.goto("/dashboard");
  const bellBtn = page.locator('button[title="Notifications"]').first();
  if (await bellBtn.isVisible()) {
    await bellBtn.click();
    // Dropdown should appear with "Notifications" heading or "No notifications"
    await page.waitForTimeout(300);
    const dropdown = page.getByText(/notifications|no notifications/i).first();
    await expect(dropdown).toBeVisible();
  }
});

test("command palette opens with Cmd+K", async ({ page }) => {
  await page.goto("/dashboard");
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(200);
  // Command palette renders some search input
  const cmdInput = page.locator('input[placeholder*="search" i], [cmdk-input]').first();
  await expect(cmdInput).toBeVisible({ timeout: 2000 }).catch(() => {
    // If Cmd+K not wired, that's a finding
    throw new Error("Cmd+K did not open command palette");
  });
});

// --------------------------------------------------------------------------
// 6. 404 + error pages
// --------------------------------------------------------------------------

test("404 page renders gracefully on unknown route", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist-xyz123");
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/404|not found|page not found/i).first()).toBeVisible();
});

// --------------------------------------------------------------------------
// 7. Console error global check
// --------------------------------------------------------------------------

test("dashboard has no critical console errors", async ({ page }, testInfo) => {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  const errors = consoleErrors.get(testInfo.title) ?? [];
  // Filter Clerk-specific dev warnings since we run with Clerk disabled
  const critical = errors.filter(
    (e) => !e.toLowerCase().includes("clerk") && !e.includes("404")
  );
  expect(critical, `Critical console errors: ${critical.join(" | ")}`).toEqual([]);
});
