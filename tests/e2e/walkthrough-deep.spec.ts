import { test, expect, mockApi, enterApp, PATTERNS } from "./helpers";
import type { Page, TestInfo } from "@playwright/test";

/**
 * DEEP interaction walkthrough — exercises every screen AND its interactions
 * (wizards, dialogs, toggles, counters, tutorial tour, celebration, offline),
 * capturing a screenshot at each meaningful state. On-demand only:
 *   npm run walkthrough:deep   (mobile + tablet)
 */
test.skip(!process.env.WALKTHROUGH, "deep walkthrough — set WALKTHROUGH=1 to run");

const SHOT = (ti: TestInfo, n: string) => `walkthrough-shots/${ti.project.name}-${n}.png`;
const settle = (page: Page, ms = 650) => page.waitForTimeout(ms);

async function snap(page: Page, ti: TestInfo, name: string) {
  await page.screenshot({ path: SHOT(ti, name), fullPage: true });
}

/** Fill if present; log a miss instead of failing the whole journey. */
async function tryFill(page: Page, loc: ReturnType<Page["locator"]>, value: string, what: string) {
  try {
    await loc.first().fill(value, { timeout: 4000 });
    return true;
  } catch {
    console.log(`MISS: could not fill ${what} @ ${page.url()}`);
    return false;
  }
}

/** Click if present; log a miss instead of failing the whole journey. */
async function tryClick(page: Page, loc: ReturnType<Page["locator"]>, what: string) {
  try {
    await loc.first().click({ timeout: 4000 });
    return true;
  } catch {
    console.log(`MISS: could not click ${what} @ ${page.url()}`);
    return false;
  }
}

/** Richer mocks on top of mockApi (later routes win): echo PUTs + diagnostics. */
async function deepMocks(page: Page) {
  await mockApi(page);
  await page.route("**/api/patterns/*", async (route) => {
    const req = route.request();
    if (req.method() === "PUT") {
      const body = req.postDataJSON?.() ?? {};
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...PATTERNS[0], ...body }),
      });
    }
    return route.fallback();
  });
  await page.route("**/api/diagnostics**", async (route) => {
    const deep = route.request().method() === "POST";
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: !deep,
        ranAt: new Date().toISOString(),
        checks: deep
          ? [
              { name: "Live text generation", ok: true, detail: 'Model responded ("ok").', ms: 812 },
              { name: "Live image generation", ok: false, detail: "OPENAI_API_KEY is not set — AI features are running on fallbacks.", ms: 45 },
            ]
          : [
              { name: "Database", ok: true, detail: "Connected — 14 patterns in the library.", ms: 38 },
              { name: "Object storage", ok: true, detail: "Write + read probe succeeded.", ms: 102 },
              { name: "OpenAI API key", ok: true, detail: "Key accepted by the OpenAI API.", ms: 240 },
            ],
      }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await deepMocks(page);
});

// ── J1: first run → pick Vumsh → switch profile ──────────────────────────────
test("J1 profile journey", async ({ page }, ti) => {
  await page.addInitScript(() => {
    localStorage.setItem("crochet-time-tutorial-v1:vumsh", "completed");
    localStorage.setItem("crochet-time-tutorial-v1:larissa", "completed");
  });
  await page.goto("/who");
  await settle(page);
  await tryClick(page, page.getByRole("button", { name: /Continue as Vumsh/i }), "Vumsh card");
  await settle(page, 1000);
  await snap(page, ti, "j1a-home-as-vumsh");
  await tryClick(page, page.getByRole("button", { name: /Switch profile/i }), "header avatar");
  await settle(page);
  await snap(page, ti, "j1b-picker-last-time-badge");
});

