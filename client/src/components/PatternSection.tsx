import React, { useState } from 'react';
import { PatternSection as PatternSectionType, PatternStep } from '@/lib/types';
import { ChevronDown, ChevronRight, Plus, Minus, Check, Lock, Unlock, StickyNote, Edit, Save, X, ImageIcon, Trash, FileDigit, RefreshCw, Pencil, Loader2, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import SectionImagePlaceholder from './SectionImagePlaceholder';
import StepPhotoUploader from './StepPhotoUploader';
import SectionPhotoUploader from './SectionPhotoUploader';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PatternSectionProps {
  section: PatternSectionType & { patternId?: string };
  sectionIndex: number;
  isExpanded: boolean;
  projectType?: string;
  onToggleExpand: () => void;
  onUpdateStep: (stepIndex: number, updatedStep: PatternStep) => void;
  onDeleteStep: (stepIndex: number) => void;
  onAddStep: () => void;
  onUpdateSection: (updatedSection: PatternSectionType) => void;
}

// Simplified Step row component
const StepRow: React.FC<{
  step: PatternStep;
  stepIndex: number;
  sectionIndex: number;
  patternId: string;
  sectionLocked?: boolean;
  onUpdate: (updatedStep: PatternStep) => void;
  onDelete: () => void;
}> = ({ step, stepIndex, sectionIndex, patternId, sectionLocked, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  // Locked steps (or steps in a locked section) cannot be edited or deleted.
  // Progress controls (complete toggle, counter) stay available.
  const editLocked = step.locked || !!sectionLocked;
  const [editedText, setEditedText] = useState(step.text);
  const [isShowingPhoto, setIsShowingPhoto] = useState(false);
  
  const toggleComplete = () => {
    onUpdate({
      ...step,
      completed: !step.completed
    });
  };
  
  const updateCount = (increment: boolean) => {
    onUpdate({
      ...step,
      count: increment ? step.count + 1 : Math.max(0, step.count - 1)
    });
  };
  
  const toggleLock = () => {
    onUpdate({
      ...step,
      locked: !step.locked
    });
  };
  
  const handleSaveEdit = () => {
    onUpdate({
      ...step,
      text: editedText
    });
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setEditedText(step.text);
    setIsEditing(false);
  };

  // Handler for photo uploads
  const handlePhotoUpdated = (photoUrl: string) => {
    onUpdate({
      ...step,
      photo: photoUrl
    });
  };

  return (
    <div className="border-b border-gray-100 text-sm">
      <div className="flex items-start gap-2 px-2 py-2">
        {/* Complete — primary action, comfortable tap target */}
        <button
          onClick={toggleComplete}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleComplete(); } }}
          role="checkbox"
          aria-checked={step.completed}
          aria-label={step.completed ? 'Mark step incomplete' : 'Mark step complete'}
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors',
            step.completed
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-gray-300 bg-background hover:border-primary-300',
          )}
        >
          {step.completed && <Check className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              rows={2}
            />
          ) : (
            <div className={cn('leading-snug', step.completed && 'text-gray-400 line-through')}>
              <span className="mr-1.5 font-medium text-gray-400">{step.id}.</span>
              {step.text}
            </div>
          )}

          {/* Controls — wrap on small screens, comfortable tap targets */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {/* Per-step counter — always available (was hidden at 0, so it could never start) */}
            <div className="inline-flex items-center rounded-full border border-border">
              <button onClick={() => updateCount(false)} aria-label="Decrease count" className="flex h-8 w-8 items-center justify-center rounded-l-full text-gray-500 hover:bg-gray-100">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[2ch] px-1 text-center text-sm tabular-nums text-foreground">{step.count}</span>
              <button onClick={() => updateCount(true)} aria-label="Increase count" className="flex h-8 w-8 items-center justify-center rounded-r-full text-gray-500 hover:bg-gray-100">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <span className="flex-1" />

            {isEditing ? (
              <>
                <button onClick={handleSaveEdit} title="Save changes" aria-label="Save changes" className="flex h-8 w-8 items-center justify-center rounded-full text-secondary-600 hover:bg-secondary-50">
                  <Save className="h-[18px] w-[18px]" />
                </button>
                <button onClick={handleCancelEdit} title="Cancel" aria-label="Cancel edit" className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                  <X className="h-[18px] w-[18px]" />
                </button>
              </>
            ) : (
              <>
                {!editLocked && (
                  <button onClick={() => setIsEditing(true)} title="Edit step" aria-label="Edit step" className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <Edit className="h-[18px] w-[18px]" />
                  </button>
                )}
                {/* Section-level lock disables the per-step lock toggle; unlock the section to edit */}
                <button onClick={toggleLock} disabled={sectionLocked} title={sectionLocked ? 'Section is locked' : step.locked ? 'Unlock step' : 'Lock step'} aria-label={step.locked ? 'Unlock step' : 'Lock step'} className={cn('flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100', sectionLocked && 'opacity-40 cursor-not-allowed', step.locked || sectionLocked ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600')}>
                  {step.locked || sectionLocked ? <Lock className="h-[18px] w-[18px]" /> : <Unlock className="h-[18px] w-[18px]" />}
                </button>
                <button onClick={() => setIsShowingPhoto(!isShowingPhoto)} title={step.photo ? 'Show/hide photo' : 'Add photo'} aria-label={step.photo ? 'Show or hide photo' : 'Add photo'} className={cn('flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100', step.photo ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600')}>
                  <Camera className="h-[18px] w-[18px]" />
                </button>
                {!editLocked && (
                  <button onClick={onDelete} title="Delete step" aria-label="Delete step" className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-destructive">
                    <Trash className="h-[18px] w-[18px]" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Photo uploader - only shown when toggled */}
      {isShowingPhoto && (
        <div className="px-3 pb-2">
          <StepPhotoUploader
            patternId={patternId}
            sectionIndex={sectionIndex}
            stepIndex={stepIndex}
            currentPhoto={step.photo || null}
            onPhotoUpdated={handlePhotoUpdated}
          />
        </div>
      )}
    </div>
  );
};

const PatternSection: React.FC<PatternSectionProps> = ({
  section,
  sectionIndex,
  isExpanded,
  projectType,
  onToggleExpand,
  onUpdateStep,
  onDeleteStep,
  onAddStep,
  onUpdateSection
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(section.notes || '');

  // Keep editedNotes in sync when section.notes changes externally (e.g. after a save)
  React.useEffect(() => {
    if (!isEditingNotes) {
      setEditedNotes(section.notes || '');
    }
  }, [section.notes, isEditingNotes]);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  
  const toggleLock = () => {
    onUpdateSection({
      ...section,
      locked: !section.locked
    });
  };
  
  const saveNotes = () => {
    onUpdateSection({
      ...section,
      notes: editedNotes
    });
    setIsEditingNotes(false);
    setIsNotesOpen(true);
  };
  
  const cancelEditNotes = () => {
    setEditedNotes(section.notes || '');
    setIsEditingNotes(false);
  };

  // States for diagram generation 
  const { toast } = useToast();
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [isDiagramDialogOpen, setIsDiagramDialogOpen] = useState(false);
  const [diagramRefinementPrompt, setDiagramRefinementPrompt] = useState('');
  
  // Handle section image generation
  const handleSectionImageGenerated = (imageUrl: string) => {
    onUpdateSection({
      ...section,
      partImageUrl: imageUrl
    });
  };
  
  // Open dialog for diagram refinement
  const openDiagramRefinementDialog = () => {
    const basePrompt = `Crochet stitch diagram for the ${section.name} section of a ${projectType || 'crochet project'} - ${section.steps.map((s: PatternStep) => s.text).slice(0, 3).join(". ")}`;
    setDiagramRefinementPrompt(`${basePrompt}. Make sure to include the following specific details and improvements:`);
    setIsDiagramDialogOpen(true);
  };

  // Generate diagram with refinements
  const handleRegenerateDiagramWithRefinements = () => {
    if (!diagramRefinementPrompt.trim()) return;
    generateSectionDiagram(diagramRefinementPrompt);
  };

  // Generate stitch diagram for this section
  const generateSectionDiagram = async (customPrompt?: string | React.MouseEvent) => {
    if (isGeneratingDiagram) return;
    
    // Convert event to undefined if it's a React.MouseEvent
    const promptToUse = typeof customPrompt === 'string' ? customPrompt : undefined;
    
    setIsGeneratingDiagram(true);
    setIsDiagramDialogOpen(false);
    
    try {
      const response = await apiRequest('POST', '/api/generate-image', {
        prompt: promptToUse || `Crochet stitch diagram for the ${section.name} section of a ${projectType || 'crochet project'} - ${section.steps.map((s: PatternStep) => s.text).slice(0, 3).join(". ")}`,
        type: 'diagram',
        projectType,
      });
      
      const data = await response.json();
      
      if (data.url) {
        onUpdateSection({
          ...section,
          diagramUrl: data.url
        });
        
        toast({
          title: "Stitch Diagram Generated",
          description: "Diagram for this section has been created successfully.",
        });
      }
    } catch (error) {
      console.error('Error generating stitch diagram:', error);
      toast({
        title: "Diagram Generation Failed",
        description: "There was an error creating the stitch diagram. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  // Calculate completion stats for this section
  const completedSteps = section.steps.filter((step: PatternStep) => step.completed).length;
  const totalSteps = section.steps.length;
  const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
      <div className={`w-full flex items-center p-1.5 text-left ${
        isExpanded ? 'bg-primary-50' : ''
      }`}>
        {/* Expand/Collapse control */}
        <button 
          className="p-1 text-gray-500"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDown size={16} className="text-secondary-600" />
          ) : (
            <ChevronRight size={16} className="text-secondary-600" />
          )}
        </button>
        
        {/* Section Thumbnail */}
        <div className="h-8 w-8 rounded overflow-hidden mr-2 flex-shrink-0 bg-gray-100">
          {section.partImageUrl ? (
            <img 
              src={section.partImageUrl} 
              alt={section.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              <ImageIcon size={14} />
            </div>
          )}
        </div>
        
        {/* Section Header Content */}
        <div className="flex-grow cursor-pointer" onClick={onToggleExpand}>
          <h3 className="text-sm font-medium text-secondary-700">{section.name}</h3>
          {!isExpanded && (
            <div className="flex items-center mt-0.5">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full mr-2">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{completedSteps}/{totalSteps}</span>
            </div>
          )}
        </div>
        
        {/* Section Actions */}
        <div className="flex items-center space-x-1 flex-nowrap">
          {/* Notes button */}
          <button 
            className={`p-1 rounded ${
              isNotesOpen ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-500 hover:bg-gray-100'
            }`}
            onClick={() => {
              if (isEditingNotes) return;
              setIsNotesOpen(!isNotesOpen);
            }}
            title="Section Notes"
          >
            <StickyNote size={14} />
          </button>
          
          {/* Diagram button */}
          <button
            onClick={() => generateSectionDiagram()}
            disabled={isGeneratingDiagram}
            className={`p-1 rounded ${
              section.diagramUrl ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
            } ${isGeneratingDiagram ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={section.diagramUrl ? "Regenerate Stitch Diagram" : "Generate Stitch Diagram"}
          >
            <FileDigit size={14} />
          </button>
          
          {/* Lock/Unlock button */}
          <button 
            className={`p-1 rounded ${section.locked 
              ? 'text-amber-500 hover:bg-amber-50' 
              : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={toggleLock}
            title={section.locked ? "Unlock Section" : "Lock Section"}
          >
            {section.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        </div>
      </div>
      
      {/* Notes Section - Only shown when expanded and notes are toggled */}
      {isExpanded && isNotesOpen && (
        <div className="px-2 py-1.5 bg-yellow-50 border-y border-yellow-100">
          {isEditingNotes ? (
            <div className="flex flex-col">
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                rows={2}
                placeholder="Add notes for this section..."
              />
              <div className="flex justify-end mt-1 space-x-1">
                <button 
                  onClick={saveNotes}
                  className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 hover:bg-green-100"
                >
                  Save
                </button>
                <button 
                  onClick={cancelEditNotes}
                  className="text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start text-xs">
              <div className="text-gray-700">
                {section.notes || "No notes added for this section."}
              </div>
              <button 
                onClick={() => setIsEditingNotes(true)}
                className="text-gray-500 hover:text-gray-700 p-0.5 ml-1 flex-shrink-0"
              >
                <Edit size={12} />
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Image placeholder and steps - Only shown when expanded */}
      {isExpanded && (
        <div className="pt-1 pb-2">
          {/* Section Image */}
          <div className="px-2 mb-2">
            <SectionPhotoUploader
              patternId={section.patternId || ""}
              sectionIndex={sectionIndex}
              currentPhoto={section.partImageUrl || null}
              onPhotoUpdated={handleSectionImageGenerated}
              onRequestPatternRegeneration={() => {
                // Request pattern regeneration based on the new image
                toast({
                  title: "Regenerating Pattern",
                  description: "Updating pattern to match your new image...",
                });
                
                // Call the API to regenerate the pattern
                if (section.patternId) {
                  apiRequest('POST', `/api/patterns/${section.patternId}/regenerate`, {
                    sectionIndex,
                    basedOnImage: true
                  })
                  .then(async (response) => {
                    const data = await response.json();
                    if (data.success) {
                      toast({
                        title: "Pattern Updated",
                        description: "Pattern has been updated based on your image.",
                      });
                      // The full pattern will be updated through the API response
                    } else {
                      throw new Error("Pattern regeneration failed");
                    }
                  })
                  .catch(error => {
                    console.error("Error regenerating pattern:", error);
                    toast({
                      title: "Regeneration Failed",
                      description: "There was a problem updating the pattern. Please try again.",
                      variant: "destructive",
                    });
                  });
                }
              }}
            />
          </div>
          
          {/* Section Stitch Diagram Display */}
          {section.diagramUrl && (
            <div className="px-2 mb-3">
              <div className="relative border border-gray-200 bg-white p-2 rounded-md">
                <h4 className="text-xs font-medium text-secondary-700 mb-1">Stitch Diagram</h4>
                <div className="relative">
                  <img 
                    src={section.diagramUrl} 
                    alt={`Stitch diagram for ${section.name}`}
                    className="w-full rounded"
                  />
                  {!isGeneratingDiagram && (
                    <div className="absolute bottom-2 right-2 flex space-x-1">
                      <button
                        onClick={openDiagramRefinementDialog}
                        className="p-1 bg-black/70 hover:bg-black/80 text-white rounded-full"
                        title="Refine and regenerate diagram"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => generateSectionDiagram()}
                        className="p-1 bg-black/70 hover:bg-black/80 text-white rounded-full"
                        title="Regenerate diagram"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  )}
                  {isGeneratingDiagram && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {section.steps.map((step: PatternStep, stepIndex: number) => (
              <StepRow
                key={`step-${step.id}`}
                step={step}
                stepIndex={stepIndex}
                sectionIndex={sectionIndex}
                patternId={section.patternId || ""}
                sectionLocked={!!section.locked}
                onUpdate={(updatedStep) => onUpdateStep(stepIndex, updatedStep)}
                onDelete={() => onDeleteStep(stepIndex)}
              />
            ))}
          </div>

          {/* Add Step Button — disabled while the section is locked */}
          {!section.locked && (
            <div className="px-2 mt-1">
              <button
                className="w-full flex items-center justify-center py-1 border border-dashed border-gray-300 rounded text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 text-xs"
                onClick={onAddStep}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Add Step</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Diagram Refinement Dialog */}
      <Dialog open={isDiagramDialogOpen} onOpenChange={setIsDiagramDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Refine Stitch Diagram</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-gray-700 mb-1 block">
              Customize your prompt with specific refinements:
            </label>
            <Textarea
              value={diagramRefinementPrompt}
              onChange={(e) => setDiagramRefinementPrompt(e.target.value)}
              placeholder="Describe specific details or changes you want for the diagram..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiagramDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegenerateDiagramWithRefinements} disabled={isGeneratingDiagram}>
              {isGeneratingDiagram ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate with Refinements'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatternSection;