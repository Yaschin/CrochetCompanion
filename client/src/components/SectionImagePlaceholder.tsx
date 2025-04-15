import React, { useState } from 'react';
import { ImageIcon, Loader2, SparklesIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SectionImagePlaceholderProps {
  patternId: string;
  sectionIndex: number;
  sectionName: string;
  partImageUrl: string | null;
  onImageGenerated: (imageUrl: string) => void;
}

const SectionImagePlaceholder: React.FC<SectionImagePlaceholderProps> = ({
  patternId,
  sectionIndex,
  sectionName,
  partImageUrl,
  onImageGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImage = async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      
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
    } catch (error) {
      console.error("Error generating section image:", error);
      toast({
        title: "Image generation failed",
        description: "Could not generate a section image. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (partImageUrl) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
        <img 
          src={partImageUrl} 
          alt={`${sectionName} illustration`} 
          className="w-full h-auto max-h-48 object-cover"
        />
      </div>
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
            onClick={generateImage}
            className="flex items-center space-x-1 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-md text-xs font-medium"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>Generate Image</span>
          </button>
        </>
      )}
    </div>
  );
};

export default SectionImagePlaceholder;