// ── J2: tutorial tour ─────────────────────────────────────────────────────────
test("J2 tutorial tour", async ({ page }, ti) => {
  await page.addInitScript(() => localStorage.setItem("crochet-time:profile", "larissa"));
  await page.goto("/home");
  await page.waitForTimeout(2200);
  await tryClick(page, page.getByRole("button", { name: /show me around/i }), "tour start");
  await settle(page);
  await snap(page, ti, "j2a-tour-step1");
  await tryClick(page, page.getByRole("button", { name: /^Next/i }), "tour next 1");
  await settle(page, 900);
  await snap(page, ti, "j2b-tour-step2");
  await tryClick(page, page.getByRole("button", { name: /^Next/i }), "tour next 2");
  await settle(page, 900);
  await snap(page, ti, "j2c-tour-step3");
});

// ── J3: create wizard, all modes ─────────────────────────────────────────────
test("J3 create wizard", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/create");
  await settle(page);
  await tryClick(page, page.getByText("Toys & Amigurumi"), "category");
  await tryClick(page, page.getByRole("button", { name: /Next →/i }), "next to details");
  await settle(page);
  await tryFill(page, page.locator("textarea"), "A tiny strawberry bunny with floppy ears", "wizard description");
  await tryClick(page, page.getByText(/^Beginner$/i), "skill chip");
  await settle(page);
  await snap(page, ti, "j3a-wizard-details");
  await tryClick(page, page.getByRole("button", { name: /Next →/i }), "next to yarn");
  await settle(page);
  await snap(page, ti, "j3b-wizard-yarn-colours");
  await tryClick(page, page.getByRole("button", { name: /Next →/i }), "next to inspiration");
  await settle(page);
  await snap(page, ti, "j3c-wizard-inspiration");
  await tryClick(page, page.getByRole("button", { name: /Review →/i }), "to review");
  await settle(page);
  await snap(page, ti, "j3d-wizard-review");
  await tryClick(page, page.getByRole("button", { name: /Add my own/i }), "own tab");
  await settle(page);
  await snap(page, ti, "j3e-add-my-own");
  await tryClick(page, page.getByRole("button", { name: /Import PDF/i }), "pdf tab");
  await settle(page);
  await snap(page, ti, "j3f-import-pdf");
});

// ── J4: library search/filter/sort/favorite ──────────────────────────────────
test("J4 library interactions", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/library");
  await settle(page);
  await page.getByPlaceholder(/Search patterns/i).first().fill("bunny");
  await settle(page);
  await snap(page, ti, "j4a-library-searched");
  await page.getByPlaceholder(/Search patterns/i).first().fill("");
  await tryClick(page, page.getByRole("button", { name: /Favorites/i }), "favorites-only");
  await settle(page);
  await snap(page, ti, "j4b-library-favorites-only");
});


// ── J6: stash add-material + notes ───────────────────────────────────────────
test("J6 stash interactions", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/stash");
  await settle(page);
  await tryClick(page, page.getByRole("button", { name: /Add material/i }), "add material");
  await settle(page);
  await snap(page, ti, "j6a-stash-add-form");
  await tryFill(page, page.locator("#m-name"), "Paintbox Cotton Aran", "material name");
  await snap(page, ti, "j6b-stash-form-filled");
  await page.keyboard.press("Escape");
  await settle(page);
  await tryFill(page, page.getByPlaceholder(/Wishlist/i), "Need more rose pink for the bunny nose", "stash notes");
  await tryClick(page, page.getByRole("button", { name: /Save notes/i }), "save notes");
  await settle(page);
  await snap(page, ti, "j6c-stash-notes-saved");
});

