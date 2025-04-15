import { useState, useCallback } from 'react';
import { Pattern, PatternSection, PatternStep } from '../lib/types';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function usePatternState(initialPattern?: Pattern) {
  const { toast } = useToast();
  const [pattern, setPattern] = useState<Pattern | undefined>(initialPattern);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Update pattern in database
  const updatePatternMutation = useMutation({
    mutationFn: async (updatedPattern: Pattern) => {
      const res = await apiRequest('PUT', `/api/patterns/${updatedPattern.id}`, updatedPattern);
      return res.json();
    },
    onSuccess: (data) => {
      setPattern(data);
      toast({
        title: "Pattern Updated",
        description: "Your pattern has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating your pattern.",
        variant: "destructive",
      });
    },
  });

  // Update a step
  const updateStep = useCallback((sectionIndex: number, stepIndex: number, updatedStep: PatternStep) => {
    if (!pattern) return;

    const updatedSections = [...pattern.sections];
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      steps: [
        ...updatedSections[sectionIndex].steps.slice(0, stepIndex),
        updatedStep,
        ...updatedSections[sectionIndex].steps.slice(stepIndex + 1)
      ]
    };

    const updatedPattern = { ...pattern, sections: updatedSections };
    updatePatternMutation.mutate(updatedPattern);
  }, [pattern, updatePatternMutation]);

  // Delete a step
  const deleteStep = useCallback((sectionIndex: number, stepIndex: number) => {
    if (!pattern) return;

    const updatedSections = [...pattern.sections];
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      steps: updatedSections[sectionIndex].steps.filter((_, i) => i !== stepIndex)
    };

    const updatedPattern = { ...pattern, sections: updatedSections };
    updatePatternMutation.mutate(updatedPattern);
  }, [pattern, updatePatternMutation]);

  // Add a new step to a section
  const addStep = useCallback((sectionIndex: number) => {
    if (!pattern) return;

    const updatedSections = [...pattern.sections];
    const newStepId = Math.max(...updatedSections[sectionIndex].steps.map(s => s.id), 0) + 1;
    
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      steps: [
        ...updatedSections[sectionIndex].steps,
        {
          id: newStepId,
          text: "New step - add your instructions here",
          locked: false,
          count: 0,
          notes: "",
          photo: null,
          completed: false
        }
      ]
    };

    const updatedPattern = { ...pattern, sections: updatedSections };
    updatePatternMutation.mutate(updatedPattern);
  }, [pattern, updatePatternMutation]);

  // Add a new section
  const addSection = useCallback((sectionName: string) => {
    if (!pattern) return;

    const updatedPattern = {
      ...pattern,
      sections: [
        ...pattern.sections,
        {
          name: sectionName,
          steps: [
            {
              id: 1,
              text: "Add your instructions here",
              locked: false,
              count: 0,
              notes: "",
              photo: null,
              completed: false
            }
          ]
        }
      ]
    };

    updatePatternMutation.mutate(updatedPattern);
  }, [pattern, updatePatternMutation]);

  // Calculate progress
  const calculateProgress = useCallback(() => {
    if (!pattern) return { completedSteps: 0, totalSteps: 0, percentComplete: 0 };

    const counts = pattern.sections.reduce((acc, section) => {
      const sectionCounts = section.steps.reduce((stepAcc, step) => ({
        total: stepAcc.total + 1,
        completed: stepAcc.completed + (step.completed ? 1 : 0)
      }), { total: 0, completed: 0 });
      
      return {
        total: acc.total + sectionCounts.total,
        completed: acc.completed + sectionCounts.completed
      };
    }, { total: 0, completed: 0 });

    return {
      completedSteps: counts.completed,
      totalSteps: counts.total,
      percentComplete: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0
    };
  }, [pattern]);

  return {
    pattern,
    setPattern,
    updateStep,
    deleteStep,
    addStep,
    addSection,
    calculateProgress,
    isUpdating: updatePatternMutation.isPending
  };
}
