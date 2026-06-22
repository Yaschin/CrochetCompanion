import type { Express, Request, Response } from "express";
import { generatePattern } from "../api/generatePattern";
import { parsePattern, parsePdfText } from "../api/parsePattern";
import { generateImage } from "../api/generateImage";
import { pdfParseFn } from "../pdfParse";

/** AI generation/import endpoints: pattern + image generation and PDF/text parsing. */
export function registerAiRoutes(app: Express): void {
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
        referenceImage,
      });

      res.json(generatedPattern);
    } catch (error) {
      console.error("Error in generate-pattern endpoint:", error);
      res.status(500).json({ message: "Failed to generate pattern" });
    }
  });

  // PDF import: extract text from base64-encoded PDF(s), then AI-structure it.
  app.post("/api/parse-pdf", async (req: Request, res: Response) => {
    // Accept either a single fileBase64 (legacy) or an array filesBase64
    const rawSingle: string | undefined = req.body.fileBase64;
    const rawMulti: string[] | undefined = req.body.filesBase64;
    const files: string[] = rawMulti?.length ? rawMulti : rawSingle ? [rawSingle] : [];

    if (files.length === 0) {
      return res.status(400).json({ message: "filesBase64 array (or fileBase64) is required" });
    }
    if (files.length > 5) {
      return res.status(400).json({ message: "Maximum 5 PDFs at once." });
    }

    // Step 1: extract + concatenate text from every PDF
    const textParts: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const buffer = Buffer.from(files[i], "base64");
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ message: `PDF ${i + 1} is too large — maximum size per file is 10 MB.` });
      }
      try {
        const data = await pdfParseFn(buffer);
        const text = (data.text || "").trim();
        if (text.length >= 50) textParts.push(text);
      } catch (pdfErr: any) {
        const msg = (pdfErr?.message || "") + " " + (pdfErr?.details || "");
        const isStructure = /invalid|corrupt|bad xref|password|damaged|format/i.test(msg);
        return res.status(422).json({
          message: isStructure
            ? `PDF ${i + 1} doesn't look valid — it may be corrupt or password-protected.`
            : `Couldn't read PDF ${i + 1}. Try re-saving it and uploading again.`,
        });
      }
    }

    if (textParts.length === 0) {
      return res.status(422).json({
        message: "No readable text found in any of the PDFs — they may be image-based (scanned). Try copying the text manually and using 'Add my own' instead.",
      });
    }

    // Join all pages with a clear separator so AI sees them as one pattern
    const combinedText = textParts.join("\n\n--- (next file) ---\n\n");

    // Step 2: AI structuring
    try {
      const result = await parsePdfText(combinedText);
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
      res.status(500).json({ message: "Failed to parse pattern" });
    }
  });

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
      res.status(500).json({ message: "Failed to generate image" });
    }
  });
}
