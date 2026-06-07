import { test as base, expect, type Page } from "@playwright/test";

/**
 * Shared E2E helpers: API mocking (so no DB is needed), splash entry,
 * viewport-aware navigation, and layout/console assertions.
 */

// ── Mock data ────────────────────────────────────────────────────────────────
const steps = (texts: string[]) =>
  texts.map((text, i) => ({
    id: i + 1, text, locked: i === 0, count: 0, notes: "", photo: null, completed: i === 0,
  }));

export const PATTERNS = [
  {
    id: "p1",
    title: "Cuddle Bunny",
    description: "A soft amigurumi bunny with long floppy ears.",
    projectType: "Toy",
    skillLevel: "Intermediate",
    yarnType: "Worsted",
    size: "20cm",
    endProductImage: "",
    materialsNotes: "",
    createdAt: new Date().toISOString(),
    sections: [
      { name: "Head", notes: "", locked: false, steps: steps(["Rnd 1: 6 sc in MR (6)", "Rnd 2: inc x6 (12)", "Rnd 3: (sc, inc) x6 (18)"]) },
      { name: "Ears", notes: "", locked: false, steps: steps(["Make 2", "Ch 10, sc back along chain"]) },
    ],
    yarnRequirements: [{ color: "Cream", volume: "~50g" }],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [{ name: "Safety eyes", description: "8mm black", quantity: 2 }],
    toolRequirements: [{ name: "Tapestry needle" }],
    needsStuffing: "Polyester fiberfill",
    favorite: true,
    status: "active",
    startedAt: new Date().toISOString(),
    finishedAt: null,
  },
  {
    id: "p2",
    title: "Sunny Coaster",
    description: "A cheerful sunflower coaster.",
    projectType: "Home Decor",
    skillLevel: "Easy",
    yarnType: "Cotton",
    size: "10cm",
    endProductImage: "",
    materialsNotes: "",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sections: [{ name: "Center", notes: "", locked: false, steps: steps(["Rnd 1: 6 sc in MR (6)", "Rnd 2: inc x6 (12)"]) }],
    yarnRequirements: [{ color: "Yellow", volume: "~20g" }],
    hookRequirements: [{ size: "3.0mm", quantity: 1 }],
    notionsRequirements: [],
    toolRequirements: [],
    needsStuffing: "",
    favorite: false,
    status: "finished",
    startedAt: new Date(Date.now() - 172800000).toISOString(),
    finishedAt: new Date().toISOString(),
  },
];

export const COMMUNITY = [
  {
    id: "c1",
    title: "Bumblebee Amigurumi",
    creator: "HookedByHana",
    projectType: "Toy",
    skillLevel: "Intermediate",
    description: "A plump little bee with stripes and tiny wings.",
    endProductImage: "",
    yarnType: "Worsted",
    size: "12cm",
    sections: [{ name: "Body", notes: "", locked: false, steps: steps(["Rnd 1: 6 sc in MR (6)", "Rnd 2: inc x6 (12)"]) }],
    yarnRequirements: [{ color: "Yellow", volume: "~40g" }],
    hookRequirements: [{ size: "3.0mm", quantity: 1 }],
    notionsRequirements: [],
    toolRequirements: [],
    needsStuffing: "Fiberfill",
    likes: 128,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c2",
    title: "Sunflower Coaster",
    creator: "CozyCrops",
    projectType: "Home Decor",
    skillLevel: "Easy",
    description: "A quick, satisfying sunflower coaster.",
    endProductImage: "",
    yarnType: "Cotton",
    size: "10cm",
    sections: [{ name: "Center", notes: "", locked: false, steps: steps(["Rnd 1: 6 sc in MR (6)"]) }],
    yarnRequirements: [{ color: "Gold", volume: "~20g" }],
    hookRequirements: [],
    notionsRequirements: [],
    toolRequirements: [],
    needsStuffing: "",
    likes: 64,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// 1x1 transparent PNG so mocked image requests never error.
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/** Intercept every /api/** call and serve fixtures — removes the DB/backend dependency. */
export async function mockApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });

    if (path.startsWith("/api/media/")) {
      return route.fulfill({ status: 200, contentType: "image/png", body: TRANSPARENT_PNG });
    }
    if (path === "/api/patterns" && method === "GET") return json(PATTERNS);
    if (path === "/api/patterns" && method === "POST") return json({ ...PATTERNS[0], id: "p-new" }, 201);
    if (/^\/api\/patterns\/[^/]+$/.test(path) && method === "GET") return json(PATTERNS[0]);
    if (/^\/api\/patterns\/[^/]+$/.test(path)) return json(PATTERNS[0]); // PUT/DELETE
    if (/\/regenerate$/.test(path)) return json({ success: true, pattern: PATTERNS[0] });
    if (/\/alignment-check$/.test(path)) return json({ success: true, alignmentScore: 82, feedback: "Good match." });
    if (/\/(photo|image|product-image)$/.test(path)) return json({ success: true, photoUrl: "/api/media/x", imageUrl: "/api/media/x", pattern: PATTERNS[0] });
    if (path === "/api/community" && method === "GET") return json(COMMUNITY);
    if (path === "/api/community" && method === "POST") return json({ ...COMMUNITY[0], id: "c-new" }, 201);
    if (/^\/api\/community\/[^/]+\/like$/.test(path)) return json({ success: true, likes: 200 });
    if (/^\/api\/community\/[^/]+$/.test(path)) return json(COMMUNITY[0]);
    if (path === "/api/stash") return method === "GET" ? json([]) : json({ success: true });
    if (path === "/api/stash-notes") return json({ content: "" });
    if (path === "/api/characters") return json({});
    if (path === "/api/generate-pattern") return json(PATTERNS[0]);
    if (path === "/api/generate-image") return json({ url: "/api/media/x" });

    // Safe fallbacks
    if (method === "GET") return json([]);
    return json({ success: true });
  });
}

