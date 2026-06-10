import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { createRequire } from "module";
import { existsSync } from "fs";
import { resolve } from "path";
import { storage } from "./storage";
import { generatePattern } from "./api/generatePattern";
import { parsePattern, parsePdfText } from "./api/parsePattern";
import { generateImage } from "./api/generateImage";
import { analyzeAlignment } from "./api/analyzeAlignment";
import { transformPattern } from "./api/transformPattern";
import { communityService } from "./communityService";
import { patternService } from "./patternService";
import { stashService } from "./stashService";
import { seedStarterContentOnce } from "./seedLibrary";
import { seedLibraryImages } from "./seedLibraryImages";
import { seedProfilePatterns, seedProfileStash } from "./seedProfilePatterns";
import { ensureSchema } from "./ensureSchema";
import { runQuickDiagnostics, runDeepDiagnostics } from "./diagnostics";
import { patternSchema, stashItemSchema, insertCommunityPatternSchema } from "../shared/schema";
import { PROFILES, isProfileId, profileById, DEFAULT_PROFILE_ID } from "../shared/profiles";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "./db";

// Resolve the active family profile from ?profile=<id>. Defaults to Larissa so
// pre-profile clients (and service-worker-cached requests) keep working.
function profileOf(req: Request): string {
  const p = String(req.query.profile ?? "").trim();
  return isProfileId(p) ? p : DEFAULT_PROFILE_ID;
}

