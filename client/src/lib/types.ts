// Pattern models
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

export interface Pattern {
  id: string;
  title: string;
  projectType: string;
  skillLevel: string;
  yarnType?: string;
  size?: string;
  endProductImage?: string;
  materialsNotes?: string;
  createdAt: string;
  sections: PatternSection[];
  yarnRequirements?: YarnRequirement[];
  hookRequirements?: HookRequirement[];
  notionsRequirements?: NotionsRequirement[];
  toolRequirements?: ToolRequirement[];
  needsStuffing?: string;
}

// Form models
export interface PatternInputFormData {
  prompt: string;
  projectType: string;
  skillLevel: string;
  yarnType?: string;
  size?: string;
}

// Stash models
export interface StashItem {
  id: string;
  type: 'yarn' | 'hook' | 'notion' | 'tool';
  name: string;
  color?: string;
  volume?: string;
  size?: string;
  quantity: number;
  description?: string;
  notes?: string;
}