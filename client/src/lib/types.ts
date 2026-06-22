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
  volume: string;
}

export interface HookRequirement {
  size: string;
  quantity: number;
  note?: string;
}

export interface NotionsRequirement {
  name: string;
  description: string;
  quantity: number;
}

export interface ToolRequirement {
  name: string;
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

/** An original document the user imported (currently always a PDF). */
export interface SourceFile {
  key: string; // object-storage key, served at /api/media/<key>
  name: string;
  type: "pdf";
  size?: number;
  pages?: number;
  addedAt: string;
}

/** "As-built" record of a finished object — what was actually used / how it turned out. */
export interface FinishedRecord {
  madeFor?: string;
  hookUsed?: string;
  yarnUsed?: string;
  measurements?: string;
  notes?: string;
}

export interface Pattern {
  id: string;
  title: string;
  description?: string;
  projectType: string;
  skillLevel: string;
  materialsNotes?: string;
  userNotes?: string;
  counterState?: { stitches: number; rows: number; target: number; history?: unknown[] } | null;
  workSessions?: { start: string; end: string; ms: number }[];
  sourceFiles?: SourceFile[];
  finishedRecord?: FinishedRecord | null;
  yarnRequirements?: YarnRequirement[];
  hookRequirements?: HookRequirement[];
  notionsRequirements?: NotionsRequirement[];
  toolRequirements?: ToolRequirement[];
  needsStuffing?: string;
  sections: PatternSection[];
  createdAt: string;
  yarnType?: string;
  size?: string;
  endProductImage?: string;
  favorite?: boolean;
  // Project lifecycle
  status?: 'pattern' | 'active' | 'finished';
  startedAt?: string | null;
  finishedAt?: string | null;
}

export type StashItemType = 'yarn' | 'hook' | 'notion' | 'tool';

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

export type ViewType =
  | "home"
  | "splash"
  | "profile-picker"
  | "input"
  | "loading"
  | "viewer"
  | "library"
  | "documents"
  | "stash"
  | "favorites"
  | "projects"
  | "community"
  | "community-detail"
  | "community-submit"
  | "progress"
  | "photo-upload"
  | "stitch-counter"
  | "yarn-recs"
  | "tools"
  | "settings";
