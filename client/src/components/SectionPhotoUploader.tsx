import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, ImageIcon, Upload, X, RefreshCw, CheckCircle, Percent } from 'lucide-react';
import axios from 'axios';

interface SectionPhotoUploaderProps {
  patternId: string;
  sectionIndex: number;
  currentPhoto: string | null;
  onPhotoUpdated: (photoUrl: string) => void;
  onRequestPatternRegeneration?: () => void;
}

// Define response types for API calls
interface PhotoUploadResponse {
  success: boolean;
  photoUrl: string;
  pattern?: any;
}

interface ImageGenerationResponse {
  success: boolean;
  imageUrl: string;
  pattern?: any;
}

const SectionPhotoUploader: React.FC<SectionPhotoUploaderProps> = ({
  patternId,
  sectionIndex,
  currentPhoto,
  onPhotoUpdated,
  onRequestPatternRegeneration
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // State for alignment check
  const [isAlignmentChecking, setIsAlignmentChecking] = useState(false);
  const [alignmentScore, setAlignmentScore] = useState<number | null>(null);
  const [showRegenerateOption, setShowRegenerateOption] = useState(false);

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an image to upload',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Convert file to base64
      const base64Data = await fileToBase64(selectedFile);
      
      // Send to server
      const response = await axios.post(`/api/patterns/${patternId}/sections/${sectionIndex}/photo`, {
        photo: base64Data
      });
      
      if (response.data.success && response.data.photoUrl) {
        toast({
          title: 'Photo uploaded',
          description: 'Your section photo has been successfully uploaded',
        });
        
        // Update state
        onPhotoUpdated(response.data.photoUrl);
        
        // Ask if user wants to regenerate pattern based on new image
        setShowRegenerateOption(true);
        
        // Reset component state
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsDialogOpen(false);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was a problem uploading your photo. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle pattern regeneration request
  const handleRegeneratePattern = () => {
    if (onRequestPatternRegeneration) {
      toast({
        title: 'Regenerating pattern',
        description: 'Updating pattern to match your new image...',
      });
      onRequestPatternRegeneration();
      setShowRegenerateOption(false);
    }
  };
  
  // Check alignment between pattern and image
  const checkAlignment = async () => {
    try {
      setIsAlignmentChecking(true);
      
      // Call API endpoint to check alignment
      const response = await axios.post(`/api/patterns/${patternId}/sections/${sectionIndex}/alignment-check`);
      
      if (response.data.success && response.data.alignmentScore !== undefined) {
        setAlignmentScore(response.data.alignmentScore);
        
        // Recommend regeneration if score is low
        if (response.data.alignmentScore < 70) {
          setShowRegenerateOption(true);
        }
        
        toast({
          title: 'Alignment Check Complete',
          description: `Your pattern matches the image by approximately ${response.data.alignmentScore}%`,
        });
      } else {
        throw new Error('Alignment check failed');
      }
    } catch (error) {
      console.error('Alignment check error:', error);
      toast({
        title: 'Alignment check failed',
        description: 'Could not determine pattern-image alignment. Try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsAlignmentChecking(false);
    }
  };

  // Handle capturing from webcam
  const handleCapture = async () => {
    try {
      // Will be implemented later if needed
      toast({
        title: 'Coming soon',
        description: 'Webcam capture functionality will be available in a future update.',
      });
    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: 'Capture failed',
        description: 'There was a problem capturing your photo. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Generate a section image through the AI
  const handleGenerateAIImage = async () => {
    try {
      setIsUploading(true);
      
      // Call the API endpoint to generate an image for this section
      const response = await axios.post(`/api/patterns/${patternId}/sections/${sectionIndex}/image`);
      
      if (response.data.success && response.data.imageUrl) {
        toast({
          title: 'Image generated',
          description: 'AI has generated a new image for this section',
        });
        
        // Update state
        onPhotoUpdated(response.data.imageUrl);
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'Image generation failed',
        description: 'There was a problem generating the image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="mt-2">
      {/* Photo preview */}
      {currentPhoto && (
        <div className="mb-2 relative">
          <img 
            src={currentPhoto} 
            alt="Section" 
            className="max-w-full h-auto rounded-md border border-gray-200" 
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-1 right-1 bg-black/25 hover:bg-black/50 text-white rounded-full p-1"
            onClick={() => setIsDialogOpen(true)}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload button if no photo */}
      {!currentPhoto && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-1 text-xs"
        >
          <ImageIcon className="h-3.5 w-3.5 mr-1" />
          Add Section Photo
        </Button>
      )}
      
      {/* Photo action buttons (alignment check and regenerate) */}
      {currentPhoto && (
        <div className="flex mt-2 space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkAlignment}
            disabled={isAlignmentChecking}
            className="flex items-center gap-1 text-xs"
          >
            <Percent className="h-3.5 w-3.5 mr-1" />
            {isAlignmentChecking ? 'Checking...' : 'Check Pattern Match'}
          </Button>
          
          {showRegenerateOption && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRegeneratePattern}
              className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Regenerate Pattern
            </Button>
          )}
          
          {alignmentScore !== null && (
            <div className="flex items-center text-xs font-medium ml-2">
              <span className={alignmentScore >= 80 ? "text-green-600" : 
                alignmentScore >= 60 ? "text-amber-600" : "text-red-600"}>
                {alignmentScore}% match
              </span>
              {alignmentScore >= 80 && <CheckCircle className="h-3.5 w-3.5 ml-1 text-green-600" />}
            </div>
          )}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Section Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            {previewUrl && (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full h-auto rounded-md" 
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-1 right-1 bg-black/25 hover:bg-black/50 text-white rounded-full p-1"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Current photo */}
            {!previewUrl && currentPhoto && (
              <div className="relative">
                <img 
                  src={currentPhoto} 
                  alt="Current" 
                  className="max-w-full h-auto rounded-md" 
                />
              </div>
            )}

            {/* Upload controls */}
            {!previewUrl && !isUploading && (
              <div className="flex justify-center space-x-4">
                <label className="flex flex-col items-center justify-center px-4 py-2 bg-white text-blue-500 rounded-lg shadow-lg tracking-wide border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
                  <Upload className="h-6 w-6" />
                  <span className="mt-2 text-sm">Select file</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                </label>

                <Button 
                  type="button" 
                  onClick={handleCapture}
                  className="flex flex-col items-center justify-center px-4 py-2"
                >
                  <Camera className="h-6 w-6" />
                  <span className="mt-2 text-sm">Capture</span>
                </Button>

                <Button 
                  type="button" 
                  onClick={handleGenerateAIImage}
                  className="flex flex-col items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <span className="text-sm">Generate with AI</span>
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setPreviewUrl(null);
                setSelectedFile(null);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            {previewUrl && (
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectionPhotoUploader;