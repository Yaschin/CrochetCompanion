import {
  test,
  expect,
  mockApi,
  enterApp,
  navByLabel,
  expectNoHorizontalOverflow,
  realConsoleErrors,
} from "./helpers";

/**
 * Cross-screen, cross-viewport smoke + layout suite.
 *
 * Runs under three projects (mobile 390 / tablet 768 / desktop 1440 — see
 * playwright.config.ts). For every screen it checks:
 *   • the screen actually renders (a known element is visible),
 *   • there is no horizontal overflow at that viewport,
 *   • no real (non-environmental) console/page errors fired,
 * and saves a full-page screenshot for visual responsive review.
 */

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

async function snap(page: import("@playwright/test").Page, testInfo: import("@playwright/test").TestInfo, name: string) {
  await page.waitForTimeout(400); // allow view/Framer transition to settle
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-${name}.png`,
    fullPage: true,
  });
}

// ── Splash ────────────────────────────────────────────────────────────────────
test("splash renders and enters the app", async ({ page, consoleErrors }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Enter Your Studio|Get Started|Skip/i }).first()).toBeVisible({ timeout: 8000 });
  await snap(page, testInfo, "splash");
  await enterApp(page);
  await expect(page.getByRole("button", { name: /Library/i }).first()).toBeVisible();
  expect(realConsoleErrors(consoleErrors)).toEqual([]);
});

// ── Family profile picker (first run, no stored profile) ─────────────────────
test("first run shows the profile picker and entering as Mummy personalises home", async ({ page, consoleErrors }, testInfo) => {
  await page.goto("/");
  const enter = page.getByRole("button", { name: /Enter Your Studio|Get Started|Skip/i }).first();
  try {
    await enter.click({ timeout: 8000 });
  } catch {
    await page.waitForTimeout(4500);
    await page.getByRole("button", { name: /Enter Your Studio/i }).first().click({ timeout: 6000 });
  }
  await expect(page.getByText(/Who's crocheting today/i)).toBeVisible({ timeout: 8000 });
  await snap(page, testInfo, "profile-picker");
  await page.getByRole("button", { name: /Continue as Mummy/i }).click();
  await expect(page.getByText(/Mummy!/).first()).toBeVisible({ timeout: 8000 });
  expect(realConsoleErrors(consoleErrors)).toEqual([]);
});

// ── Primary nav screens ─────────────────────────────────────────────────────────
const PRIMARY: { name: string; labels?: string[]; expectText: RegExp }[] = [
  { name: "home", expectText: /Crochet|Larissa|Continue|Create|Favourites|Favorites/i },
  { name: "create", labels: ["Create", "AI Studio"], expectText: /pattern|create|describe|generate|step/i },
  { name: "library", labels: ["Library"], expectText: /Librar|pattern|Favorites|Search/i },
  { name: "favorites", labels: ["Favorites"], expectText: /Favorites/i },
  { name: "projects", labels: ["Projects"], expectText: /Project/i },
];

for (const screen of PRIMARY) {
  test(`${screen.name} renders cleanly`, async ({ page, consoleErrors }, testInfo) => {
    await enterApp(page);
    if (screen.labels) await navByLabel(page, screen.labels);
    // Scope to <main> so the always-in-DOM (mobile-hidden) Sidebar isn't matched.
    await expect(page.locator("main").getByText(screen.expectText).first()).toBeVisible({ timeout: 10000 });
    await snap(page, testInfo, screen.name);
    expect(realConsoleErrors(consoleErrors)).toEqual([]);
  });
}

// ── Community (sidebar on md+, via Favorites CTA on mobile) ──────────────────────
test("community gallery renders cleanly", async ({ page, consoleErrors }, testInfo) => {
  await enterApp(page);
  // Sidebar exposes "Community Library" directly (tablet/desktop).
  try {
    await navByLabel(page, ["Community Library", "Community"]);
  } catch {
    // Mobile: reach Community via the Favorites screen CTA.
    await navByLabel(page, ["Favorites"]);
    await page.getByRole("button", { name: /Community Library/i }).first().click();
    await page.waitForTimeout(350);
  }
  await expect(page.locator("main").getByText(/Community Library/i).first()).toBeVisible({ timeout: 10000 });
  await snap(page, testInfo, "community");
  expect(realConsoleErrors(consoleErrors)).toEqual([]);
});

test("community detail renders from a card", async ({ page, consoleErrors }, testInfo) => {
  await enterApp(page);
  try {
    await navByLabel(page, ["Community Library", "Community"]);
  } catch {
    await navByLabel(page, ["Favorites"]);
    await page.getByRole("button", { name: /Community Library/i }).first().click();
    await page.waitForTimeout(350);
  }
  await page.getByText("Bumblebee Amigurumi").first().click();
  await expect(page.getByText(/Pattern Detail/i).first()).toBeVisible({ timeout: 10000 });
  await snap(page, testInfo, "community-detail");
  expect(realConsoleErrors(consoleErrors)).toEqual([]);
});

test("community submit wizard renders", async ({ page, consoleErrors }, testInfo) => {
  await enterApp(page);
  try {
    await navByLabel(page, ["Community Library", "Community"]);
  } catch {
    await navByLabel(page, ["Favorites"]);
    await page.getByRole("button", { name: /Community Library/i }).first().click();
    await page.waitForTimeout(350);
  }
  await page.getByRole("button", { name: /Share Pattern/i }).first().click();
  await expect(page.getByText(/Share Your Pattern/i).first()).toBeVisible({ timeout: 10000 });
  await snap(page, testInfo, "community-submit");
  expect(realConsoleErrors(consoleErrors)).toEqual([]);
});

// ── Pattern viewer + sub-screens (reached from the Library) ──────────────────────
test("pattern viewer renders from the library", async ({ page, consoleErrors }, testInfo) => {
  await enterApp(page);
  await navByLabel(page, ["Library"]);
  await page.getByText("Cuddle Bunny").first().click();
  await expect(page.getByRole("button", { name: /Overview/i }).first()).toBeVisible({ timeout: 10000 });
  await snap(page, testInfo, "viewer");
  expect(realConsoleErrors(consoleErrors)).toEqual([]);
});

test("pattern viewer lifecycle + tabs work", async ({ page }, testInfo) => {
  await enterApp(page);
  await navByLabel(page, ["Library"]);
  await page.getByText("Cuddle Bunny").first().click();
  // Tab switches
  await page.getByRole("button", { name: /^Pattern$/i }).first().click();
  await expect(page.getByText(/Head|Ears/).first()).toBeVisible();
  await snap(page, testInfo, "viewer-pattern-tab");
  await page.getByRole("button", { name: /Notes/i }).first().click();
  await page.getByRole("button", { name: /Overview/i }).first().click();
});

test("stitch counter modal opens from the viewer", async ({ page, consoleErrors }, testInfo) => {
  await enterApp(page);
  await navByLabel(page, ["Library"]);
  await page.getByText("Cuddle Bunny").first().click();
  await page.getByText(/Row Counter/i).first().click();
  await page.waitForTimeout(400);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-stitch-counter.png`, fullPage: true });
  expect(realConsoleErrors(consoleErrors)).toEqual([]);
});

test("pattern detail screen renders from the viewer", async ({ page, consoleErrors }, testInfo) => {
  await enterApp(page);
  await navByLabel(page, ["Library"]);
  await page.getByText("Cuddle Bunny").first().click();
  await page.getByRole("button", { name: /Details/i }).first().click();
  await page.waitForTimeout(400);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-pattern-detail.png`, fullPage: true });
  expect(realConsoleErrors(consoleErrors)).toEqual([]);
});
