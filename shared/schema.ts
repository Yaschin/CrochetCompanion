import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define stash items table
export const stashItems = pgTable("stash_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  type: text("type").notNull(), // 'yarn', 'hook', 'notion', 'tool'
  name: text("name").notNull(),
  color: text("color"),
  volume: text("volume"),
  size: text("size"),
  quantity: integer("quantity").notNull().default(1),
  description: text("description"),
  notes: text("notes"),
});

// Define stash notes table
export const stashNotes = pgTable("stash_notes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  content: text("content").default(""),
});

// Create stash item schema for validation
export const stashItemSchema = z.object({
  id: z.string(),
  type: z.enum(['yarn', 'hook', 'notion', 'tool']),
  name: z.string(),
  color: z.string().optional(),
  volume: z.string().optional(),
  size: z.string().optional(),
  quantity: z.number().default(1),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const insertStashItemSchema = createInsertSchema(stashItems).omit({
  id: true,
});

export type StashItem = z.infer<typeof stashItemSchema>;
export type InsertStashItem = z.infer<typeof insertStashItemSchema>;

// Define the pattern schema structure
export const patterns = pgTable("patterns", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  projectType: text("projectType").notNull(),
  skillLevel: text("skillLevel").notNull(),
  yarnType: text("yarnType"),
  size: text("size"),
  endProductImage: text("endProductImage"),
  materialsNotes: text("materialsNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  sections: jsonb("sections").notNull(),
  yarnRequirements: jsonb("yarnRequirements"),
  hookRequirements: jsonb("hookRequirements"),
  notionsRequirements: jsonb("notionsRequirements"),
  toolRequirements: jsonb("toolRequirements"),
  needsStuffing: text("needsStuffing"),
  favorite: boolean("favorite").notNull().default(false),
});

// Define yarn requirement
export interface YarnRequirement {
  color: string;
  volume: string; // e.g., "~50g" or "~80 yards"
}

// Define hook requirement
export interface HookRequirement {
  size: string; // e.g., "5.0mm" or "H/8"
  quantity: number;
  note?: string;
}

// Define notions requirement (accessories, embellishments, etc.)
export interface NotionsRequirement {
  name: string; // e.g., "Safety eyes", "Buttons"
  description: string; // e.g., "15mm black", "1 inch wooden"
  quantity: number;
}

// Define tool requirement
export interface ToolRequirement {
  name: string; // e.g., "Tapestry needle", "Stitch markers"
  description?: string;
  quantity?: number;
}

// Define pattern step with enhanced features
export interface PatternStep {
  id: number;
  text: string;
  locked: boolean;
  count: number;
  notes: string;
  photo: string | null;
  aiStepImage?: string | null;
  diagramUrl?: string | null;
  completed: boolean;
}

// Define pattern section with enhanced features
export interface PatternSection {
  name: string;
  notes: string;
  locked: boolean;
  partImageUrl?: string | null;
  diagramUrl?: string | null;
  steps: PatternStep[];
}

// Create the pattern schema for validation
export const patternSchema = z.object({
  id: z.string(),
  title: z.string(),
  projectType: z.string(),
  skillLevel: z.string(),
  yarnType: z.string().optional(),
  size: z.string().optional(),
  endProductImage: z.string().optional(),
  materialsNotes: z.string().optional().default(""),
  createdAt: z.string(),
  sections: z.array(
    z.object({
      name: z.string(),
      notes: z.string().default(""),
      locked: z.boolean().default(false),
      partImageUrl: z.string().nullable().optional(),
      diagramUrl: z.string().nullable().optional(),
      steps: z.array(
        z.object({
          id: z.number(),
          text: z.string(),
          locked: z.boolean().default(false),
          count: z.number().default(0),
          notes: z.string().default(""),
          photo: z.string().nullable().optional(),
          aiStepImage: z.string().nullable().optional(),
          diagramUrl: z.string().nullable().optional(),
          completed: z.boolean().default(false),
        })
      ),
    })
  ),
  // Yarn requirements
  yarnRequirements: z.array(
    z.object({
      color: z.string(),
      volume: z.string(),
    })
  ).optional().default([]),
  
  // Hook requirements
  hookRequirements: z.array(
    z.object({
      size: z.string(),
      quantity: z.number().default(1),
      note: z.string().optional(),
    })
  ).optional().default([]),
  
  // Notions requirements (safety eyes, buttons, etc.)
  notionsRequirements: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      quantity: z.number().default(1),
    })
  ).optional().default([]),
  
  // Tool requirements
  toolRequirements: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      quantity: z.number().optional(),
    })
  ).optional().default([]),
  
  // Stuffing requirement
  needsStuffing: z.string().optional(),

  // Larissa's Favorites
  favorite: z.boolean().optional().default(false),
});

export const insertPatternSchema = createInsertSchema(patterns).omit({
  id: true,
  createdAt: true,
});

export type InsertPattern = z.infer<typeof insertPatternSchema>;
export type Pattern = z.infer<typeof patternSchema>;
