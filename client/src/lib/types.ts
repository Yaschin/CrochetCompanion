// Pattern data model
export interface YarnRequirement {
  color: string;
  volume: string; // e.g., "~50g" or "~80 yards"
}

// Define hook requirement
export interface HookRequirement {
  size: string; // e.g., "5.0mm" or "H/8"
  quantity: number;
  note?: string;
}

// Define notions requirement (accessories, embellishments, etc.)
export interface NotionsRequirement {
  name: string; // e.g., "Safety eyes", "Buttons"
  description: string; // e.g., "15mm black", "1 inch wooden"
  quantity: number;
}

// Define tool requirement
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
  patternId?: string;
}

export interface Pattern {
  id: string;
  title: string;
  projectType: string;
  skillLevel: string;
  yarnType?: string;
  size?: string;
  endProductImage?: string;
  materialsNotes: string;
  createdAt: string;
  sections: PatternSection[];
  yarnRequirements: YarnRequirement[];
  // New material types
  hookRequirements?: HookRequirement[];
  notionsRequirements?: NotionsRequirement[];
  toolRequirements?: ToolRequirement[];
  needsStuffing?: string;
}

// Input forms
export interface PatternInputFormData {
  prompt: string;
  projectType: string;
  skillLevel: string;
  yarnType?: string;
  size?: string;
  referenceImage?: File;
}

// Dropdown options
export const projectTypes = [
  { value: "plushie", label: "Plushie 🧸" },
  { value: "blanket", label: "Blanket 🛏" },
  { value: "hat", label: "Hat 🎩" },
  { value: "bag", label: "Bag 👜" },
  { value: "scarf", label: "Scarf 🧣" },
  { value: "other", label: "Other" }
];

export const skillLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];
