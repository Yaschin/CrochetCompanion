import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Pattern, PatternSection as PatternSectionType, PatternStep } from '../lib/types';
import PatternSection from './PatternSection';
import EnhancedMaterialsList from './EnhancedMaterialsList';
import PatternProgressBar from './PatternProgressBar';
import StitchCounter from './StitchCounter';
import { cn } from '../lib/utils';
import { RefreshCw, Download, Plus, Image, Hash, Heart, CheckCircle2, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { ToastAction } from './ui/toast';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PatternViewerProps {
  pattern: Pattern;
  onPatternUpdated: (pattern: Pattern) => void;
}

/**
 * PatternViewer component displays the pattern details and allows interaction
 * Optimized for memory efficiency and performance with large patterns
 */
const PatternViewer: React.FC<PatternViewerProps> = ({ pattern, onPatternUpdated }) => {
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
  const regenerationTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Regenerate steps mutation
  const regenerateStepsMutation = useMutation({
    mutationFn: async (data: { patternId: string; unlockedStepsOnly: boolean }) => {
      try {
        const res = await apiRequest('POST', '/api/generate-pattern', {
          prompt: pattern.title, // Use the title as a base prompt for regeneration
          patternId: data.patternId,
          projectType: pattern.projectType,
          skillLevel: pattern.skillLevel,
          yarnType: pattern.yarnType,
          size: pattern.size,
          unlockedStepsOnly: true,
          originalPattern: pattern
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
      // Assuming the returned data is the regenerated pattern
      onPatternUpdated(data);
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
  const handleRegeneratePattern = async () => {
    setIsRegenerating(true);
    try {
      await regenerateStepsMutation.mutateAsync({
        patternId: pattern.id,
        unlockedStepsOnly: true
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
    <div className="surface-card mb-8 p-5 sm:p-7">
      <StitchCounter
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        patternId={pattern.id}
        patternTitle={pattern.title}
      />
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {pattern.title}
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {pattern.status === 'active' && (
              <span className="inline-flex items-center rounded-full bg-honey-100 px-3 py-1 text-xs font-medium text-honey-700">In progress</span>
            )}
            {pattern.status === 'finished' && (
              <span className="inline-flex items-center rounded-full bg-secondary-100 px-3 py-1 text-xs font-medium text-secondary-800">Finished</span>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              <svg className="wool-icon h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7M5 15l7 7 7-7"/>
              </svg>
              {pattern.projectType}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="wool-icon h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              {pattern.skillLevel}
            </span>
            {pattern.yarnType && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <svg className="wool-icon h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8" opacity="0.2"/>
                  <path d="M12 20a8 8 0 100-16 8 8 0 000 16z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 14a2 2 0 100-4 2 2 0 000 4z" fill="currentColor"/>
                </svg>
                {pattern.yarnType}
              </span>
            )}
            {pattern.size && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="wool-icon h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"/>
                </svg>
                {pattern.size}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => updatePatternMutation.mutate({ ...pattern, favorite: !pattern.favorite })}
          aria-label={pattern.favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={!!pattern.favorite}
          title={pattern.favorite ? 'Remove from favorites' : 'Add to favorites'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
        >
          <Heart className={cn('h-5 w-5', pattern.favorite ? 'fill-primary text-primary' : '')} />
        </button>
      </div>

      {/* Final Product Image */}
      {pattern.endProductImage && (
        <div className="mb-8 relative group">
          <div className="rounded-xl overflow-hidden bg-gray-100 h-64 md:h-80 flex items-center justify-center">
            <img 
              src={pattern.endProductImage} 
              alt={pattern.title} 
              className="object-contain h-full w-full"
            />
            <button
              type="button"
              onClick={handleRegenerateImage}
              className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Regenerate image"
            >
              <RefreshCw className="h-5 w-5 text-primary" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Multi-view crochet pattern visualization (front, side, back)
          </p>
        </div>
      )}

      {/* Image Regeneration Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Regenerate Pattern Image</DialogTitle>
            <DialogDescription>
              Provide additional details to refine the image. The AI will generate a new multi-view image (front, side, back) based on your suggestions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageRefinements" className="col-span-4">
                Refinements
              </Label>
              <Input
                id="imageRefinements"
                placeholder="e.g., more texture details, pastel colors, change background to white"
                className="col-span-4"
                value={imageRefinements}
                onChange={(e) => setImageRefinements(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setImageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isRegeneratingImage} 
              onClick={handleImageRefinementSubmit}
            >
              {isRegeneratingImage ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pattern Progress Bar */}
      <PatternProgressBar sections={pattern.sections} />

      {/* Materials Section */}
      <EnhancedMaterialsList 
        yarnRequirements={pattern.yarnRequirements || []}
        hookRequirements={pattern.hookRequirements || []}
        notionsRequirements={pattern.notionsRequirements || []}
        toolRequirements={pattern.toolRequirements || []}
        needsStuffing={pattern.needsStuffing || ""}
        materialsNotes={pattern.materialsNotes || ""}
        onUpdate={(updatedMaterials) => {
          const updatedPattern = {
            ...pattern,
            yarnRequirements: updatedMaterials.yarnRequirements,
            hookRequirements: updatedMaterials.hookRequirements,
            notionsRequirements: updatedMaterials.notionsRequirements,
            toolRequirements: updatedMaterials.toolRequirements,
            needsStuffing: updatedMaterials.needsStuffing,
            materialsNotes: updatedMaterials.materialsNotes
          };
          updatePatternMutation.mutate(updatedPattern);
        }}
      />

      {/* Pattern Sections (Accordion) */}
      <div className="space-y-4">
        {pattern.sections
          .filter(section => section.name.toLowerCase() !== "materials") // Filter out the Materials section
          .map((section, sectionIndex) => (
          <PatternSection
            key={`section-${sectionIndex}`}
            section={{...section, patternId: pattern.id}}
            projectType={pattern.projectType}
            sectionIndex={sectionIndex}
            isExpanded={expandedSections.has(section.name)}
            onToggleExpand={() => toggleSection(section.name)}
            onUpdateStep={(stepIndex, updatedStep) => updateStep(sectionIndex, stepIndex, updatedStep)}
            onDeleteStep={(stepIndex) => deleteStep(sectionIndex, stepIndex)}
            onAddStep={() => addStep(sectionIndex)}
            onUpdateSection={useCallback((updatedSection) => {
              // Create minimal copies needed for the update
              const updatedSections = [...pattern.sections];
              updatedSections[sectionIndex] = updatedSection;
              
              // Update only what changed to minimize memory usage
              const updatedPattern = { ...pattern, sections: updatedSections };
              updatePatternMutation.mutate(updatedPattern);
            }, [pattern, sectionIndex, updatePatternMutation])}
          />
        ))}

        {/* Add Section Button */}
        <button 
          className="w-full flex items-center justify-center p-4 border border-dashed border-gray-300 rounded-xl text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 transition-colors"
          onClick={addSection}
        >
          <Plus className="h-5 w-5 mr-2" />
          <span>Add New Section</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        {pattern.status === 'active' ? (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => updatePatternMutation.mutate({ ...pattern, status: 'finished', finishedAt: new Date().toISOString() })}
          >
            <CheckCircle2 className="h-5 w-5" />
            Mark finished
          </button>
        ) : pattern.status === 'finished' ? (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            onClick={() => updatePatternMutation.mutate({ ...pattern, status: 'active', finishedAt: null })}
          >
            <RefreshCw className="h-5 w-5" />
            Reopen project
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => updatePatternMutation.mutate({ ...pattern, status: 'active', startedAt: new Date().toISOString() })}
          >
            <Play className="h-5 w-5" />
            Start project
          </button>
        )}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => setCounterOpen(true)}
        >
          <Hash className="h-5 w-5" />
          Stitch Counter
        </button>
        <button
          type="button"
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={handleExportPattern}
        >
          <Download className="h-5 w-5 mr-2" />
          Export Pattern
        </button>
        <button 
          type="button" 
          className={`inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark ${isRegenerating ? 'opacity-75 cursor-not-allowed' : ''}`}
          onClick={handleRegeneratePattern}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              Regenerate Pattern
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PatternViewer;