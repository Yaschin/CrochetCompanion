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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  sections: jsonb("sections").notNull(),
});

// Create a simplified pattern structure for in-memory storage
export const patternSchema = z.object({
  id: z.string(),
  title: z.string(),
  projectType: z.string(),
  skillLevel: z.string(),
  yarnType: z.string().optional(),
  size: z.string().optional(),
  endProductImage: z.string().optional(),
  createdAt: z.string(),
  sections: z.array(
    z.object({
      name: z.string(),
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
});

export const insertPatternSchema = createInsertSchema(patterns).omit({
  id: true,
  createdAt: true,
});

export type InsertPattern = z.infer<typeof insertPatternSchema>;
export type Pattern = z.infer<typeof patternSchema>;
