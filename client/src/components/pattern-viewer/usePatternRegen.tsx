import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Pattern } from '@/lib/types';
import { showAiErrorToast } from '@/lib/aiErrorToast';

/**
 * The pattern's AI-regeneration concern: the regenerate-steps / regenerate-image
 * mutations, their in-flight + dialog state, and the handlers that drive them.
 * Self-contained — it only needs the pattern and the update callback, so it lifts
 * cleanly out of usePatternViewer without passing setters around.
 */
export function usePatternRegen(pattern: Pattern, onPatternUpdated: (pattern: Pattern) => void) {
  const { toast } = useToast();

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageRefinements, setImageRefinements] = useState('');
  const [regenSection, setRegenSection] = useState<number | null>(null);
  const [regenNote, setRegenNote] = useState("");
  const [regenAllConfirmOpen, setRegenAllConfirmOpen] = useState(false);
  const [regenAllNote, setRegenAllNote] = useState("");

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

  return {
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
  };
}
