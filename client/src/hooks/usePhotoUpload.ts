import { useCallback, useState } from "react";
import type { ChangeEvent } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { fileToDataUrl } from "@/lib/utils";

interface UploadOptions {
  successTitle: string;
  successDescription?: string;
  /** Called with the stored photo URL on success. */
  onUploaded: (photoUrl: string) => void;
}

/**
 * Shared photo-upload plumbing for the step and section uploaders: file
 * selection + preview, the `POST { photo } → { photoUrl }` round-trip, and
 * consistent error toasts. The dialog/trigger UI stays per-component — the two
 * legitimately diverge (the section uploader adds camera capture + AI generate).
 */
export function usePhotoUpload() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    fileToDataUrl(file).then(setPreviewUrl);
  }, []);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    reset();
  }, [reset]);

  const upload = useCallback(
    async (endpoint: string, opts: UploadOptions) => {
      if (!selectedFile) {
        toast({ title: "No file selected", description: "Please select an image to upload", variant: "destructive" });
        return;
      }
      setIsUploading(true);
      try {
        const photoDataUrl = await fileToDataUrl(selectedFile);
        const res = await apiRequest("POST", endpoint, { photo: photoDataUrl });
        const data = await res.json();
        opts.onUploaded(data.photoUrl ?? "");
        toast({ title: opts.successTitle, description: opts.successDescription, duration: 5000 });
        setIsDialogOpen(false);
        reset();
      } catch (error) {
        const msg = String(error);
        if (/size|large/i.test(msg)) {
          toast({ title: "File too large", description: "The photo you selected is too large. Please choose a smaller image.", variant: "destructive", duration: 6000 });
        } else if (/format|type/i.test(msg)) {
          toast({ title: "Invalid file format", description: "Please select a valid image file (JPEG, PNG, GIF, etc.).", variant: "destructive", duration: 6000 });
        } else {
          toast({ title: "Upload failed", description: "There was an error uploading your photo. Please try again.", variant: "destructive", duration: 6000 });
        }
      } finally {
        setIsUploading(false);
      }
    },
    [selectedFile, toast, reset],
  );

  return {
    isDialogOpen, setIsDialogOpen,
    isUploading, setIsUploading,
    selectedFile, previewUrl,
    handleFileChange, reset, closeDialog, upload,
  };
}
