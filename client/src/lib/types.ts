// Pattern data model
export interface YarnRequirement {
  color: string;
  volume: string; // e.g., "~50g" or "~80 yards"
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
