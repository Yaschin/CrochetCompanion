import { Pattern, patterns as patternsTable } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { SQL } from "drizzle-orm";

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
      
      // Map database record to Pattern type
      return {
        id: pattern.id,
        title: pattern.title,
        projectType: pattern.projectType,
        skillLevel: pattern.skillLevel,
        yarnType: pattern.yarnType || undefined,
        size: pattern.size || undefined,
        endProductImage: pattern.endProductImage || undefined,
        materialsNotes: pattern.materialsNotes || "",
        yarnRequirements: pattern.yarnRequirements || [],
        createdAt,
        sections: pattern.sections as Pattern["sections"]
      };
    } catch (error) {
      console.error("Error getting pattern:", error);
      return undefined;
    }
  }

  async getAllPatterns(): Promise<Pattern[]> {
    try {
      const result = await db.select().from(patternsTable);
      
      return result.map(pattern => {
        // Convert createdAt to ISO string if it's a Date object
        const createdAt = pattern.createdAt instanceof Date 
          ? pattern.createdAt.toISOString() 
          : pattern.createdAt as string;
        
        // Map database record to Pattern type
        return {
          id: pattern.id,
          title: pattern.title,
          projectType: pattern.projectType,
          skillLevel: pattern.skillLevel,
          yarnType: pattern.yarnType || undefined,
          size: pattern.size || undefined,
          endProductImage: pattern.endProductImage || undefined,
          materialsNotes: pattern.materialsNotes || "",
          yarnRequirements: pattern.yarnRequirements || [],
          createdAt,
          sections: pattern.sections as Pattern["sections"]
        };
      });
    } catch (error) {
      console.error("Error getting all patterns:", error);
      return [];
    }
  }

  async createPattern(pattern: Omit<Pattern, "id" | "createdAt">): Promise<Pattern> {
    try {
      const id = uuidv4();
      
      // Prepare the database record
      const dbRecord = {
        id,
        title: pattern.title,
        projectType: pattern.projectType,
        skillLevel: pattern.skillLevel,
        yarnType: pattern.yarnType || null,
        size: pattern.size || null,
        endProductImage: pattern.endProductImage || null,
        materialsNotes: pattern.materialsNotes || "",
        yarnRequirements: pattern.yarnRequirements || [],
        sections: pattern.sections
      };
      
      // Insert into database
      const result = await db.insert(patternsTable).values(dbRecord).returning();
      
      if (result.length === 0) {
        throw new Error("Failed to create pattern");
      }
      
      const created = result[0];
      
      // Convert createdAt to ISO string if it's a Date object
      const createdAt = created.createdAt instanceof Date 
        ? created.createdAt.toISOString() 
        : created.createdAt as string;
      
      // Map database record to Pattern type
      return {
        id: created.id,
        title: created.title,
        projectType: created.projectType,
        skillLevel: created.skillLevel,
        yarnType: created.yarnType || undefined,
        size: created.size || undefined,
        endProductImage: created.endProductImage || undefined,
        materialsNotes: created.materialsNotes || "",
        yarnRequirements: created.yarnRequirements || [],
        createdAt,
        sections: created.sections as Pattern["sections"]
      };
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
      
      // Prepare the database update record
      const dbUpdate: any = {};
      
      // Only include fields that are present in the update
      if (patternUpdate.title !== undefined) dbUpdate.title = patternUpdate.title;
      if (patternUpdate.projectType !== undefined) dbUpdate.projectType = patternUpdate.projectType;
      if (patternUpdate.skillLevel !== undefined) dbUpdate.skillLevel = patternUpdate.skillLevel;
      if (patternUpdate.yarnType !== undefined) dbUpdate.yarnType = patternUpdate.yarnType || null;
      if (patternUpdate.size !== undefined) dbUpdate.size = patternUpdate.size || null;
      if (patternUpdate.endProductImage !== undefined) dbUpdate.endProductImage = patternUpdate.endProductImage || null;
      if (patternUpdate.materialsNotes !== undefined) dbUpdate.materialsNotes = patternUpdate.materialsNotes || "";
      if (patternUpdate.yarnRequirements !== undefined) dbUpdate.yarnRequirements = patternUpdate.yarnRequirements || [];
      if (patternUpdate.sections !== undefined) dbUpdate.sections = patternUpdate.sections;
      
      // Update the database
      const result = await db.update(patternsTable)
        .set(dbUpdate)
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
      
      // Map database record to Pattern type
      return {
        id: updated.id,
        title: updated.title,
        projectType: updated.projectType,
        skillLevel: updated.skillLevel,
        yarnType: updated.yarnType || undefined,
        size: updated.size || undefined,
        endProductImage: updated.endProductImage || undefined,
        materialsNotes: updated.materialsNotes || "",
        yarnRequirements: updated.yarnRequirements || [],
        createdAt,
        sections: updated.sections as Pattern["sections"]
      };
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
