import { useState, useRef, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Pattern, PatternSection as PatternSectionType, PatternStep } from '../lib/types';
import PatternSection from './PatternSection';
import EnhancedMaterialsList from './EnhancedMaterialsList';
import PatternProgressBar from './PatternProgressBar';
import { Edit, Save, RefreshCw, Download, Plus, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PatternViewerProps {
  pattern: Pattern;
  onPatternUpdated: (pattern: Pattern) => void;
}

const PatternViewer: React.FC<PatternViewerProps> = ({ pattern, onPatternUpdated }) => {
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set([pattern.sections[0]?.name]));
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageRefinements, setImageRefinements] = useState('');
  const regenerationTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (regenerationTimeoutRef.current) {
        clearTimeout(regenerationTimeoutRef.current);
      }
    };
  }, []);

  // Format the creation date
  const formattedDate = new Date(pattern.createdAt).toLocaleDateString();

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
          throw new Error('OpenAI API key missing or invalid. Please check your API key configuration.');
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
      
      toast({
        title: "Regeneration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (String(error).includes('API key')) {
        toast({
          title: "API Key Required",
          description: "OpenAI API key is required for this feature. Please add it in your environment variables.",
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
          throw new Error('OpenAI API key missing or invalid. Please check your API key configuration.');
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
      
      toast({
        title: "Image Regeneration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (String(error).includes('API key')) {
        toast({
          title: "API Key Required",
          description: "OpenAI API key is required for this feature. Please add it in your environment variables.",
          variant: "destructive",
        });
      }
      
      setImageDialogOpen(false);
    },
  });

  // Toggle section expansion
  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  // Update a step
  const updateStep = (sectionIndex: number, stepIndex: number, updatedStep: PatternStep) => {
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
  };

  // Delete a step
  const deleteStep = (sectionIndex: number, stepIndex: number) => {
    const updatedSections = [...pattern.sections];
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      steps: updatedSections[sectionIndex].steps.filter((_, i) => i !== stepIndex)
    };

    const updatedPattern = { ...pattern, sections: updatedSections };
    updatePatternMutation.mutate(updatedPattern);
  };

  // Add a new step to a section
  const addStep = (sectionIndex: number) => {
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
  };

  // Add a new section
  const addSection = () => {
    const newSectionName = "New Section";
    const updatedPattern = {
      ...pattern,
      sections: [
        ...pattern.sections,
        {
          name: newSectionName,
          notes: "",
          locked: false,
          partImageUrl: null,
          steps: [
            {
              id: 1,
              text: "Add your instructions here",
              locked: false,
              count: 0,
              notes: "",
              photo: null,
              aiStepImage: null,
              completed: false
            }
          ]
        }
      ]
    };

    updatePatternMutation.mutate(updatedPattern);

    // Expand the new section
    setExpandedSections(prev => new Set(prev).add(newSectionName));
  };

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
      if (String(error).includes('API key')) {
        toast({
          title: "API Key Required",
          description: "An OpenAI API key is needed for pattern regeneration. Please check your environment variables.",
          variant: "destructive",
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
      if (String(error).includes('API key')) {
        toast({
          title: "API Key Required",
          description: "An OpenAI API key is needed for image generation. Please check your environment variables.",
          variant: "destructive",
        });
      } else if (String(error).includes('429') || String(error).includes('rate limit')) {
        toast({
          title: "Rate Limit Exceeded",
          description: "The OpenAI API rate limit has been reached. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  // Handle pattern export
  const handleExportPattern = () => {
    // Create a formatted text version of the pattern
    let exportText = `# ${pattern.title}\n\n`;
    exportText += `Project Type: ${pattern.projectType}\n`;
    exportText += `Skill Level: ${pattern.skillLevel}\n`;
    if (pattern.yarnType) exportText += `Yarn Type: ${pattern.yarnType}\n`;
    if (pattern.size) exportText += `Size: ${pattern.size}\n\n`;

    pattern.sections.forEach(section => {
      exportText += `## ${section.name}\n\n`;

      section.steps.forEach(step => {
        exportText += `${step.id}. ${step.text}\n`;
        if (step.notes) exportText += `   Notes: ${step.notes}\n`;
        exportText += '\n';
      });
    });

    // Create a download link
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pattern.title.replace(/\s+/g, '_')}_pattern.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary-600 font-heading">
            {pattern.title}
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
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

        <div className="flex space-x-2">
          <button 
            type="button" 
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-full text-sm font-medium text-secondary-600 hover:bg-secondary-100"
            aria-label="Edit pattern"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button 
            type="button" 
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-full text-sm font-medium text-secondary-600 hover:bg-secondary-100"
            aria-label="Save pattern"
          >
            <Save className="h-5 w-5" />
          </button>
        </div>
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
            onUpdateSection={(updatedSection) => {
              const updatedSections = [...pattern.sections];
              updatedSections[sectionIndex] = updatedSection;
              const updatedPattern = { ...pattern, sections: updatedSections };
              updatePatternMutation.mutate(updatedPattern);
            }}
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