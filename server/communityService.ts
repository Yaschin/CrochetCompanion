import { CommunityPattern, InsertCommunityPattern, communityPatterns, insertCommunityPatternSchema } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db } from "./db";
import { desc, eq, sql } from "drizzle-orm";

function rowToCommunity(row: typeof communityPatterns.$inferSelect): CommunityPattern {
  const createdAt = row.createdAt instanceof Date
    ? row.createdAt.toISOString()
    : (row.createdAt as unknown as string);

  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
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

  // Seed a small curated gallery so Community isn't empty on first run.
  async seedIfEmpty(): Promise<void> {
    try {
      const existing = await db.select({ id: communityPatterns.id }).from(communityPatterns).limit(1);
      if (existing.length > 0) return;

      console.log("Seeding community gallery…");
      for (const seed of COMMUNITY_SEEDS) {
        await this.create(insertCommunityPatternSchema.parse(seed));
      }
    } catch (error) {
      console.error("Error seeding community patterns:", error);
    }
  },
};

// Build a minimal-but-real section so seeded patterns are genuinely usable.
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

const COMMUNITY_SEEDS: z.input<typeof insertCommunityPatternSchema>[] = [
  {
    title: "Sunflower Coaster",
    creator: "CozyCrops",
    projectType: "Home Decor",
    skillLevel: "Easy",
    description: "A cheerful sunflower coaster worked in the round — a quick, satisfying make.",
    endProductImage: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600&q=80",
    yarnType: "Cotton (DK)",
    sections: [
      section("Center", ["Rnd 1: 6 sc in magic ring (6)", "Rnd 2: inc in each st (12)", "Rnd 3: (sc, inc) x6 (18)"]),
      section("Petals", ["Join petal yarn in any st", "(ch3, dc, ch3, sl st) in each st around", "Fasten off and weave in ends"]),
    ],
    yarnRequirements: [{ color: "Golden Yellow", volume: "~20g" }, { color: "Brown", volume: "~10g" }],
  },
  {
    title: "Bumblebee Amigurumi",
    creator: "HookedByHana",
    projectType: "Toy",
    skillLevel: "Intermediate",
    description: "A plump little bee with stripes and tiny wings. Beginner-friendly amigurumi shaping.",
    endProductImage: "https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=600&q=80",
    yarnType: "Acrylic (Worsted)",
    needsStuffing: "Polyester fiberfill",
    sections: [
      section("Body", ["Rnd 1: 6 sc in MR (6)", "Rnd 2: inc x6 (12)", "Rnd 3: (sc, inc) x6 (18)", "Rnds 4-8: sc around, alternating yellow/black stripes", "Stuff firmly and close"]),
      section("Wings", ["Make 2: 5 sc in MR, ch and sl st to shape", "Sew to back of body"]),
    ],
    yarnRequirements: [{ color: "Yellow", volume: "~40g" }, { color: "Black", volume: "~25g" }, { color: "White", volume: "~10g" }],
  },
  {
    title: "Granny Square Flower Blanket",
    creator: "YarnLily",
    projectType: "Home Decor",
    skillLevel: "Intermediate",
    description: "Classic granny squares with a floral centre, joined as-you-go. Cosy and timeless.",
    endProductImage: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80",
    yarnType: "Acrylic (Worsted)",
    sections: [
      section("Square (make 35)", ["Rnd 1: flower centre — 6 dc in MR", "Rnd 2: petals around centre", "Rnds 3-5: granny clusters to square off"]),
      section("Join & Edging", ["Join squares with sc seams", "Work 2 rounds of border in cream", "Weave in all ends"]),
    ],
    yarnRequirements: [{ color: "Cream", volume: "~300g" }, { color: "Assorted", volume: "~400g" }],
  },
  {
    title: "Daisy Bucket Hat",
    creator: "StitchJoy",
    projectType: "Wearable",
    skillLevel: "Easy",
    description: "A breezy bucket hat with appliqué daisies. Adjustable for most adult sizes.",
    endProductImage: "https://images.unsplash.com/photo-1575029292585-6f3dd97b7b91?w=600&q=80",
    yarnType: "Cotton (Worsted)",
    sections: [
      section("Crown", ["Rnd 1: 8 hdc in MR", "Increase evenly each round until 22cm diameter"]),
      section("Sides & Brim", ["Work even for crown depth", "Increase for brim over final 5 rounds", "Add daisy appliqués"]),
    ],
    yarnRequirements: [{ color: "Natural", volume: "~120g" }, { color: "White", volume: "~15g" }],
  },
  {
    title: "Ocean Turtle",
    creator: "WoolWhimsy",
    projectType: "Toy",
    skillLevel: "Intermediate",
    description: "A friendly sea turtle with a textured shell. Great stash-buster for greens and blues.",
    endProductImage: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&q=80",
    yarnType: "Acrylic (Worsted)",
    needsStuffing: "Polyester fiberfill",
    sections: [
      section("Shell", ["Work a domed circle in the round", "Add bobble texture in rounds 4-7"]),
      section("Body & Limbs", ["Make head, 4 flippers and tail", "Stuff and assemble to shell"]),
    ],
    yarnRequirements: [{ color: "Sea Green", volume: "~50g" }, { color: "Sand", volume: "~30g" }],
  },
  {
    title: "Tulip Bouquet",
    creator: "CrochetLily",
    projectType: "Home Decor",
    skillLevel: "Easy",
    description: "A trio of everlasting tulips on wire stems — a sweet gift that never wilts.",
    endProductImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    yarnType: "Cotton (DK)",
    sections: [
      section("Flower (make 3)", ["Work petals in the round", "Shape into a cupped tulip and fasten"]),
      section("Stem & Leaves", ["Cover floral wire with green sc cord", "Add 2 leaves per stem"]),
    ],
    yarnRequirements: [{ color: "Pink", volume: "~25g" }, { color: "Green", volume: "~20g" }],
  },
];
