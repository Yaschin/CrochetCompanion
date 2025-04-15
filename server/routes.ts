import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import * as fs from 'fs';
import { storage } from "./storage";
import { generatePattern } from "./api/generatePattern";
import { generateImage } from "./api/generateImage";
import { patternService } from "./patternService";
import { stashService } from "./stashService";
import { projectEventService } from "./projectEventService";
import { patternSchema, stashItemSchema, projectEventSchema } from "../shared/schema";
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
      const { prompt, type, projectType, yarnType, partName } = req.body;
      
      if (!prompt || !type) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const imageUrl = await generateImage({ prompt, type, projectType, yarnType, partName });
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

  // Generate main product image for a pattern
  app.post("/api/patterns/:patternId/product-image", async (req: Request, res: Response) => {
    try {
      const { patternId } = req.params;
      const { refinements } = req.body;
      
      // Get the pattern
      const pattern = await patternService.getPattern(patternId);
      if (!pattern) {
        return res.status(404).json({ message: "Pattern not found" });
      }
      
      // Create a base prompt from the pattern title and additional refinements
      let prompt = pattern.title;
      if (refinements) {
        prompt += `. ${refinements}`;
      }
      
      // Get yarn colors for additional context
      const colors = pattern.yarnRequirements && pattern.yarnRequirements.length > 0
        ? ` using these colors: ${pattern.yarnRequirements.map((req: any) => req.color).join(", ")}`
        : '';
      
      const imageUrl = await generateImage({
        prompt: prompt + colors,
        type: 'final',
        projectType: pattern.projectType,
        yarnType: pattern.yarnType
      });
      
      // Update the pattern with the new image URL
      if (imageUrl) {
        const updatedPattern = await patternService.updatePattern(patternId, {
          endProductImage: imageUrl
        });
        
        return res.json({ success: true, imageUrl, pattern: updatedPattern });
      }
      
      res.status(500).json({ message: "Failed to generate product image" });
    } catch (error) {
      console.error("Error generating product image:", error);
      res.status(500).json({ 
        message: "Failed to generate product image", 
        error: (error as Error).message 
      });
    }
  });

  // Generate image for a specific pattern section
  app.post("/api/patterns/:patternId/sections/:sectionIndex/image", async (req: Request, res: Response) => {
    try {
      const { patternId, sectionIndex } = req.params;
      const { refinements } = req.body;
      const sectionIdx = parseInt(sectionIndex, 10);
      
      if (isNaN(sectionIdx)) {
        return res.status(400).json({ message: "Invalid section index" });
      }
      
      // Get the pattern
      const pattern = await patternService.getPattern(patternId);
      if (!pattern) {
        return res.status(404).json({ message: "Pattern not found" });
      }
      
      // Get the section
      const section = pattern.sections[sectionIdx];
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      // Generate image for the section
      let prompt = `A detailed illustration of the ${section.name.toLowerCase()} part of a crocheted ${pattern.projectType}`;
      if (refinements) {
        prompt += `. ${refinements}`;
      }
      
      const colors = pattern.yarnRequirements && pattern.yarnRequirements.length > 0
        ? ` using these colors: ${pattern.yarnRequirements.map((req: any) => req.color).join(", ")}`
        : '';
      
      const imageUrl = await generateImage({
        prompt: prompt + colors,
        type: 'part',
        projectType: pattern.projectType,
        partName: section.name
      });
      
      // Update the pattern with the new image URL
      if (imageUrl) {
        const updatedSection = { ...section, partImageUrl: imageUrl };
        const updatedSections = [...pattern.sections];
        updatedSections[sectionIdx] = updatedSection;
        
        const updatedPattern = await patternService.updatePattern(patternId, {
          sections: updatedSections
        });
        
        return res.json({ success: true, imageUrl, pattern: updatedPattern });
      }
      
      res.status(500).json({ message: "Failed to generate image" });
    } catch (error) {
      console.error("Error generating section image:", error);
      res.status(500).json({ 
        message: "Failed to generate section image", 
        error: (error as Error).message 
      });
    }
  });

  // Stash CRUD endpoints
  app.get("/api/stash", async (_req: Request, res: Response) => {
    try {
      const items = await stashService.getAllItems();
      res.json(items);
    } catch (error) {
      console.error("Error getting stash items:", error);
      res.status(500).json({ message: "Failed to get stash items", error: (error as Error).message });
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
      res.status(500).json({ message: "Failed to get stash item", error: (error as Error).message });
    }
  });

  app.post("/api/stash", async (req: Request, res: Response) => {
    try {
      const result = stashItemSchema.omit({ id: true }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid stash item data", errors: result.error.errors });
      }
      
      const item = await stashService.createItem(result.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating stash item:", error);
      res.status(500).json({ message: "Failed to create stash item", error: (error as Error).message });
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
      res.status(500).json({ message: "Failed to update stash item", error: (error as Error).message });
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
      res.status(500).json({ message: "Failed to delete stash item", error: (error as Error).message });
    }
  });

  // Stash notes endpoints
  app.get("/api/stash-notes", async (_req: Request, res: Response) => {
    try {
      const notes = await stashService.getNotes();
      res.json({ content: notes }); // Using content key for consistency
    } catch (error) {
      console.error("Error getting stash notes:", error);
      res.status(500).json({ message: "Failed to get stash notes", error: (error as Error).message });
    }
  });

  app.put("/api/stash-notes", async (req: Request, res: Response) => {
    try {
      // Accept both content and notes for backwards compatibility
      const content = req.body.content || req.body.notes;
      
      if (typeof content !== 'string') {
        return res.status(400).json({ message: "Invalid notes data" });
      }
      
      const updatedNotes = await stashService.updateNotes(content);
      res.json({ content: updatedNotes }); // Using content key for consistency
    } catch (error) {
      console.error("Error updating stash notes:", error);
      res.status(500).json({ message: "Failed to update stash notes", error: (error as Error).message });
    }
  });

  // Project Events CRUD endpoints
  app.get("/api/project-events", async (_req: Request, res: Response) => {
    try {
      const events = await projectEventService.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error getting project events:", error);
      res.status(500).json({ message: "Failed to get project events", error: (error as Error).message });
    }
  });

  app.get("/api/project-events/:id", async (req: Request, res: Response) => {
    try {
      const event = await projectEventService.getEvent(req.params.id);
      
      if (!event) {
        return res.status(404).json({ message: "Project event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error getting project event:", error);
      res.status(500).json({ message: "Failed to get project event", error: (error as Error).message });
    }
  });

  app.post("/api/project-events", async (req: Request, res: Response) => {
    try {
      const result = projectEventSchema.omit({ id: true, createdAt: true, updatedAt: true }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid project event data", errors: result.error.errors });
      }
      
      const event = await projectEventService.createEvent(result.data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating project event:", error);
      res.status(500).json({ message: "Failed to create project event", error: (error as Error).message });
    }
  });

  app.put("/api/project-events/:id", async (req: Request, res: Response) => {
    try {
      const result = projectEventSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid project event data", errors: result.error.errors });
      }
      
      const updatedEvent = await projectEventService.updateEvent(req.params.id, result.data);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Project event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating project event:", error);
      res.status(500).json({ message: "Failed to update project event", error: (error as Error).message });
    }
  });

  app.delete("/api/project-events/:id", async (req: Request, res: Response) => {
    try {
      const success = await projectEventService.deleteEvent(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Project event not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting project event:", error);
      res.status(500).json({ message: "Failed to delete project event", error: (error as Error).message });
    }
  });

  // Add endpoint for uploading step photos
  app.post("/api/patterns/:patternId/sections/:sectionIndex/steps/:stepIndex/photo", async (req: Request, res: Response) => {
    try {
      const { patternId, sectionIndex, stepIndex } = req.params;
      const sectionIdx = parseInt(sectionIndex, 10);
      const stepIdx = parseInt(stepIndex, 10);
      
      if (isNaN(sectionIdx) || isNaN(stepIdx)) {
        return res.status(400).json({ message: "Invalid section or step index" });
      }
      
      // Get the pattern
      const pattern = await patternService.getPattern(patternId);
      if (!pattern) {
        return res.status(404).json({ message: "Pattern not found" });
      }
      
      // Get the section
      const section = pattern.sections[sectionIdx];
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      
      // Get the step
      const step = section.steps[stepIdx];
      if (!step) {
        return res.status(404).json({ message: "Step not found" });
      }

      if (!req.body.photo) {
        return res.status(400).json({ message: "Photo data is required" });
      }

      // Process the base64 encoded photo data
      const photoData = req.body.photo;
      
      // Create a unique filename based on pattern ID, section and step
      const fileName = `${patternId}_section${sectionIdx}_step${stepIdx}_${Date.now().toString()}.png`;
      const filePath = `/uploads/${fileName}`;
      
      // Extract the base64 data from the data URL
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
      const dataBuffer = Buffer.from(base64Data, 'base64');
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = './client/public/uploads';
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Write the file to disk
      fs.writeFileSync(`${uploadsDir}/${fileName}`, dataBuffer);
      
      // Update the step with the photo URL
      const updatedSections = [...pattern.sections];
      updatedSections[sectionIdx].steps[stepIdx] = {
        ...step,
        photo: `/uploads/${fileName}`
      };
      
      // Update the pattern
      const updatedPattern = await patternService.updatePattern(patternId, {
        sections: updatedSections
      });
      
      if (!updatedPattern) {
        return res.status(500).json({ message: "Failed to update pattern with photo" });
      }
      
      res.json({
        success: true,
        photoUrl: `/uploads/${fileName}`,
        pattern: updatedPattern
      });
    } catch (error) {
      console.error("Error uploading step photo:", error);
      res.status(500).json({ message: "Failed to upload step photo", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
