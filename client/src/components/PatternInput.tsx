import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Eye, Sparkles } from 'lucide-react';
import { PatternInputFormData, Pattern, projectTypes, skillLevels } from '../lib/types';
import { CrochetHookIcon, PatternIcon, YarnIcon, SizeIcon } from '../icons/WoolIcons';

interface PatternInputProps {
  onPatternCreated: (pattern: Pattern) => void;
}

const PatternInput: React.FC<PatternInputProps> = ({ onPatternCreated }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PatternInputFormData>({
    prompt: '',
    projectType: '',
    skillLevel: '',
    yarnType: '',
    size: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Generate pattern mutation
  const generatePatternMutation = useMutation({
    mutationFn: async (data: PatternInputFormData) => {
      const res = await apiRequest('POST', '/api/generate-pattern', {
        prompt: data.prompt,
        projectType: data.projectType,
        skillLevel: data.skillLevel,
        yarnType: data.yarnType || undefined,
        size: data.size || undefined
      });
      return res.json();
    }
  });

  // Generate image mutation
  const generateImageMutation = useMutation({
    mutationFn: async (data: { prompt: string, projectType: string, yarnType?: string }) => {
      const res = await apiRequest('POST', '/api/generate-image', {
        prompt: data.prompt,
        type: 'final',
        projectType: data.projectType,
        yarnType: data.yarnType
      });
      return res.json();
    }
  });

  // Save pattern mutation
  const savePatternMutation = useMutation({
    mutationFn: async (pattern: Omit<Pattern, 'id' | 'createdAt'>) => {
      const res = await apiRequest('POST', '/api/patterns', pattern);
      return res.json();
    }
  });

  // Handle pattern generation
  const handleGeneratePattern = async () => {
    if (!formData.prompt || !formData.projectType || !formData.skillLevel) {
      toast({
        title: "Missing information",
        description: "Please fill in the prompt, project type, and skill level.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate the pattern
      const generatedPatternData = await generatePatternMutation.mutateAsync(formData);
      
      // Generate an image for the pattern
      const imagePrompt = `${generatedPatternData.title || formData.prompt}`;
      const imageResponse = await generateImageMutation.mutateAsync({
        prompt: imagePrompt,
        projectType: formData.projectType,
        yarnType: formData.yarnType
      });

      // Prepare pattern for saving
      const patternToSave = {
        title: generatedPatternData.title,
        projectType: formData.projectType,
        skillLevel: formData.skillLevel,
        yarnType: formData.yarnType || undefined,
        size: formData.size || undefined,
        endProductImage: imageResponse.url,
        materialsNotes: generatedPatternData.materialsNotes || "",
        yarnRequirements: generatedPatternData.yarnRequirements || [],
        sections: generatedPatternData.sections.map((section: any) => ({
          name: section.name,
          notes: section.notes || "",
          locked: false,
          partImageUrl: section.partImageUrl || null,
          steps: section.steps.map((step: any) => ({
            id: step.id,
            text: step.text,
            locked: false,
            count: 0,
            notes: '',
            photo: null,
            aiStepImage: null,
            completed: false
          }))
        }))
      };

      // Save the pattern
      const savedPattern = await savePatternMutation.mutateAsync(patternToSave);
      
      // Pass the saved pattern to the parent component
      onPatternCreated(savedPattern);
      
      toast({
        title: "Pattern Generated!",
        description: `Your "${savedPattern.title}" pattern is ready.`,
      });
    } catch (error) {
      console.error('Error generating pattern:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your pattern. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle preview (placeholder for future implementation)
  const handlePreview = () => {
    toast({
      title: "Preview",
      description: "Preview functionality coming soon!",
    });
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 mb-8">
      <h2 className="text-2xl font-bold text-secondary-600 font-heading mb-6">Create a New Pattern</h2>
      
      {/* Prompt Input */}
      <div className="mb-6">
        <label htmlFor="prompt" className="block text-sm font-medium text-secondary-600 mb-2">
          Enter your pattern prompt or paste existing pattern
        </label>
        <div className="rounded-xl border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-primary-300">
          <textarea 
            id="prompt" 
            name="prompt"
            rows={5} 
            className="w-full p-4 rounded-xl outline-none resize-none"
            placeholder="Describe what you want to crochet, e.g. 'a cute baby tiger plushie with striped pattern, approx 15cm tall'"
            value={formData.prompt}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Metadata Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Project Type */}
        <div>
          <label className="flex items-center mb-2 text-sm font-medium text-secondary-600">
            <CrochetHookIcon className="wool-icon h-5 w-5 mr-1 text-primary-400" />
            Project Type
          </label>
          <div className="relative">
            <select 
              name="projectType"
              className="appearance-none block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
              value={formData.projectType}
              onChange={handleInputChange}
            >
              <option value="">Select project type</option>
              {projectTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Skill Level */}
        <div>
          <label className="flex items-center mb-2 text-sm font-medium text-secondary-600">
            <PatternIcon className="wool-icon h-5 w-5 mr-1 text-primary-400" />
            Skill Level
          </label>
          <div className="relative">
            <select 
              name="skillLevel"
              className="appearance-none block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
              value={formData.skillLevel}
              onChange={handleInputChange}
            >
              <option value="">Select skill level</option>
              {skillLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Yarn Type */}
        <div>
          <label className="flex items-center mb-2 text-sm font-medium text-secondary-600">
            <YarnIcon className="wool-icon h-5 w-5 mr-1 text-primary-400" />
            Yarn Type
          </label>
          <input 
            type="text"
            name="yarnType"
            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            placeholder="Leave blank for AI recommendations"
            value={formData.yarnType}
            onChange={handleInputChange}
          />
        </div>

        {/* Target Size */}
        <div>
          <label className="flex items-center mb-2 text-sm font-medium text-secondary-600">
            <SizeIcon className="wool-icon h-5 w-5 mr-1 text-primary-400" />
            Target Size
          </label>
          <input 
            type="text"
            name="size"
            className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            placeholder="e.g. '15 cm tall'"
            value={formData.size}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* Reference Image Upload */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-secondary-600 mb-2">
          Optional Reference Image
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-secondary-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-400 focus-within:outline-none">
                <span>Upload an image</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 10MB
            </p>
            {file && (
              <p className="text-sm text-primary-600">
                Selected: {file.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          type="button"
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={handlePreview}
        >
          <Eye className="h-5 w-5 mr-2" />
          Preview
        </button>
        <button
          type="button"
          className={`inline-flex justify-center items-center px-6 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
            isGenerating ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          onClick={handleGeneratePattern}
          disabled={isGenerating}
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Pattern'}
        </button>
      </div>
    </div>
  );
};

export default PatternInput;
