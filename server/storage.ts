import { Pattern, patterns as patternsTable } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Storage interface with CRUD methods
export interface IStorage {
  getPattern(id: string): Promise<Pattern | undefined>;
  getAllPatterns(): Promise<Pattern[]>;
  createPattern(pattern: Omit<Pattern, "id" | "createdAt">): Promise<Pattern>;
  updatePattern(id: string, pattern: Partial<Pattern>): Promise<Pattern | undefined>;
  deletePattern(id: string): Promise<boolean>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getPattern(id: string): Promise<Pattern | undefined> {
    try {
      const result = await db.select().from(patternsTable).where(eq(patternsTable.id, id));
      
      if (result.length === 0) {
        return undefined;
      }
      
      const pattern = result[0];
      
      // Convert createdAt to ISO string if it's a Date object
      const createdAt = pattern.createdAt instanceof Date 
        ? pattern.createdAt.toISOString() 
        : pattern.createdAt as string;
      
      return { 
        ...pattern, 
        createdAt 
      } as Pattern;
    } catch (error) {
      console.error("Error getting pattern:", error);
      return undefined;
    }
  }

  async getAllPatterns(): Promise<Pattern[]> {
    try {
      const result = await db.select().from(patternsTable);
      
      return result.map(pattern => ({
        ...pattern,
        createdAt: pattern.createdAt instanceof Date 
          ? pattern.createdAt.toISOString() 
          : pattern.createdAt as string
      })) as Pattern[];
    } catch (error) {
      console.error("Error getting all patterns:", error);
      return [];
    }
  }

  async createPattern(pattern: Omit<Pattern, "id" | "createdAt">): Promise<Pattern> {
    try {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      
      const newPattern = {
        ...pattern,
        id,
        createdAt
      };
      
      const result = await db.insert(patternsTable).values(newPattern).returning();
      
      if (result.length === 0) {
        throw new Error("Failed to create pattern");
      }
      
      const created = result[0];
      
      // Convert createdAt to ISO string if it's a Date object
      const createdAtStr = created.createdAt instanceof Date 
        ? created.createdAt.toISOString() 
        : created.createdAt as string;
      
      return { 
        ...created, 
        createdAt: createdAtStr 
      } as Pattern;
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
      
      const result = await db.update(patternsTable)
        .set(patternUpdate)
        .where(eq(patternsTable.id, id))
        .returning();
      
      if (result.length === 0) {
        return undefined;
      }
      
      const updated = result[0];
      
      // Convert createdAt to ISO string if it's a Date object
      const createdAt = updated.createdAt instanceof Date 
        ? updated.createdAt.toISOString() 
        : updated.createdAt as string;
      
      return { 
        ...updated, 
        createdAt 
      } as Pattern;
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
