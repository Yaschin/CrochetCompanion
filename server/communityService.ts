import { CommunityPattern, InsertCommunityPattern, communityPatterns, insertCommunityPatternSchema } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db } from "./db";
import { desc, eq, sql } from "drizzle-orm";
import { generateImage } from "./api/generateImage";

function rowToCommunity(row: typeof communityPatterns.$inferSelect): CommunityPattern {
  const createdAt = row.createdAt instanceof Date
    ? row.createdAt.toISOString()
    : (row.createdAt as unknown as string);

  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    creatorId: row.creatorId ?? null,
    projectType: row.projectType,
    skillLevel: row.skillLevel,
    description: row.description || "",
    endProductImage: row.endProductImage || undefined,
    yarnType: row.yarnType || undefined,
    size: row.size || undefined,
    sections: (row.sections ?? []) as CommunityPattern["sections"],
    yarnRequirements: (row.yarnRequirements ?? []) as CommunityPattern["yarnRequirements"],
    hookRequirements: (row.hookRequirements ?? []) as CommunityPattern["hookRequirements"],
    notionsRequirements: (row.notionsRequirements ?? []) as CommunityPattern["notionsRequirements"],
    toolRequirements: (row.toolRequirements ?? []) as CommunityPattern["toolRequirements"],
    needsStuffing: row.needsStuffing || undefined,
    likes: row.likes ?? 0,
    createdAt,
  };
}

export const communityService = {
  async getAll(): Promise<CommunityPattern[]> {
    try {
      const rows = await db.select().from(communityPatterns).orderBy(desc(communityPatterns.createdAt));
      return rows.map(rowToCommunity);
    } catch (error) {
      console.error("Error listing community patterns:", error);
      return [];
    }
  },

  async getById(id: string): Promise<CommunityPattern | undefined> {
    try {
      const rows = await db.select().from(communityPatterns).where(eq(communityPatterns.id, id));
      return rows.length ? rowToCommunity(rows[0]) : undefined;
    } catch (error) {
      console.error("Error getting community pattern:", error);
      return undefined;
    }
  },

  async create(data: InsertCommunityPattern): Promise<CommunityPattern> {
    const record = {
      id: uuidv4(),
      title: data.title,
      creator: data.creator || "Larissa",
      creatorId: data.creatorId ?? null,
      projectType: data.projectType,
      skillLevel: data.skillLevel,
      description: data.description || null,
      endProductImage: data.endProductImage || null,
      yarnType: data.yarnType || null,
      size: data.size || null,
      sections: data.sections ?? [],
      yarnRequirements: data.yarnRequirements ?? [],
      hookRequirements: data.hookRequirements ?? [],
      notionsRequirements: data.notionsRequirements ?? [],
      toolRequirements: data.toolRequirements ?? [],
      needsStuffing: data.needsStuffing || null,
      likes: 0,
    };
    const result = await db.insert(communityPatterns).values(record as any).returning();
    return rowToCommunity(result[0]);
  },

  async incrementLikes(id: string): Promise<number | undefined> {
    try {
      const result = await db
        .update(communityPatterns)
        .set({ likes: sql`${communityPatterns.likes} + 1` })
        .where(eq(communityPatterns.id, id))
        .returning();
      return result.length ? result[0].likes : undefined;
    } catch (error) {
      console.error("Error liking community pattern:", error);
      return undefined;
    }
  },

  // Seed 40 curated patterns on first run only (empty table). Never deletes
  // existing rows — user submissions must survive restarts and seed changes.
  // On every startup also resumes image generation for any patterns still missing images.
  async seedIfEmpty(): Promise<void> {
    try {
      const existing = await db.select().from(communityPatterns);

      if (existing.length === 0) {
        console.log("Community: seeding 40-pattern gallery for the first time…");

        const created: CommunityPattern[] = [];
        for (const seed of COMMUNITY_SEEDS) {
          const p = await this.create(insertCommunityPatternSchema.parse(seed));
          created.push(p);
        }
        console.log(`Community: seeded ${created.length} patterns. Generating images in background…`);
        generateCommunityImages(created).catch((e) =>
          console.error("Community image generation error:", e)
        );
      } else {
        // Already seeded — resume image generation for any patterns still missing images.
        const missing = existing
          .filter((r) => !r.endProductImage || r.endProductImage.includes("placehold"))
          .map(rowToCommunity);
        if (missing.length > 0) {
          console.log(`Community: resuming image generation for ${missing.length} patterns…`);
          generateCommunityImages(missing).catch((e) =>
            console.error("Community image generation (resume) error:", e)
          );
        } else {
          console.log("Community: all 40 patterns have images ✓");
        }
      }
    } catch (error) {
      console.error("Error seeding community patterns:", error);
    }
  },
};

// Generate AI images for seeded community patterns in batches of 3.
async function generateCommunityImages(patterns: CommunityPattern[]): Promise<void> {
  const BATCH = 3;
  const DELAY = 3000;
  for (let i = 0; i < patterns.length; i += BATCH) {
    const batch = patterns.slice(i, i + BATCH);
    await Promise.all(batch.map(async (p) => {
      try {
        const prompt = `${p.title} — ${p.skillLevel} crochet ${p.projectType}. ${p.description}`;
        const url = await generateImage({ prompt, type: "final", projectType: p.projectType, yarnType: p.yarnType });
        if (url && !url.includes("placehold")) {
          await db.update(communityPatterns).set({ endProductImage: url }).where(eq(communityPatterns.id, p.id));
          console.log(`[community-image] ✓ ${p.title}`);
        }
      } catch (e) {
        console.error(`[community-image] ✗ ${p.title}:`, e);
      }
    }));
    if (i + BATCH < patterns.length) {
      await new Promise((r) => setTimeout(r, DELAY));
    }
  }
  console.log("[community-image] Background image generation complete.");
}

// Build a section with real crochet steps.
function section(name: string, steps: string[]) {
  return {
    name,
    notes: "",
    locked: false,
    steps: steps.map((text, i) => ({
      id: i + 1,
      text,
      locked: false,
      count: 0,
      notes: "",
      photo: null,
      completed: false,
    })),
  };
}

// ─── 40 Curated Community Patterns ───────────────────────────────────────────

