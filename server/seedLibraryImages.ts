import { db } from "./db";
import { patterns as patternsTable } from "../shared/schema";
import { generateImage } from "./api/generateImage";
import { eq, isNull } from "drizzle-orm";

const BATCH = 3;
const DELAY = 3000;

export async function seedLibraryImages(): Promise<void> {
  try {
    const all = await db.select().from(patternsTable);
    const missing = all.filter(
      (r) => !r.endProductImage || (r.endProductImage as string).includes("placehold")
    );

    if (missing.length === 0) {
      console.log("Library images: all patterns have images ✓");
      return;
    }

    console.log(`Library images: generating for ${missing.length} pattern(s) in background…`);

    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (p) => {
          try {
            const prompt = `${p.title} — ${p.skillLevel ?? "beginner"} crochet ${p.projectType ?? "project"}. ${p.description ?? ""}`;
            const url = await generateImage({
              prompt,
              type: "final",
              projectType: p.projectType ?? undefined,
              yarnType: p.yarnType ?? undefined,
            });
            if (url && !url.includes("placehold")) {
              await db
                .update(patternsTable)
                .set({ endProductImage: url })
                .where(eq(patternsTable.id, p.id));
              console.log(`[library-image] ✓ ${p.title}`);
            }
          } catch (e) {
            console.error(`[library-image] ✗ ${p.title}:`, e);
          }
        })
      );
      if (i + BATCH < missing.length) {
        await new Promise((r) => setTimeout(r, DELAY));
      }
    }

    console.log("[library-image] Background image generation complete ✓");
  } catch (e) {
    console.error("[library-image] Seed error:", e);
  }
}
