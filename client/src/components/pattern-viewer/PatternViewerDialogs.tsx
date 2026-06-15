import { palette } from "@/lib/theme";
import { Pattern } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Image, Share2 } from "lucide-react";

interface PatternViewerDialogsProps {
  pattern: Pattern;
  // Regenerate-all confirmation
  regenAllOpen: boolean;
  onRegenAllOpenChange: (open: boolean) => void;
  regenAllNote: string;
  onRegenAllNoteChange: (value: string) => void;
  onConfirmRegenAll: () => void;
  isRegenerating: boolean;
  // Share-to-community confirmation
  shareOpen: boolean;
  onShareOpenChange: (open: boolean) => void;
  onConfirmShare: () => void;
  sharePending: boolean;
  // Image regeneration
  imageOpen: boolean;
  onImageOpenChange: (open: boolean) => void;
  imageRefinements: string;
  onImageRefinementsChange: (value: string) => void;
  onConfirmImage: () => void;
  isRegeneratingImage: boolean;
}

/** The three modal dialogs that hang off the viewer (regen-all, share, image). */
const PatternViewerDialogs: React.FC<PatternViewerDialogsProps> = ({
  pattern,
  regenAllOpen,
  onRegenAllOpenChange,
  regenAllNote,
  onRegenAllNoteChange,
  onConfirmRegenAll,
  isRegenerating,
  shareOpen,
  onShareOpenChange,
  onConfirmShare,
  sharePending,
  imageOpen,
  onImageOpenChange,
  imageRefinements,
  onImageRefinementsChange,
  onConfirmImage,
  isRegeneratingImage,
}) => (
  <>
    {/* ── Regenerate All Confirmation Dialog ── */}
    <Dialog open={regenAllOpen} onOpenChange={onRegenAllOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Regenerate All Sections?</DialogTitle>
          <DialogDescription>
            This will rewrite all unlocked steps with AI. Locked steps are safe. You can add an optional note to guide the regeneration.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <textarea
            rows={2}
            placeholder="Optional: any specific instructions? (e.g. make it beginner-friendly)"
            value={regenAllNote}
            onChange={(e) => onRegenAllNoteChange(e.target.value)}
            className="w-full p-2.5 rounded-xl text-[13px] outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(140,100,55,0.25)", color: palette.ink }}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onRegenAllOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isRegenerating}
            onClick={onConfirmRegenAll}
          >
            {isRegenerating ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Regenerating…</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" />Yes, Regenerate All</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* ── Share to Community Confirmation Dialog ── */}
    <Dialog open={shareOpen} onOpenChange={onShareOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share to the Community Library?</DialogTitle>
          <DialogDescription>
            This publishes “{pattern.title}” — its photo, materials and all written
            instructions — to the public Community Library for others to browse and make.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onShareOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={sharePending}
            onClick={onConfirmShare}
          >
            {sharePending ? (
              <><Share2 className="h-4 w-4 mr-2 animate-pulse" />Sharing…</>
            ) : (
              <><Share2 className="h-4 w-4 mr-2" />Yes, Share Pattern</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* ── Image Regeneration Dialog ── */}
    <Dialog open={imageOpen} onOpenChange={onImageOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Regenerate Pattern Image</DialogTitle>
          <DialogDescription>
            Provide additional details to refine the image.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="imageRefinements" className="col-span-4">Refinements</Label>
            <Input
              id="imageRefinements"
              placeholder="e.g., more texture details, pastel colors"
              className="col-span-4"
              value={imageRefinements}
              onChange={(e) => onImageRefinementsChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onImageOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={isRegeneratingImage} onClick={onConfirmImage}>
            {isRegeneratingImage ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Image className="h-4 w-4 mr-2" />Generate Image</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);

export default PatternViewerDialogs;
