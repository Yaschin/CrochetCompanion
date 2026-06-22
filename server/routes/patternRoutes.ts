import type { Express, Request, Response } from "express";
import { patternService } from "../patternService";
import { generatePattern } from "../api/generatePattern";
import { patternSchema, type SourceFile } from "@shared/schema";
import { isMaterialsSection } from "@shared/sections";
import { uploadBuffer, deleteObject, getObjectDataUrl } from "../objectStorage";
import { pdfParseFn } from "../pdfParse";
import { generateImage } from "../api/generateImage";
import { analyzeAlignment } from "../api/analyzeAlignment";
import { transformPattern } from "../api/transformPattern";
import { askCoach } from "../api/coach";
import { checkWork } from "../api/checkWork";
import { getMeta } from "../ensureSchema";
import { capText, profileOf } from "../httpHelpers";

/**
 * The pattern domain: CRUD, cover/product/section images, step & section photos,
 * imported source files, AI coach + work-check + alignment, resize/substitute.
 */
export function registerPatternRoutes(app: Express): void {
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
      res.status(500).json({ message: "Failed to create pattern" });
    }
  });

  app.get("/api/patterns", async (req: Request, res: Response) => {
    try {
      const patterns = await patternService.getAllPatterns(profileOf(req));
      res.json(patterns);
    } catch (error) {
      console.error("Error getting patterns:", error);
      res.status(500).json({ message: "Failed to get patterns" });
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
      res.status(500).json({ message: "Failed to get pattern" });
    }
  });

  app.put("/api/patterns/:id", async (req: Request, res: Response) => {
    try {
      const result = patternSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid pattern data", errors: result.error.errors });
      }

      // Doing = starting: the moment real crochet work arrives (a completed
      // step or a non-zero counter), a saved pattern becomes an active
      // project automatically — no bureaucratic "Start project" click needed.
      const update = result.data;
      if (update.status === undefined) {
        const existing = await patternService.getPattern(req.params.id);
        if (existing && existing.status === "pattern") {
          const counted =
            update.counterState != null &&
            ((update.counterState.rows ?? 0) > 0 || (update.counterState.stitches ?? 0) > 0);
          const stepDone =
            Array.isArray(update.sections) &&
            update.sections.some(
              (sec) => !isMaterialsSection(sec.name) && sec.steps.some((st) => st.completed)
            );
          if (counted || stepDone) {
            update.status = "active";
            update.startedAt = existing.startedAt ?? new Date().toISOString();
          }
        }
      }

      const updatedPattern = await patternService.updatePattern(req.params.id, update);
      
      if (!updatedPattern) {
        return res.status(404).json({ message: "Pattern not found" });
      }
      
      res.json(updatedPattern);
    } catch (error) {
      console.error("Error updating pattern:", error);
      res.status(500).json({ message: "Failed to update pattern" });
    }
  });

  // Set a real photo of the finished object as the pattern's cover image
  // (replaces the AI render on the trophy shelf, library and home cards).
  app.post("/api/patterns/:id/cover-photo", async (req: Request, res: Response) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64 || typeof imageBase64 !== "string" || !imageBase64.startsWith("data:image/")) {
        return res.status(400).json({ message: "imageBase64 (data:image/… URL) is required" });
      }
      const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
      if (buffer.length > 8 * 1024 * 1024) {
        return res.status(400).json({ message: "Photo too large — maximum 8 MB." });
      }
      const url = await uploadBuffer(buffer, contentType);
      const updated = await patternService.updatePattern(req.params.id, { endProductImage: url });
      if (!updated) return res.status(404).json({ message: "Pattern not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error setting cover photo:", error);
      res.status(500).json({ message: "Failed to set cover photo" });
    }
  });

  app.delete("/api/patterns/:id", async (req: Request, res: Response) => {
    try {
      // Read the pattern first so we can clean up any stored originals.
      const existing = await patternService.getPattern(req.params.id);
      const success = await patternService.deletePattern(req.params.id);

      if (!success) {
        return res.status(404).json({ message: "Pattern not found" });
      }

      // Best-effort: remove imported PDFs from object storage so they don't orphan.
      for (const f of existing?.sourceFiles ?? []) {
        await deleteObject(f.key).catch(() => {});
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting pattern:", error);
      res.status(500).json({ message: "Failed to delete pattern" });
    }
  });

  // ─── Imported source files (original PDFs kept to refer back to) ────────────
  // Attach one or more original PDFs to a pattern. The bytes go to object
  // storage; metadata rides on the pattern so the viewer + files library can
  // open them later. Stored at save-time (not during parse) so cancelled
  // imports never orphan an upload.
  app.post("/api/patterns/:id/source-files", async (req: Request, res: Response) => {
    try {
      const files = req.body?.files;
      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "files array is required" });
      }
      if (files.length > 5) {
        return res.status(400).json({ message: "Maximum 5 files at once." });
      }
      const pattern = await patternService.getPattern(req.params.id);
      if (!pattern) return res.status(404).json({ message: "Pattern not found" });

      const added: SourceFile[] = [];
      for (const f of files) {
        const name = typeof f?.name === "string" && f.name.trim() ? f.name.trim() : "pattern.pdf";
        const payload = typeof f?.base64 === "string" ? f.base64.replace(/^data:[^;]+;base64,/, "") : "";
        if (!payload) return res.status(400).json({ message: "Each file needs base64 content." });
        const buffer = Buffer.from(payload, "base64");
        if (buffer.length > 10 * 1024 * 1024) {
          return res.status(400).json({ message: `${name} is too large — maximum 10 MB.` });
        }
        if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
          return res.status(415).json({ message: `${name} doesn't look like a valid PDF.` });
        }
        let pages: number | undefined;
        try { pages = (await pdfParseFn(buffer)).numpages; } catch { /* page count is best-effort */ }
        let url: string;
        try {
          url = await uploadBuffer(buffer, "application/pdf");
        } catch (storageErr) {
          console.error("[source-files] object storage upload failed:", storageErr);
          return res.status(503).json({ message: "File storage isn't available right now — try again later." });
        }
        added.push({
          key: url.replace(/^\/api\/media\//, ""),
          name, type: "pdf", size: buffer.length, pages,
          addedAt: new Date().toISOString(),
        });
      }

      const sourceFiles = [...(pattern.sourceFiles ?? []), ...added];
      const updated = await patternService.updatePattern(req.params.id, { sourceFiles });
      res.json({ sourceFiles: updated?.sourceFiles ?? sourceFiles });
    } catch (error) {
      console.error("Error attaching source files:", error);
      res.status(500).json({ message: "Failed to attach files" });
    }
  });

  app.delete("/api/patterns/:id/source-files/:key", async (req: Request, res: Response) => {
    try {
      const pattern = await patternService.getPattern(req.params.id);
      if (!pattern) return res.status(404).json({ message: "Pattern not found" });
      const { key } = req.params;
      const remaining = (pattern.sourceFiles ?? []).filter((f) => f.key !== key);
      await patternService.updatePattern(req.params.id, { sourceFiles: remaining });
      await deleteObject(key).catch(() => {});
      res.json({ sourceFiles: remaining });
    } catch (error) {
      console.error("Error removing source file:", error);
      res.status(500).json({ message: "Failed to remove file" });
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
      res.status(500).json({ message: "Failed to generate product image" });
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
      res.status(500).json({ message: "Failed to generate section image" });
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
      if (dataBuffer.length > 8 * 1024 * 1024) {
        return res.status(400).json({ message: "Photo too large — maximum 8 MB." });
      }

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
      res.status(500).json({ message: "Failed to upload step photo" });
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
      if (dataBuffer.length > 8 * 1024 * 1024) {
        return res.status(400).json({ message: "Photo too large — maximum 8 MB." });
      }

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
      res.status(500).json({ message: "Failed to upload section photo" });
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

      let gaugeNote = "";
      if (mode === "resize") {
        try {
          const raw = await getMeta(`gauge:${profileOf(req)}`);
          const g = raw ? JSON.parse(raw) : null;
          if (g?.stitches && g?.rows) {
            gaugeNote = ` The maker's personal gauge is ${g.stitches} SC and ${g.rows} rows per 10cm — recalculate stitch counts and the finished size against THIS tension, not a generic one.`;
          }
        } catch { /* no gauge saved */ }
      }
      const transformed = await transformPattern(original, mode, capText(instruction) + gaugeNote);
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



  // ── Ashi the crochet coach: contextual help on the current round ────────────
  app.post("/api/patterns/:id/coach", async (req: Request, res: Response) => {
    try {
      const { question, history, sectionName, stepText } = req.body;
      if (!question || typeof question !== "string" || !question.trim()) {
        return res.status(400).json({ message: "question is required" });
      }
      const pattern = await patternService.getPattern(req.params.id);
      if (!pattern) return res.status(404).json({ message: "Pattern not found" });
      const answer = await askCoach(
        question.trim(),
        {
          patternTitle: pattern.title,
          skillLevel: pattern.skillLevel,
          sectionName: capText(sectionName, 80) || undefined,
          stepText: capText(stepText, 300) || undefined,
        },
        Array.isArray(history) ? history.filter((t) => t && (t.role === "user" || t.role === "assistant")) : []
      );
      res.json({ answer });
    } catch (error) {
      console.error("Coach failed:", error);
      res.status(500).json({ message: (error as Error).message || "Ashi couldn't answer" });
    }
  });

  // Photo "fix-my-mistake" coach: a photo of work-in-progress, judged gently
  // against the round the maker is on. Honest failure without a key.
  app.post("/api/patterns/:id/check-work", async (req: Request, res: Response) => {
    try {
      const { sectionIndex, stepIndex, imageBase64 } = req.body ?? {};
      if (typeof imageBase64 !== "string" || !imageBase64.startsWith("data:image/")) {
        return res.status(400).json({ success: false, message: "A work-in-progress photo is required." });
      }
      const sIdx = Number(sectionIndex);
      const stIdx = Number(stepIndex);
      if (!Number.isInteger(sIdx) || !Number.isInteger(stIdx)) {
        return res.status(400).json({ success: false, message: "Invalid round reference." });
      }
      const pattern = await patternService.getPattern(req.params.id);
      if (!pattern) return res.status(404).json({ success: false, message: "Pattern not found" });

      const section = pattern.sections[sIdx];
      const step = section?.steps?.[stIdx];
      if (!section || !step) {
        return res.status(400).json({ success: false, message: "Round not found in this pattern." });
      }

      // A few preceding rounds in the same section give the model context.
      const precedingRounds = section.steps.slice(Math.max(0, stIdx - 3), stIdx).map((s) => s.text);
      const countMatch = [...String(step.text).matchAll(/\((\d+)\)/g)];
      const targetCount = countMatch.length ? parseInt(countMatch[countMatch.length - 1][1], 10) : undefined;

      // Feed the section's reference art if it exists (object-storage URLs must
      // be converted to data URLs — OpenAI can't fetch /api/media/...).
      let referenceImageUrl: string | undefined;
      const ref = section.partImageUrl;
      if (typeof ref === "string" && ref) {
        referenceImageUrl = ref.startsWith("/api/media/")
          ? await getObjectDataUrl(ref.replace("/api/media/", ""))
          : ref;
      }

      const result = await checkWork({
        wipImageUrl: imageBase64,
        referenceImageUrl,
        patternTitle: pattern.title,
        sectionName: section.name,
        currentRound: step.text,
        targetCount,
        precedingRounds,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Work check failed:", error);
      const message = String(error).includes("key")
        ? "Ashi needs a valid OpenAI API key to check your work."
        : "Couldn't check your work right now.";
      res.status(500).json({ success: false, message });
    }
  });

}
