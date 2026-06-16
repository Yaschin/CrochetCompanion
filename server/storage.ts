import { Pattern, patterns as patternsTable } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { desc, eq, inArray } from "drizzle-orm";

// Storage interface with CRUD methods
export interface IStorage {
  getPattern(id: string): Promise<Pattern | undefined>;
  getPatternsByIds(ids: string[]): Promise<Pattern[]>;
  getAllPatterns(ownerId?: string): Promise<Pattern[]>;
  createPattern(pattern: Omit<Pattern, "id" | "createdAt">, ownerId?: string): Promise<Pattern>;
  updatePattern(id: string, pattern: Partial<Pattern>): Promise<Pattern | undefined>;
  deletePattern(id: string): Promise<boolean>;
}

// Map a raw database row to the Pattern domain type.
// jsonb columns are typed loosely by Drizzle, so we cast them to the
// shapes declared in the shared schema.
function rowToPattern(row: typeof patternsTable.$inferSelect): Pattern {
  const createdAt = row.createdAt instanceof Date
    ? row.createdAt.toISOString()
    : (row.createdAt as unknown as string);

  return {
    id: row.id,
    title: row.title,
    projectType: row.projectType,
    skillLevel: row.skillLevel,
    yarnType: row.yarnType || undefined,
    size: row.size || undefined,
    endProductImage: row.endProductImage || undefined,
    description: row.description || "",
    materialsNotes: row.materialsNotes || "",
    userNotes: row.userNotes || "",
    counterState: (row.counterState ?? null) as Pattern["counterState"],
    workSessions: (row.workSessions ?? []) as Pattern["workSessions"],
    finishedRecord: (row.finishedRecord ?? null) as Pattern["finishedRecord"],
    createdAt,
    sections: (row.sections ?? []) as Pattern["sections"],
    yarnRequirements: (row.yarnRequirements ?? []) as Pattern["yarnRequirements"],
    hookRequirements: (row.hookRequirements ?? []) as Pattern["hookRequirements"],
    notionsRequirements: (row.notionsRequirements ?? []) as Pattern["notionsRequirements"],
    toolRequirements: (row.toolRequirements ?? []) as Pattern["toolRequirements"],
    needsStuffing: row.needsStuffing || undefined,
    favorite: row.favorite ?? false,
    status: (row.status as Pattern["status"]) ?? "pattern",
    startedAt: row.startedAt instanceof Date ? row.startedAt.toISOString() : undefined,
    finishedAt: row.finishedAt instanceof Date ? row.finishedAt.toISOString() : undefined,
  };
}

// Build the set of columns to persist from a (partial) Pattern.
// Centralised so create and update keep the full material set in sync.
function patternToColumns(pattern: Partial<Pattern>) {
  const columns: Record<string, unknown> = {};
  if (pattern.title !== undefined) columns.title = pattern.title;
  if (pattern.projectType !== undefined) columns.projectType = pattern.projectType;
  if (pattern.skillLevel !== undefined) columns.skillLevel = pattern.skillLevel;
  if (pattern.yarnType !== undefined) columns.yarnType = pattern.yarnType || null;
  if (pattern.size !== undefined) columns.size = pattern.size || null;
  if (pattern.endProductImage !== undefined) columns.endProductImage = pattern.endProductImage || null;
  if (pattern.description !== undefined) columns.description = pattern.description || null;
  if (pattern.materialsNotes !== undefined) columns.materialsNotes = pattern.materialsNotes || "";
  if (pattern.userNotes !== undefined) columns.userNotes = pattern.userNotes || "";
  if (pattern.counterState !== undefined) columns.counterState = pattern.counterState ?? null;
  if (pattern.workSessions !== undefined) columns.workSessions = pattern.workSessions ?? [];
  if (pattern.finishedRecord !== undefined) columns.finishedRecord = pattern.finishedRecord ?? null;
  if (pattern.sections !== undefined) columns.sections = pattern.sections;
  if (pattern.yarnRequirements !== undefined) columns.yarnRequirements = pattern.yarnRequirements || [];
  if (pattern.hookRequirements !== undefined) columns.hookRequirements = pattern.hookRequirements || [];
  if (pattern.notionsRequirements !== undefined) columns.notionsRequirements = pattern.notionsRequirements || [];
  if (pattern.toolRequirements !== undefined) columns.toolRequirements = pattern.toolRequirements || [];
  if (pattern.needsStuffing !== undefined) columns.needsStuffing = pattern.needsStuffing || null;
  if (pattern.favorite !== undefined) columns.favorite = pattern.favorite;
  if (pattern.status !== undefined) columns.status = pattern.status;
  if (pattern.startedAt !== undefined) columns.startedAt = pattern.startedAt ? new Date(pattern.startedAt) : null;
  if (pattern.finishedAt !== undefined) columns.finishedAt = pattern.finishedAt ? new Date(pattern.finishedAt) : null;
  return columns;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getPattern(id: string): Promise<Pattern | undefined> {
    try {
      const result = await db.select().from(patternsTable).where(eq(patternsTable.id, id));
      if (result.length === 0) {
        return undefined;
      }
      return rowToPattern(result[0]);
    } catch (error) {
      console.error("Error getting pattern:", error);
      return undefined;
    }
  }

  // Batch-fetch patterns by id in a single query (avoids N+1 loops, e.g. the
  // make-along board reading every member's pattern).
  async getPatternsByIds(ids: string[]): Promise<Pattern[]> {
    if (ids.length === 0) return [];
    try {
      const result = await db.select().from(patternsTable).where(inArray(patternsTable.id, ids));
      return result.map(rowToPattern);
    } catch (error) {
      console.error("Error getting patterns by ids:", error);
      return [];
    }
  }

  async getAllPatterns(ownerId?: string): Promise<Pattern[]> {
    try {
      const base = db.select().from(patternsTable);
      const result = await (ownerId ? base.where(eq(patternsTable.ownerId, ownerId)) : base)
        .orderBy(desc(patternsTable.createdAt));
      return result.map(rowToPattern);
    } catch (error) {
      console.error("Error getting all patterns:", error);
      return [];
    }
  }

  async createPattern(pattern: Omit<Pattern, "id" | "createdAt">, ownerId?: string): Promise<Pattern> {
    try {
      const id = uuidv4();

      const dbRecord = {
        id,
        ownerId: ownerId ?? "larissa",
        ...patternToColumns(pattern),
        // sections is required (NOT NULL) — ensure it is always present
        sections: pattern.sections ?? [],
      };

      const result = await db.insert(patternsTable).values(dbRecord as any).returning();
      if (result.length === 0) {
        throw new Error("Failed to create pattern");
      }
      return rowToPattern(result[0]);
    } catch (error) {
      console.error("Error creating pattern:", error);
      throw error;
    }
  }

  async updatePattern(id: string, patternUpdate: Partial<Pattern>): Promise<Pattern | undefined> {
    try {
      const existingPattern = await this.getPattern(id);
      if (!existingPattern) {
        return undefined;
      }

      const dbUpdate = patternToColumns(patternUpdate);

      const result = await db.update(patternsTable)
        .set(dbUpdate as any)
        .where(eq(patternsTable.id, id))
        .returning();

      if (result.length === 0) {
        return undefined;
      }
      return rowToPattern(result[0]);
    } catch (error) {
      console.error("Error updating pattern:", error);
      return undefined;
    }
  }

  async deletePattern(id: string): Promise<boolean> {
    try {
      const result = await db.delete(patternsTable)
        .where(eq(patternsTable.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting pattern:", error);
      return false;
    }
  }
}

// Export DatabaseStorage instance
export const storage = new DatabaseStorage();
