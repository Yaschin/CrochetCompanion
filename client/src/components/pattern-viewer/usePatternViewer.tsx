import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Pattern, PatternStep } from '@/lib/types';
import { recordActivity } from '@/lib/activityLog';
import { shareStoryCard } from '@/lib/storyCard';
import { getActiveProfile } from '@/lib/profile';
import { ToastAction } from '@/components/ui/toast';
import { showAiErrorToast } from '@/lib/aiErrorToast';

/**
 * All PatternViewer state, mutations and handlers. Kept apart from the JSX so
 * PatternViewer itself stays a thin presenter that just wires the pieces up.
 */
export function usePatternViewer(pattern: Pattern, onPatternUpdated: (pattern: Pattern) => void) {
  const { toast } = useToast();
  
  // Only store section names in state to reduce memory usage
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Start with only the first section expanded to minimize initial rendering
    return new Set([pattern.sections[0]?.name]);
  });
  
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageRefinements, setImageRefinements] = useState('');
  const [counterOpen, setCounterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "pattern" | "notes">("overview");
  const [regenSection, setRegenSection] = useState<number | null>(null);
  const [regenNote, setRegenNote] = useState("");
  // Notes live in the DB (pattern.userNotes); fall back to the legacy
  // device-local note so nothing written before the migration is lost.
  const [notes, setNotes] = useState(() => {
    if (pattern.userNotes) return pattern.userNotes;
    try { return localStorage.getItem(`crochet-time:notes:${pattern.id}`) || ""; } catch { return ""; }
  });
  const [showCelebration, setShowCelebration] = useState(false);
  // After the finish confetti, offer to deduct used-up yarn from the stash.
  const [showStashDeplete, setShowStashDeplete] = useState(false);
  const pendingDepleteRef = useRef(false);
  const [regenAllConfirmOpen, setRegenAllConfirmOpen] = useState(false);
  const [regenAllNote, setRegenAllNote] = useState("");
  const [shareConfirmOpen, setShareConfirmOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(pattern.title);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [adaptOpen, setAdaptOpen] = useState(false);
  const [adaptMode, setAdaptMode] = useState<"resize" | "substitute">("resize");
  const [adaptInstruction, setAdaptInstruction] = useState("");
  const [alignmentResults, setAlignmentResults] = useState<Record<number, { score: number; feedback: string }>>({});
  const [alignmentLoading, setAlignmentLoading] = useState<Record<number, boolean>>({});
  const regenerationTimeoutRef = useRef<NodeJS.Timeout>();

  // Re-load notes whenever the pattern changes (e.g. navigating between patterns).
  useEffect(() => {
    if (pattern.userNotes) {
      setNotes(pattern.userNotes);
      return;
    }
    try { setNotes(localStorage.getItem(`crochet-time:notes:${pattern.id}`) || ""); } catch { /* ignore */ }
    // Only re-run on pattern switch — not on every keystroke round-trip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern.id]);

  // Clean up timeout to prevent memory leaks
  useEffect(() => {
    return () => {
      if (regenerationTimeoutRef.current) {
        clearTimeout(regenerationTimeoutRef.current);
      }
    };
  }, []);

  // Memoize date formatting to avoid recalculating on every render
  const formattedDate = useMemo(() => {
    return new Date(pattern.createdAt).toLocaleDateString();
  }, [pattern.createdAt]);

  // Update pattern mutation
  const updatePatternMutation = useMutation({
    mutationFn: async (updatedPattern: Pattern) => {
      try {
        const res = await apiRequest('PUT', `/api/patterns/${updatedPattern.id}`, updatedPattern);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Error updating pattern:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      onPatternUpdated(data);
      // Celebrate the moment a project is finished (transition into "finished").
      if (data?.status === "finished" && pattern.status !== "finished") {
        recordActivity();
        pendingDepleteRef.current = true;
        setShowCelebration(true);
      }
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating your pattern.",
        variant: "destructive",
      });
    },
  });

  // Save user notes to the DB so they survive cache clears and follow the
  // pattern across devices. The legacy localStorage copy is removed on success
  // and used as a safety net if the server is unreachable (e.g. offline).
  const saveNotesMutation = useMutation({
    mutationFn: async (userNotes: string) => {
      const res = await apiRequest('PUT', `/api/patterns/${pattern.id}`, { userNotes });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    },
    onSuccess: (data) => {
      onPatternUpdated(data);
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      try { localStorage.removeItem(`crochet-time:notes:${pattern.id}`); } catch { /* ignore */ }
      toast({ title: "Notes saved! ♡", description: "Your notes are saved with this pattern." });
    },
    onError: (_err, userNotes) => {
      try { localStorage.setItem(`crochet-time:notes:${pattern.id}`, userNotes); } catch { /* ignore */ }
      toast({
        title: "Saved on this device only",
        description: "Couldn't reach the server — your note is kept locally. Try saving again when you're back online.",
        variant: "destructive",
      });
    },
  });

  // Set a real photo of the finished object as the cover image.
  const coverPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await apiRequest('POST', `/api/patterns/${pattern.id}/cover-photo`, { imageBase64 });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    },
    onSuccess: (data) => {
      onPatternUpdated(data);
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      toast({ title: "Beautiful! 📷", description: "Your photo is now the cover — trophy shelf included." });
    },
    onError: () => toast({ title: "Couldn't save the photo", description: "Please try again.", variant: "destructive" }),
  });

  // "Up next" — one pinned pattern per profile.
  const { data: upNext } = useQuery<{ patternId: string | null }>({ queryKey: ["/api/up-next"] });
  const isUpNext = upNext?.patternId === pattern.id;
  const upNextMutation = useMutation({
    mutationFn: async (pin: boolean) => {
      const res = await apiRequest('PUT', '/api/up-next', { patternId: pin ? pattern.id : "" });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: (_d, pin) => {
      queryClient.invalidateQueries({ queryKey: ["/api/up-next"] });
      toast(pin ? { title: "Pinned as up next ⏭", description: "It'll be waiting on your Home screen." } : { title: "Unpinned" });
    },
    onError: () => toast({ title: "Couldn't update", variant: "destructive" }),
  });

  const [sharingStory, setSharingStory] = useState(false);
  const handleStoryCard = async () => {
    setSharingStory(true);
    try {
      await shareStoryCard(pattern, getActiveProfile().name);
      toast({ title: "Story card ready 🎞", description: "Shared (or downloaded) — straight to the family chat!" });
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        toast({ title: "Couldn't make the card", variant: "destructive" });
      }
    } finally {
      setSharingStory(false);
    }
  };

  // Rename the pattern (AI titles can be quirky).
  const renameMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest('PUT', `/api/patterns/${pattern.id}`, { title });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    },
    onSuccess: (data) => {
      onPatternUpdated(data);
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      setEditingTitle(false);
      toast({ title: "Renamed ♡" });
    },
    onError: () => toast({ title: "Couldn't rename", variant: "destructive" }),
  });

  // Publish this pattern to the Community Library (publish-from-library path)
  const shareToCommunityMutation = useMutation({
    mutationFn: async () => {
      const body = {
        title: pattern.title,
        projectType: pattern.projectType,
        skillLevel: pattern.skillLevel,
        description: pattern.description || '',
        endProductImage: pattern.endProductImage,
        yarnType: pattern.yarnType,
        size: pattern.size,
        sections: pattern.sections,
        yarnRequirements: pattern.yarnRequirements || [],
        hookRequirements: pattern.hookRequirements || [],
        notionsRequirements: pattern.notionsRequirements || [],
        toolRequirements: pattern.toolRequirements || [],
        needsStuffing: pattern.needsStuffing,
      };
      const res = await apiRequest('POST', '/api/community', body);
      if (!res.ok) throw new Error('share failed');
      return res.json();
    },
    onSuccess: () => {
      setShareConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/community'] });
      toast({ title: 'Shared to Community ✨', description: 'Your pattern is now in the Community Library.' });
    },
    onError: () => toast({ title: 'Could not share pattern', variant: 'destructive' }),
  });

  // Adapt pattern — resize or yarn substitute (creates a new pattern, non-destructive)
  const adaptMutation = useMutation({
    mutationFn: async ({ mode, instruction }: { mode: "resize" | "substitute"; instruction: string }) => {
      const endpoint = mode === "resize" ? "resize" : "substitute";
      const res = await apiRequest("POST", `/api/patterns/${pattern.id}/${endpoint}`, { instruction });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Adaptation failed");
      }
      return res.json() as Promise<Pattern>;
    },
    onSuccess: (newPattern) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      setAdaptOpen(false);
      setAdaptInstruction("");
      toast({
        title: "Adapted pattern created ✨",
        description: `"${newPattern.title}" is now in your library.`,
        action: <ToastAction altText="View" onClick={() => onPatternUpdated(newPattern)}>View it</ToastAction>,
      });
    },
    onError: (err) => {
      toast({ title: "Adaptation failed", description: (err as Error).message, variant: "destructive" });
    },
  });

  // Alignment check — AI compares a section photo against the pattern instructions
  const checkAlignment = async (sectionIndex: number) => {
    setAlignmentLoading(prev => ({ ...prev, [sectionIndex]: true }));
    try {
      const res = await apiRequest("POST", `/api/patterns/${pattern.id}/sections/${sectionIndex}/alignment-check`, {});
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Alignment check failed");
      }
      const data = await res.json();
      setAlignmentResults(prev => ({ ...prev, [sectionIndex]: { score: data.alignmentScore, feedback: data.feedback } }));
    } catch (err) {
      toast({ title: "Alignment check failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setAlignmentLoading(prev => ({ ...prev, [sectionIndex]: false }));
    }
  };

  // Regenerate steps mutation
  const regenerateStepsMutation = useMutation({
    mutationFn: async (data: { patternId: string; unlockedStepsOnly: boolean; userNote?: string }) => {
      // Use the persisting, lock-aware regenerate endpoint so locked steps are
      // preserved server-side and the result is saved to the database.
      const res = await apiRequest('POST', `/api/patterns/${data.patternId}/regenerate`, {
        userNote: data.userNote || undefined,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      // The regenerate endpoint returns { success, message, pattern }
      onPatternUpdated(data.pattern);
      toast({
        title: "Pattern Regenerated",
        description: "Your pattern has been updated with new instructions.",
      });
    },
    onError: (error) => {
      showAiErrorToast(error, { action: "regenerate your pattern", fallbackTitle: "Regeneration Failed" });
    },
  });

  // Regenerate product image mutation
  const regenerateImageMutation = useMutation({
    mutationFn: async (data: { patternId: string; refinements?: string }) => {
      const res = await apiRequest('POST', `/api/patterns/${data.patternId}/product-image`, {
        refinements: data.refinements
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Update pattern with new image
      onPatternUpdated(data.pattern);
      toast({
        title: "Image Regenerated",
        description: "Your pattern image has been updated.",
      });
      // Close dialog and reset state
      setImageDialogOpen(false);
      setImageRefinements('');
    },
    onError: (error) => {
      showAiErrorToast(error, { action: "regenerate the image", fallbackTitle: "Image Regeneration Failed" });
      setImageDialogOpen(false);
    },
  });

  // Toggle section expansion - memoized to prevent unnecessary re-renders
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

  // Update a step with optimized memory usage
  const updateStep = useCallback((sectionIndex: number, stepIndex: number, updatedStep: PatternStep) => {
    // Create a memory-efficient copy of the pattern using structural sharing
    const updatedSections = [...pattern.sections];
    
    // Only clone the specific section being modified
    const currentSection = updatedSections[sectionIndex];
    const updatedSteps = [...currentSection.steps];
    
    // Replace only the specific step
    updatedSteps[stepIndex] = updatedStep;
    
    // Create updated section with the new steps array
    updatedSections[sectionIndex] = {
      ...currentSection,
      steps: updatedSteps
    };

    // Create the updated pattern with minimum cloning
    const updatedPattern = { ...pattern, sections: updatedSections };
    updatePatternMutation.mutate(updatedPattern);
  }, [pattern, updatePatternMutation]);

  // Delete a step with optimized memory usage
  const deleteStep = useCallback((sectionIndex: number, stepIndex: number) => {
    // Create minimal copies needed for the update
    const updatedSections = [...pattern.sections];
    const currentSection = updatedSections[sectionIndex];
    
    // Create a new steps array without the deleted step
    const filteredSteps = currentSection.steps.filter((_, i) => i !== stepIndex);
    
    // Update only the affected section
    updatedSections[sectionIndex] = {
      ...currentSection,
      steps: filteredSteps
    };

    // Create updated pattern with minimal cloning
    const updatedPattern = { ...pattern, sections: updatedSections };
    updatePatternMutation.mutate(updatedPattern);
  }, [pattern, updatePatternMutation]);

  // Add a new step to a section with memory optimization
  const addStep = useCallback((sectionIndex: number) => {
    // Get the current section
    const currentSection = pattern.sections[sectionIndex];
    
    // Calculate the new step ID efficiently
    const maxId = currentSection.steps.reduce(
      (max, step) => Math.max(max, step.id), 0
    );
    const newStepId = maxId + 1;
    
    // Create the new step with minimal properties
    const newStep = {
      id: newStepId,
      text: "New step - add your instructions here",
      locked: false,
      count: 0,
      notes: "",
      photo: null,
      completed: false
    };
    
    // Create updated sections array with minimal cloning
    const updatedSections = [...pattern.sections];
    updatedSections[sectionIndex] = {
      ...currentSection,
      steps: [...currentSection.steps, newStep]
    };

    // Update the pattern with minimal cloning
    const updatedPattern = { ...pattern, sections: updatedSections };
    updatePatternMutation.mutate(updatedPattern);
  }, [pattern, updatePatternMutation]);

  // Add a new section with memory optimization and memoization
  const addSection = useCallback(() => {
    const newSectionName = "New Section";
    
    // Create the minimal required new section object
    const newSection = {
      name: newSectionName,
      notes: "",
      locked: false,
      partImageUrl: null,
      steps: [
        // Include only one initial step with minimal properties
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
    };
    
    // Create updated pattern with minimal cloning
    const updatedPattern = {
      ...pattern,
      sections: [...pattern.sections, newSection]
    };

    // Submit the update
    updatePatternMutation.mutate(updatedPattern);

    // Expand the new section for immediate editing
    setExpandedSections(prev => new Set(prev).add(newSectionName));
  }, [pattern, updatePatternMutation]);

  // Handle pattern regeneration
  const handleRegeneratePattern = async (userNote?: string) => {
    setIsRegenerating(true);
    try {
      await regenerateStepsMutation.mutateAsync({
        patternId: pattern.id,
        unlockedStepsOnly: true,
        userNote,
      });
    } catch (error) {
      // Error toast is surfaced by the mutation's onError; swallow the rejection
      // here so it doesn't become an unhandled promise rejection.
      console.error('Error in handleRegeneratePattern:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle product image regeneration
  const handleRegenerateImage = async () => {
    setImageDialogOpen(true);
  };

  // Handle the image dialog submit
  const handleImageRefinementSubmit = async () => {
    setIsRegeneratingImage(true);
    try {
      await regenerateImageMutation.mutateAsync({
        patternId: pattern.id,
        refinements: imageRefinements
      });
    } catch (error) {
      // Error toast is surfaced by the mutation's onError; swallow the rejection
      // here so it doesn't become an unhandled promise rejection.
      console.error('Error in handleImageRefinementSubmit:', error);
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  // Handle pattern export with memory optimization and memoization
  const handleExportPattern = useCallback(() => {
    // Create pattern text in chunks to reduce memory pressure
    const textChunks = [];
    
    // Add header information
    textChunks.push(`# ${pattern.title}\n\n`);
    textChunks.push(`Project Type: ${pattern.projectType}\n`);
    textChunks.push(`Skill Level: ${pattern.skillLevel}\n`);
    if (pattern.yarnType) textChunks.push(`Yarn Type: ${pattern.yarnType}\n`);
    if (pattern.size) textChunks.push(`Size: ${pattern.size}\n\n`);

    // Process each section separately to avoid creating one large string
    pattern.sections.forEach(section => {
      textChunks.push(`## ${section.name}\n\n`);

      // Process steps in batches
      section.steps.forEach(step => {
        let stepText = `${step.id}. ${step.text}\n`;
        if (step.notes) stepText += `   Notes: ${step.notes}\n`;
        stepText += '\n';
        textChunks.push(stepText);
      });
    });

    // Join chunks only at the end to minimize memory usage
    const exportText = textChunks.join('');
    
    // Create a download link
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Use a more direct download approach
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pattern.title.replace(/\s+/g, '_')}_pattern.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Clean up resources immediately to prevent memory leaks
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }, [pattern]); // Only re-create when pattern changes

  return {
    expandedSections,
    isRegenerating,
    isRegeneratingImage,
    imageDialogOpen,
    setImageDialogOpen,
    imageRefinements,
    setImageRefinements,
    counterOpen,
    setCounterOpen,
    activeTab,
    setActiveTab,
    regenSection,
    setRegenSection,
    regenNote,
    setRegenNote,
    notes,
    setNotes,
    showCelebration,
    setShowCelebration,
    showStashDeplete,
    setShowStashDeplete,
    regenAllConfirmOpen,
    setRegenAllConfirmOpen,
    regenAllNote,
    setRegenAllNote,
    shareConfirmOpen,
    setShareConfirmOpen,
    followOpen,
    setFollowOpen,
    editingTitle,
    setEditingTitle,
    titleDraft,
    setTitleDraft,
    adaptOpen,
    setAdaptOpen,
    adaptMode,
    setAdaptMode,
    adaptInstruction,
    setAdaptInstruction,
    alignmentResults,
    alignmentLoading,
    sharingStory,
    pendingDepleteRef,
    coverInputRef,
    formattedDate,
    isUpNext,
    updatePatternMutation,
    saveNotesMutation,
    coverPhotoMutation,
    upNextMutation,
    renameMutation,
    shareToCommunityMutation,
    adaptMutation,
    regenerateStepsMutation,
    regenerateImageMutation,
    handleStoryCard,
    checkAlignment,
    toggleSection,
    updateStep,
    deleteStep,
    addStep,
    addSection,
    handleRegeneratePattern,
    handleRegenerateImage,
    handleImageRefinementSubmit,
    handleExportPattern,
  };
}
