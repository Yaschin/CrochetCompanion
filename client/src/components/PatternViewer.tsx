import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Pattern, PatternSection as PatternSectionType, PatternStep } from '../lib/types';
import PatternStepCard from './PatternStepCard';
import PatternSection from './PatternSection';
import MaterialsList from './MaterialsList';
import PatternProgressBar from './PatternProgressBar';
import { Edit, Save, RefreshCw, Download, Plus } from 'lucide-react';

interface PatternViewerProps {
  pattern: Pattern;
  onPatternUpdated: (pattern: Pattern) => void;
}

const PatternViewer: React.FC<PatternViewerProps> = ({ pattern, onPatternUpdated }) => {
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([pattern.sections[0]?.name]));
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Format the creation date
  const formattedDate = new Date(pattern.createdAt).toLocaleDateString();

  // Update pattern mutation
  const updatePatternMutation = useMutation({
    mutationFn: async (updatedPattern: Pattern) => {
      const res = await apiRequest('PUT', `/api/patterns/${updatedPattern.id}`, updatedPattern);
      return res.json();
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
      return res.json();
    },
    onSuccess: (data) => {
      // Assuming the returned data is the regenerated pattern
      onPatternUpdated(data);
      toast({
        title: "Pattern Regenerated",
        description: "Your pattern has been updated with new instructions.",
      });
    },
    onError: () => {
      toast({
        title: "Regeneration Failed",
        description: "There was an error regenerating your pattern.",
        variant: "destructive",
      });
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
    } finally {
      setIsRegenerating(false);
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
        <div className="mb-8">
          <div className="rounded-xl overflow-hidden bg-gray-100 h-64 md:h-80 flex items-center justify-center">
            <img 
              src={pattern.endProductImage} 
              alt={pattern.title} 
              className="object-contain h-full w-full"
            />
          </div>
        </div>
      )}

      {/* Pattern Progress Bar */}
      <PatternProgressBar sections={pattern.sections} />

      {/* Materials Section */}
      <MaterialsList 
        yarnRequirements={pattern.yarnRequirements || []}
        materialsNotes={pattern.materialsNotes || ""}
        onUpdate={(updatedRequirements, updatedNotes) => {
          const updatedPattern = {
            ...pattern,
            yarnRequirements: updatedRequirements,
            materialsNotes: updatedNotes
          };
          updatePatternMutation.mutate(updatedPattern);
        }}
      />

      {/* Pattern Sections (Accordion) */}
      <div className="space-y-4">
        {pattern.sections.map((section, sectionIndex) => (
          <PatternSection
            key={`section-${sectionIndex}`}
            section={section}
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
          className={`inline-flex justify-center items-center px-6 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
            isRegenerating ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          onClick={handleRegeneratePattern}
          disabled={isRegenerating}
        >
          <RefreshCw className={`h-5 w-5 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? 'Regenerating...' : 'Regenerate Unlocked Steps'}
        </button>
      </div>
    </div>
  );
};

export default PatternViewer;
