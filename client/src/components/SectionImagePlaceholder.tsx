import React, { useState } from 'react';
import { ImageIcon, Loader2, SparklesIcon, RefreshCw, X, Pencil } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface SectionImagePlaceholderProps {
  patternId: string;
  sectionIndex: number;
  sectionName: string;
  partImageUrl: string | null | undefined;
  onImageGenerated: (imageUrl: string) => void;
  projectType?: string;
}

const SectionImagePlaceholder: React.FC<SectionImagePlaceholderProps> = ({
  patternId,
  sectionIndex,
  sectionName,
  partImageUrl,
  onImageGenerated,
  projectType
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const { toast } = useToast();
  
  const basePrompt = `${sectionName} part of a crocheted ${projectType || 'item'}`;

  const generateImage = async (customPrompt?: string) => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      
      // If we have a custom prompt, use the direct API
      if (customPrompt) {
        const res = await apiRequest(
          'POST',
          '/api/generate-image',
          {
            prompt: customPrompt,
            type: 'part',
            projectType,
            partName: sectionName
          }
        );
        
        const data = await res.json();
        
        if (data.url) {
          onImageGenerated(data.url);
          toast({
            title: "Image regenerated!",
            description: "Your refined section image has been created successfully.",
          });
          return;
        }
      } else {
        // Otherwise use the standard endpoint
        const res = await apiRequest(
          'POST', 
          `/api/patterns/${patternId}/sections/${sectionIndex}/image`
        );
        
        const data = await res.json();
        
        if (data.imageUrl) {
          onImageGenerated(data.imageUrl);
          toast({
            title: "Image generated!",
            description: "Your section image has been created successfully.",
          });
        }
      }
    } catch (error) {
      console.error("Error generating section image:", error);
      
      // Provide more specific error messages based on error type
      const errorMsg = String(error);
      
      if (errorMsg.includes('API key') || errorMsg.includes('authentication') || 
          errorMsg.includes('401') || errorMsg.includes('403')) {
        toast({
          title: "OpenAI API Key Required",
          description: "To generate section images, please add a valid OpenAI API key in your environment variables. Visit platform.openai.com to get a key.",
          variant: "apiWarning",
          action: <ToastAction altText="Visit OpenAI" onClick={() => window.open('https://platform.openai.com/account/api-keys', '_blank')}>Get API Key</ToastAction>,
          duration: 10000, // Show for longer (10 seconds)
        });
      } else if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit')) {
        toast({
          title: "Rate Limit Reached",
          description: "OpenAI API rate limit reached. Please try again in a few moments.",
          variant: "apiWarning",
          duration: 8000,
        });
      } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        toast({
          title: "Generation Timed Out",
          description: "The image generation request timed out. Please try again with a simpler prompt.",
          variant: "apiWarning",
          duration: 8000,
        });
      } else {
        toast({
          title: "Image Generation Failed",
          description: "Could not generate a section image. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
      setIsDialogOpen(false);
    }
  };

  const openRefinementDialog = () => {
    setRefinementPrompt(`${basePrompt}. Make sure to include the following specific details and improvements:`);
    setIsDialogOpen(true);
  };

  const handleRegenerateWithRefinements = () => {
    if (!refinementPrompt.trim()) return;
    generateImage(refinementPrompt);
  };

  if (partImageUrl) {
    return (
      <>
        <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
          <img 
            src={partImageUrl} 
            alt={`${sectionName} illustration`} 
            className="w-full h-auto max-h-48 object-cover"
          />
          {!isGenerating && (
            <div className="absolute bottom-2 right-2 flex space-x-1">
              <button
                onClick={openRefinementDialog}
                className="p-1 bg-black/70 hover:bg-black/80 text-white rounded-full"
                title="Refine and regenerate"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => generateImage()}
                className="p-1 bg-black/70 hover:bg-black/80 text-white rounded-full"
                title="Regenerate image"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Refine Image Generation</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm text-gray-700 mb-1 block">
                Customize your prompt with specific refinements:
              </label>
              <Textarea
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                placeholder="Describe specific details or changes you want..."
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRegenerateWithRefinements} disabled={isGenerating}>
                {isGenerating ? (
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
      </>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-4 flex flex-col items-center justify-center bg-gray-50 h-36">
      {isGenerating ? (
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-gray-500">Generating image...</p>
        </div>
      ) : (
        <>
          <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-3 text-center max-w-[80%]">
            No image for {sectionName} section yet
          </p>
          <button
            onClick={() => generateImage()}
            className="flex items-center space-x-1 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-md text-xs font-medium"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>Generate Image</span>
          </button>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Refine Image Generation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-gray-700 mb-1 block">
              Customize your prompt with specific refinements:
            </label>
            <Textarea
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              placeholder="Describe specific details or changes you want..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegenerateWithRefinements} disabled={isGenerating}>
              {isGenerating ? (
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

export default SectionImagePlaceholder;