// ── J7: community filter / like / detail / submit wizard ─────────────────────
test("J7 community journey", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/community");
  await settle(page);
  await tryFill(page, page.getByPlaceholder(/Search community/i), "bee", "community search");
  await settle(page);
  await snap(page, ti, "j7a-community-searched");
  await tryFill(page, page.getByPlaceholder(/Search community/i), "", "community search clear");
  await settle(page);
  await tryClick(page, page.getByText("Bumblebee Amigurumi"), "community card");
  await settle(page);
  await tryClick(page, page.getByRole("button", { name: /Add to Library/i }), "add to library");
  await settle(page);
  await snap(page, ti, "j7b-detail-added-toast");
  await page.goto("/community/submit");
  await settle(page);
  await tryFill(page, page.locator("input").first(), "Granny Stripe Cushion", "share name");
  await tryClick(page, page.getByRole("button", { name: /Next: Photos/i }), "to photos");
  await settle(page);
  await snap(page, ti, "j7c-submit-photos-step");
  await tryClick(page, page.getByRole("button", { name: /Next: Pattern/i }), "to pattern");
  await settle(page);
  await tryFill(page, page.locator("textarea"), "Round 1: 6 sc in magic ring (6)\nRound 2: inc x6 (12)", "share pattern text");
  await tryClick(page, page.getByRole("button", { name: /Next: Review/i }), "to review");
  await settle(page);
  await snap(page, ti, "j7d-submit-review");
  await tryClick(page, page.getByRole("button", { name: /Submit Pattern/i }), "submit");
  await settle(page, 900);
  await snap(page, ti, "j7e-submit-done");
});

// ── J8: viewer overview — favorite, mark finished (celebration), image dialog ─
test("J8 viewer overview actions", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page, 900);
  await tryClick(page, page.getByRole("button", { name: /New Image/i }), "new image");
  await settle(page);
  await snap(page, ti, "j8a-image-dialog");
  await page.keyboard.press("Escape");
  await settle(page);
  await tryClick(page, page.getByRole("button", { name: /Mark finished/i }), "mark finished");
  await page.waitForTimeout(1200);
  await snap(page, ti, "j8b-finish-celebration");
});

// ── J9: pattern tab — steps, locks, regen panel, add step ────────────────────
test("J9 pattern tab interactions", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page, 900);
  await tryClick(page, page.getByRole("button", { name: /^Pattern$/i }), "pattern tab");
  await settle(page);
  await tryClick(page, page.getByText(/^Ears$/), "expand Ears");
  await settle(page);
  await snap(page, ti, "j9a-both-sections-open");
  await tryClick(page, page.getByRole("checkbox", { name: /Mark step complete/i }), "complete a step");
  await settle(page);
  await tryClick(page, page.getByLabel("Increase count").first(), "step count +");
  await tryClick(page, page.getByLabel("Increase count").first(), "step count + again");
  await settle(page);
  await snap(page, ti, "j9b-step-toggled-counted");
  await tryClick(page, page.getByLabel("Edit step").first(), "edit step");
  await settle(page);
  await snap(page, ti, "j9c-step-editing");
  await tryClick(page, page.getByLabel("Cancel edit").first(), "cancel edit");
  await tryClick(page, page.getByRole("button", { name: /Regenerate this section/i }), "section regen panel");
  await settle(page);
  await snap(page, ti, "j9d-section-regen-panel");
  await tryClick(page, page.getByRole("button", { name: /Add Step/i }), "add step");
  await settle(page);
  await snap(page, ti, "j9e-step-added");
});

// ── J10: notes typing + save ─────────────────────────────────────────────────
test("J10 notes save", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page, 900);
  await tryClick(page, page.getByRole("button", { name: /Notes/i }), "notes tab");
  await tryFill(page, page.locator("textarea"), "Use 3.25mm hook for tighter ears — mum's tip ♡", "viewer notes");
  await tryClick(page, page.getByRole("button", { name: /Save Notes/i }), "save notes");
  await settle(page, 900);
  await snap(page, ti, "j10-notes-saved");
});

// ── J11: follow mode advance/back/undo ───────────────────────────────────────
test("J11 follow mode flow", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page, 900);
  await tryClick(page, page.getByRole("button", { name: /^Pattern$/i }), "pattern tab");
  await tryClick(page, page.getByRole("button", { name: /Follow step-by-step/i }), "follow mode");
  await settle(page);
  await tryClick(page, page.getByRole("button", { name: /Done — next/i }), "done next");
  await settle(page);
  await snap(page, ti, "j11a-follow-advanced");
  await tryClick(page, page.getByLabel("Previous step"), "back");
  await settle(page);
  await snap(page, ti, "j11b-follow-back-done-state");
});

