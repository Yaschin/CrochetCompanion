import type { Express, Request, Response } from "express";
import { runQuickDiagnostics, runDeepDiagnostics } from "../diagnostics";

/** Settings → App health self-diagnostics. */
export function registerDiagnosticsRoutes(app: Express): void {
  // Quick: DB, object storage, OpenAI key + model availability (no generation).
  app.get("/api/diagnostics", async (_req: Request, res: Response) => {
    try {
      res.json(await runQuickDiagnostics());
    } catch (error) {
      console.error("Diagnostics failed:", error);
      res.status(500).json({ message: "Diagnostics failed" });
    }
  });

  // Deep: one tiny live text generation + one live image generation (costs a
  // small amount of API credit; user-initiated from Settings only).
  app.post("/api/diagnostics/deep", async (_req: Request, res: Response) => {
    try {
      res.json(await runDeepDiagnostics());
    } catch (error) {
      console.error("Deep diagnostics failed:", error);
      res.status(500).json({ message: "Deep diagnostics failed" });
    }
  });
}
