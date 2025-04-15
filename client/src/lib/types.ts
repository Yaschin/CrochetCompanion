// Import all schema types from shared schema
import { 
  Pattern, PatternSection, PatternStep,
  YarnRequirement, HookRequirement, NotionsRequirement, ToolRequirement,
  StashItem
} from '../shared/schema';

// Re-export them for backward compatibility
export type {
  Pattern, PatternSection, PatternStep,
  YarnRequirement, HookRequirement, NotionsRequirement, ToolRequirement,
  StashItem
};

// Form models (keeping this as it's client-specific)
export interface PatternInputFormData {
  prompt: string;
  projectType: string;
  skillLevel: string;
  yarnType?: string;
  size?: string;
}