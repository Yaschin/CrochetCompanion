import type { Express, Request, Response } from "express";
import { patternService } from "../patternService";
import { stashService } from "../stashService";
import { patternSchema, stashItemSchema } from "../../shared/schema";
import { profileOf } from "../httpHelpers";

/** Export / import all of a profile's data as a single JSON backup. */
export function registerBackupRoutes(app: Express): void {
  app.get("/api/export", async (req: Request, res: Response) => {
    try {
      const profile = profileOf(req);
      const [patterns, stash, stashNotesContent] = await Promise.all([
        patternService.getAllPatterns(profile),
        stashService.getAllItems(profile),
        stashService.getNotes(profile),
      ]);
      const payload = {
        app: "crochet-time",
        version: 2,
        profile,
        exportedAt: new Date().toISOString(),
        patterns,
        stash,
        stashNotes: stashNotesContent,
      };
      const date = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Disposition", `attachment; filename="crochet-time-backup-${profile}-${date}.json"`);
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error("Export failed:", error);
      res.status(500).json({ message: "Export failed" });
    }
  });

  // Additive restore: imported patterns/stash are created as new records
  // (never overwriting existing data), so re-importing is non-destructive.
  // v1 backups (pre-profiles) and v2 backups both import into the ACTIVE profile.
  app.post("/api/import", async (req: Request, res: Response) => {
    try {
      const profile = profileOf(req);
      const body = req.body ?? {};
      const patterns = Array.isArray(body.patterns) ? body.patterns : [];
      const stash = Array.isArray(body.stash) ? body.stash : [];
      let importedPatterns = 0;
      let importedStash = 0;
      let skippedPatterns = 0;
      let skippedStash = 0;

      // Validate each entry against the same schema POST /api/patterns uses, so
      // a corrupt row in a backup can't crash the whole restore or land malformed
      // data in the library. Invalid entries are skipped and reported, not
      // silently dropped. (zod strips the server-owned id/createdAt from real
      // backups, and tolerates their absence in hand-built imports.)
      const importPatternSchema = patternSchema.omit({ id: true, createdAt: true });
      for (const p of patterns) {
        const parsed = importPatternSchema.safeParse(p);
        if (parsed.success) {
          await patternService.createPattern(parsed.data, profile);
          importedPatterns++;
        } else {
          skippedPatterns++;
        }
      }

      for (const s of stash) {
        const result = stashItemSchema.omit({ id: true }).safeParse(s);
        if (result.success) {
          await stashService.createItem(result.data, profile);
          importedStash++;
        } else {
          skippedStash++;
        }
      }

      if (typeof body.stashNotes === "string" && body.stashNotes.trim()) {
        await stashService.updateNotes(body.stashNotes, profile);
      }

      res.json({ success: true, importedPatterns, importedStash, skippedPatterns, skippedStash });
    } catch (error) {
      console.error("Import failed:", error);
      res.status(500).json({ message: "Import failed" });
    }
  });
}
