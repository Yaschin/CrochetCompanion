import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, ExternalLink, ChevronRight, X } from "lucide-react";
import { palette } from "@/lib/theme";
import { Pattern } from "../lib/types";
import { collectDocuments, fileMetaLabel, mediaUrl } from "../lib/documents";
import SourcePdfViewer from "./SourcePdfViewer";
import { PatternThumb } from "@/components/PatternThumb";

interface DocumentsListProps {
  /** Jump into the pattern itself (the parsed/working version). */
  onOpenPattern: (pattern: Pattern) => void;
}

/**
 * The "files" library: every pattern that has imported originals, grouped by
 * pattern. Tapping a file opens it full-screen (reusing SourcePdfViewer);
 * "Open pattern" jumps to the parsed/working pattern.
 */
export default function DocumentsList({ onOpenPattern }: DocumentsListProps) {
  const { data: patterns = [], isLoading } = useQuery<Pattern[]>({ queryKey: ["/api/patterns"] });
  const docs = collectDocuments(patterns);
  const [viewing, setViewing] = useState<{ pattern: Pattern; key: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!docs.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <FileText className="h-9 w-9" style={{ color: palette.clay }} />
        <p className="font-heading font-semibold text-[15px]" style={{ color: palette.ink }}>No imported PDFs yet</p>
        <p className="text-[13px] max-w-xs" style={{ color: palette.clay }}>
          When you bring a pattern in with <b>Import PDF</b>, the original is kept here so you can refer back to it anytime.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {docs.map(({ pattern, files }) => (
        <div key={pattern.id} className="craft-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden" style={{ containerType: "inline-size" }}>
              <PatternThumb image={pattern.endProductImage} title={pattern.title} projectType={pattern.projectType} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-[14px] truncate" style={{ color: palette.ink }}>{pattern.title}</p>
              <p className="text-[11px]" style={{ color: palette.clay }}>
                {files.length} file{files.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              onClick={() => onOpenPattern(pattern)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all hover:opacity-90 flex-shrink-0"
              style={{ background: "rgba(194,78,107,0.08)", color: palette.rose }}
            >
              Open pattern <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {files.map((f) => (
              <div key={f.key} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: "rgba(140,100,55,0.06)" }}>
                <FileText className="h-4 w-4 flex-shrink-0" style={{ color: palette.rose }} />
                <button onClick={() => setViewing({ pattern, key: f.key })} className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-semibold truncate" style={{ color: palette.ink }}>{f.name}</p>
                  {fileMetaLabel(f) && <p className="text-[11px]" style={{ color: palette.clay }}>{fileMetaLabel(f)}</p>}
                </button>
                <a
                  href={mediaUrl(f.key)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${f.name} in a new tab`}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0"
                  style={{ background: "rgba(140,100,55,0.10)", color: palette.ink }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Full-screen file viewer */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: palette.cream }}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(140,100,55,0.15)" }}>
            <button
              onClick={() => setViewing(null)}
              aria-label="Close"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full"
              style={{ background: "rgba(140,100,55,0.10)", color: palette.ink }}
            >
              <X className="h-4 w-4" />
            </button>
            <p className="font-heading font-bold text-[14px] truncate flex-1 text-center" style={{ color: palette.ink }}>
              {viewing.pattern.title}
            </p>
            <button
              onClick={() => onOpenPattern(viewing.pattern)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold flex-shrink-0"
              style={{ background: "rgba(194,78,107,0.08)", color: palette.rose }}
            >
              Pattern <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 px-4 py-3 flex flex-col">
            <SourcePdfViewer files={viewing.pattern.sourceFiles ?? []} initialKey={viewing.key} />
          </div>
        </div>
      )}
    </div>
  );
}
