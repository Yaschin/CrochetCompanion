import { useState, useCallback } from 'react';
import { Pattern, PatternStep } from '@/lib/types';

/**
 * Section/step editing for the pattern viewer: which sections are expanded,
 * plus the add/update/delete CRUD over steps and sections. Extracted from
 * usePatternViewer so the container hook stays focused. Every change is
 * persisted through the shared updatePatternMutation (uses structural sharing
 * to clone only the section being edited).
 */
export function useSectionEditing(
  pattern: Pattern,
  updatePatternMutation: { mutate: (pattern: Pattern) => void },
) {
  // Only store section names in state to reduce memory usage; start with only
  // the first section expanded to minimize initial rendering.
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set([pattern.sections[0]?.name]),
  );

  const toggleSection = useCallback((sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  }, []);

  const updateStep = useCallback((sectionIndex: number, stepIndex: number, updatedStep: PatternStep) => {
    const updatedSections = [...pattern.sections];
    const currentSection = updatedSections[sectionIndex];
    const updatedSteps = [...currentSection.steps];
    updatedSteps[stepIndex] = updatedStep;
    updatedSections[sectionIndex] = { ...currentSection, steps: updatedSteps };
    updatePatternMutation.mutate({ ...pattern, sections: updatedSections });
  }, [pattern, updatePatternMutation]);

  const deleteStep = useCallback((sectionIndex: number, stepIndex: number) => {
    const updatedSections = [...pattern.sections];
    const currentSection = updatedSections[sectionIndex];
    const filteredSteps = currentSection.steps.filter((_, i) => i !== stepIndex);
    updatedSections[sectionIndex] = { ...currentSection, steps: filteredSteps };
    updatePatternMutation.mutate({ ...pattern, sections: updatedSections });
  }, [pattern, updatePatternMutation]);

  const addStep = useCallback((sectionIndex: number) => {
    const currentSection = pattern.sections[sectionIndex];
    const maxId = currentSection.steps.reduce((max, step) => Math.max(max, step.id), 0);
    const newStep = {
      id: maxId + 1,
      text: "New step - add your instructions here",
      locked: false,
      count: 0,
      notes: "",
      photo: null,
      completed: false,
    };
    const updatedSections = [...pattern.sections];
    updatedSections[sectionIndex] = { ...currentSection, steps: [...currentSection.steps, newStep] };
    updatePatternMutation.mutate({ ...pattern, sections: updatedSections });
  }, [pattern, updatePatternMutation]);

  const addSection = useCallback(() => {
    const newSectionName = "New Section";
    const newSection = {
      name: newSectionName,
      notes: "",
      locked: false,
      partImageUrl: null,
      steps: [
        { id: 1, text: "Add your instructions here", locked: false, count: 0, notes: "", photo: null, completed: false },
      ],
    };
    updatePatternMutation.mutate({ ...pattern, sections: [...pattern.sections, newSection] });
    setExpandedSections(prev => new Set(prev).add(newSectionName));
  }, [pattern, updatePatternMutation]);

  return { expandedSections, toggleSection, updateStep, deleteStep, addStep, addSection };
}
