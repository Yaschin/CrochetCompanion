import React, { useState } from 'react';
import { ImageIcon, Loader2, SparklesIcon, RefreshCw, Pencil, Key, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getOrdinalSuffix } from '@/lib/dateUtils';

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
            title: "Image Regenerated Successfully!",
            description: `Your refined image for the ${sectionName} section (${sectionIndex + 1}${getOrdinalSuffix(sectionIndex + 1)} section) has been created with your custom details.`,
            duration: 5000,
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
            title: "Image Generated Successfully!",
            description: `Your image for the ${sectionName} section (${sectionIndex + 1}${getOrdinalSuffix(sectionIndex + 1)} section) has been created.`,
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("Error generating section image:", error);
      
      // Provide more specific error messages based on error type
      const errorMsg = String(error);
      
      // API Key or Authentication Errors
      if (errorMsg.includes('API key') || errorMsg.includes('authentication') || 
          errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('key invalid')) {
        toast({
          title: "OpenAI API Key Required",
          description: "To generate section images for the " + (sectionIndex + 1) + getOrdinalSuffix(sectionIndex + 1) + 
                      " section, please add a valid OpenAI API key in your environment variables.",
          variant: "apiWarning",
          action: <ToastAction altText="Visit OpenAI" onClick={() => window.open('https://platform.openai.com/account/api-keys', '_blank')}>
                    <Key className="mr-1 h-4 w-4" />Get API Key
                 </ToastAction>,
          duration: 10000, // Show for longer (10 seconds)
        });
      } 
      // Rate Limit Errors
      else if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit')) {
        toast({
          title: "Rate Limit Reached",
          description: "OpenAI API rate limit reached for image generation. Please try again in a few minutes when your quota resets.",
          variant: "apiWarning",
          duration: 8000,
        });
      } 
      // Timeout Errors 
      else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        toast({
          title: "Generation Timed Out",
          description: "The image generation request for the " + sectionName + " section timed out. Try a simpler description or check your network connection.",
          variant: "apiWarning",
          duration: 8000,
        });
      }
      // Network Errors
      else if (errorMsg.includes('network') || errorMsg.includes('connection') || errorMsg.includes('ECONNRESET')) {
        toast({
          title: "Network Error",
          description: "Could not connect to the OpenAI API. Please check your internet connection and try again.",
          variant: "apiWarning",
          duration: 8000,
        });
      }
      // Content Policy Violations
      else if (errorMsg.includes('content policy') || errorMsg.includes('safety') || errorMsg.includes('violation')) {
        toast({
          title: "Content Policy Violation",
          description: "Your image request may violate OpenAI's content policy. Please ensure your description doesn't contain inappropriate content.",
          variant: "apiWarning",
          action: <ToastAction altText="Learn More" onClick={() => window.open('https://openai.com/policies/usage-policies', '_blank')}>
                    <AlertCircle className="mr-1 h-4 w-4" />Learn More
                 </ToastAction>,
          duration: 10000,
        });
      }
      // Billing Errors
      else if (errorMsg.includes('billing') || errorMsg.includes('payment') || errorMsg.includes('quota')) {
        toast({
          title: "OpenAI Billing Issue",
          description: "There's a billing issue with your OpenAI account. Please check your payment information or usage quota.",
          variant: "apiWarning",
          action: <ToastAction altText="Check Billing" onClick={() => window.open('https://platform.openai.com/account/billing', '_blank')}>
                    Check Billing
                 </ToastAction>,
          duration: 10000,
        });
      }
      // Generic Fallback Error
      else {
        toast({
          title: "Image Generation Failed",
          description: `Could not generate an image for the ${sectionName} section. Error details: ${errorMsg.substring(0, 50)}${errorMsg.length > 50 ? '...' : ''}`,
          variant: "destructive",
          duration: 6000,
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
          <p className="text-sm text-gray-500">Generating image for {sectionName}...</p>
          <p className="text-xs text-gray-400 mt-1 text-center max-w-[90%]">
            This may take up to 20 seconds
          </p>
        </div>
      ) : (
        <>
          <ImageIcon className="h-10 w-10 text-gray-400 mb-1" />
          <p className="text-sm text-gray-600 font-medium mb-1 text-center max-w-[90%]">
            {sectionName} Section Image
          </p>
          <p className="text-xs text-gray-500 mb-3 text-center max-w-[90%]">
            Generate an AI illustration of the {sectionName.toLowerCase()} part of your {projectType || 'pattern'}.
            {/* API key check is now handled by the error handling in the generateImage function */}
            <span className="block mt-1 text-xs text-gray-400">
              <Key className="h-3 w-3 inline mr-1" />
              Requires OpenAI API key
            </span>
          </p>
          <button
            onClick={() => generateImage()}
            className="flex items-center space-x-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-md text-xs font-medium"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>Generate {sectionIndex === 0 ? 'First' : sectionIndex + 1 + getOrdinalSuffix(sectionIndex + 1)} Section Image</span>
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