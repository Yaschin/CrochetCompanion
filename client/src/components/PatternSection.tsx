import React, { useState } from 'react';
import { PatternSection as PatternSectionType, PatternStep } from '@/lib/types';
import PatternStepCard from './PatternStepCard';
import { ChevronDown, ChevronRight, Plus, Lock, Unlock, StickyNote, Edit, Save, X } from 'lucide-react';

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

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className={`w-full flex items-center p-4 text-left ${
        isExpanded ? 'bg-primary-50' : ''
      }`}>
        {/* Section Thumbnail */}
        {section.partImageUrl && (
          <div className="relative mr-3 flex-shrink-0">
            <img 
              src={section.partImageUrl} 
              alt={section.name}
              className="h-10 w-10 rounded-md object-cover"
            />
          </div>
        )}
        
        {/* Section Header Content */}
        <div className="flex-grow cursor-pointer" onClick={onToggleExpand}>
          <h3 className="text-lg font-bold text-secondary-700 font-heading">{section.name}</h3>
        </div>
        
        {/* Section Actions */}
        <div className="flex items-center space-x-2">
          {/* Notes button */}
          <button 
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
            onClick={() => {
              if (isEditingNotes) {
                return; // Don't toggle if we're editing
              }
              setIsNotesOpen(!isNotesOpen);
            }}
            title="Section Notes"
          >
            <StickyNote size={18} />
          </button>
          
          {/* Lock/Unlock button */}
          <button 
            className={`p-1.5 rounded-full ${section.locked 
              ? 'text-amber-500 hover:bg-amber-50' 
              : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={toggleLock}
            title={section.locked ? "Unlock Section" : "Lock Section"}
          >
            {section.locked ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
          
          {/* Expand/Collapse button */}
          <button 
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown size={18} className="text-secondary-600" />
            ) : (
              <ChevronRight size={18} className="text-secondary-600" />
            )}
          </button>
        </div>
      </div>
      
      {/* Notes Section */}
      {isExpanded && (isNotesOpen || isEditingNotes) && (
        <div className="px-4 pt-2 pb-0">
          {isEditingNotes ? (
            <div className="bg-yellow-50 p-3 rounded-md mb-4">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Section Notes</label>
                <div className="flex space-x-2">
                  <button 
                    onClick={saveNotes}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save size={16} />
                  </button>
                  <button 
                    onClick={cancelEditNotes}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Add notes for this section..."
              />
            </div>
          ) : (
            <div className="bg-yellow-50 p-3 rounded-md mb-4 flex justify-between">
              <div className="text-sm">
                {section.notes || "No notes added for this section."}
              </div>
              <button 
                onClick={() => setIsEditingNotes(true)}
                className="text-gray-500 hover:text-gray-700 ml-2"
              >
                <Edit size={16} />
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Steps */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {section.steps.map((step, stepIndex) => (
            <PatternStepCard
              key={`step-${step.id}`}
              step={step}
              stepNumber={step.id}
              onUpdate={(updatedStep) => onUpdateStep(stepIndex, updatedStep)}
              onDelete={() => onDeleteStep(stepIndex)}
            />
          ))}

          {/* Add Step Button */}
          <button 
            className="w-full flex items-center justify-center p-3 border border-dashed border-gray-300 rounded-lg text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 transition-colors"
            onClick={onAddStep}
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>Add New Step</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PatternSection;