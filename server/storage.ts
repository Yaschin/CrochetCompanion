import { Pattern } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getPattern(id: string): Promise<Pattern | undefined>;
  getAllPatterns(): Promise<Pattern[]>;
  createPattern(pattern: Omit<Pattern, "id" | "createdAt">): Promise<Pattern>;
  updatePattern(id: string, pattern: Partial<Pattern>): Promise<Pattern | undefined>;
  deletePattern(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private patterns: Map<string, Pattern>;

  constructor() {
    this.patterns = new Map();
  }

  async getPattern(id: string): Promise<Pattern | undefined> {
    return this.patterns.get(id);
  }

  async getAllPatterns(): Promise<Pattern[]> {
    return Array.from(this.patterns.values());
  }

  async createPattern(pattern: Omit<Pattern, "id" | "createdAt">): Promise<Pattern> {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const newPattern: Pattern = { ...pattern, id, createdAt };
    this.patterns.set(id, newPattern);
    return newPattern;
  }

  async updatePattern(id: string, patternUpdate: Partial<Pattern>): Promise<Pattern | undefined> {
    const existingPattern = this.patterns.get(id);
    if (!existingPattern) return undefined;

    const updatedPattern = { ...existingPattern, ...patternUpdate };
    this.patterns.set(id, updatedPattern);
    return updatedPattern;
  }

  async deletePattern(id: string): Promise<boolean> {
    return this.patterns.delete(id);
  }
}

export const storage = new MemStorage();