const COMMUNITY_SEEDS: z.input<typeof insertCommunityPatternSchema>[] = [

  // ── TOYS / AMIGURUMI (10) ─────────────────────────────────────────────────

  {
    title: "Strawberry Sweetheart",
    creator: "TinyKnitCo",
    projectType: "Toy",
    skillLevel: "Easy",
    description: "A chubby little strawberry with a leafy green crown and a sweet embroidered face. Perfect first amigurumi.",
    yarnType: "Cotton (DK)",
    size: "~9cm tall when stuffed",
    needsStuffing: "Polyester fiberfill",
    sections: [
      section("Body", [
        "MR: 6 sc (6)",
        "Rnd 2: inc x6 (12)",
        "Rnd 3: (sc, inc) x6 (18)",
        "Rnd 4: (sc 2, inc) x6 (24)",
        "Rnds 5–10: sc around (24)",
        "Rnd 11: (sc 2, dec) x6 (18) — begin stuffing",
        "Rnd 12: (sc, dec) x6 (12) — finish stuffing",
        "Rnd 13: dec x6 (6) — fasten off, close"
      ]),
      section("Leaves & Face", [
        "Join green yarn at top opening — (ch 4, sl st in 2nd ch from hook, sc, hdc, sl st back) x5 for leaves",
        "Embroider 2 black French knots for eyes, small V for nose",
        "Add tiny white seed spots with backstitch",
        "Weave in all ends"
      ]),
    ],
    yarnRequirements: [{ color: "Cherry Red", volume: "~30g" }, { color: "Leaf Green", volume: "~10g" }, { color: "Cream", volume: "~5g" }],
    hookRequirements: [{ size: "3.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Safety eyes", description: "6mm black", quantity: 2 }, { name: "Stitch markers", description: "split-ring", quantity: 2 }],
  },

  {
    title: "Dumpling Bear Cub",
    creator: "HookedByHana",
    projectType: "Toy",
    skillLevel: "Easy",
    description: "A round, squishy bear cub with pudgy arms, a contrast-colour belly, and tiny button nose. Great for gifting.",
    yarnType: "Acrylic (Worsted)",
    size: "~14cm tall",
    needsStuffing: "Polyester fiberfill",
    sections: [
      section("Head", [
        "MR: 6 sc (6)",
        "Rnd 2: inc x6 (12)",
        "Rnd 3: (sc, inc) x6 (18)",
        "Rnd 4: (2 sc, inc) x6 (24)",
        "Rnds 5–10: sc around (24)",
        "Rnd 11: (2 sc, dec) x6 (18)",
        "Stuff firmly. Rnd 12: (sc, dec) x6 (12). Rnd 13: dec x6 (6). Close."
      ]),
      section("Body", [
        "MR: 6 sc, inc x6 (12), (sc, inc) x6 (18), (2sc, inc) x6 (24)",
        "Rnds 5–12: sc around (24)",
        "Join cream for belly: sc 8 in centre-front BLO for contrast patch",
        "Rnd 13: (2sc, dec) x6 (18). Stuff. Rnd 14: (sc, dec) x6 (12). Rnd 15: dec x6 (6). Close."
      ]),
      section("Arms, Ears & Assembly", [
        "Arms (make 2): MR 6, inc x6 (12), sc 8 rounds, stuff lightly, close — sew to sides",
        "Ears (make 2): MR 6, inc x6 (12), fold flat, sc across opening — sew to head top",
        "Attach safety eyes between Rnds 5–6, embroider nose with dark brown",
        "Sew head to body firmly. Weave in all ends."
      ]),
    ],
    yarnRequirements: [{ color: "Honey Brown", volume: "~60g" }, { color: "Warm Cream", volume: "~15g" }],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Safety eyes", description: "12mm black", quantity: 2 }],
  },

  {
    title: "Neon Axolotl",
    creator: "WoolWhimsy",
    projectType: "Toy",
    skillLevel: "Intermediate",
    description: "A smiley pink axolotl with feathery external gills and four little legs. Instantly iconic.",
    yarnType: "Acrylic (DK)",
    size: "~22cm long",
    needsStuffing: "Polyester fiberfill",
    sections: [
      section("Body & Head", [
        "MR: 6 sc. Inc x6 (12). (sc, inc) x6 (18). (2 sc, inc) x6 (24). (3 sc, inc) x6 (30).",
        "Rnds 6–20: sc around (30) — the long body tube",
        "Rnd 21: (3 sc, dec) x6 (24). Rnd 22: (2 sc, dec) x6 (18). Stuff firmly.",
        "Rnd 23: (sc, dec) x6 (12). Rnd 24: dec x6 (6). Close."
      ]),
      section("Gills (make 3)", [
        "MR: 6 sc (6). Inc x6 (12). Sc 4 rnds (12).",
        "Dec x3 to create a tapered stalk (9). Sc 3 more rnds.",
        "Do not stuff — sew to top of head in a fan arrangement",
        "Use pink mohair yarn for fluffy tips if desired"
      ]),
      section("Legs & Tail", [
        "Legs (make 4): ch 6, join into ring, sc 4 rnds, stuff lightly — sew 2 to each side of body",
        "Tail: taper end of body into a fin shape with decreases over 4 rnds",
        "Embroider black eyes, pink cheeks with blush yarn",
        "Attach safety eyes at Rnd 4 of head, pull tight"
      ]),
    ],
    yarnRequirements: [{ color: "Bubblegum Pink", volume: "~70g" }, { color: "Pale Lilac", volume: "~20g" }],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [{ name: "Safety eyes", description: "9mm black", quantity: 2 }],
  },

  {
    title: "Avocado Toast Plushie",
    creator: "CrochetLily",
    projectType: "Toy",
    skillLevel: "Easy",
    description: "Millennial mood: a slice of toast holding a half-avocado, complete with a little brown pit.",
    yarnType: "Cotton (Worsted)",
    size: "~12cm x 10cm",
    needsStuffing: "Polyester fiberfill",
    sections: [
      section("Toast Slice", [
        "Ch 18. Row 1: sc across (17). Ch 1, turn.",
        "Rows 2–16: sc across, ch 1, turn",
        "Round the top two corners with sc2tog at each corner on last row",
        "Sc evenly around all edges in tan yarn for border. Stuff and close."
      ]),
      section("Avocado Half", [
        "MR: 6 sc. Inc x6 (12). (sc, inc) x6 (18). (2 sc, inc) x3 (21) — oval shape",
        "Change to light green for inner flesh for 2 rnds, then dark green for skin edge",
        "Brown centre pit: MR 4, inc x4 (8), sc 2 rnds — sew to centre",
        "Stuff the half lightly and sew flat-side down to toast"
      ]),
      section("Face & Details", [
        "Embroider small dots on toast for 'seeds'",
        "Add safety eyes and smile to avocado half",
        "Optional: red yarn for 'chilli flakes' French knots",
        "Weave in all ends"
      ]),
    ],
    yarnRequirements: [{ color: "Wheat Tan", volume: "~40g" }, { color: "Avocado Green", volume: "~25g" }, { color: "Dark Brown", volume: "~8g" }],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
  },

  {
    title: "Penguin in a Sweater",
    creator: "YarnLily",
    projectType: "Toy",
    skillLevel: "Easy",
    description: "A waddling penguin wearing a tiny knit-look sweater with a colourwork stripe. Too cute.",
    yarnType: "Acrylic (Worsted)",
    size: "~16cm tall",
    needsStuffing: "Polyester fiberfill",
    sections: [
      section("Body", [
        "MR: 6 sc. Inc x6 (12). (sc, inc) x6 (18). (2 sc, inc) x6 (24).",
        "Rnds 5–8: sc in black. Switch to white for belly: sc front 12 sts, black back 12 sts.",
        "Rnds 9–15: continue colour-blocking. Rnd 16: (2 sc, dec) x6 (18).",
        "Rnd 17: (sc, dec) x6 (12). Stuff firmly. Rnd 18: dec x6 (6). Close."
      ]),
      section("Head, Beak & Wings", [
        "Head: MR 6, inc x6 (12), (sc, inc) x6 (18), sc 6 rnds, dec 9 times (9), stuff, close",
        "Beak: ch 4, hdc in 2nd ch from hook, hdc, sl st — fold and sew to face",
        "Wings (make 2): ch 8, hdc across, dec each end for 3 rows — sew to sides",
        "Attach safety eyes at Rnd 3, sew head to body"
      ]),
      section("Mini Sweater", [
        "Ch 24, join. Work 6 rnds of (k2, p2 look) BLO ribbing in contrast colour",
        "Divide for armholes — work body section for 4 rnds",
        "Add 1 stripe row in bright contrast colour at chest",
        "Slide sweater onto penguin and tack in place"
      ]),
    ],
    yarnRequirements: [{ color: "Black", volume: "~50g" }, { color: "White", volume: "~25g" }, { color: "Teal", volume: "~15g" }, { color: "Coral", volume: "~5g" }],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Safety eyes", description: "10mm black", quantity: 2 }],
  },

  {
    title: "Mushroom Cottage Village",
    creator: "CozyCrops",
    projectType: "Toy",
    skillLevel: "Intermediate",
    description: "A set of three mushroom houses with tiny windows and doors — a whimsical display piece or desktop décor.",
    yarnType: "Acrylic (DK)",
    size: "Small 8cm, Medium 12cm, Large 16cm",
    needsStuffing: "Polyester fiberfill",
    sections: [
      section("Stem (each size)", [
        "Small: MR 6, inc x6, (sc, inc) x3 — sc 8 rnds. Medium: inc further to 24, sc 12 rnds. Large: to 30, sc 16 rnds.",
        "Leave top open — stuff firmly before closing",
        "Work windows: small squares of sl sts in cream on front of stem",
        "Embroider door arch in brown backstitch"
      ]),
      section("Cap (each size)", [
        "MR: 6 sc. Inc rounds to match stem diameter + 8 extra sts for overhang",
        "Work cap in red for 4–6 rnds flat, then decrease sharply for dome shape",
        "Add white spots: (ch 3, sl st) clusters scattered across cap",
        "Stuff cap and sew to top of stem"
      ]),
      section("Assembly & Accents", [
        "Crochet tiny mushroom sprouts (MR 4, inc x4, 3 sc rnds) for garden",
        "Make a tiny leaf: (ch 6, dc, hdc, sc, sl st, ch 1, turn) — sew to base",
        "Arrange on a circular crochet base: ch 4, join, 6 sc, inc to 30 — sew all pieces",
        "Add tiny pebbles or beads around base for detail"
      ]),
    ],
    yarnRequirements: [{ color: "Cream White", volume: "~80g" }, { color: "Poppy Red", volume: "~60g" }, { color: "Forest Green", volume: "~20g" }],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
  },

  {
    title: "Lazy Sloth & Tiny Baby",
    creator: "StitchJoy",
    projectType: "Toy",
    skillLevel: "Advanced",
    description: "A detailed mama sloth with wire-poseable arms, textured fur stitch body, and a mini baby clinging to her tummy.",
    yarnType: "Acrylic (DK)",
    size: "Mama ~28cm, Baby ~10cm",
    needsStuffing: "Polyester fiberfill + floral wire for arms",
    sections: [
      section("Mama Body & Head", [
        "Body: work in fur stitch (loop stitch) for textured feel, 30 sts x 20 rnds — stuff",
        "Head: MR 6, inc to 30, sc 10 rnds, decrease to close — attach safety eyes, embroider face",
        "Face disc: separate circle in cream, sc to 24, sew over face area",
        "Claws: ch 4, sl st back for each finger — 3 per hand"
      ]),
      section("Long Arms & Legs", [
        "Arms (make 2): ch 40 — sc in BLO for a corded texture. Thread floral wire through centre.",
        "Legs (make 2): ch 25, sc BLO, wire-armed — sew to lower body",
        "Wrap arm tips around a branch or wire frame to pose",
        "Sew arms to shoulder with double-thread for security"
      ]),
      section("Baby Sloth", [
        "Baby body: MR 6, inc to 18, sc 8 rnds, decrease to close — 10cm stuffed",
        "Baby arms: ch 15 each, wire-free — curl naturally",
        "Embroider tiny face with sleepy expression on baby",
        "Attach baby to mama's belly with a few secure sts"
      ]),
    ],
    yarnRequirements: [{ color: "Taupe Grey", volume: "~120g" }, { color: "Cream", volume: "~30g" }, { color: "Dark Brown", volume: "~10g" }],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [{ name: "Safety eyes", description: "14mm amber", quantity: 2 }, { name: "Floral wire", description: "2mm gauge", quantity: 1 }],
  },

  {
    title: "Cinnamoroll Puppy",
    creator: "MoonYarns",
    projectType: "Toy",
    skillLevel: "Easy",
    description: "Inspired by the iconic blue-eyed puppy with a big round head and tiny pink cheeks. Irresistibly soft.",
    yarnType: "Acrylic (DK)",
    size: "~18cm seated",
    needsStuffing: "Polyester fiberfill",
    sections: [
      section("Big Round Head", [
        "MR: 6. Inc x6 (12). (sc, inc) x6 (18). (2sc, inc) x6 (24). (3sc, inc) x6 (30). (4sc, inc) x6 (36).",
        "Rnds 7–16: sc around (36) — the big round head is the focal point",
        "Decrease back: (4sc, dec) x6 (30). (3sc, dec) x6 (24). Stuff well.",
        "(2sc, dec) x6 (18). (sc, dec) x6 (12). dec x6 (6). Close."
      ]),
      section("Body & Tail", [
        "Body: MR 6, inc to 24, sc 10 rnds, decrease to close — stuff",
        "Tail: ch 12, sc back from hook — curl into a spiral cinnamon roll shape, sew to back",
        "Ears: long floppy drops — ch 8, hdc across, dec 1 each row for 4 rows — sew to top of head",
        "Front paws: small oval flatten discs, sew to base of body"
      ]),
      section("Face Details", [
        "Blue button eyes — position between Rnds 8–9, pull tight",
        "Embroider a tiny oval nose in dark pink",
        "Blush cheeks: 6-st circles in pink, sew flat to cheeks",
        "Optional: tiny blue ribbon bow between ears"
      ]),
    ],
    yarnRequirements: [{ color: "Snow White", volume: "~80g" }, { color: "Blush Pink", volume: "~10g" }],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [{ name: "Safety eyes", description: "9mm blue", quantity: 2 }],
  },

  {
    title: "Rainbow Cactus Trio",
    creator: "HookedByHana",
    projectType: "Toy",
    skillLevel: "Easy",
    description: "Three desert cactus pals in bold pastel colours with tiny flower toppers, in individual terracotta-look pots.",
    yarnType: "Cotton (DK)",
    size: "~10–14cm tall in pots",
    needsStuffing: "Polyester fiberfill + dried beans for pot weight",
    sections: [
      section("Cactus Body (each)", [
        "Tall: MR 6, inc x6 (12), (sc, inc) x6 (18) — sc 18 rnds in BLO for ribbed texture",
        "Short/Round: MR 6, inc to 18, inc to 24 — sc 8 rnds then decrease to close",
        "Mini: MR 6, inc to 12 — sc 6 rnds. All: stuff firmly before closing.",
        "Arms: ch 8, sc back, sew to sides of tall cactus"
      ]),
      section("Pots", [
        "Pot: MR 6, inc x6 (12), sc in back loops for base ridge, sc up sides for 6 rnds",
        "Rim: final rnd — inc every 4th st for flared edge",
        "Fill pot base with dried beans wrapped in felt for stability",
        "Place stuffed cactus in pot and tack with a few sts"
      ]),
      section("Flowers & Spines", [
        "Tiny flower: (ch 4, sl st) x5 into MR — make in yellow, pink or white",
        "Sew flower to top of each cactus",
        "Spines: short lengths of stiff thread or embroidery floss, loop-knotted through sts",
        "Weave in all ends"
      ]),
    ],
    yarnRequirements: [{ color: "Sage Green", volume: "~50g" }, { color: "Terracotta", volume: "~40g" }, { color: "Buttercup Yellow", volume: "~10g" }, { color: "Dusty Rose", volume: "~8g" }],
    hookRequirements: [{ size: "3.0mm", quantity: 1 }],
  },

  {
    title: "Sushi Roll Collection",
    creator: "CozyCrops",
    projectType: "Toy",
    skillLevel: "Intermediate",
    description: "A set of six sushi pieces: maki rolls, nigiri, and a tamago piece — realistic colours, incredibly giftable.",
    yarnType: "Cotton (DK)",
    size: "Each piece ~5–7cm",
    needsStuffing: "Polyester fiberfill",
    sections: [
      section("Maki Rolls (make 2)", [
        "Rice: MR 6, inc to 18, sc 4 rnds in white — cylindrical",
        "Nori wrap: ch 18, join — 2 rnds in black around the cylinder",
        "Filling: stuff with a contrasting colour yarn ball for red/orange 'fish'",
        "Sew top closed, add sesame seed dots with cream French knots"
      ]),
      section("Nigiri (make 2)", [
        "Rice bed: ch 10, sc across, inc 1 each end, 3 rows — oval rice mound, stuff",
        "Fish topping: ch 10, hdc across, slight shaping — in salmon pink or tuna red",
        "Drape fish over rice mound and stitch in place",
        "Optional: tiny black nori strip around centre"
      ]),
      section("Tamago & Tray", [
        "Tamago: same as nigiri rice, topping in yellow — embroider faint ridges",
        "Serving tray: ch 20, sc across, 2 rows — form a shallow box shape in dark wood-brown",
        "Arrange all 6 pieces on tray, tack lightly",
        "Weave in all ends"
      ]),
    ],
    yarnRequirements: [{ color: "White", volume: "~30g" }, { color: "Black", volume: "~20g" }, { color: "Salmon Pink", volume: "~15g" }, { color: "Canary Yellow", volume: "~10g" }],
    hookRequirements: [{ size: "2.5mm", quantity: 1 }],
  },

  // ── WEARABLE (10) ────────────────────────────────────────────────────────

  {
    title: "Ribbed Autumn Beanie",
    creator: "CozyCrops",
    projectType: "Wearable",
    skillLevel: "Easy",
    description: "A chunky BLO-ribbed beanie that works up in 90 minutes. Stretchy fit, cosy feel — your go-to winter hat.",
    yarnType: "Acrylic (Bulky)",
    size: "One size fits most adults (56–60cm head circumference)",
    sections: [
      section("Crown", [
        "MR: 6 sc. Rnd 2: inc x6 (12). Rnd 3: (sc, inc) x6 (18). Rnd 4: (2sc, inc) x6 (24).",
        "Rnd 5: (3sc, inc) x6 (30). Rnd 6: (4sc, inc) x6 (36).",
        "Continue increasing every rnd (+6) until 54 sts for adult hat",
        "Work 2 plain rnds flat to confirm correct diameter before starting sides"
      ]),
      section("Body & Brim", [
        "Rnds 1–8: sc in BLO only — creates a ribbed texture automatically",
        "Work until hat body is 15cm from crown",
        "Brim: switch to sl st in BLO for 4 rnds for a firmer fold-back edge",
        "Fasten off, weave in ends — hat is complete"
      ]),
    ],
    yarnRequirements: [{ color: "Burnt Sienna", volume: "~120g" }],
    hookRequirements: [{ size: "6.0mm", quantity: 1 }],
  },

  {
    title: "Wildflower Cottagecore Cardigan",
    creator: "YarnLily",
    projectType: "Wearable",
    skillLevel: "Advanced",
    description: "An open-front cardigan with a wildflower-stitch yoke and bell cuffs. Romantic and heirloom-worthy.",
    yarnType: "Wool (DK)",
    size: "XS–XL (written for S; adjust chain for other sizes)",
    sections: [
      section("Yoke (worked top-down)", [
        "Foundation: ch 80. Row 1: dc across, ch 3, turn.",
        "Raglan increases: place markers at 4 points, inc 2 sts either side every RS row — 8 incs per row",
        "Work yoke for 24 rows total — raglan seams define armhole placement",
        "Wildflower motif: every 6th dc column, work a raised puff stitch blossom"
      ]),
      section("Body", [
        "Separate arms at markers — join underarm, ch 4, continue body in the round",
        "Work in (dc 4, shell st) repeat for 30cm body length",
        "Front bands: sc evenly down both fronts, adding 5 evenly-spaced buttonholes on right band",
        "Lower hem: 3 rnds of picot edging in matching or contrast colour"
      ]),
      section("Sleeves & Finishing", [
        "Pick up armhole sts, join — work sleeves in the round for 35cm",
        "Bell cuff: inc 1 st every 3rd st in last 5 rnds for flared end",
        "Final cuff rnd: shell st edging (sc, skip 1, 5dc in next, skip 1) around",
        "Block and press on a dress form, sew on vintage buttons"
      ]),
    ],
    yarnRequirements: [{ color: "Sage Green", volume: "~450g" }, { color: "Cream", volume: "~80g" }],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Buttons", description: "18mm mother-of-pearl", quantity: 5 }, { name: "Stitch markers", description: "locking", quantity: 8 }],
  },

  {
    title: "Lace Shell Summer Top",
    creator: "MoonYarns",
    projectType: "Wearable",
    skillLevel: "Intermediate",
    description: "A breezy, lace-weight summer top with a shell stitch body and adjustable tie-shoulder straps.",
    yarnType: "Cotton (DK)",
    size: "XS, S, M, L — worked in rows",
    sections: [
      section("Back Panel", [
        "Ch 62 (68, 74, 80). Row 1 (RS): sc, *skip 2, 5dc in next (shell), skip 2, sc* across.",
        "Row 2 (WS): ch 3, 2dc in first sc, *sc in 3rd dc of shell, shell in sc* across",
        "Repeat Rows 1–2 for 35 (36, 37, 38) cm total length",
        "Armhole shaping: sl st over first shell each side for 2 rows"
      ]),
      section("Front Panel & Straps", [
        "Work front identical to back",
        "Join shoulders at top with sc seam on RS",
        "Straps: ch 60 at each shoulder point — test length before fastening off",
        "Tie straps in a bow or knot at the neck"
      ]),
      section("Edging", [
        "Join sides with sc seam, leaving bottom 4cm open as side slits",
        "Neck edge: 2 rnds sc in contrasting colour",
        "Hem: picot edging: sc, (ch 3, sl st in same st, sc 2) around",
        "Block flat, lightly press with damp cloth"
      ]),
    ],
    yarnRequirements: [{ color: "Ivory White", volume: "~220g" }],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
  },

  {
    title: "Teddy Bear Ear Warmer",
    creator: "TinyKnitCo",
    projectType: "Wearable",
    skillLevel: "Easy",
    description: "A BLO-ribbed headband with two fluffy teddy ears on top. Kids and adults love it equally.",
    yarnType: "Acrylic (Worsted)",
    size: "Child 46cm / Adult 56cm",
    sections: [
      section("Headband", [
        "Ch 10 (10). Row 1: sc across (9). Ch 1, turn.",
        "All rows: sc in BLO — this creates the ribbed texture",
        "Work until band measures 46cm (child) or 56cm (adult) un-stretched",
        "Join ends with sc seam or mattress stitch"
      ]),
      section("Ears (make 2)", [
        "Outer ear: MR 6, inc x6 (12), sc around (12) — 2 rnds flat",
        "Inner ear: MR 4, inc x4 (8) in pink/contrast — sew inside outer ear",
        "Pinch base of ear slightly and sew firmly to headband seam area",
        "Weave in all ends — done!"
      ]),
    ],
    yarnRequirements: [{ color: "Warm Caramel", volume: "~60g" }, { color: "Blush Pink", volume: "~10g" }],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
  },

  {
    title: "Striped Knee-High Socks",
    creator: "StitchJoy",
    projectType: "Wearable",
    skillLevel: "Intermediate",
    description: "Colour-blocked knee-highs with a reinforced heel, ribbed cuff and toe. Worked top-down in the round.",
    yarnType: "Wool (Fingering)",
    size: "Women's S (36–38) / M (39–41)",
    sections: [
      section("Cuff & Leg", [
        "Cast on 72 (80) sts, join. Work (ch 2, dc2tog, ch 2, sl st) rib for 8cm.",
        "Switch to stripe pattern: 4 rnds Colour A, 4 rnds Colour B — work for 30cm knee length",
        "Decrease 4 sts at the ankle over 2 rnds: 64 (72) sts at ankle",
        "Work 4 more rnds plain to reach the ankle"
      ]),
      section("Heel Flap & Turn", [
        "Heel flap: work flat on 32 (36) heel sts, sl st 1, sc across — 16 rows",
        "Heel turn: dec toward centre over 4 rows — creates the pocket",
        "Pick up 16 sts each side of heel flap, join to work in round again",
        "Gusset decrease: dec 1 each side every other rnd until 64 (72) sts remain"
      ]),
      section("Foot & Toe", [
        "Work foot plain in main colour for 20cm or to 2cm before desired length",
        "Toe: (sc 6, dec) x8 (56 sts). Continue decreasing 8 sts every rnd until 16 sts remain.",
        "Break yarn, thread through remaining sts, pull tight",
        "Weave in ends, block on sock blockers"
      ]),
    ],
    yarnRequirements: [{ color: "Dusty Mauve", volume: "~150g" }, { color: "Sage Green", volume: "~80g" }],
    hookRequirements: [{ size: "2.25mm", quantity: 1 }],
  },

  {
    title: "Crescent Moon Shawl",
    creator: "WoolWhimsy",
    projectType: "Wearable",
    skillLevel: "Intermediate",
    description: "A crescent-shaped shawlette in halo mohair with a star-stitch pattern and long fringe ends.",
    yarnType: "Kid Mohair (Lace, held double)",
    size: "~145cm wingspan x 45cm depth",
    sections: [
      section("Main Body", [
        "Ch 4, join. Row 1: work (dc, ch 1) x 5 in ring — first fan.",
        "Short rows with increases at both ends and centre spine every RS row",
        "Star stitch repeat: sc 3, *insert hook in each of last 3 sts + 1 ch sp, yo, pull through, yo, pull through all — ch 1* across",
        "Work until shawl is 45cm at deepest point"
      ]),
      section("Borders & Fringe", [
        "Picot border: sc, ch 3, sl st in sc, sc 2 — repeat along entire curved edge",
        "Spine line: ch 3 arches along centre-increase line for definition",
        "Fringe: cut 30cm lengths, fold double, loop-knot through each picot point",
        "Trim fringe to even length, steam-block to open lace pattern"
      ]),
    ],
    yarnRequirements: [{ color: "Dusty Lavender", volume: "~200g" }],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
  },

  {
    title: "Boho Mesh Crop Vest",
    creator: "CrochetLily",
    projectType: "Wearable",
    skillLevel: "Intermediate",
    description: "An open-mesh festival vest with a v-neck and bottom fringe trim. Pairs perfectly with a bralette.",
    yarnType: "Cotton (DK)",
    size: "XS–L (worked flat, seamed at sides)",
    sections: [
      section("Front Panel", [
        "Ch 61 (69, 77, 85). Row 1 (RS): sc, *ch 3, skip 3, sc*, ending sc. Ch 4, turn.",
        "Row 2 (WS): *sc in ch-3 sp, ch 3*, ending dc in last sc. Ch 1, turn.",
        "Repeat Rows 1–2 for 30cm body length",
        "V-neck shaping: work each half separately, decreasing 1 mesh at neck edge every 4 rows"
      ]),
      section("Back & Assembly", [
        "Work back panel identically (no V-neck shaping — straight top edge)",
        "Join shoulder seams with sc on RS — seam becomes a decorative ridge",
        "Side seams: sc from bottom, leaving 4cm open at armhole",
        "Armhole edging: 2 rnds sc around each armhole"
      ]),
      section("Neck & Fringe Hem", [
        "Neck: sc evenly around V-neck opening, 3 sc at V-point to keep angle sharp",
        "Fringe: cut 20cm lengths of cotton, attach every other chain space across hem",
        "Optional: braid every 3 fringe strands for a macramé-style finish",
        "Block flat, hang to dry"
      ]),
    ],
    yarnRequirements: [{ color: "Natural Ecru", volume: "~280g" }],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
  },

  {
    title: "Heritage Lace Baby Bonnet",
    creator: "TinyKnitCo",
    projectType: "Wearable",
    skillLevel: "Easy",
    description: "A delicate heirloom-style baby bonnet with a simple shell-lace brim and satin ribbon ties.",
    yarnType: "Cotton (DK)",
    size: "Newborn / 0–3m / 3–6m",
    sections: [
      section("Crown", [
        "Ch 60 (65, 70). Row 1: sc across. Ch 3, turn.",
        "Row 2 (RS): *dc 2, skip 1, shell of 3dc in next, skip 1* across — shell row",
        "Row 3: sc across. Repeat Rows 2–3 for 8cm cap depth.",
        "Fold and sc-seam back edge of crown together"
      ]),
      section("Brim & Ties", [
        "Turn bonnet right way out. Pick up sts along front curved edge.",
        "Brim Row 1: sc evenly across front curved edge",
        "Brim Row 2: shell stitch (3dc, ch 1, 3dc) in alternate sts",
        "Ties: ch 40 each side — can sub satin ribbon threaded through edge"
      ]),
    ],
    yarnRequirements: [{ color: "Soft White", volume: "~60g" }],
    hookRequirements: [{ size: "3.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Satin ribbon", description: "6mm wide, 80cm total", quantity: 1 }],
  },

  {
    title: "Fair Isle Star Mittens",
    creator: "MoonYarns",
    projectType: "Wearable",
    skillLevel: "Advanced",
    description: "Nordic-style colour-work mittens with an eight-pointed star chart, thumb gusset, and cosy fleece lining option.",
    yarnType: "Wool (DK)",
    size: "Women's S / M (worked in the round)",
    sections: [
      section("Cuff", [
        "Ch 40 (44), join. Work (BLO sc) rib for 6cm in MC only.",
        "Switch to two-colour work: carry CC loosely behind MC",
        "Cuff border chart: 3 rnds of alternating dots pattern before star section",
        "Increase 4 sts evenly on last cuff rnd: 44 (48) sts"
      ]),
      section("Star Chart & Thumb Gusset", [
        "Begin 8-point star chart (24-rnd repeat) across palm",
        "Thumb gusset: place marker at thumb position, inc 2 sts every 3rd rnd for 9 rnds: 20 thumb sts",
        "Place thumb sts on waste yarn, ch 2 across gap, continue hand",
        "Complete star chart, decrease for fingertip over 4 rnds, close"
      ]),
      section("Thumb", [
        "Pick up 20 thumb sts + 2 from gap (22). Join and work in the round.",
        "Work 6 rnds of SC in MC only for thumb",
        "Decrease: (sc 2, dec) x5 (17). Final rnd: dec x8 (9). Close.",
        "Weave in all colour-work ends on WS, block on mitten blockers"
      ]),
    ],
    yarnRequirements: [{ color: "Midnight Navy", volume: "~100g" }, { color: "Snowflake White", volume: "~50g" }],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
  },

  {
    title: "Balloon Sleeve Crop Top",
    creator: "StitchJoy",
    projectType: "Wearable",
    skillLevel: "Intermediate",
    description: "A structured crop top with dramatic puffed sleeves gathered into fitted cuffs. Perfect for summer evenings.",
    yarnType: "Cotton (DK)",
    size: "XS, S, M — worked seamlessly top-down",
    sections: [
      section("Yoke & Body", [
        "Ch 64 (72, 80) for neck. Row 1: dc across. Mark raglan points (4 markers).",
        "Increase 8 sts per RS row at raglan markers for 18 rows — yoke complete",
        "Divide for sleeves at markers. Ch 6 each underarm. Join body and work 10cm.",
        "Hem: work 3 rnds of sc for a clean edge, fasten off"
      ]),
      section("Puff Sleeves", [
        "Pick up sleeve sts + underarm chain — work in round for 8cm",
        "Balloon shaping: inc 2 every 3rd st every rnd for 8 rnds — creates balloon shape",
        "Work 4 more rnds at widest point, then decrease sharply back to cuff width",
        "Cuff: sc in BLO for 4cm — fitted contrast to the puff"
      ]),
    ],
    yarnRequirements: [{ color: "Terracotta Rust", volume: "~300g" }],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
  },

  // ── HOME DECOR (10) ──────────────────────────────────────────────────────

  {
    title: "Vintage Rainbow Ripple Blanket",
    creator: "YarnLily",
    projectType: "Home Decor",
    skillLevel: "Intermediate",
    description: "A full-size throw in the classic ripple chevron stitch with 10 vintage rainbow colours. Timeless.",
    yarnType: "Acrylic (Worsted)",
    size: "130 x 160cm",
    sections: [
      section("Foundation & Pattern Set-up", [
        "Ch 201 (multiple of 18 + 3) in first colour.",
        "Row 1: sc in 2nd ch from hook, sc 7, 3sc in next (peak), sc 8, skip 2 (valley), repeat across",
        "Ch 1, turn — this sets the chevron rhythm for all subsequent rows",
        "Change colour every 2 rows: join new colour at end of row with sl st"
      ]),
      section("Main Body", [
        "Continue ripple pattern for 160 rows — change colour every 2 rows through rainbow sequence",
        "Colour order: coral, orange, amber, yellow, sage, teal, sky, periwinkle, lavender, rose",
        "Keep tension very even — peaks and valleys should stay consistent throughout",
        "Carry unused yarns loosely up the side to minimise ends"
      ]),
      section("Border", [
        "Join white yarn. Work 2 rnds sc around entire blanket, 3sc at corners.",
        "Final rnd: (sc 3, ch 2) picot border along top and bottom edges",
        "Weave in all colour ends as you go to avoid a daunting finish pile",
        "Block if needed — lay flat, mist with water, leave to dry"
      ]),
    ],
    yarnRequirements: [
      { color: "Coral", volume: "~80g" }, { color: "Amber", volume: "~80g" },
      { color: "Yellow", volume: "~80g" }, { color: "Sage", volume: "~80g" },
      { color: "Sky Blue", volume: "~80g" }, { color: "Lavender", volume: "~80g" },
      { color: "White", volume: "~100g" },
    ],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
  },

  {
    title: "Boho Peacock Feather Wall Art",
    creator: "CozyCrops",
    projectType: "Home Decor",
    skillLevel: "Advanced",
    description: "An oversized woven wall hanging with three crocheted peacock feather motifs and layered fringe. A statement piece.",
    yarnType: "Cotton (Worsted)",
    size: "~60cm wide x 90cm tall with fringe",
    sections: [
      section("Peacock Feather Motif (make 3)", [
        "Centre: ch 30, sc back to form a spine",
        "Barbs: along spine, work (ch 5, sc back, sl st to spine) every other st — both sides",
        "Eye: join teal at tip — MR 6, inc to 18, sc 2 rnds in teal. Ring of gold sc. Centre of black sc.",
        "Curl barbs gently for a natural look"
      ]),
      section("Woven Background Panel", [
        "Driftwood dowel: ch over rod to create a 60cm hanging surface",
        "Warp threads: hang 80cm lengths of ecru cotton as warp, 40 threads across",
        "Weave cream and tan weft rows through warp: plain weave for 40cm",
        "Fringe layers: cut graduated lengths 15, 25, 40cm — attach to bottom of woven section"
      ]),
      section("Assembly & Hanging", [
        "Lay feathers over woven background — pin to find best arrangement",
        "Stitch feathers to background at spine points",
        "Trim and separate fringe strands — braid every 4 strands for texture",
        "Knot a leather cord through dowel ends for hanging"
      ]),
    ],
    yarnRequirements: [{ color: "Ecru", volume: "~200g" }, { color: "Teal", volume: "~60g" }, { color: "Gold", volume: "~40g" }, { color: "Navy", volume: "~30g" }],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
  },

  {
    title: "Chunky Woven Storage Basket",
    creator: "WoolWhimsy",
    projectType: "Home Decor",
    skillLevel: "Easy",
    description: "A rigid-sided basket in chunky cotton rope. The woven-look texture comes from simple BLO single crochet.",
    yarnType: "Cotton (Chunky Rope)",
    size: "~28cm diameter x 22cm tall",
    sections: [
      section("Base", [
        "MR: 6 sc. Rnd 2: inc x6 (12). Rnd 3: (sc, inc) x6 (18). Continue increasing every rnd (+6).",
        "Stop increasing at 48 sts — about 28cm diameter",
        "Work 1 rnd of sl sts in BLO — this creates the crisp base-to-wall transition fold line",
        "Do not stuff — the rope holds its shape naturally"
      ]),
      section("Walls", [
        "From fold line, sc all sts in BLO — every rnd creates a stacked woven look",
        "Work straight walls for 22cm — no increases or decreases",
        "Final 2 rnds: sc in both loops for a stronger rim",
        "Optional: reinforce inside with a plastic basket insert"
      ]),
      section("Handles (make 2)", [
        "Ch 16. Sc in 2nd ch from hook — form a rectangular handle strap.",
        "Work 3 rows of sc for thickness",
        "Fold handle in half and sc the two sides together for a corded look",
        "Attach firmly to either side of basket rim with 12 sc over the handle base"
      ]),
    ],
    yarnRequirements: [{ color: "Natural White", volume: "~400g" }],
    hookRequirements: [{ size: "8.0mm", quantity: 1 }],
  },

  {
    title: "Wildflower Hexagon Throw",
    creator: "CrochetLily",
    projectType: "Home Decor",
    skillLevel: "Intermediate",
    description: "Sixty 15cm hexagons, each with a different wildflower centre, joined as-you-go into a lap throw.",
    yarnType: "Acrylic (DK)",
    size: "~120 x 90cm",
    sections: [
      section("Hexagon Motif (make 60)", [
        "Rnd 1: MR — 12 dc in main colour for flower centre",
        "Rnd 2: petal round — (ch 2, 3dc cl, ch 2, sl st) x6 in alternate sts",
        "Rnd 3: join background colour. Work 2dc, 3dc corner, 2dc across each of 6 sides.",
        "Rnd 4: (3dc, ch 2, 3dc) at each corner — hexagon shape fully formed"
      ]),
      section("Join As You Go", [
        "From motif 2 onwards: at joining edges, replace ch 2 corner with ch 1, sl st to neighbour, ch 1",
        "Join in 5 rows of 12 hexagons — starting from centre and working outward",
        "Fill in with half-hexagon triangles at straight edges for a rectangular shape",
        "Check joins are flat — redo any that pucker"
      ]),
      section("Edging", [
        "Join border colour. Sc around entire throw, 3 sc at each outer corner.",
        "Rnd 2: picot edging — sc 3, (ch 3, sl st in sc, sc 3) around",
        "Weave in remaining ends — use a blunt needle for neatness",
        "Machine wash gentle, reshape and lay flat to dry"
      ]),
    ],
    yarnRequirements: [{ color: "Cream", volume: "~200g" }, { color: "Wildflower Mix", volume: "~300g (assorted)" }],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
  },

  {
    title: "Sage & Flax Kitchen Mat",
    creator: "HookedByHana",
    projectType: "Home Decor",
    skillLevel: "Easy",
    description: "A durable kitchen runner in two-tone cotton, worked in the herringbone half-double stitch for a woven look.",
    yarnType: "Cotton (Worsted)",
    size: "~40 x 70cm",
    sections: [
      section("Main Body", [
        "Ch 50. Row 1: herringbone hdc across — insert hook into back bump of hdc instead of normal stitch.",
        "Row 2: ch 1, turn. Herringbone hdc across.",
        "Change colour every 10 rows: Colour A 10 rows, Colour B 10 rows — alternate for 70cm",
        "Keep tension firm for a non-slip mat that holds its shape"
      ]),
      section("Edging", [
        "Sc evenly around all 4 sides, 3 sc at corners",
        "Rnd 2: reverse sc (crab stitch) around for a decorative corded edge",
        "Weave in all ends on wrong side",
        "Optional: add a non-slip rug backing fabric with fabric glue"
      ]),
    ],
    yarnRequirements: [{ color: "Sage Green", volume: "~120g" }, { color: "Natural Flax", volume: "~120g" }],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
  },

  {
    title: "Trailing Vine Plant Hanger",
    creator: "TinyKnitCo",
    projectType: "Home Decor",
    skillLevel: "Easy",
    description: "A single-plant macramé-style hanger with crocheted net cradle and spiral-twisted cords. Holds pots up to 15cm.",
    yarnType: "Natural Cotton Rope (3-ply)",
    size: "~80cm total length including fringe",
    sections: [
      section("Hanging Cord & Crown", [
        "Cut 8 lengths of rope, 200cm each. Fold in half, tie through ring.",
        "Crown: ch 8, join into ring — sc 8 rnds for a snug crown wrap around ropes",
        "Separate into 4 pairs of 2 ropes each",
        "Spiral twist: twist each pair for 20cm — the pairs naturally spiral against each other"
      ]),
      section("Cradle Net", [
        "Work net at 40cm mark: take one rope from each adjacent pair",
        "Ch 12 to connect adjacent pairs — repeat for all 4 cross-joins: forms a diamond net",
        "Repeat diamond row 2cm lower for a double-layer cradle",
        "Gather all 8 ropes together at base, tie with overhand knot"
      ]),
      section("Fringe & Finishing", [
        "Trim rope ends evenly below gathering knot — 15cm fringe",
        "Unravel rope plies for a fluffy fringe effect",
        "Trim to a V-shape or cut straight — hang and test weight with a filled pot",
        "Optional: thread wooden beads on spiral sections before connecting"
      ]),
    ],
    yarnRequirements: [{ color: "Natural Ecru", volume: "~200g" }],
    hookRequirements: [{ size: "6.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Metal ring", description: "4cm brass or copper ring", quantity: 1 }],
  },

  {
    title: "Checkerboard Boucle Cushion",
    creator: "MoonYarns",
    projectType: "Home Decor",
    skillLevel: "Intermediate",
    description: "A graphic 45x45cm cushion in matte black and cloud-white boucle — the perfect Scandi living room accent.",
    yarnType: "Acrylic Boucle (Chunky)",
    size: "45 x 45cm cushion cover",
    sections: [
      section("Front Panel", [
        "Ch 44. Row 1 (RS): dc 4 in MC, change to CC, dc 4, change back — checkerboard begins.",
        "Carry unused colour loosely across back — do not cut between colour blocks.",
        "Work 44 rows of dc — every 4 rows shift the checkerboard by 4 sts for true offset",
        "Fasten off MC. Edging row: sc all around in CC."
      ]),
      section("Back Panel & Assembly", [
        "Work back panel in plain dc, single colour — same dimensions as front",
        "Place panels WS together. Sc 3 sides together using CC.",
        "Insert 45x45cm cushion pad.",
        "Sc 4th side closed — or add button closure for removable cover"
      ]),
    ],
    yarnRequirements: [{ color: "Jet Black", volume: "~200g" }, { color: "Cloud White", volume: "~200g" }],
    hookRequirements: [{ size: "7.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Cushion pad", description: "45x45cm polyester", quantity: 1 }],
  },

  {
    title: "Dreamy Ombre Baby Blanket",
    creator: "CozyCrops",
    projectType: "Home Decor",
    skillLevel: "Easy",
    description: "A soft, cloud-like baby blanket that fades from blush to lilac using a gradient yarn and simple texture stitch.",
    yarnType: "Acrylic (DK, gradient ball)",
    size: "~75 x 95cm",
    sections: [
      section("Main Body", [
        "Ch 100. Row 1: sc across (99). Ch 1, turn.",
        "Texture rows: alternate between sc and (ch 1, skip 1, sc) rows — creates a simple eyelet pattern",
        "The gradient ball handles colour changes automatically — no cutting needed",
        "Work until blanket is 95cm — approximately 130 rows with DK weight"
      ]),
      section("Border", [
        "Join a coordinating solid pastel yarn for border",
        "Rnd 1: sc evenly around all 4 sides, 3 sc at each corner",
        "Rnd 2: (sc 2, ch 2, sc 2) picot in every 4th st — sweet ruffle effect",
        "Fasten off, weave in ends. Machine wash warm, tumble dry low."
      ]),
    ],
    yarnRequirements: [{ color: "Blush to Lilac Gradient", volume: "~400g" }, { color: "Soft Lilac (border)", volume: "~50g" }],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
  },

  {
    title: "Celestial Star Mobile",
    creator: "StitchJoy",
    projectType: "Home Decor",
    skillLevel: "Advanced",
    description: "A nursery mobile with a crescent moon, five stars, and three cloud puffs, all in muted sage and gold.",
    yarnType: "Cotton (DK)",
    size: "~35cm diameter, 50cm drop",
    sections: [
      section("Crescent Moon", [
        "Large circle: MR 6, inc every rnd to 48 sts — stuff and close",
        "Small circle: same process to 36 sts — stuff and close",
        "Overlap small circle over large, sew together along the overlap arc — creates the crescent",
        "Embroider a tiny sleeping face at the 3-o'clock position"
      ]),
      section("Stars (make 5) & Clouds (make 3)", [
        "Star: ch 2, *5dc in first ch (corner), ch 1, sl st in next* x5 — simple flat star",
        "Make 2 star layers per star, sc around edges together, stuff lightly",
        "Cloud: (MR 6, sl st) x3 — three connected ovals. Stuff and sc all edges shut.",
        "Embroider tiny dots on clouds"
      ]),
      section("Mobile Frame & Hanging", [
        "Cover a 35cm embroidery hoop with sc in cream yarn",
        "Hang all pieces from hoop at varying lengths with cotton string: moon longest, stars mid, clouds short",
        "Space evenly around the hoop — check balance before tying off",
        "Top loop: wrap string around hoop at 4 equidistant points, gather, tie"
      ]),
    ],
    yarnRequirements: [{ color: "Sage Green", volume: "~80g" }, { color: "Gold", volume: "~50g" }, { color: "Soft White", volume: "~40g" }],
    hookRequirements: [{ size: "3.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Embroidery hoop", description: "35cm wooden", quantity: 1 }, { name: "Cotton string", description: "natural, 2m", quantity: 1 }],
  },

  {
    title: "Trio Nesting Bowls",
    creator: "WoolWhimsy",
    projectType: "Home Decor",
    skillLevel: "Easy",
    description: "Three graduated bowls (small, medium, large) in terracotta, rust and cream — perfect for keys, jewellery or snacks.",
    yarnType: "Cotton (DK)",
    size: "S 10cm / M 16cm / L 22cm diameter",
    sections: [
      section("Bowls (one method, three sizes)", [
        "Small: MR 6, inc to 30 sts for flat base. Switch to sc in BLO for 6 straight rnds.",
        "Medium: inc to 48 sts base. Straight walls for 8 rnds.",
        "Large: inc to 66 sts base. Straight walls for 10 rnds.",
        "All bowls: starch heavily with fabric starch spray and shape while damp"
      ]),
      section("Rim & Stiffening", [
        "Each bowl: final rnd worked in both loops with a reverse sc (crab stitch) for a neat, firm edge",
        "Mix fabric stiffener with water 50:50, brush generously over entire bowl",
        "Shape over an appropriate bowl or plate and leave until bone dry (overnight)",
        "Remove from mould — bowl will hold its shape permanently"
      ]),
    ],
    yarnRequirements: [{ color: "Terracotta", volume: "~100g" }, { color: "Rust", volume: "~80g" }, { color: "Cream", volume: "~60g" }],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [{ name: "Fabric stiffener", description: "250ml bottle", quantity: 1 }],
  },

  // ── ACCESSORIES (10) ─────────────────────────────────────────────────────

  {
    title: "Natural Raffia Market Tote",
    creator: "CrochetLily",
    projectType: "Accessory",
    skillLevel: "Easy",
    description: "A structured beach bag in natural raffia with long handles and a optional interior cotton liner.",
    yarnType: "Raffia Yarn",
    size: "~35cm wide x 30cm tall + handles",
    sections: [
      section("Base & Body", [
        "Ch 41. Row 1: sc across (40). Work 4 rows sc for flat base.",
        "Join into round: sc up one short side, 40 sc along top, sc down other short side — oval base",
        "Walls: sc in BLO every rnd for woven texture — work for 28cm",
        "Flat top opening: sc in both loops for final 3 rnds to stabilise top"
      ]),
      section("Handles (make 2)", [
        "Ch 80. Sc back along chain for a 3-layer thick handle strip.",
        "Work 4 rows sc — press flat, handles should be firm and non-stretchy",
        "Attach handles 8cm in from each side at the top of the bag — stitch a square with X centre for strength",
        "Reinforce attachment point with 2–3 passes of thread"
      ]),
      section("Optional Liner", [
        "Cut cotton fabric 2x body panel + base shape with 1.5cm seam allowance",
        "Stitch lining bag with sewing machine, leaving top open",
        "Drop inside bag, fold top edge over bag rim, slip-stitch to interior",
        "Wipe bag clean with damp cloth — do not machine wash raffia"
      ]),
    ],
    yarnRequirements: [{ color: "Natural Straw", volume: "~250g" }],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
  },

  {
    title: "French Artist Beret",
    creator: "HookedByHana",
    projectType: "Accessory",
    skillLevel: "Intermediate",
    description: "A classic flat-top beret with a fitted band and dramatic oversized crown. The Parisian essential.",
    yarnType: "Wool (DK)",
    size: "One size (55–60cm head) — adjust band to fit",
    sections: [
      section("Crown (worked top-down)", [
        "MR: 6 sc. Inc x6 every rnd to 96 sts — roughly 30cm diameter for the flat top.",
        "Work 2 plain rnds to set the flat crown shape",
        "Begin decreasing: (dec, sc 10) x8 (88). (dec, sc 9) x8 (80). (dec, sc 8) x8 (72).",
        "Continue decreasing until 54 sts at mid-head"
      ]),
      section("Band", [
        "Change to BLO sc for 3 rnds (creates a ridge fold at the beret edge)",
        "Rib band: ch 8. Work sc in BLO rows for a 2.5cm wide rib strip.",
        "Join rib strip into a circle sized to head circumference",
        "Sew rib band to bottom edge of crown"
      ]),
      section("Pom & Finishing", [
        "Centre top button: wrap yarn 40x around 3 fingers, tie in middle, trim into a small pom",
        "Sew pom to exact centre of beret top",
        "Block beret over a dinner plate to set the flat crown shape",
        "Steam lightly, leave until fully dry"
      ]),
    ],
    yarnRequirements: [{ color: "Classic Black", volume: "~150g" }],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
  },

  {
    title: "Granny Patchwork Crossbody",
    creator: "WoolWhimsy",
    projectType: "Accessory",
    skillLevel: "Intermediate",
    description: "Twenty-four mini granny squares joined into a structured bag with a zip lining and adjustable strap.",
    yarnType: "Cotton (DK)",
    size: "~22cm wide x 18cm tall",
    sections: [
      section("Granny Squares (make 24)", [
        "Rnd 1: MR — (3dc, ch 2) x4 for basic granny",
        "Rnd 2: (3dc, ch 2, 3dc) at each corner, 3dc between corners",
        "Use a different petal colour for each square — plan colour layout before joining",
        "Final rnd: sc around in joining colour (cream or grey)"
      ]),
      section("Bag Assembly", [
        "Arrange 12 squares into a 3x4 front panel — join with sc seams on RS",
        "Repeat for back panel",
        "Join front and back panels along bottom and both sides with sc seam",
        "Reinforce corners with extra sc passes"
      ]),
      section("Strap & Lining", [
        "Strap: ch 150 in coordinating yarn, sc back — work 4 rows for a sturdy strap",
        "Attach lobster clips at each end to D-rings sewn inside top corners",
        "Lining: sew a cotton lining with a zip pocket — insert and hand-stitch to top edge",
        "Press the bag flat to check square alignment before final finishing"
      ]),
    ],
    yarnRequirements: [{ color: "Cream (joining)", volume: "~80g" }, { color: "Assorted Pastels", volume: "~200g (mix)" }],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [{ name: "D-rings", description: "18mm", quantity: 2 }, { name: "Lobster clasps", description: "18mm silver", quantity: 2 }],
  },

  {
    title: "Double Shell Stitch Headband",
    creator: "YarnLily",
    projectType: "Accessory",
    skillLevel: "Easy",
    description: "A wide, padded headband in a double-layer shell stitch — great for taming hair and looking effortlessly chic.",
    yarnType: "Cotton (Worsted)",
    size: "One size, adjustable (elastic back)",
    sections: [
      section("Shell Panel", [
        "Ch 11. Row 1: sc, *skip 1, 5dc shell, skip 1, sc* — fits 2 shells across the 11-ch width.",
        "Row 2: ch 3, 2dc in sc, sc in 3rd dc, 5dc in next sc — reverse shell fills gaps",
        "Work until strip is 38cm long (covers front of head)",
        "Make 2 identical panels"
      ]),
      section("Assembly & Elastic", [
        "Layer 2 panels WS together — sc around 3 sides to sandwich them",
        "Elastic back: thread 20cm elastic through a loop at each end",
        "Adjust elastic to fit, knot ends and tuck inside the headband",
        "Sc final edge closed"
      ]),
    ],
    yarnRequirements: [{ color: "Dusty Rose", volume: "~60g" }],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Elastic", description: "1.5cm wide, 20cm", quantity: 1 }],
  },

  {
    title: "1970s Openwork Gloves",
    creator: "StitchJoy",
    projectType: "Accessory",
    skillLevel: "Advanced",
    description: "Fingered gloves with a vintage openwork cuff, worked finger by finger on a tiny hook. Glamorous and intricate.",
    yarnType: "Cotton (Fingering)",
    size: "Women's S/M",
    sections: [
      section("Cuff", [
        "Ch 48, join. Work (ch 4, skip 2, dc in next) repeat for 6cm — lacy grid cuff",
        "Rnd 7: sc in every st and ch sp to tighten to 48 sts",
        "Thumb gusset: mark thumb position. Inc 2 sts every 3rd rnd for 7 rnds: 14 thumb sts.",
        "Place thumb sts on holder, ch 4, continue palm"
      ]),
      section("Palm & Fingers", [
        "Work palm in sc for 3cm past thumb gusset",
        "Divide for 4 fingers — join small lengths of yarn for each",
        "Index: pick up 12 sts, join, sc for 5cm, dec to close",
        "Middle: 12 sts, 5.5cm. Ring: 12 sts, 5cm. Pinky: 10 sts, 4cm."
      ]),
      section("Thumb & Finishing", [
        "Pick up thumb sts + 4 from gap (18). Work 4cm in round.",
        "Decrease to close: (sc, dec) x6 (12). dec x6 (6). Close.",
        "Weave in all ends very neatly — glove fingers need tidy finishing",
        "Block on glove blockers or over plastic bags formed into hand shape"
      ]),
    ],
    yarnRequirements: [{ color: "Ivory Cream", volume: "~80g" }],
    hookRequirements: [{ size: "1.75mm", quantity: 1 }],
  },

  {
    title: "Zippered Travel Pouch Set",
    creator: "TinyKnitCo",
    projectType: "Accessory",
    skillLevel: "Easy",
    description: "A set of two cotton pouches (large 22cm and small 13cm) with zip openings and linen lining. Travel-ready.",
    yarnType: "Cotton (Worsted)",
    size: "Large 22x15cm / Small 13x10cm",
    sections: [
      section("Pouch Body (each size)", [
        "Ch 45 (27). Row 1: sc across (44/26). Ch 1, turn.",
        "Rows 2–30 (18): sc across, ch 1, turn — plain solid body for both pouches",
        "Fold in half — sc the two side seams closed on RS",
        "Do not close the top — this will be the zip opening"
      ]),
      section("Zip & Lining", [
        "Pin a matching zip along the top opening, wrong side of zip to inside of pouch",
        "Hand-stitch zip in place with 3 passes of cotton thread",
        "Lining: cut fabric to match pouch shape + seam allowance, sew and insert",
        "Slip-stitch lining top edge to zip tape to hide raw edges"
      ]),
    ],
    yarnRequirements: [{ color: "Terracotta", volume: "~100g" }, { color: "Sage Green", volume: "~60g" }],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Zips", description: "22cm and 13cm", quantity: 2 }],
  },

  {
    title: "Velvet Ribbon Hair Bow",
    creator: "CrochetLily",
    projectType: "Accessory",
    skillLevel: "Easy",
    description: "An oversized coquette bow in crushed velvet yarn — the trend that never gets old. Works up in 20 minutes.",
    yarnType: "Velvet Yarn (Chunky)",
    size: "~18cm wide",
    sections: [
      section("Bow Loops", [
        "Ch 25. Sc across (24). Ch 1, turn.",
        "Rows 2–8: sc across — creates a rectangular panel",
        "Fold panel in half (short ends together) and sc the short end closed — tube formed",
        "Flatten tube so seam is at centre back and squeeze centre inward"
      ]),
      section("Centre Knot & Clip", [
        "Centre wrap: ch 12, sc back for a short strap",
        "Wrap strap tightly around pinched centre of bow — sew ends together firmly at back",
        "Attach a hair clip or comb to the centre wrap strap at the back",
        "Fluff and shape bow loops — velvet holds its shape naturally"
      ]),
    ],
    yarnRequirements: [{ color: "Dusty Rose Velvet", volume: "~40g" }],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Hair clip", description: "7cm alligator clip", quantity: 1 }],
  },

  {
    title: "Wide-Brim Floppy Sun Hat",
    creator: "HookedByHana",
    projectType: "Accessory",
    skillLevel: "Intermediate",
    description: "A floppy wide-brim summer hat in natural raffia with a grosgrain ribbon band. Classic and sun-smart.",
    yarnType: "Raffia Yarn",
    size: "One size (57cm average head)",
    sections: [
      section("Crown", [
        "MR: 4 sc. Rnd 2: inc x4 (8). Continue increasing 4 sts per rnd until 40 sts (10cm dome).",
        "Work 2 plain rnds — flat crown area",
        "Begin side band: work 12 rnds straight (no increase) for the hat body/side",
        "Maintain firm tension — raffia can loosen if worked too loosely"
      ]),
      section("Brim", [
        "Begin brim increases: (sc 4, inc) every rnd",
        "Work 12 increasing rnds — brim should be 12cm wide at its broadest",
        "Final 2 rnds: work without increasing to set the brim edge flat",
        "Last rnd: sl st for a clean finish"
      ]),
      section("Ribbon Band & Finishing", [
        "Thread grosgrain ribbon through stitch gaps around the side band at crown base",
        "Tie in a bow at the back or a side knot",
        "Steam the brim on a dinner plate to set its shape",
        "Store stuffed with tissue paper to maintain shape"
      ]),
    ],
    yarnRequirements: [{ color: "Natural Straw", volume: "~200g" }],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Grosgrain ribbon", description: "2.5cm wide, 100cm", quantity: 1 }],
  },

  {
    title: "Fringe Festival Belt",
    creator: "MoonYarns",
    projectType: "Accessory",
    skillLevel: "Easy",
    description: "A woven-look macramé belt with long cotton fringe ends — the ultimate boho festival accessory.",
    yarnType: "Cotton (Worsted)",
    size: "Fits 65–90cm waist (with tied closure)",
    sections: [
      section("Belt Body", [
        "Ch 90. Row 1: sc across (89). Ch 1, turn.",
        "Rows 2–5: sc across for a thick 5-row belt strap",
        "Fringe sides: at each short end, add 18cm cut lengths, loop-knotted through each st",
        "6 fringes per side — total fringe should cascade to about hip level"
      ]),
      section("Embellishments & Closure", [
        "Thread wooden beads onto fringe strands before knotting ends",
        "Overhand knot at 12cm mark on each fringe strand — beads above knot",
        "Tie closure: belt is worn by wrapping around waist and tying the fringe ends together",
        "Optional: add a D-ring at one end and loop other end through for a slide closure"
      ]),
    ],
    yarnRequirements: [{ color: "Natural Cream", volume: "~80g" }, { color: "Terracotta", volume: "~40g" }],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Wooden beads", description: "8mm natural", quantity: 20 }],
  },

  {
    title: "Puffy Cloud Bag",
    creator: "CozyCrops",
    projectType: "Accessory",
    skillLevel: "Intermediate",
    description: "An oversized cloud-shaped bag in chunky white bouclé with a wide zip top and short chain strap.",
    yarnType: "Acrylic Boucle (Bulky)",
    size: "~35cm wide x 22cm tall",
    sections: [
      section("Cloud Shape Panels (make 2)", [
        "Ch 40. Rows 1–15: sc across for the main rectangular cloud body",
        "Top cloud bumps: continue with (sc 8, inc) repeat and add 3 upward curves across top edge",
        "Each bump: work short rows over 10 sts, increasing then decreasing for the dome shape",
        "Both front and back panels identical"
      ]),
      section("Assembly & Zip", [
        "Sc front and back together along bottom and curved cloud sides — leave flat top open",
        "Pin a 30cm white zip across the opening between the cloud bumps",
        "Machine or hand stitch zip in place",
        "Reinforce all corners with extra sc through both layers"
      ]),
      section("Strap & Lining", [
        "Chain strap: ch 50 in metallic silver yarn — attach at each top corner",
        "OR make a crocheted short strap: ch 6, sc BLO for 30cm — attach with D-rings",
        "Lining: optional white fabric lining slip-stitched to interior zip tape",
        "Weave in all ends and give bag a light steam to fluff the bouclé"
      ]),
    ],
    yarnRequirements: [{ color: "Cloud White Boucle", volume: "~250g" }],
    hookRequirements: [{ size: "7.0mm", quantity: 1 }],
    notionsRequirements: [{ name: "Zip", description: "30cm white", quantity: 1 }, { name: "Chain strap", description: "45cm silver", quantity: 1 }],
  },
];
