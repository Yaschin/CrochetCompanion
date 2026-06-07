import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Crochet Time.
 *
 * The suite is **frontend-only**: every `/api/*` request is mocked in the tests
 * (see `tests/e2e/helpers.ts`), so NO database, OpenAI key, or Express backend is
 * required. It builds the client and serves it with `vite preview`.
 *
 * Run:
 *   npm run test:e2e:install   # one-time: install Playwright browsers
 *   npm run test:e2e           # build client, serve, run across 3 viewports
 *
 * To run against an already-running server instead of building, set E2E_BASE_URL,
 * e.g. E2E_BASE_URL=http://localhost:5000 npm run test:e2e
 */
const PORT = 4173;
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },

  // Skip the built-in server when pointing at an external URL.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run preview:e2e",
        url: BASE_URL,
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
      },

  // Larissa crochets phone-in-hand, so mobile is first. Tablet 768 = the `md`
  // breakpoint (sidebar appears); desktop exercises the right-panel layout.
  projects: [
    { name: "mobile",  use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
    { name: "tablet",  use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