// Cap free-text that gets interpolated into AI prompts — keeps a stray paste
// (or anything malicious) from ballooning token spend or hijacking the prompt.
function capText(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
import { uploadBuffer, uploadBufferWithKey, objectExists, streamObject, getObjectDataUrl } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Serve stored media objects from object storage
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

  // Generate pattern endpoint
  app.post("/api/generate-pattern", async (req: Request, res: Response) => {
    try {
      const { prompt, projectType, skillLevel, yarnType, size, referenceImage } = req.body;

      if (!prompt || !projectType || !skillLevel) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const generatedPattern = await generatePattern({
        prompt,
        projectType,
        skillLevel,
        yarnType,
        size,
        referenceImage
      });

      res.json(generatedPattern);
    } catch (error) {
      console.error("Error in generate-pattern endpoint:", error);
      res.status(500).json({ message: "Failed to generate pattern", error: (error as Error).message });
    }
  });

  // Parse / import an existing pattern (structures raw text into sections + steps via AI)
  // PDF import: extract text from base64-encoded PDF then AI-structure it
  // Lazy-load pdf-parse via createRequire to avoid the index.js test-runner
  // bug in pdf-parse@1.1.1 which expects ./test/data/ relative to CWD.
  const _require = createRequire(import.meta.url);
  const pdfParseFn: (buf: Buffer) => Promise<{ text: string; numpages: number }> =
    _require("pdf-parse/lib/pdf-parse");

  app.post("/api/parse-pdf", async (req: Request, res: Response) => {
    const { fileBase64 } = req.body;
    if (!fileBase64 || typeof fileBase64 !== "string") {
      return res.status(400).json({ message: "fileBase64 is required" });
    }
    const buffer = Buffer.from(fileBase64, "base64");
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ message: "PDF too large — maximum size is 10 MB." });
    }

    // Step 1: extract text — catch PDF-level errors with a user-friendly message
    let text = "";
    try {
      const data = await pdfParseFn(buffer);
      text = (data.text || "").trim();
    } catch (pdfErr: any) {
      const msg = (pdfErr?.message || "") + " " + (pdfErr?.details || "");
      const isStructure = /invalid|corrupt|bad xref|password|damaged|format/i.test(msg);
      return res.status(422).json({
        message: isStructure
          ? "This file doesn't look like a valid PDF — it may be corrupt or password-protected. Try re-exporting it from the original source."
          : "Couldn't read this PDF. Try re-saving it and uploading again, or use 'Add my own' to paste the text.",
      });
    }

    if (text.length < 50) {
      return res.status(422).json({
        message: "No readable text found in this PDF — it may be image-based (scanned). Try copying the text manually and using 'Add my own' instead.",
      });
    }

    // Step 2: AI structuring
    try {
      const result = await parsePdfText(text);
      res.json(result);
    } catch (aiErr) {
      console.error("AI structuring error in parse-pdf:", aiErr);
      res.status(500).json({ message: "Pattern text was extracted but AI structuring failed — please try again." });
    }
  });

  app.post("/api/parse-pattern", async (req: Request, res: Response) => {
    try {
      const { title, projectType, skillLevel, yarnType, size, rawText } = req.body;
      if (!title || !projectType || !skillLevel) {
        return res.status(400).json({ message: "title, projectType, and skillLevel are required" });
      }
      const result = await parsePattern({ title, projectType, skillLevel, yarnType, size, rawText });
      res.json(result);
    } catch (error) {
      console.error("Error in parse-pattern endpoint:", error);
      res.status(500).json({ message: "Failed to parse pattern", error: (error as Error).message });
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

  // ─── Character companion routes ─────────────────────────────────────────────

  const CHARACTER_DEFS: Record<string, { prompt: string }> = {
    aloo: {
      prompt:
        "Photorealistic studio product photo of a handcrafted amigurumi crochet dog plushie. Small plump round body, big round head, floppy rounded ears, tiny black button eyes, subtle embroidered smile. Made entirely from soft dusty rose pink cotton yarn showing beautiful crochet stitch texture. Sitting upright on a smooth warm cream linen surface. Soft bokeh cream background. Professional product photography lighting, macro detail, extremely lifelike crochet texture, no humans, plain background.",
    },
    yala: {
      prompt:
        "Photorealistic studio product photo of a handcrafted amigurumi crochet elephant plushie. Chunky round body, oversized round floppy ears, short curved trunk, small tail, tiny black button eyes, embroidered smile. Made entirely from soft lavender purple cotton yarn showing beautiful crochet stitch texture. Sitting upright on a smooth warm cream linen surface. Soft bokeh cream background. Professional product photography lighting, macro detail, extremely lifelike crochet texture, no humans, plain background.",
    },
    ashi: {
      prompt:
        "Photorealistic studio product photo of a handcrafted amigurumi crochet dog plushie. Compact round body, large droopy ears, short snout, tiny black button eyes, embroidered nose and smile. Made entirely from soft teal blue-green cotton yarn showing beautiful crochet stitch texture. Sitting upright on a smooth warm cream linen surface. Soft bokeh cream background. Professional product photography lighting, macro detail, extremely lifelike crochet texture, no humans, plain background.",
    },
    bee: {
      prompt:
        "Photorealistic studio product photo of a handcrafted amigurumi crochet bee plushie. Chubby round striped body, tiny white crocheted wings, small antennae with round tips, tiny black button eyes, subtle embroidered smile. Body made from golden yellow cotton yarn with dark brown stripe details and white yarn accents. Sitting upright on a smooth warm cream linen surface. Soft bokeh cream background. Professional product photography lighting, macro detail, extremely lifelike crochet texture, no humans, plain background.",
    },
    sheep: {
      prompt:
        "Photorealistic studio product photo of a handcrafted amigurumi crochet sheep plushie. Fluffy bumpy round body, small round head with cream-coloured face, small ears, four tiny legs, tiny black button eyes, embroidered smile. Body made from loopy sage green textured bouclé-style cotton yarn, face and legs in smooth cream yarn. Sitting upright on a smooth warm cream linen surface. Soft bokeh cream background. Professional product photography lighting, macro detail, extremely lifelike crochet texture, no humans, plain background.",
    },
  };

  // GET /api/characters — return stored image URLs for each character
  app.get("/api/characters", async (_req: Request, res: Response) => {
    try {
      const result: Record<string, string | null> = {};
      await Promise.all(
        Object.keys(CHARACTER_DEFS).map(async (id) => {
          // Prefer static public file (instant load) over object storage streaming
          const staticPath = resolve(`client/public/characters/char-${id}.png`);
          if (existsSync(staticPath)) {
            result[id] = `/characters/char-${id}.png`;
            return;
          }
          const key = `char-${id}`;
          const exists = await objectExists(key);
          result[id] = exists ? `/api/media/${key}` : null;
        })
      );
      res.json(result);
    } catch (error) {
      console.error("Error checking character images:", error);
      res.status(500).json({ message: "Failed to check character images" });
    }
  });

  // POST /api/characters/generate — generate a single character image
  app.post("/api/characters/generate", async (req: Request, res: Response) => {
    try {
      const { characterId } = req.body;
      if (!characterId || !CHARACTER_DEFS[characterId]) {
        return res.status(400).json({ message: "Invalid characterId" });
      }

      const key = `char-${characterId}`;
      // Return cached version if it already exists
      if (await objectExists(key)) {
        return res.json({ url: `/api/media/${key}` });
      }

      const OpenAI = (await import("openai")).default;
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (!apiKey) {
        return res.status(503).json({ message: "OpenAI API key not configured" });
      }

      const openai = new OpenAI({ apiKey });
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: CHARACTER_DEFS[characterId].prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const openaiUrl = response.data[0].url;
      if (!openaiUrl) throw new Error("No image URL returned");

      // Download and store permanently with a fixed key
      const imgRes = await fetch(openaiUrl);
      if (!imgRes.ok) throw new Error("Failed to fetch generated image");
      const contentType = imgRes.headers.get("content-type") || "image/png";
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const url = await uploadBufferWithKey(key, buffer, contentType);

      res.json({ url });
    } catch (error) {
      console.error("Error generating character image:", error);
      res.status(500).json({ message: "Failed to generate character image", error: (error as Error).message });
    }
  });

  // ─── Pattern CRUD endpoints ──────────────────────────────────────────────────
  // Pattern CRUD endpoints
  app.post("/api/patterns", async (req: Request, res: Response) => {
    try {
      const result = patternSchema.omit({ id: true, createdAt: true }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid pattern data", errors: result.error.errors });
      }
      
      const pattern = await patternService.createPattern(result.data, profileOf(req));
      res.status(201).json(pattern);

      // Fire-and-forget: generate a product image in the background if none exists yet.
      if (!pattern.endProductImage || pattern.endProductImage.includes("placehold")) {
        (async () => {
          try {
            const prompt = `${pattern.title} — a ${pattern.skillLevel} crochet ${pattern.projectType}${pattern.description ? `. ${pattern.description}` : ""}`;
            const imageUrl = await generateImage({
              prompt,
              type: "final",
              projectType: pattern.projectType,
              yarnType: pattern.yarnType ?? undefined,
            });
            if (imageUrl && !imageUrl.includes("placehold")) {
              await patternService.updatePattern(pattern.id, { endProductImage: imageUrl });
              console.log(`[auto-image] ✓ Generated image for "${pattern.title}" (${pattern.id})`);
            }
          } catch (e) {
            console.error(`[auto-image] Failed for pattern "${pattern.title}":`, e);
          }
        })();
      }
    } catch (error) {
      console.error("Error creating pattern:", error);
      res.status(500).json({ message: "Failed to create pattern", error: (error as Error).message });
    }
  });

  app.get("/api/patterns", async (req: Request, res: Response) => {
    try {
      const patterns = await patternService.getAllPatterns(profileOf(req));
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
        prompt += `. ${capText(refinements)}`;
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
        prompt += `. ${capText(refinements)}`;
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
  app.get("/api/stash", async (req: Request, res: Response) => {
    try {
      const items = await stashService.getAllItems(profileOf(req));
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
      
      const item = await stashService.createItem(result.data, profileOf(req));
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
  app.get("/api/stash-notes", async (req: Request, res: Response) => {
    try {
      const notes = await stashService.getNotes(profileOf(req));
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
      
      const updatedNotes = await stashService.updateNotes(content, profileOf(req));
      res.json({ content: updatedNotes }); // Using content key for consistency
    } catch (error) {
      console.error("Error updating stash notes:", error);
      res.status(500).json({ message: "Failed to update stash notes", error: (error as Error).message });
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

      // Extract the base64 data from the data URL and detect content type
      const mimeMatch = photoData.match(/^data:(image\/\w+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : "image/png";
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
      const dataBuffer = Buffer.from(base64Data, 'base64');

      // Upload to object storage
      const photoUrl = await uploadBuffer(dataBuffer, contentType);

      // Update the step with the photo URL
      const updatedSections = [...pattern.sections];
      updatedSections[sectionIdx].steps[stepIdx] = {
        ...step,
        photo: photoUrl
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
        photoUrl,
        pattern: updatedPattern
      });
    } catch (error) {
      console.error("Error uploading step photo:", error);
      res.status(500).json({ message: "Failed to upload step photo", error: (error as Error).message });
    }
  });
  
  // Add endpoint for uploading section photos
  app.post("/api/patterns/:patternId/sections/:sectionIndex/photo", async (req: Request, res: Response) => {
    try {
      const { patternId, sectionIndex } = req.params;
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

      if (!req.body.photo) {
        return res.status(400).json({ message: "Photo data is required" });
      }

      // Process the base64 encoded photo data
      const photoData = req.body.photo;

      // Extract the base64 data from the data URL and detect content type
      const mimeMatch = photoData.match(/^data:(image\/\w+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : "image/png";
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
      const dataBuffer = Buffer.from(base64Data, 'base64');

      // Upload to object storage
      const photoUrl = await uploadBuffer(dataBuffer, contentType);

      // Update the section with the photo URL
      const updatedSections = [...pattern.sections];
      updatedSections[sectionIdx] = {
        ...section,
        partImageUrl: photoUrl
      };
      
      // Update the pattern
      const updatedPattern = await patternService.updatePattern(patternId, {
        sections: updatedSections
      });
      
      if (!updatedPattern) {
        return res.status(500).json({ message: "Failed to update pattern with section photo" });
      }
      
      res.json({
        success: true,
        photoUrl,
        pattern: updatedPattern
      });
    } catch (error) {
      console.error("Error uploading section photo:", error);
      res.status(500).json({ message: "Failed to upload section photo", error: String(error) });
    }
  });
  
  // Endpoint to check alignment between pattern section and image
  app.post("/api/patterns/:patternId/sections/:sectionIndex/alignment-check", async (req: Request, res: Response) => {
    try {
      const { patternId, sectionIndex } = req.params;
      const sectionIdx = parseInt(sectionIndex, 10);
      
      if (isNaN(sectionIdx)) {
        return res.status(400).json({ success: false, message: "Invalid section index" });
      }
      
      // Get the current pattern
      const pattern = await patternService.getPattern(patternId);
      if (!pattern) {
        return res.status(404).json({ success: false, message: "Pattern not found" });
      }
      
      if (!pattern.sections[sectionIdx] || !pattern.sections[sectionIdx].partImageUrl) {
        return res.status(400).json({ success: false, message: "Section or section image not found" });
      }
      
      // Get section details
      const section = pattern.sections[sectionIdx];
      const sectionSteps = section.steps.map(step => step.text).join('\n');
      const sectionName = section.name;
      const partImageUrl = section.partImageUrl as string;

      // Object-storage images (/api/media/...) are not publicly fetchable by OpenAI,
      // so convert them to a data URL. External/public URLs are passed through directly.
      let imageInput: string;
      if (partImageUrl.startsWith("/api/media/")) {
        const key = partImageUrl.replace("/api/media/", "");
        imageInput = await getObjectDataUrl(key);
      } else {
        imageInput = partImageUrl;
      }

      // Genuine vision-based comparison (replaces the previous Math.random() estimate).
      const { score, feedback } = await analyzeAlignment(imageInput, sectionName, sectionSteps);

      res.json({
        success: true,
        alignmentScore: score,
        feedback,
      });
    } catch (error) {
      console.error('Error checking pattern-image alignment:', error);
      const message = String(error).includes("API key")
        ? "AI alignment check requires a valid OpenAI API key."
        : "Failed to analyze pattern-image alignment";
      res.status(500).json({ success: false, message });
    }
  });
  
  // Endpoint to regenerate pattern based on section image
  app.post("/api/patterns/:patternId/regenerate", async (req: Request, res: Response) => {
    try {
      const { patternId } = req.params;
      const { sectionIndex, basedOnImage, userNote } = req.body;
      
      // Get the original pattern
      const originalPattern = await patternService.getPattern(patternId);
      if (!originalPattern) {
        return res.status(404).json({ success: false, message: "Pattern not found" });
      }
      
      // If regenerating based on image, ensure section and image exist
      let sectionReferenceImage: string | undefined;
      if (basedOnImage && sectionIndex !== undefined) {
        const sectionIdx = Number(sectionIndex);
        const sectionImg = originalPattern.sections[sectionIdx]?.partImageUrl;
        if (!originalPattern.sections[sectionIdx] || !sectionImg) {
          return res.status(400).json({ success: false, message: "Section or section image not found" });
        }
        // Resolve the section image to something the vision model can actually
        // "see" (data URL or public URL), so regeneration is truly image-driven.
        if (sectionImg.startsWith("data:") || sectionImg.startsWith("http")) {
          sectionReferenceImage = sectionImg;
        } else if (sectionImg.startsWith("/api/media/")) {
          try {
            sectionReferenceImage = await getObjectDataUrl(sectionImg.replace("/api/media/", ""));
          } catch (err) {
            console.warn("Could not load section image for vision regeneration:", err);
          }
        }
      }

      // Call pattern generation with the original pattern for reference
      const basePrompt = originalPattern.title;
      const cappedNote = capText(userNote);
      const fullPrompt = cappedNote
        ? `${basePrompt}. Additional instructions: ${cappedNote}`
        : basePrompt;

      const regeneratedPattern = await generatePattern({
        prompt: fullPrompt,
        projectType: originalPattern.projectType,
        skillLevel: originalPattern.skillLevel,
        yarnType: originalPattern.yarnType,
        size: originalPattern.size,
        patternId: patternId,
        originalPattern: originalPattern,
        // Preserve locked steps/sections: merge unlocked regenerated content with
        // the locked originals instead of regenerating the whole pattern from scratch.
        unlockedStepsOnly: true,
        // If regenerating based on specific section image, tell the API which image to focus on
        // The actual section image, sent to the vision model (true image-driven regen).
        referenceImage: sectionReferenceImage,
      });
      
      // Update the pattern in the database
      const updatedPattern = await patternService.updatePattern(patternId, regeneratedPattern);
      
      res.json({ 
        success: true, 
        message: "Pattern successfully regenerated",
        pattern: updatedPattern
      });
    } catch (error) {
      console.error('Error regenerating pattern:', error);
      res.status(500).json({ success: false, message: "Failed to regenerate pattern" });
    }
  });

  // ── Phase 2: adapt an existing pattern (non-destructive — saves a new one) ────
  async function adaptAndSave(req: Request, res: Response, mode: "resize" | "substitute") {
    try {
      const { instruction } = req.body ?? {};
      if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
        return res.status(400).json({
          message: mode === "resize" ? "Tell me how to resize, e.g. '30% bigger'." : "Tell me which yarn to use, e.g. 'DK weight'.",
        });
      }
      const original = await patternService.getPattern(req.params.id);
      if (!original) return res.status(404).json({ message: "Pattern not found" });

      const transformed = await transformPattern(original, mode, capText(instruction));
      transformed.title =
        mode === "resize" ? `${original.title} (resized)` : `${original.title} (${instruction.trim()})`;
      // The adapted copy belongs to whoever requested the adaptation.
      const created = await patternService.createPattern(transformed, profileOf(req));
      res.status(201).json(created);
    } catch (error) {
      console.error(`${mode} failed:`, error);
      res.status(500).json({ message: (error as Error).message || `${mode} failed` });
    }
  }

  app.post("/api/patterns/:id/resize", (req, res) => adaptAndSave(req, res, "resize"));
  app.post("/api/patterns/:id/substitute", (req, res) => adaptAndSave(req, res, "substitute"));

  // ── Community ───────────────────────────────────────────────────────────────
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

  // ── Family profiles ─────────────────────────────────────────────────────────
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
      // Accept a list of YYYY-MM-DD days (defaults to "today" server-side is
      // wrong across timezones — the client supplies its local date).
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

  // ── App health diagnostics ──────────────────────────────────────────────────
  // Quick: DB, object storage, OpenAI key + model availability (no generation).
  app.get("/api/diagnostics", async (_req: Request, res: Response) => {
    try {
      res.json(await runQuickDiagnostics());
    } catch (error) {
      console.error("Diagnostics failed:", error);
      res.status(500).json({ message: "Diagnostics failed", error: (error as Error).message });
    }
  });

  // Deep: one tiny live text generation + one live image generation (costs a
  // small amount of API credit; user-initiated from Settings only).
  app.post("/api/diagnostics/deep", async (_req: Request, res: Response) => {
    try {
      res.json(await runDeepDiagnostics());
    } catch (error) {
      console.error("Deep diagnostics failed:", error);
      res.status(500).json({ message: "Deep diagnostics failed", error: (error as Error).message });
    }
  });

  // ── Backup: export & import all user data ───────────────────────────────────
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
      res.status(500).json({ message: "Export failed", error: (error as Error).message });
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

      for (const p of patterns) {
        if (p && typeof p.title === "string" && Array.isArray(p.sections)) {
          const { id: _id, createdAt: _createdAt, ...rest } = p;
          await patternService.createPattern(rest, profile);
          importedPatterns++;
        }
      }

      for (const s of stash) {
        const result = stashItemSchema.omit({ id: true }).safeParse(s);
        if (result.success) {
          await stashService.createItem(result.data, profile);
          importedStash++;
        }
      }

      if (typeof body.stashNotes === "string" && body.stashNotes.trim()) {
        await stashService.updateNotes(body.stashNotes, profile);
      }

      res.json({ success: true, importedPatterns, importedStash });
    } catch (error) {
      console.error("Import failed:", error);
      res.status(500).json({ message: "Import failed", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
