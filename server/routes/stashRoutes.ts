import type { Express, Request, Response } from "express";
import { stashService } from "../stashService";
import { stashItemSchema } from "../../shared/schema";
import { scanLabel } from "../api/scanLabel";
import { profileOf } from "../httpHelpers";

/** Stash (materials inventory) CRUD, notes, and the ball-band label scanner. */
export function registerStashRoutes(app: Express): void {
  app.get("/api/stash", async (req: Request, res: Response) => {
    try {
      const items = await stashService.getAllItems(profileOf(req));
      res.json(items);
    } catch (error) {
      console.error("Error getting stash items:", error);
      res.status(500).json({ message: "Failed to get stash items" });
    }
  });

  app.get("/api/stash/:id", async (req: Request, res: Response) => {
    try {
      const item = await stashService.getItem(req.params.id);

      if (!item) {
        return res.status(404).json({ message: "Stash item not found" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error getting stash item:", error);
      res.status(500).json({ message: "Failed to get stash item" });
    }
  });

  app.post("/api/stash", async (req: Request, res: Response) => {
    try {
      const result = stashItemSchema.omit({ id: true }).safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ message: "Invalid stash item data", errors: result.error.errors });
      }

      const item = await stashService.createItem(result.data, profileOf(req));
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating stash item:", error);
      res.status(500).json({ message: "Failed to create stash item" });
    }
  });

  app.put("/api/stash/:id", async (req: Request, res: Response) => {
    try {
      const result = stashItemSchema.partial().safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ message: "Invalid stash item data", errors: result.error.errors });
      }

      const updatedItem = await stashService.updateItem(req.params.id, result.data);

      if (!updatedItem) {
        return res.status(404).json({ message: "Stash item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating stash item:", error);
      res.status(500).json({ message: "Failed to update stash item" });
    }
  });

  app.delete("/api/stash/:id", async (req: Request, res: Response) => {
    try {
      const success = await stashService.deleteItem(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Stash item not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting stash item:", error);
      res.status(500).json({ message: "Failed to delete stash item" });
    }
  });

  app.get("/api/stash-notes", async (req: Request, res: Response) => {
    try {
      const notes = await stashService.getNotes(profileOf(req));
      res.json({ content: notes }); // Using content key for consistency
    } catch (error) {
      console.error("Error getting stash notes:", error);
      res.status(500).json({ message: "Failed to get stash notes" });
    }
  });

  app.put("/api/stash-notes", async (req: Request, res: Response) => {
    try {
      // Accept both content and notes for backwards compatibility
      const content = req.body.content || req.body.notes;

      if (typeof content !== 'string') {
        return res.status(400).json({ message: "Invalid notes data" });
      }

      const updatedNotes = await stashService.updateNotes(content, profileOf(req));
      res.json({ content: updatedNotes }); // Using content key for consistency
    } catch (error) {
      console.error("Error updating stash notes:", error);
      res.status(500).json({ message: "Failed to update stash notes" });
    }
  });

  // Yarn ball-band scanner: photo → pre-filled stash item.
  app.post("/api/stash/scan-label", async (req: Request, res: Response) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64 || typeof imageBase64 !== "string" || !imageBase64.startsWith("data:image/")) {
        return res.status(400).json({ message: "imageBase64 (data:image/… URL) is required" });
      }
      res.json(await scanLabel(imageBase64));
    } catch (error) {
      console.error("Label scan failed:", error);
      res.status(500).json({ message: (error as Error).message || "Could not read the label" });
    }
  });
}
