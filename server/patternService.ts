import { storage } from "./storage";
import { Pattern } from "@shared/schema";

export const patternService = {
  async createPattern(pattern: Omit<Pattern, "id" | "createdAt">, ownerId?: string): Promise<Pattern> {
    return storage.createPattern(pattern, ownerId);
  },

  async getPattern(id: string): Promise<Pattern | undefined> {
    return storage.getPattern(id);
  },

  async getPatternsByIds(ids: string[]): Promise<Pattern[]> {
    return storage.getPatternsByIds(ids);
  },

  async getAllPatterns(ownerId?: string): Promise<Pattern[]> {
    return storage.getAllPatterns(ownerId);
  },

  async updatePattern(id: string, pattern: Partial<Pattern>): Promise<Pattern | undefined> {
    return storage.updatePattern(id, pattern);
  },

  async deletePattern(id: string): Promise<boolean> {
    return storage.deletePattern(id);
  }
};