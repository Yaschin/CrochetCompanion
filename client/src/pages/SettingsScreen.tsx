import { useRef, useState } from "react";
import { ChevronLeft, Download, Upload, Shield, Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ViewType } from "../lib/types";

interface SettingsScreenProps {
  onNavigate: (view: ViewType) => void;
}

export default function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "crochet-time-backup.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Backup downloaded", description: "Your data has been saved as a JSON file." });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not download your backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await apiRequest("POST", "/api/import", data);
      const result = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stash"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stash-notes"] });
      toast({
        title: "Backup restored",
        description: `Imported ${result.importedPatterns ?? 0} pattern(s) and ${result.importedStash ?? 0} material(s).`,
      });
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "That file couldn't be read.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
        <button onClick={() => onNavigate("home")} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70" style={{ background: "rgba(140,100,55,0.08)", color: "#9A7868" }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>Settings</h1>
          <p className="text-[12px]" style={{ color: "#9A7868" }}>Backup & data</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20 md:pb-4 flex flex-col gap-4">
        {/* Backup */}
        <div className="craft-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4" style={{ color: "#84934F" }} />
            <p className="font-heading font-semibold text-[15px]" style={{ color: "#3D2318" }}>Backup your crochet life</p>
          </div>
          <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: "#7A5A48" }}>
            Download everything — every pattern, project, and material — as a single file you can keep safe.
            Restoring is additive, so importing never overwrites what's already here.
          </p>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-heading font-bold text-[14px] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #84934F, #6A7A3A)", color: "white", boxShadow: "0 4px 16px rgba(132,147,79,0.35)" }}
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting…" : "Export backup (.json)"}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-heading font-bold text-[14px] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ background: "rgba(132,147,79,0.10)", color: "#84934F", border: "1.5px solid rgba(132,147,79,0.25)" }}
          >
            <Upload className="h-4 w-4" />
            {importing ? "Restoring…" : "Restore from backup"}
          </button>
        </div>

        {/* About */}
        <div className="craft-card p-5 flex items-center gap-3">
          <img
            src="/characters/char-bee-transparent.png"
            alt="Bee"
            style={{ width: 48, height: 48, objectFit: "contain" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div>
            <p className="font-heading font-semibold text-[14px]" style={{ color: "#3D2318" }}>Crochet Time</p>
            <p className="text-[12px] flex items-center gap-1" style={{ color: "#C24E6B" }}>
              Made with <Heart className="h-3 w-3" style={{ fill: "#C24E6B" }} /> for Larissa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
