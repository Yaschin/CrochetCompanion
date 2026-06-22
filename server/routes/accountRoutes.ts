import type { Express, Request, Response } from "express";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { PROFILES } from "../../shared/profiles";
import { getMeta, setMeta } from "../ensureSchema";
import { profileOf } from "../httpHelpers";

/** Per-profile account bits: profiles list, activity/streak, up-next pin, gauge. */
export function registerAccountRoutes(app: Express): void {
  app.get("/api/profiles", (_req: Request, res: Response) => {
    res.json(PROFILES);
  });

  // ── Crochet-activity days (drives the streak; synced from localStorage) ─────
  app.get("/api/activity", async (req: Request, res: Response) => {
    try {
      const result = await db.execute(
        sql`SELECT day FROM activity_days WHERE "ownerId" = ${profileOf(req)} ORDER BY day`
      );
      res.json({ days: (result.rows ?? []).map((r) => (r as { day: string }).day) });
    } catch (error) {
      console.error("Error reading activity:", error);
      res.status(500).json({ message: "Failed to read activity" });
    }
  });

  app.post("/api/activity", async (req: Request, res: Response) => {
    try {
      // The client supplies its local YYYY-MM-DD days ("today" server-side would
      // be wrong across timezones).
      const days: string[] = Array.isArray(req.body?.days) ? req.body.days : [];
      const valid = days.filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(0, 400);
      const profile = profileOf(req);
      for (const day of valid) {
        await db.execute(
          sql`INSERT INTO activity_days ("ownerId", day) VALUES (${profile}, ${day})
              ON CONFLICT ("ownerId", day) DO NOTHING`
        );
      }
      res.json({ success: true, recorded: valid.length });
    } catch (error) {
      console.error("Error recording activity:", error);
      res.status(500).json({ message: "Failed to record activity" });
    }
  });

  // ── "Up next" — one pinned pattern per profile ──────────────────────────────
  app.get("/api/up-next", async (req: Request, res: Response) => {
    try {
      const patternId = await getMeta(`upnext:${profileOf(req)}`);
      res.json({ patternId: patternId || null });
    } catch (error) {
      res.status(500).json({ message: "Failed to read up-next" });
    }
  });

  app.put("/api/up-next", async (req: Request, res: Response) => {
    try {
      const parsed = z.object({ patternId: z.string().max(64).nullish() }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "patternId must be a string" });
      }
      const patternId = parsed.data.patternId ?? "";
      await setMeta(`upnext:${profileOf(req)}`, patternId);
      res.json({ success: true, patternId: patternId || null });
    } catch (error) {
      res.status(500).json({ message: "Failed to set up-next" });
    }
  });

  // ── Personal gauge (tension) per profile ───────────────────────────────────
  app.get("/api/gauge", async (req: Request, res: Response) => {
    try {
      const raw = await getMeta(`gauge:${profileOf(req)}`);
      res.json(raw ? JSON.parse(raw) : { stitches: null, rows: null });
    } catch (error) {
      res.status(500).json({ message: "Failed to read gauge" });
    }
  });

  app.put("/api/gauge", async (req: Request, res: Response) => {
    try {
      const num = z.union([z.number().positive().max(200), z.null()]);
      const parsed = z.object({ stitches: num.optional(), rows: num.optional() }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Gauge values must be a positive number up to 200, or null." });
      }
      const stitches = parsed.data.stitches ?? null;
      const rows = parsed.data.rows ?? null;
      await setMeta(`gauge:${profileOf(req)}`, JSON.stringify({ stitches, rows }));
      res.json({ stitches, rows });
    } catch (error) {
      res.status(500).json({ message: "Failed to save gauge" });
    }
  });
}