// ── J12: counter modal counting + target ─────────────────────────────────────
test("J12 counter modal counting", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page, 900);
  await tryClick(page, page.getByText(/Row Counter/i), "open counter");
  await settle(page);
  const big = page.getByRole("button", { name: /Add a stitch. Current count/i });
  await big.click();
  await big.click();
  await big.click();
  await tryFill(page, page.locator('input[type="number"]'), "5", "counter target");
  await settle(page);
  await snap(page, ti, "j12a-counter-3-of-5");
  await tryClick(page, page.getByRole("button", { name: /Next row/i }), "next row");
  await settle(page);
  await snap(page, ti, "j12b-counter-next-row");
});

// ── J13: full counter screen — rows, stitches, history, voice ────────────────
test("J13 counter screen", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1/counter");
  await settle(page, 900);
  await tryClick(page, page.getByRole("button", { name: /Tap to count a row/i }), "big row tap");
  await tryClick(page, page.getByRole("button", { name: /Tap to count a row/i }), "big row tap 2");
  const plus = page.locator("button:has(svg.lucide-plus)").last();
  await plus.click().catch(() => {});
  await plus.click().catch(() => {});
  await plus.click().catch(() => {});
  await tryClick(page, page.getByLabel(/Toggle activity history/i), "history toggle");
  await settle(page);
  await snap(page, ti, "j13a-counter-screen-history");
  await tryClick(page, page.getByLabel(/Toggle hands-free voice/i), "voice toggle");
  await settle(page);
  await snap(page, ti, "j13b-counter-voice-attempt");
});


// ── J15: settings — run checks, deep test, restart tour ──────────────────────
test("J15 settings diagnostics", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/settings");
  await settle(page);
  await tryClick(page, page.getByRole("button", { name: /Run checks/i }), "run checks");
  await settle(page, 900);
  await snap(page, ti, "j15a-diagnostics-green");
  await tryClick(page, page.getByRole("button", { name: /Deep AI test/i }), "deep test");
  await settle(page, 900);
  await snap(page, ti, "j15b-diagnostics-mixed");
  await tryClick(page, page.getByRole("button", { name: /Take the tour again/i }), "restart tour");
  await page.waitForTimeout(1800);
  await snap(page, ti, "j15c-tour-restarted");
});

// ── J16: offline banner ──────────────────────────────────────────────────────
test("J16 offline banner", async ({ page, context }, ti) => {
  await enterApp(page);
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await settle(page);
  await snap(page, ti, "j16-offline-banner");
  await context.setOffline(false);
});

// ── J17: viewer adapt + regenerate-all dialog ────────────────────────────────
test("J17 adapt and regen dialogs", async ({ page }, ti) => {
  await enterApp(page);
  await page.goto("/patterns/p1");
  await settle(page, 900);
  const open = page.getByRole("button", { name: /Open ▼/i });
  if (await open.first().isVisible().catch(() => false)) {
    await open.first().click();
    await settle(page);
    await tryFill(page, page.getByPlaceholder(/30% bigger/i), "about 30% bigger for a toddler", "adapt instruction");
    await tryClick(page, page.getByRole("button", { name: /Swap Yarn/i }), "swap yarn tab");
    await settle(page);
    await snap(page, ti, "j17a-adapt-filled");
  }
  await tryClick(page, page.getByRole("button", { name: /^Pattern$/i }), "pattern tab");
  await settle(page);
  await tryClick(page, page.getByRole("button", { name: /Regenerate All|Regenerate Pattern/i }), "regen all");
  await settle(page);
  await snap(page, ti, "j17b-regen-all-dialog");
});
