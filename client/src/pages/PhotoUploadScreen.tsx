import { palette } from "@/lib/theme";
import { ChevronLeft, Camera, ImageOff } from "lucide-react";
import { motion } from "framer-motion";
import { Pattern, ViewType } from "../lib/types";

interface PhotoUploadScreenProps {
  pattern: Pattern | null;
  onNavigate: (view: ViewType) => void;
}

interface AggregatedPhoto {
  url: string;
  section: string;
  step: number;
}

/**
 * Honest progress-photo gallery: shows the photos actually attached to this
 * pattern's steps (added via the per-section uploader in the editor). No more
 * SAMPLE_PHOTOS — an empty pattern shows an empty state, not fabricated photos.
 */
export default function PhotoUploadScreen({ pattern, onNavigate }: PhotoUploadScreenProps) {
  const photos: AggregatedPhoto[] = (pattern?.sections ?? [])
    .filter((s) => s.name.toLowerCase() !== "materials")
    .flatMap((s) =>
      s.steps
        .map((st, i) => (st.photo ? { url: st.photo as string, section: s.name, step: i + 1 } : null))
        .filter((p): p is AggregatedPhoto => p !== null),
    );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <button onClick={() => onNavigate("progress")} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70" style={{ background: "rgba(60,143,163,0.08)", color: "#3D8FA3" }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>Progress Photos</h1>
          <p className="text-[12px]" style={{ color: palette.clay }}>
            {pattern ? pattern.title : "Document your journey"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 md:pb-4 flex flex-col gap-4">
        {!pattern ? (
          <div className="craft-card p-6 flex flex-col items-center text-center gap-3">
            <p className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>No project selected</p>
            <p className="text-[12px]" style={{ color: palette.clay }}>Open a pattern to see its progress photos.</p>
            <button onClick={() => onNavigate("library")} className="btn-craft btn-rose px-5 py-2.5">Browse Library →</button>
          </div>
        ) : photos.length === 0 ? (
          <div className="craft-card p-8 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(60,143,163,0.10)", color: "#3D8FA3" }}>
              <ImageOff className="h-6 w-6" />
            </div>
            <p className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>No photos yet</p>
            <p className="text-[12px] max-w-[260px]" style={{ color: palette.clay }}>
              Add a photo to any step while you work — open the pattern, expand a section, and tap the camera on a step.
            </p>
            <button onClick={() => onNavigate("viewer")} className="btn-craft btn-rose px-5 py-2.5 inline-flex items-center gap-2">
              <Camera className="h-4 w-4" /> Open pattern
            </button>
          </div>
        ) : (
          <div>
            <p className="font-heading font-semibold text-[14px] mb-3" style={{ color: palette.ink }}>
              Your Progress ({photos.length})
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {photos.map((photo, i) => (
                <motion.div
                  key={`${photo.section}-${photo.step}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="craft-card overflow-hidden"
                >
                  <div className="relative h-32" style={{ background: "rgba(140,100,55,0.06)" }}>
                    <img src={photo.url} alt={`${photo.section} step ${photo.step}`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(255,252,245,0.92)", color: palette.rose }}>
                      Step {photo.step}
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-[11.5px] font-semibold leading-tight truncate" style={{ color: palette.ink }}>{photo.section}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
