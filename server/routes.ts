import type { Express } from "express";
import { createServer, type Server } from "http";
import { communityService } from "./communityService";
import { seedStarterContentOnce } from "./seedLibrary";
import { seedLibraryImages } from "./seedLibraryImages";
import { seedProfilePatterns, seedProfileStash } from "./seedProfilePatterns";
import { ensureSchema } from "./ensureSchema";
import { requireAuth } from "./auth";
import { pushConfigured } from "./push";
import { runDueReminders } from "./reminders";
import { registerAuthRoutes } from "./routes/authRoutes";
import { registerPushRoutes } from "./routes/pushRoutes";
import { registerMediaRoutes } from "./routes/mediaRoutes";
import { registerAiRoutes } from "./routes/aiRoutes";
import { registerPatternRoutes } from "./routes/patternRoutes";
import { registerStashRoutes } from "./routes/stashRoutes";
import { registerCommunityRoutes } from "./routes/communityRoutes";
import { registerAccountRoutes } from "./routes/accountRoutes";
import { registerDiagnosticsRoutes } from "./routes/diagnosticsRoutes";
import { registerBackupRoutes } from "./routes/backupRoutes";

/**
 * Thin orchestrator: mounts the household gate, then each domain's routes, kicks
 * off the boot-time schema heal + seeds, and (optionally) the reminder loop.
 * The endpoints themselves live in ./routes/<domain>Routes.ts.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Household gate (no-op unless HOUSEHOLD_PASSCODE is set). Registered before
  // any route so it protects every /api/* endpoint except /api/auth/*.
  app.use(requireAuth);

  registerAuthRoutes(app);
  registerPushRoutes(app);

  // Apply idempotent schema/data heals, then run the one-time seeds and
  // resume background image generation for any library patterns missing images.
  ensureSchema()
    .then(() => {
      communityService.seedIfEmpty().catch((e: unknown) => console.error("Community seed failed:", e));
      seedStarterContentOnce()
        .then(() => seedProfilePatterns())
        .then(() => seedProfileStash())
        .then(() => seedLibraryImages())
        .catch((e: unknown) => console.error("Library/stash seed failed:", e));
    })
    .catch((e: unknown) => console.error("Schema ensure failed:", e));

  registerMediaRoutes(app);
  registerAiRoutes(app);
  registerPatternRoutes(app);
  registerStashRoutes(app);
  registerCommunityRoutes(app);
  registerAccountRoutes(app);
  registerDiagnosticsRoutes(app);
  registerBackupRoutes(app);

  // Optional in-process reminder loop for always-on hosts. Off by default;
  // autoscale deployments should drive POST /api/push/run-due via external cron
  // instead (the process may be asleep when a reminder is due).
  if (process.env.ENABLE_REMINDER_LOOP === "1" && pushConfigured()) {
    const everyMs = 10 * 60 * 1000;
    setInterval(() => {
      runDueReminders().catch((e) => console.error("[reminders] loop failed:", e));
    }, everyMs).unref();
    console.log("[reminders] in-process loop enabled (every 10m)");
  }

  const httpServer = createServer(app);
  return httpServer;
}
