import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePattern } from "./api/generatePattern";
import { generateImage } from "./api/generateImage";
import { patternService } from "./patternService";
import { patternSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate pattern endpoint
  app.post("/api/generate-pattern", async (req: Request, res: Response) => {
    try {
      const { prompt, projectType, skillLevel, yarnType, size } = req.body;
      
      if (!prompt || !projectType || !skillLevel) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const generatedPattern = await generatePattern({
        prompt,
        projectType,
        skillLevel,
        yarnType,
        size
      });

      res.json(generatedPattern);
    } catch (error) {
      console.error("Error in generate-pattern endpoint:", error);
      res.status(500).json({ message: "Failed to generate pattern", error: (error as Error).message });
    }
  });

  // Generate image endpoint
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, type, projectType, yarnType } = req.body;
      
      if (!prompt || !type) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const imageUrl = await generateImage({ prompt, type, projectType, yarnType });
      res.json({ url: imageUrl });
    } catch (error) {
      console.error("Error in generate-image endpoint:", error);
      res.status(500).json({ message: "Failed to generate image", error: (error as Error).message });
    }
  });

  // Pattern CRUD endpoints
  app.post("/api/patterns", async (req: Request, res: Response) => {
    try {
      const result = patternSchema.omit({ id: true, createdAt: true }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid pattern data", errors: result.error.errors });
      }
      
      const pattern = await patternService.createPattern(result.data);
      res.status(201).json(pattern);
    } catch (error) {
      console.error("Error creating pattern:", error);
      res.status(500).json({ message: "Failed to create pattern", error: (error as Error).message });
    }
  });

  app.get("/api/patterns", async (_req: Request, res: Response) => {
    try {
      const patterns = await patternService.getAllPatterns();
      res.json(patterns);
    } catch (error) {
      console.error("Error getting patterns:", error);
      res.status(500).json({ message: "Failed to get patterns", error: (error as Error).message });
    }
  });

  app.get("/api/patterns/:id", async (req: Request, res: Response) => {
    try {
      const pattern = await patternService.getPattern(req.params.id);
      
      if (!pattern) {
        return res.status(404).json({ message: "Pattern not found" });
      }
      
      res.json(pattern);
    } catch (error) {
      console.error("Error getting pattern:", error);
      res.status(500).json({ message: "Failed to get pattern", error: (error as Error).message });
    }
  });

  app.put("/api/patterns/:id", async (req: Request, res: Response) => {
    try {
      const result = patternSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid pattern data", errors: result.error.errors });
      }
      
      const updatedPattern = await patternService.updatePattern(req.params.id, result.data);
      
      if (!updatedPattern) {
        return res.status(404).json({ message: "Pattern not found" });
      }
      
      res.json(updatedPattern);
    } catch (error) {
      console.error("Error updating pattern:", error);
      res.status(500).json({ message: "Failed to update pattern", error: (error as Error).message });
    }
  });

  app.delete("/api/patterns/:id", async (req: Request, res: Response) => {
    try {
      const success = await patternService.deletePattern(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Pattern not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting pattern:", error);
      res.status(500).json({ message: "Failed to delete pattern", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
