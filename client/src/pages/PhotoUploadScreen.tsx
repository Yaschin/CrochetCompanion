import { useState, useRef } from "react";
import { ChevronLeft, Upload, Image, X, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ViewType } from "../lib/types";

interface PhotoUploadScreenProps {
  onNavigate: (view: ViewType) => void;
}

interface ProgressPhoto {
  id: string;
  url: string;
  caption: string;
  date: string;
  row?: number;
}

const SAMPLE_PHOTOS: ProgressPhoto[] = [
  { id: "1", url: "", caption: "First few rows!", date: "June 3", row: 8 },
  { id: "2", url: "", caption: "Body taking shape", date: "June 5", row: 22 },
];

export default function PhotoUploadScreen({ onNavigate }: PhotoUploadScreenProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>(SAMPLE_PHOTOS);
  const [dragging, setDragging] = useState(false);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleAdd = () => {
    if (!previewUrl) return;
    setPhotos(ps => [...ps, {
      id: Date.now().toString(),
      url: previewUrl,
      caption: caption || "Progress photo",
      date: "Just now",
    }]);
    setPreviewUrl(null);
    setCaption("");
  };

  const removePhoto = (id: string) => setPhotos(ps => ps.filter(p => p.id !== id));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 pt-5 pb-4"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <button onClick={() => onNavigate("progress")}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
          style={{ background: "rgba(60,143,163,0.08)", color: "#3D8FA3" }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>
            Progress Photos
          </h1>
          <p className="text-[12px]" style={{ color: "#9A7868" }}>Document your journey</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 md:pb-4 flex flex-col gap-4">

        {/* Upload area — warm default border, only go teal on hover/drag */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !previewUrl && fileRef.current?.click()}
          className="rounded-2xl border-2 border-dashed transition-all cursor-pointer"
          style={{
            borderColor: dragging
              ? "#3D8FA3"
              : previewUrl
              ? "#84934F"
              : "rgba(140,100,55,0.35)",
            background: dragging
              ? "rgba(60,143,163,0.08)"
              : previewUrl
              ? "rgba(132,147,79,0.06)"
              : "rgba(255,252,245,0.7)",
            minHeight: 160,
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {previewUrl ? (
            <div className="p-4 flex flex-col gap-3">
              <div className="relative rounded-xl overflow-hidden" style={{ height: 160 }}>
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Add a caption (optional)…"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none"
                style={{
                  background: "rgba(255,252,245,0.95)",
                  border: "1.5px solid rgba(140,100,55,0.22)",
                  color: "#3D2318",
                }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #84934F, #6A7A3A)", boxShadow: "0 3px 12px rgba(132,147,79,0.4)" }}>
                Save Photo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(140,100,55,0.10)", color: "#9A7868" }}>
                <Upload className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="font-heading font-semibold text-[14px]" style={{ color: "#5C3A28" }}>
                  Drop a photo here
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "#9A7868" }}>
                  or tap to browse your gallery
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{ background: "rgba(140,100,55,0.09)", color: "#7A5A48" }}>
                  <Camera className="h-3 w-3" />
                  Camera
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{ background: "rgba(140,100,55,0.09)", color: "#7A5A48" }}>
                  <Image className="h-3 w-3" />
                  Gallery
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Photo gallery */}
        <div>
          <p className="font-heading font-semibold text-[14px] mb-3" style={{ color: "#3D2318" }}>
            Your Progress ({photos.length})
          </p>
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {photos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="craft-card overflow-hidden group"
                >
                  <div className="relative h-32"
                    style={{ background: `linear-gradient(135deg, hsl(${(i * 60 + 180) % 360} 35% 88%), hsl(${(i * 60 + 200) % 360} 25% 80%))` }}>
                    {photo.url ? (
                      <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-30">📷</span>
                      </div>
                    )}
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.55)" }}>
                      <X className="h-3 w-3 text-white" />
                    </button>
                    {photo.row && (
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: "rgba(255,252,245,0.9)", color: "#C24E6B" }}>
                        Row {photo.row}
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-[11.5px] font-semibold leading-tight" style={{ color: "#3D2318" }}>
                      {photo.caption}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#9A7868" }}>{photo.date}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
