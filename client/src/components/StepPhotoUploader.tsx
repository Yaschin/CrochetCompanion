import React, { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface StepPhotoUploaderProps {
  patternId: string;
  sectionIndex: number;
  stepIndex: number;
  currentPhoto: string | null;
  onPhotoUpdated: (photoUrl: string) => void;
}

const StepPhotoUploader: React.FC<StepPhotoUploaderProps> = ({
  patternId,
  sectionIndex,
  stepIndex,
  currentPhoto,
  onPhotoUpdated
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

    setIsUploading(true);
    try {
      // Convert file to base64
      const base64Data = await fileToBase64(selectedFile);
      
      // Send to server
      const response = await apiRequest('POST', 
        `/api/patterns/${patternId}/sections/${sectionIndex}/steps/${stepIndex}/photo`,
        { photo: base64Data }
      );
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the step with new photo URL
      onPhotoUpdated(data.photoUrl);
      
      toast({
        title: 'Photo uploaded',
        description: 'Your photo has been added to this step'
      });
      
      // Close dialog and reset state
      setIsDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your photo. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete photo
  const handleDeletePhoto = async () => {
    if (!currentPhoto) return;
    
    setIsUploading(true);
    try {
      // Send to server (we'll just set the photo to null)
      const response = await apiRequest('POST', 
        `/api/patterns/${patternId}/sections/${sectionIndex}/steps/${stepIndex}/photo`,
        { photo: null }
      );
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      
      // Update the step with null photo URL
      onPhotoUpdated('');
      
      toast({
        title: 'Photo removed',
        description: 'The photo has been removed from this step'
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Delete failed',
        description: 'There was an error removing the photo. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {currentPhoto ? (
        <div className="relative group">
          <img 
            src={currentPhoto} 
            alt="Step photo" 
            className="w-full rounded-md border border-gray-200"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-md">
            <Button
              variant="destructive"
              size="sm"
              className="mr-2"
              onClick={handleDeletePhoto}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="ml-2">Remove</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4 mr-2" />
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full h-20 border-dashed"
          onClick={() => setIsDialogOpen(true)}
        >
          <Camera className="h-5 w-5 mr-2" />
          Add photo
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center">
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-60 rounded-md"
                  />
                  <button
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center">
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your photo here or click to browse
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary/90"
                  >
                    Select Photo
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Photo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StepPhotoUploader;