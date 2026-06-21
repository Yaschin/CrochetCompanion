import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePatternRegen } from './usePatternRegen';
import { useSectionEditing } from './useSectionEditing';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { fileToDataUrl } from '@/lib/utils';
import { Pattern } from '@/lib/types';
import { recordActivity } from '@/lib/activityLog';
import { estimateForType } from '@/lib/timeTracking';
import { shareStoryCard } from '@/lib/storyCard';
import { getActiveProfile } from '@/lib/profile';
import { ToastAction } from '@/components/ui/toast';

/**
 * All PatternViewer state, mutations and handlers. Kept apart from the JSX so
 * PatternViewer itself stays a thin presenter that just wires the pieces up.
 */
export function usePatternViewer(pattern: Pattern, onPatternUpdated: (pattern: Pattern) => void) {
  const { toast } = useToast();

  const {
    isRegenerating,
    isRegeneratingImage,
    imageDialogOpen,
    setImageDialogOpen,
    imageRefinements,
    setImageRefinements,
    regenSection,
    setRegenSection,
    regenNote,
    setRegenNote,
    regenAllConfirmOpen,
    setRegenAllConfirmOpen,
    regenAllNote,
    setRegenAllNote,
    regenerateStepsMutation,
    regenerateImageMutation,
    handleRegeneratePattern,
    handleRegenerateImage,
    handleImageRefinementSubmit,
  } = usePatternRegen(pattern, onPatternUpdated);
  
  const [counterOpen, setCounterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "pattern" | "notes">("overview");
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

  // Personalised time estimate: average tracked time across the family's own
  // finished projects of this type. Reads the already-cached library list.
  const { data: allPatterns } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });
  const timeEstimate = useMemo(
    () => estimateForType(allPatterns ?? [], pattern.projectType),
    [allPatterns, pattern.projectType],
  );

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

  // Section/step expansion + CRUD live in a focused sub-hook; they persist
  // through the same updatePatternMutation defined above.
  const { expandedSections, toggleSection, updateStep, deleteStep, addStep, addSection } =
    useSectionEditing(pattern, updatePatternMutation);

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
      const imageBase64 = await fileToDataUrl(file);
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
  const { data: upNext, isLoading: upNextLoading } = useQuery<{ patternId: string | null }>({ queryKey: ["/api/up-next"] });
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
    timeEstimate,
    isUpNext,
    upNextLoading,
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
