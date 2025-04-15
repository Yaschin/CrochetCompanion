import React, { useState } from 'react';
import { PatternSection as PatternSectionType, PatternStep } from '@/lib/types';
import { ChevronDown, ChevronRight, Plus, Lock, Unlock, StickyNote, Edit, Save, X, ImageIcon, Trash, FileDigit } from 'lucide-react';
import SectionImagePlaceholder from './SectionImagePlaceholder';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PatternSectionProps {
  section: PatternSectionType;
  sectionIndex: number;
  isExpanded: boolean;
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
  onUpdate: (updatedStep: PatternStep) => void;
  onDelete: () => void;
}> = ({ step, stepIndex, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(step.text);
  
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

  return (
    <div className="flex items-center justify-between py-1 px-2 border-b border-gray-100 text-sm">
      {isEditing ? (
        <div className="flex-grow pr-2">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            rows={2}
          />
        </div>
      ) : (
        <div className="flex-grow">
          <div className={`${step.completed ? 'line-through text-gray-400' : ''}`}>
            <span className="font-medium text-gray-500 mr-2">{step.id}.</span>
            {step.text}
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-1">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="text-green-500 hover:text-green-700 p-0.5"
              title="Save changes"
            >
              <Save size={14} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-red-500 hover:text-red-700 p-0.5"
              title="Cancel"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
              title="Edit step"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={toggleLock}
              className={`${step.locked ? 'text-amber-500' : 'text-gray-400'} hover:text-amber-600 p-0.5`}
              title={step.locked ? "Unlock step" : "Lock step"}
            >
              {step.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            <button
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500 p-0.5"
              title="Delete step"
            >
              <Trash size={14} />
            </button>
          </>
        )}
        
        {step.count > 0 && (
          <div className="flex items-center space-x-1 ml-2">
            <button 
              onClick={() => updateCount(false)}
              className="text-gray-400 hover:text-gray-600 px-1"
            >
              -
            </button>
            <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{step.count}</span>
            <button 
              onClick={() => updateCount(true)}
              className="text-gray-400 hover:text-gray-600 px-1"
            >
              +
            </button>
          </div>
        )}
        <input 
          type="checkbox" 
          checked={step.completed}
          onChange={toggleComplete}
          className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary ml-1"
        />
      </div>
    </div>
  );
};

const PatternSection: React.FC<PatternSectionProps> = ({
  section,
  sectionIndex,
  isExpanded,
  onToggleExpand,
  onUpdateStep,
  onDeleteStep,
  onAddStep,
  onUpdateSection
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(section.notes || '');
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
  
  // Handle section image generation
  const handleSectionImageGenerated = (imageUrl: string) => {
    onUpdateSection({
      ...section,
      partImageUrl: imageUrl
    });
  };
  
  // Generate stitch diagram for this section
  const generateSectionDiagram = async () => {
    if (isGeneratingDiagram) return;
    
    setIsGeneratingDiagram(true);
    try {
      console.log("Generating stitch diagram for section:", section.name);
      const response = await apiRequest('POST', '/api/generate-image', {
        prompt: `Crochet diagram for ${section.name} section - ${section.steps.map(s => s.text).slice(0, 3).join(". ")}`,
        type: 'diagram',
      });
      
      const data = await response.json();
      console.log("Diagram generation response:", data);
      
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
  const completedSteps = section.steps.filter(step => step.completed).length;
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
            onClick={generateSectionDiagram}
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
            <SectionImagePlaceholder
              patternId={section.patternId || ""}
              sectionIndex={sectionIndex}
              sectionName={section.name}
              partImageUrl={section.partImageUrl || null}
              onImageGenerated={handleSectionImageGenerated}
            />
          </div>
          
          {/* Section Stitch Diagram Display */}
          {section.diagramUrl && (
            <div className="px-2 mb-3">
              <div className="border border-gray-200 bg-white p-2 rounded-md">
                <h4 className="text-xs font-medium text-secondary-700 mb-1">Stitch Diagram</h4>
                <img 
                  src={section.diagramUrl} 
                  alt={`Stitch diagram for ${section.name}`}
                  className="w-full rounded"
                />
                {isGeneratingDiagram && (
                  <div className="mt-1 text-xs text-blue-500 text-center">
                    Generating new diagram...
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {section.steps.map((step, stepIndex) => (
              <StepRow
                key={`step-${step.id}`}
                step={step}
                stepIndex={stepIndex}
                onUpdate={(updatedStep) => onUpdateStep(stepIndex, updatedStep)}
                onDelete={() => onDeleteStep(stepIndex)}
              />
            ))}
          </div>

          {/* Add Step Button */}
          <div className="px-2 mt-1">
            <button 
              className="w-full flex items-center justify-center py-1 border border-dashed border-gray-300 rounded text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 text-xs"
              onClick={onAddStep}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Step</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternSection;