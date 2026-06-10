import { test, expect, mockApi, enterApp, navByLabel } from "./helpers";

/**
 * Full visual walkthrough — captures EVERY screen (and key sub-states) as a
 * full-page screenshot for detailed review. Mocked API, no DB needed.
 * Run:  npx playwright test tests/e2e/walkthrough.spec.ts --project=mobile --project=desktop
 */

// On-demand visual review tool, not part of CI: run via `npm run walkthrough`.
test.skip(!process.env.WALKTHROUGH, "visual walkthrough — set WALKTHROUGH=1 to run");

const SHOT = (p: string, n: string) => `walkthrough-shots/${p}-${n}.png`;

async function settle(page: import("@playwright/test").Page, ms = 700) {
  await page.waitForTimeout(ms);
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("01 splash", async ({ page }, ti) => {
  await page.goto("/");
  await settle(page, 1500);
  await page.screenshot({ path: SHOT(ti.project.name, "01-splash"), fullPage: true });
});

test("02 profile picker", async ({ page }, ti) => {
  await page.addInitScript(() => localStorage.setItem("crochet-time-tutorial-v1:mummy", "completed"));
  await page.goto("/who");
  await settle(page);
  await page.screenshot({ path: SHOT(ti.project.name, "02-profile-picker"), fullPage: true });
});

test("03 tutorial overlay", async ({ page }, ti) => {
  await page.addInitScript(() => localStorage.setItem("crochet-time:profile", "larissa"));
  await page.goto("/home");
  await page.waitForTimeout(2200); // welcome appears after 1.2s
  await page.screenshot({ path: SHOT(ti.project.name, "03-tutorial-welcome"), fullPage: true });
});

const SIMPLE: { name: string; path: string }[] = [
  { name: "04-home", path: "/home" },
  { name: "05-create", path: "/create" },
  { name: "06-library", path: "/library" },
  { name: "07-search", path: "/search" },
  { name: "08-stash", path: "/stash" },
  { name: "09-favorites", path: "/favorites" },
  { name: "10-projects", path: "/projects" },
  { name: "11-yarn-recs", path: "/yarn" },
  { name: "12-community", path: "/community" },
  { name: "13-community-detail", path: "/community/c1" },
  { name: "14-community-submit", path: "/community/submit" },
  { name: "15-settings", path: "/settings" },
  { name: "16-viewer-overview", path: "/patterns/p1" },
  { name: "20-pattern-detail", path: "/patterns/p1/details" },
  { name: "21-progress", path: "/patterns/p1/progress" },
  { name: "22-photos", path: "/patterns/p1/photos" },
  { name: "23-stitch-counter-screen", path: "/patterns/p1/counter" },
];

for (const s of SIMPLE) {
  test(s.name, async ({ page, consoleErrors }, ti) => {
    await enterApp(page);
    await page.goto(s.path);
    await settle(page, 900);
    await page.screenshot({ path: SHOT(ti.project.name, s.name), fullPage: true });
    // Surface console errors in the report without failing the walkthrough.
    if (consoleErrors.length) console.log(`[${s.name}] console:`, consoleErrors.slice(0, 3));
  });
}

test("17 viewer pattern tab", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page);
  await page.getByRole("button", { name: /^Pattern$/i }).first().click();
  await settle(page);
  await page.screenshot({ path: SHOT(ti.project.name, "17-viewer-pattern-tab"), fullPage: true });
});

test("18 viewer notes tab", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page);
  await page.getByRole("button", { name: /Notes/i }).first().click();
  await settle(page);
  await page.screenshot({ path: SHOT(ti.project.name, "18-viewer-notes-tab"), fullPage: true });
});

test("19 follow mode", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page);
  await page.getByRole("button", { name: /^Pattern$/i }).first().click();
  await settle(page);
  await page.getByRole("button", { name: /Follow step-by-step/i }).click();
  await settle(page);
  await page.screenshot({ path: SHOT(ti.project.name, "19-follow-mode"), fullPage: true });
});

test("24 stitch counter modal", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page);
  await page.getByText(/Row Counter/i).first().click();
  await settle(page);
  await page.screenshot({ path: SHOT(ti.project.name, "24-stitch-counter-modal"), fullPage: true });
});

test("25 share confirm dialog", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page);
  await page.getByRole("button", { name: /Share/i }).first().click();
  await settle(page);
  await page.screenshot({ path: SHOT(ti.project.name, "25-share-confirm"), fullPage: true });
});

test("26 adapt panel", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page);
  const open = page.getByRole("button", { name: /Open ▼/i }).first();
  if (await open.isVisible().catch(() => false)) {
    await open.click();
    await settle(page);
  }
  await page.screenshot({ path: SHOT(ti.project.name, "26-adapt-panel"), fullPage: true });
});
