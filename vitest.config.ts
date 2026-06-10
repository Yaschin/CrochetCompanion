import { defineConfig } from "vitest/config";
import path from "path";

// Standalone unit-test config (vite.config.ts roots the app in client/, which
// would hide tests/unit). Pure-logic tests only — UI is covered by Playwright.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
