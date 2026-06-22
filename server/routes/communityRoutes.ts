import type { Express, Request, Response } from "express";
import { z } from "zod";
import { communityService } from "../communityService";
import { makealongService } from "../makealongService";
import { insertCommunityPatternSchema } from "../../shared/schema";
import { profileById } from "../../shared/profiles";
import { uploadBuffer } from "../objectStorage";
import { profileOf } from "../httpHelpers";

/** Community gallery + family make-along board. */
export function registerCommunityRoutes(app: Express): void {
  app.get("/api/community", async (_req: Request, res: Response) => {
    const items = await communityService.getAll();
    res.json(items);
  });

  app.get("/api/community/:id", async (req: Request, res: Response) => {
    const item = await communityService.getById(req.params.id);
    if (!item) return res.status(404).json({ message: "Community pattern not found" });
    res.json(item);
  });

  app.post("/api/community", async (req: Request, res: Response) => {
    try {
      const parsed = insertCommunityPatternSchema.parse(req.body);

      // If a base64 data-URL image was supplied (standalone Share form), store it
      // durably; publish-from-library passes an existing /api/media URL through.
      if (parsed.endProductImage && parsed.endProductImage.startsWith("data:")) {
        const mimeMatch = parsed.endProductImage.match(/^data:(image\/\w+);base64,/);
        const contentType = mimeMatch ? mimeMatch[1] : "image/png";
        const base64 = parsed.endProductImage.replace(/^data:image\/\w+;base64,/, "");
        parsed.endProductImage = await uploadBuffer(Buffer.from(base64, "base64"), contentType);
      }

      // Stamp the real sharer — never trust the client-supplied creator.
      const sharer = profileById(profileOf(req));
      parsed.creator = sharer.name;
      parsed.creatorId = sharer.id;

      const created = await communityService.create(parsed);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid submission", errors: error.errors });
      }
      console.error("Error creating community pattern:", error);
      res.status(500).json({ message: "Failed to share pattern" });
    }
  });

  app.post("/api/community/:id/like", async (req: Request, res: Response) => {
    const likes = await communityService.incrementLikes(req.params.id);
    if (likes === undefined) return res.status(404).json({ message: "Community pattern not found" });
    res.json({ success: true, likes });
  });

  // ── Family make-alongs ──────────────────────────────────────────────────────
  app.get("/api/makealongs", async (_req: Request, res: Response) => {
    try {
      res.json(await makealongService.getAll());
    } catch (error) {
      console.error("Make-along list failed:", error);
      res.status(500).json({ message: "Failed to list make-alongs" });
    }
  });

  app.post("/api/makealongs", async (req: Request, res: Response) => {
    try {
      const { communityId } = req.body;
      if (!communityId || typeof communityId !== "string") {
        return res.status(400).json({ message: "communityId is required" });
      }
      res.status(201).json(await makealongService.create(communityId, profileOf(req)));
    } catch (error) {
      console.error("Make-along create failed:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to start make-along" });
    }
  });

  app.post("/api/makealongs/:id/join", async (req: Request, res: Response) => {
    try {
      await makealongService.join(req.params.id, profileOf(req));
      res.json(await makealongService.getById(req.params.id));
    } catch (error) {
      console.error("Make-along join failed:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to join make-along" });
    }
  });
}