/** Load the app and get past the animated splash screen into the workbench. */
export async function enterApp(page: Page) {
  await page.goto("/");
  const enter = page.getByRole("button", { name: /Enter Your Studio|Get Started|Skip/i }).first();
  try {
    await enter.click({ timeout: 8000 });
  } catch {
    // Splash auto-advances on timers; wait for the CTA then click.
    await page.waitForTimeout(4500);
    await page.getByRole("button", { name: /Enter Your Studio/i }).first().click({ timeout: 6000 });
  }
  // App shell is ready once a nav control is visible.
  await page.getByRole("button", { name: /Library/i }).first().waitFor({ state: "visible", timeout: 12000 });
}

/**
 * Click a nav control by accessible name, tolerant of the two nav systems:
 * bottom bar (mobile: "Create") vs sidebar (desktop: "AI Studio"). Pass all
 * acceptable labels; the first visible match is clicked.
 */
export async function navByLabel(page: Page, labels: string[]) {
  for (const label of labels) {
    const cands = page.getByRole("button", { name: label });
    const n = await cands.count();
    for (let i = 0; i < n; i++) {
      const c = cands.nth(i);
      if (await c.isVisible()) {
        await c.click();
        await page.waitForTimeout(350); // let the view transition settle
        return;
      }
    }
  }
  throw new Error(`No visible nav control for: ${labels.join(" / ")}`);
}

/** Assert the document has no horizontal overflow at the current viewport. */
export async function expectNoHorizontalOverflow(page: Page) {
  const info = await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const overflow = Math.max(0, document.documentElement.scrollWidth - docW);
    const offenders: { tag: string; cls: string; w: number; right: number }[] = [];
    if (overflow > 2) {
      document.querySelectorAll("*").forEach((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.right > docW + 2 || r.width > docW + 2) {
          offenders.push({
            tag: el.tagName,
            cls: (el.getAttribute("class") || "").slice(0, 90),
            w: Math.round(r.width),
            right: Math.round(r.right),
          });
        }
      });
    }
    return { overflow, docW, offenders: offenders.slice(0, 8) };
  });
  expect(
    info.overflow,
    `horizontal overflow ${info.overflow}px (viewport ${info.docW}px). Offenders: ${JSON.stringify(info.offenders)}`,
  ).toBeLessThanOrEqual(2);
}

/** Console errors that are environmental noise rather than app bugs. */
export function realConsoleErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/favicon/i.test(e) &&
      !/Failed to load resource/i.test(e) &&
      !/net::ERR/i.test(e) &&
      !/ERR_/i.test(e) &&
      !/Download the React DevTools/i.test(e),
  );
}

// Extended test that captures console + page errors for every test.
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(String(err)));
    await use(errors);
  },
});

export { expect };
