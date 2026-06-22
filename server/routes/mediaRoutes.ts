import type { Express, Request, Response } from "express";
import { streamObject } from "../objectStorage";

/** Serve stored media objects (images, imported PDFs) from object storage. */
export function registerMediaRoutes(app: Express): void {
  app.get("/api/media/:key", async (req: Request, res: Response) => {
    try {
      await streamObject(req.params.key, res);
    } catch (error) {
      console.error("Error serving media:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to serve media" });
      }
    }
  });
}
