/**
 * Type definitions for the Crochet Companion app
 */

export interface PatternInputFormData {
  prompt: string;
  projectType: string;
  skillLevel: string;
  yarnType?: string;
  size?: string;
}

export interface YarnRequirement {
  color: string;
  volume: string; // e.g., "~50g" or "~80 yards"
}

export interface HookRequirement {
  size: string; // e.g., "5.0mm" or "H/8"
  quantity: number;
  note?: string;
}

export interface NotionsRequirement {
  name: string; // e.g., "Safety eyes", "Buttons"
  description: string; // e.g., "15mm black", "1 inch wooden"
  quantity: number;
}

export interface ToolRequirement {
  name: string; // e.g., "Tapestry needle", "Stitch markers"
  description?: string;
  quantity?: number;
}

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

export interface PatternSection {
  name: string;
  notes: string;
  locked: boolean;
  partImageUrl?: string | null;
  diagramUrl?: string | null;
  steps: PatternStep[];
}

export interface Pattern {
  id: string;
  title: string;
  description: string;
  projectType: string;
  skillLevel: string;
  imgUrl: string;
  difficultyLevel: string;
  completed: boolean;
  materialsNotes?: string;
  yarnRequirements?: YarnRequirement[];
  hookRequirements?: HookRequirement[];
  notionsRequirements?: NotionsRequirement[];
  toolRequirements?: ToolRequirement[];
  needsStuffing?: string;
  sections: PatternSection[];
  createdAt: string;
  // Additional properties used in newer implementations
  yarnType?: string;
  size?: string;
  endProductImage?: string;
  favorite?: boolean;
}

export type StashItemType = 'yarn' | 'hook' | 'notion' | 'tool';

// Matches the database/API shape (shared/schema.ts stashItemSchema).
export interface StashItem {
  id: string;
  type: StashItemType;
  name: string;
  color?: string;
  volume?: string;
  size?: string;
  quantity: number;
  description?: string;
  notes?: string;
}

export type ViewType = "input" | "viewer" | "library" | "stash";