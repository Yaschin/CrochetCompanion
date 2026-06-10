import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { Pattern, PatternSection as PatternSectionType, PatternStep, ViewType } from '../lib/types';
import PatternSection from './PatternSection';
import EnhancedMaterialsList from './EnhancedMaterialsList';
import PatternProgressBar from './PatternProgressBar';
import StitchCounter from './StitchCounter';
import FollowMode from './FollowMode';
import CelebrationOverlay from './CelebrationOverlay';
import StashCoverage from './StashCoverage';
import { recordActivity } from '../lib/activityLog';
import { cn } from '../lib/utils';
import { RefreshCw, Download, FileText, Plus, Image, Hash, Heart, CheckCircle2, Pencil, Play, Share2, Scissors, Shuffle } from 'lucide-react';
import { printPattern } from '../lib/printPattern';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { ToastAction } from './ui/toast';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PatternViewerProps {
  pattern: Pattern;
  onPatternUpdated: (pattern: Pattern) => void;
  onNavigate?: (view: ViewType) => void;
}

/**
 * PatternViewer component displays the pattern details and allows interaction
 * Optimized for memory efficiency and performance with large patterns
 */
const PatternViewer: React.FC<PatternViewerProps> = ({ pattern, onPatternUpdated, onNavigate }) => {
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
      try {
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
      } catch (error) {
        console.error('Error regenerating pattern:', error);
        // Check if it's likely an API key issue
        const errorMsg = String(error);
        
        if (errorMsg.includes('API key') || errorMsg.includes('authentication') || 
            errorMsg.includes('401') || errorMsg.includes('403')) {
          // Use the specialized API warning toast with direct link to OpenAI
          toast({
            title: "OpenAI API Key Required",
            description: "To generate custom patterns, please add a valid OpenAI API key in your environment variables. Visit platform.openai.com to get a key.",
            variant: "apiWarning",
            action: <ToastAction altText="Visit OpenAI" onClick={() => window.open('https://platform.openai.com/account/api-keys', '_blank')}>Get API Key</ToastAction>,
            duration: 10000, // Show for longer (10 seconds)
          });
          throw new Error('OpenAI API key missing or invalid. Please add a valid API key to enable pattern generation.');
        }
        
        // Handle rate limits specifically
        if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
          toast({
            title: "Rate Limit Reached",
            description: "OpenAI API rate limit reached. Please try again in a few moments.",
            variant: "apiWarning",
            duration: 8000,
          });
          throw new Error('OpenAI API rate limit reached. Please try again later.');
        }
        
        // Handle timeout issues
        if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          toast({
            title: "Generation Timed Out",
            description: "The pattern generation request timed out. Please try again with a simpler prompt.",
            variant: "apiWarning",
            duration: 8000,
          });
          throw new Error('Pattern generation timed out. Try a simpler prompt or try again later.');
        }
        
        throw error;
      }
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
      const errorMessage = error instanceof Error ? error.message : 
        "There was an error regenerating your pattern.";
      
      const errorString = String(error);
      const isApiKeyError = errorString.includes('API key') || 
                           errorString.includes('authentication') || 
                           errorString.includes('401') || 
                           errorString.includes('403');
      
      if (isApiKeyError) {
        toast({
          title: "API Key Required",
          description: "OpenAI API key is missing or invalid. Please add your OpenAI API key to continue with pattern regeneration.",
          variant: "apiWarning",
          action: (
            <ToastAction altText="Get API Key">
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                Get API Key
              </a>
            </ToastAction>
          ),
        });
      } else if (errorString.includes('429') || errorString.toLowerCase().includes('rate limit')) {
        toast({
          title: "Rate Limit Exceeded",
          description: "The OpenAI API rate limit has been reached. Please try again later.",
          variant: "apiWarning",
        });
      } else if (errorString.includes('timeout') || errorString.includes('timed out')) {
        toast({
          title: "Request Timeout",
          description: "The pattern generation request took too long. Please try again with a simpler prompt.",
          variant: "apiWarning",
        });
      } else {
        toast({
          title: "Regeneration Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  // Regenerate product image mutation
  const regenerateImageMutation = useMutation({
    mutationFn: async (data: { patternId: string; refinements?: string }) => {
      try {
        const res = await apiRequest('POST', `/api/patterns/${data.patternId}/product-image`, {
          refinements: data.refinements
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        
        return res.json();
      } catch (error) {
        console.error('Error regenerating pattern image:', error);
        // Check if it's likely an API key issue
        const errorMsg = String(error);
        
        if (errorMsg.includes('API key') || errorMsg.includes('authentication') || 
            errorMsg.includes('401') || errorMsg.includes('403')) {
          // Use the specialized API warning toast instead of throwing
          toast({
            title: "OpenAI API Key Required",
            description: "To generate custom images, please add a valid OpenAI API key in your environment variables. Visit platform.openai.com to get a key.",
            variant: "apiWarning",
            action: <ToastAction altText="Visit OpenAI" onClick={() => window.open('https://platform.openai.com/account/api-keys', '_blank')}>Get API Key</ToastAction>,
            duration: 10000, // Show for longer (10 seconds)
          });
          throw new Error('OpenAI API key missing or invalid. Please add a valid API key to enable image generation.');
        }
        
        // Handle rate limits specifically
        if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
          toast({
            title: "Rate Limit Reached",
            description: "OpenAI API rate limit reached. Please try again in a few moments.",
            variant: "apiWarning",
            duration: 8000,
          });
          throw new Error('OpenAI API rate limit reached. Please try again later.');
        }
        
        // Handle timeout issues
        if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          toast({
            title: "Generation Timed Out",
            description: "The image generation request timed out. Please try again with a simpler prompt.",
            variant: "apiWarning",
            duration: 8000,
          });
          throw new Error('Image generation timed out. Try a simpler prompt or try again later.');
        }
        
        throw error;
      }
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
      const errorMessage = error instanceof Error ? error.message : 
        "There was an error regenerating your pattern image.";
      
      const errorString = String(error);
      const isApiKeyError = errorString.includes('API key') || 
                           errorString.includes('authentication') || 
                           errorString.includes('401') || 
                           errorString.includes('403');
      
      if (isApiKeyError) {
        toast({
          title: "API Key Required",
          description: "OpenAI API key is missing or invalid. Please add your OpenAI API key to continue with image generation.",
          variant: "apiWarning",
          action: (
            <ToastAction altText="Get API Key">
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                Get API Key
              </a>
            </ToastAction>
          ),
        });
      } else if (errorString.includes('429') || errorString.toLowerCase().includes('rate limit')) {
        toast({
          title: "Rate Limit Exceeded",
          description: "The OpenAI API rate limit has been reached. Please try again later.",
          variant: "destructive",
        });
      } else if (errorString.includes('timeout') || errorString.includes('timed out')) {
        toast({
          title: "Request Timeout",
          description: "The image generation request took too long. Please try again with a simpler prompt.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Image Regeneration Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
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
      // Error is already handled by the mutation's onError
      // This catch prevents unhandled promise rejections
      console.error('Error in handleRegeneratePattern:', error);
      
      // Display a more user-friendly message if it's an OpenAI API issue
      const errorString = String(error);
      const isApiKeyError = errorString.includes('API key') || 
                           errorString.includes('authentication') || 
                           errorString.includes('401') || 
                           errorString.includes('403');
      
      if (isApiKeyError) {
        toast({
          title: "API Key Required",
          description: "OpenAI API key is missing or invalid. Please add your OpenAI API key to continue with pattern regeneration.",
          variant: "apiWarning",
          action: (
            <ToastAction altText="Get API Key">
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                Get API Key
              </a>
            </ToastAction>
          ),
        });
      } else if (errorString.includes('429') || errorString.toLowerCase().includes('rate limit')) {
        toast({
          title: "Rate Limit Exceeded",
          description: "The OpenAI API rate limit has been reached. Please try again later.",
          variant: "apiWarning",
        });
      }
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
      // Error is already handled by the mutation's onError
      // This catch prevents unhandled promise rejections
      console.error('Error in handleImageRefinementSubmit:', error);
      
      // Display a more user-friendly message if it's an OpenAI API issue
      const errorString = String(error);
      const isApiKeyError = errorString.includes('API key') || 
                           errorString.includes('authentication') || 
                           errorString.includes('401') || 
                           errorString.includes('403');
      
      if (isApiKeyError) {
        toast({
          title: "API Key Required",
          description: "OpenAI API key is missing or invalid. Please add your OpenAI API key to continue with image generation.",
          variant: "apiWarning",
          action: (
            <ToastAction altText="Get API Key">
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                Get API Key
              </a>
            </ToastAction>
          ),
        });
      } else if (errorString.includes('429') || errorString.toLowerCase().includes('rate limit')) {
        toast({
          title: "Rate Limit Exceeded",
          description: "The OpenAI API rate limit has been reached. Please try again later.",
          variant: "apiWarning",
        });
      } else if (errorString.includes('timeout') || errorString.includes('timed out')) {
        toast({
          title: "Request Timeout",
          description: "The image generation request took too long. Please try again with a simpler prompt.",
          variant: "apiWarning",
        });
      }
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

  return (
    <div className="mb-8 flex flex-col gap-4">
      <CelebrationOverlay
        show={showCelebration}
        onDone={() => setShowCelebration(false)}
        subtitle={`"${pattern.title}" is finished ♡`}
      />
      <StitchCounter
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        patternId={pattern.id}
        patternTitle={pattern.title}
      />
      <FollowMode
        pattern={pattern}
        open={followOpen}
        onClose={() => setFollowOpen(false)}
        onUpdateStep={updateStep}
        onMarkFinished={() => {
          // Close first so the confetti celebration is visible.
          setFollowOpen(false);
          updatePatternMutation.mutate({ ...pattern, status: "finished", finishedAt: new Date().toISOString() });
        }}
      />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                aria-label="Pattern name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && titleDraft.trim()) renameMutation.mutate(titleDraft.trim());
                  if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(pattern.title); }
                }}
                className="font-heading text-xl font-bold leading-tight flex-1 min-w-0 rounded-lg px-2 py-1 outline-none"
                style={{ color: "#3D2318", background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(194,78,107,0.4)" }}
              />
              <button
                onClick={() => titleDraft.trim() && renameMutation.mutate(titleDraft.trim())}
                disabled={renameMutation.isPending || !titleDraft.trim()}
                aria-label="Save name"
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-50"
                style={{ background: "#C24E6B", color: "white" }}
              >
                {renameMutation.isPending ? "…" : "Save"}
              </button>
            </div>
          ) : (
            <h2 className="font-heading text-xl font-bold leading-tight group" style={{ color: "#3D2318" }}>
              {pattern.title}
              <button
                onClick={() => { setTitleDraft(pattern.title); setEditingTitle(true); }}
                aria-label="Rename pattern"
                title="Rename pattern"
                className="ml-2 inline-flex align-middle opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: "#9A7868" }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </h2>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {pattern.status === 'active' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">In progress</span>
            )}
            {pattern.status === 'finished' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">Finished ✓</span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
              {pattern.projectType}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
              {pattern.skillLevel}
            </span>
            {pattern.yarnType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">
                🧶 {pattern.yarnType}
              </span>
            )}
            {pattern.size && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
                📐 {pattern.size}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-medium hidden sm:block" style={{ color: "#B0908A" }}>
            Created {formattedDate}
          </span>
          <button
            type="button"
            onClick={() => updatePatternMutation.mutate({ ...pattern, favorite: !pattern.favorite })}
            aria-label={pattern.favorite ? 'Remove from favorites' : 'Add to favorites'}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110"
            style={{
              background: pattern.favorite ? "rgba(194,78,107,0.12)" : "rgba(140,100,55,0.08)",
              border: `1.5px solid ${pattern.favorite ? "rgba(194,78,107,0.3)" : "rgba(140,100,55,0.18)"}`,
            }}
          >
            <Heart className={cn('h-4.5 w-4.5', pattern.favorite ? 'fill-primary text-primary' : '')} style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(140,100,55,0.08)" }}>
        {(["overview", "pattern", "notes"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold capitalize transition-all"
            style={{
              background: activeTab === tab ? "white" : "transparent",
              color: activeTab === tab ? "#C24E6B" : "#9A7868",
              boxShadow: activeTab === tab ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tab === "overview" ? "Overview" : tab === "pattern" ? "Pattern" : "Notes"}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-4">

          {/* Image + specs card */}
          <div className="surface-card p-4">
            <div className="flex gap-4">
              {pattern.endProductImage ? (
                <div className="relative flex-shrink-0 group">
                  <img
                    src={pattern.endProductImage}
                    alt={pattern.title}
                    className="w-32 h-32 rounded-xl object-cover"
                  />
                  <button
                    onClick={handleRegenerateImage}
                    className="absolute bottom-1.5 right-1.5 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Regenerate image"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-primary" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl flex items-center justify-center flex-shrink-0 text-4xl"
                  style={{ background: "rgba(140,100,55,0.08)" }}>
                  🧶
                </div>
              )}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1.5">
                  {[
                    { label: "Type",  value: pattern.projectType },
                    { label: "Level", value: pattern.skillLevel },
                    { label: "Yarn",  value: pattern.yarnType },
                    { label: "Size",  value: pattern.size },
                    { label: "Created", value: formattedDate },
                  ].filter(r => r.value).map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider w-14 flex-shrink-0"
                        style={{ color: "#B0908A" }}>{label}</span>
                      <span className="text-[12px] font-medium truncate" style={{ color: "#3D2318" }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {pattern.status === 'finished' && (
                    <>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) coverPhotoMutation.mutate(f); e.target.value = ''; }}
                      />
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        disabled={coverPhotoMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: "rgba(132,147,79,0.12)", color: "#84934F", border: "1px solid rgba(132,147,79,0.3)" }}
                      >
                        📷 {coverPhotoMutation.isPending ? "Saving…" : "Finished photo"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => printPattern(pattern)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(194,78,107,0.1)", color: "#C24E6B", border: "1px solid rgba(194,78,107,0.2)" }}
                  >
                    <FileText className="h-3 w-3" /> Print / PDF
                  </button>
                  <button
                    onClick={handleExportPattern}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(194,78,107,0.1)", color: "#C24E6B", border: "1px solid rgba(194,78,107,0.2)" }}
                  >
                    <Download className="h-3 w-3" /> Download
                  </button>
                  <button
                    onClick={handleRegenerateImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(132,147,79,0.1)", color: "#84934F", border: "1px solid rgba(132,147,79,0.2)" }}
                  >
                    <RefreshCw className="h-3 w-3" /> New Image
                  </button>
                  <button
                    onClick={() => setShareConfirmOpen(true)}
                    disabled={shareToCommunityMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: "rgba(124,95,168,0.1)", color: "#7C5FA8", border: "1px solid rgba(124,95,168,0.2)" }}
                  >
                    <Share2 className="h-3 w-3" /> {shareToCommunityMutation.isPending ? "Sharing…" : "Share"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <PatternProgressBar sections={pattern.sections} />

          {/* Project lifecycle */}
          <div className="flex gap-2">
            {pattern.status !== 'active' && pattern.status !== 'finished' && (
              <button
                onClick={() => updatePatternMutation.mutate({ ...pattern, status: 'active', startedAt: new Date().toISOString() })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #C24E6B, #A83050)", color: "white", boxShadow: "0 3px 12px rgba(194,78,107,0.3)" }}
              >
                <Play className="h-3.5 w-3.5" /> Start project
              </button>
            )}
            {pattern.status === 'active' && (
              <button
                onClick={() => updatePatternMutation.mutate({ ...pattern, status: 'finished', finishedAt: new Date().toISOString() })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "rgba(132,147,79,0.14)", color: "#5F6B36", border: "1px solid rgba(132,147,79,0.3)" }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark finished
              </button>
            )}
            {pattern.status === 'finished' && (
              <button
                onClick={() => updatePatternMutation.mutate({ ...pattern, status: 'active', finishedAt: null })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "rgba(140,100,55,0.08)", color: "#7A5C3E", border: "1px solid rgba(140,100,55,0.22)" }}
              >
                <Play className="h-3.5 w-3.5" /> Reopen project
              </button>
            )}
          </div>

          {/* Tools grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "🧮", label: "Row Counter",  action: () => setCounterOpen(true),         color: "#7C5FA8" },
              { emoji: "📊", label: "Progress",      action: () => onNavigate?.("progress"),    color: "#84934F" },
              { emoji: "📷", label: "Photos",         action: () => onNavigate?.("photo-upload"),color: "#3D8FA3" },
              { emoji: "🧶", label: "From My Stash", action: () => onNavigate?.("yarn-recs"),   color: "#D4921A" },
            ].map(({ emoji, label, action, color }) => (
              <button
                key={label}
                onClick={action}
                className="flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `${color}10`, border: `1.5px solid ${color}28` }}
              >
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <span className="font-heading font-semibold text-[13px]" style={{ color }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Adapt this pattern */}
          <div className="surface-card p-4">
            <button
              onClick={() => setAdaptOpen(v => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-[18px]">✂️</span>
                <span className="font-heading font-semibold text-[13px]" style={{ color: "#3D2318" }}>Adapt this Pattern</span>
              </div>
              <span className="text-[11px] font-semibold" style={{ color: "#C24E6B" }}>
                {adaptOpen ? "Close ▲" : "Open ▼"}
              </span>
            </button>
            {adaptOpen && (
              <div className="flex flex-col gap-3 mt-3">
                <p className="text-[11.5px]" style={{ color: "#9A7868" }}>
                  Creates a brand-new pattern — your original is kept safe.
                </p>
                <div className="flex gap-2">
                  {(["resize", "substitute"] as const).map((m) => (
                    <button key={m} onClick={() => setAdaptMode(m)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: adaptMode === m ? "#C24E6B" : "rgba(140,100,55,0.08)",
                        color: adaptMode === m ? "white" : "#9A7868",
                        border: adaptMode === m ? "none" : "1px solid rgba(140,100,55,0.18)",
                      }}>
                      {m === "resize" ? <><Scissors className="h-3.5 w-3.5" /> Resize</> : <><Shuffle className="h-3.5 w-3.5" /> Swap Yarn</>}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder={adaptMode === "resize" ? "e.g. 30% bigger, baby size, adult large…" : "e.g. DK weight, chunky cotton, fingering…"}
                  value={adaptInstruction}
                  onChange={(e) => setAdaptInstruction(e.target.value)}
                  className="w-full p-3 rounded-xl text-[12.5px] outline-none resize-none"
                  style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.2)", color: "#3D2318" }}
                />
                <button
                  onClick={() => adaptMutation.mutate({ mode: adaptMode, instruction: adaptInstruction })}
                  disabled={!adaptInstruction.trim() || adaptMutation.isPending}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #C24E6B, #A83050)", color: "white", boxShadow: "0 3px 12px rgba(194,78,107,0.25)" }}
                >
                  {adaptMutation.isPending ? "Creating…" : "✨ Create Adapted Version"}
                </button>
              </div>
            )}
          </div>

          {/* Description (was on the retired Details screen) */}
          {pattern.description && (
            <div className="surface-card p-4">
              <p className="font-heading font-semibold text-[13px] mb-1.5" style={{ color: "#5C3A28" }}>About this pattern</p>
              <p className="text-[13px] leading-relaxed" style={{ color: "#7A5A48" }}>{pattern.description}</p>
            </div>
          )}

          {/* Can I make this? — stash coverage (was on the retired Details screen) */}
          <StashCoverage pattern={pattern} onOpenStash={() => onNavigate?.("stash")} />

          {/* Materials */}
          <EnhancedMaterialsList
            yarnRequirements={pattern.yarnRequirements || []}
            hookRequirements={pattern.hookRequirements || []}
            notionsRequirements={pattern.notionsRequirements || []}
            toolRequirements={pattern.toolRequirements || []}
            needsStuffing={pattern.needsStuffing || ""}
            materialsNotes={pattern.materialsNotes || ""}
            onUpdate={(updatedMaterials) => {
              updatePatternMutation.mutate({
                ...pattern,
                yarnRequirements: updatedMaterials.yarnRequirements,
                hookRequirements: updatedMaterials.hookRequirements,
                notionsRequirements: updatedMaterials.notionsRequirements,
                toolRequirements: updatedMaterials.toolRequirements,
                needsStuffing: updatedMaterials.needsStuffing,
                materialsNotes: updatedMaterials.materialsNotes,
              });
            }}
          />
        </div>
      )}

      {/* ── Pattern tab ── */}
      {activeTab === "pattern" && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setFollowOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-bold text-[13.5px] transition-all hover:opacity-90 active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, #84934F, #6A7A3A)", color: "white", boxShadow: "0 4px 16px rgba(132,147,79,0.35)" }}
          >
            <Play className="h-4 w-4" /> Follow step-by-step
          </button>
          {pattern.sections
            // Keep the original index — updateStep addresses pattern.sections,
            // so filtering before mapping would corrupt edits whenever a
            // "Materials" section sits before the crochet sections.
            .map((section, sectionIndex) => ({ section, sectionIndex }))
            .filter(({ section }) => section.name.toLowerCase() !== "materials")
            .map(({ section, sectionIndex }) => (
            <div key={`section-${sectionIndex}`} className="flex flex-col gap-1.5">
              <PatternSection
                section={{...section, patternId: pattern.id}}
                projectType={pattern.projectType}
                sectionIndex={sectionIndex}
                isExpanded={expandedSections.has(section.name)}
                onToggleExpand={() => toggleSection(section.name)}
                onUpdateStep={(stepIndex, updatedStep) => updateStep(sectionIndex, stepIndex, updatedStep)}
                onDeleteStep={(stepIndex) => deleteStep(sectionIndex, stepIndex)}
                onAddStep={() => addStep(sectionIndex)}
                onUpdateSection={(updatedSection) => {
                  const updatedSections = [...pattern.sections];
                  updatedSections[sectionIndex] = updatedSection;
                  updatePatternMutation.mutate({ ...pattern, sections: updatedSections });
                }}
              />
              {/* Inline section regen */}
              {regenSection === sectionIndex ? (
                <div className="p-3 rounded-2xl" style={{ background: "rgba(124,95,168,0.08)", border: "1px dashed rgba(124,95,168,0.3)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <img src="/characters/char-yala-transparent.png" alt="Yala"
                      style={{ width: 28, height: 28, objectFit: "contain" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-[11px] font-semibold" style={{ color: "#7C5FA8" }}>Yala's regen tips</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Any specific instructions for this section? (optional)"
                    value={regenNote}
                    onChange={(e) => setRegenNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-[12px] outline-none resize-none mb-2"
                    style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(124,95,168,0.25)", color: "#3D2318" }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { handleRegeneratePattern(regenNote); setRegenSection(null); }}
                      className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                      style={{ background: "linear-gradient(135deg, #7C5FA8, #5C3F88)", color: "white" }}
                    >
                      ⚡ Regenerate
                    </button>
                    <button
                      onClick={() => setRegenSection(null)}
                      className="px-3 py-2 rounded-xl text-[12px]"
                      style={{ color: "#9A7868" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setRegenSection(sectionIndex); setRegenNote(""); }}
                  className="py-2 rounded-xl text-[11.5px] font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(124,95,168,0.07)", color: "#7C5FA8", border: "1px dashed rgba(124,95,168,0.22)" }}
                >
                  ⚡ Regenerate this section
                </button>
              )}

              {/* Alignment check — only shown when the section has a photo */}
              {section.partImageUrl && (
                alignmentResults[sectionIndex] ? (
                  <div className="p-3 rounded-2xl" style={{ background: "rgba(61,131,163,0.06)", border: "1px solid rgba(61,131,163,0.2)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold" style={{ color: "#3D2318" }}>📷 Photo alignment</span>
                      <span className="text-[13px] font-bold" style={{
                        color: alignmentResults[sectionIndex].score >= 70 ? "#84934F"
                          : alignmentResults[sectionIndex].score >= 40 ? "#D4921A"
                          : "#C24E6B",
                      }}>
                        {alignmentResults[sectionIndex].score}/100
                      </span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed mb-1.5" style={{ color: "#7A5C3E" }}>
                      {alignmentResults[sectionIndex].feedback}
                    </p>
                    <button
                      onClick={() => checkAlignment(sectionIndex)}
                      className="text-[11px] font-semibold hover:opacity-70"
                      style={{ color: "#3D8FA3" }}
                    >
                      Re-check →
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => checkAlignment(sectionIndex)}
                    disabled={!!alignmentLoading[sectionIndex]}
                    className="w-full py-2 rounded-xl text-[11.5px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: "rgba(61,131,163,0.07)", color: "#3D8FA3", border: "1px dashed rgba(61,131,163,0.3)" }}
                  >
                    {alignmentLoading[sectionIndex] ? "⏳ Checking alignment…" : "📷 AI Photo Check"}
                  </button>
                )
              )}
            </div>
          ))}

          <button
            className="w-full flex items-center justify-center p-4 border border-dashed border-gray-300 rounded-xl text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 transition-colors"
            onClick={addSection}
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>Add New Section</span>
          </button>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary-600"
              onClick={() => setCounterOpen(true)}
            >
              <Hash className="h-5 w-5" /> Stitch Counter
            </button>
            <button
              className={`inline-flex justify-center items-center px-4 py-2 rounded-full shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark ${isRegenerating ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={() => setRegenAllConfirmOpen(true)}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <><RefreshCw className="h-5 w-5 mr-2 animate-spin" />Regenerating…</>
              ) : (
                <><RefreshCw className="h-5 w-5 mr-2" />Regenerate All</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Notes tab ── */}
      {activeTab === "notes" && (
        <div className="surface-card p-4">
          <p className="font-heading font-semibold text-[13px] mb-3" style={{ color: "#5C3A28" }}>
            Pattern Notes
          </p>
          <textarea
            rows={10}
            placeholder="Add your notes, modifications, tips or reminders for this pattern…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3.5 rounded-xl text-[13px] leading-relaxed outline-none resize-none"
            style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.2)", color: "#3D2318" }}
          />
          <div className="flex justify-end mt-3">
            <button
              className="px-5 py-2 rounded-xl font-semibold text-[12.5px] transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "#C24E6B", color: "white" }}
              disabled={saveNotesMutation.isPending}
              onClick={() => saveNotesMutation.mutate(notes)}
            >
              {saveNotesMutation.isPending ? "Saving…" : "Save Notes"}
            </button>
          </div>
        </div>
      )}

      {/* ── Regenerate All Confirmation Dialog ── */}
      <Dialog open={regenAllConfirmOpen} onOpenChange={(o) => { setRegenAllConfirmOpen(o); if (!o) setRegenAllNote(""); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Regenerate All Sections?</DialogTitle>
            <DialogDescription>
              This will rewrite all unlocked steps with AI. Locked steps are safe. You can add an optional note to guide the regeneration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <textarea
              rows={2}
              placeholder="Optional: any specific instructions? (e.g. make it beginner-friendly)"
              value={regenAllNote}
              onChange={(e) => setRegenAllNote(e.target.value)}
              className="w-full p-2.5 rounded-xl text-[13px] outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(140,100,55,0.25)", color: "#3D2318" }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setRegenAllConfirmOpen(false); setRegenAllNote(""); }}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isRegenerating}
              onClick={() => {
                setRegenAllConfirmOpen(false);
                handleRegeneratePattern(regenAllNote || undefined);
                setRegenAllNote("");
              }}
            >
              {isRegenerating ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Regenerating…</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" />Yes, Regenerate All</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Share to Community Confirmation Dialog ── */}
      <Dialog open={shareConfirmOpen} onOpenChange={setShareConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share to the Community Library?</DialogTitle>
            <DialogDescription>
              This publishes “{pattern.title}” — its photo, materials and all written
              instructions — to the public Community Library for others to browse and make.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShareConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={shareToCommunityMutation.isPending}
              onClick={() => shareToCommunityMutation.mutate()}
            >
              {shareToCommunityMutation.isPending ? (
                <><Share2 className="h-4 w-4 mr-2 animate-pulse" />Sharing…</>
              ) : (
                <><Share2 className="h-4 w-4 mr-2" />Yes, Share Pattern</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image Regeneration Dialog ── */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Regenerate Pattern Image</DialogTitle>
            <DialogDescription>
              Provide additional details to refine the image.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageRefinements" className="col-span-4">Refinements</Label>
              <Input
                id="imageRefinements"
                placeholder="e.g., more texture details, pastel colors"
                className="col-span-4"
                value={imageRefinements}
                onChange={(e) => setImageRefinements(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImageDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isRegeneratingImage} onClick={handleImageRefinementSubmit}>
              {isRegeneratingImage ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Image className="h-4 w-4 mr-2" />Generate Image</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatternViewer;