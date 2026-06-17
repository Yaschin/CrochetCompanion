import { Pattern, PatternSection } from "./types";
import { isMaterialsSection } from "@shared/sections";

/**
 * The single source of truth for "how far along is this make?".
 * Materials sections are gather-checklists, not crochet rounds, so they are
 * excluded — keeping the viewer, library cards, home card, projects screen,
 * progress screen and follow mode all on the same denominator.
 */
export function craftSections(sections: PatternSection[] | undefined): PatternSection[] {
  return (sections ?? []).filter((s) => !isMaterialsSection(s.name));
}

export interface ProgressInfo {
  done: number;
  total: number;
  pct: number;
}

export function patternProgress(pattern: Pick<Pattern, "sections">): ProgressInfo {
  const steps = craftSections(pattern.sections).flatMap((s) => s.steps);
  const done = steps.filter((s) => s.completed).length;
  const total = steps.length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}
