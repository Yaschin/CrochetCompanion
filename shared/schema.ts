import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
});

// Define yarn requirement
export interface YarnRequirement {
  color: string;
  volume: string; // e.g., "~50g" or "~80 yards"
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
  completed: boolean;
}

// Define pattern section with enhanced features
export interface PatternSection {
  name: string;
  notes: string;
  locked: boolean;
  partImageUrl?: string | null;
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
      steps: z.array(
        z.object({
          id: z.number(),
          text: z.string(),
          locked: z.boolean().default(false),
          count: z.number().default(0),
          notes: z.string().default(""),
          photo: z.string().nullable().optional(),
          aiStepImage: z.string().nullable().optional(),
          completed: z.boolean().default(false),
        })
      ),
    })
  ),
  yarnRequirements: z.array(
    z.object({
      color: z.string(),
      volume: z.string(),
    })
  ).optional().default([]),
});

export const insertPatternSchema = createInsertSchema(patterns).omit({
  id: true,
  createdAt: true,
});

export type InsertPattern = z.infer<typeof insertPatternSchema>;
export type Pattern = z.infer<typeof patternSchema>;
