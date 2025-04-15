import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { YarnIcon } from '../icons/WoolIcons';
import { useToast } from '@/hooks/use-toast';

interface PreviewPanelProps {
  prompt: string;
  projectType: string;
  yarnType?: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ prompt, projectType, yarnType }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generatePreview = async () => {
    if (!prompt || !projectType) {
      toast({
        title: "Missing information",
        description: "Please fill in the pattern prompt and select a project type.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiRequest('POST', '/api/generate-image', {
        prompt,
        type: 'final',
        projectType,
        yarnType
      });
      
      const data = await res.json();
      if (data && data.url) {
        setPreviewImage(data.url);
        toast({
          title: "Preview generated!",
          description: "Your pattern preview has been created.",
        });
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Preview generation failed",
        description: "Could not generate a preview image. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-medium text-secondary-700 mb-3">Pattern Preview</h3>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
          <p className="text-sm text-gray-500">Generating preview...</p>
          <p className="text-xs text-gray-400 mt-2">This may take a moment</p>
        </div>
      ) : previewImage ? (
        <div className="relative">
          <img 
            src={previewImage} 
            alt="Pattern preview" 
            className="w-full h-64 object-cover rounded-lg"
          />
          <button
            onClick={generatePreview}
            className="absolute bottom-3 right-3 inline-flex items-center px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-primary shadow-sm hover:bg-white"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Regenerate
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <YarnIcon className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 text-center max-w-xs mb-4">
            Need a sneak peek? Tap 'Show Preview' to see a sample illustration of your project.
          </p>
          <button
            onClick={generatePreview}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-primary bg-primary-50 hover:bg-primary-100"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Show Preview
          </button>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;