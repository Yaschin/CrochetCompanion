import { storage } from "./storage";
import { Pattern } from "@shared/schema";

export const patternService = {
  async createPattern(pattern: Omit<Pattern, "id" | "createdAt">): Promise<Pattern> {
    return storage.createPattern(pattern);
  },

  async getPattern(id: string): Promise<Pattern | undefined> {
    return storage.getPattern(id);
  },

  async getAllPatterns(): Promise<Pattern[]> {
    return storage.getAllPatterns();
  },

  async updatePattern(id: string, pattern: Partial<Pattern>): Promise<Pattern | undefined> {
    return storage.updatePattern(id, pattern);
  },

  async deletePattern(id: string): Promise<boolean> {
    return storage.deletePattern(id);
  }
};
