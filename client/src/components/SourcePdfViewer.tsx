import { useState } from "react";
import { FileText, ExternalLink, Trash2 } from "lucide-react";
import { palette } from "@/lib/theme";
import type { SourceFile } from "@/lib/types";
import { mediaUrl, fileMetaLabel, isIos } from "@/lib/documents";

interface SourcePdfViewerProps {
  files: SourceFile[];
  /** Open this file first (used by the full-screen document viewer). */
  initialKey?: string;
  /** When provided, shows a remove button for the active file. */
  onRemove?: (key: string) => void;
}

/**
 * Renders an imported PDF inline (native browser viewer via <iframe>), with a
 * file switcher when several were imported. On iOS — where iframe PDFs are
 * unreliable — it leads with an "Open PDF" button to the native viewer instead.
 *
 * Designed to be kept mounted (hidden) by its parent so the page/scroll
 * position survives flipping back and forth to the pattern.
 */
export default function SourcePdfViewer({ files, initialKey, onRemove }: SourcePdfViewerProps) {
  const [activeKey, setActiveKey] = useState<string>(initialKey ?? files[0]?.key ?? "");
  const active = files.find((f) => f.key === activeKey) ?? files[0];
  const ios = isIos();

  if (!active) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-10">
        <FileText className="h-7 w-7" style={{ color: palette.clay }} />
        <p className="text-[13px]" style={{ color: palette.clay }}>No original file saved for this pattern.</p>
      </div>
    );
  }

  const url = mediaUrl(active.key);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* File switcher — only when more than one PDF was imported */}
      {files.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
          {files.map((f) => {
            const on = f.key === active.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveKey(f.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all"
                style={{
                  background: on ? palette.rose : "rgba(140,100,55,0.08)",
                  color: on ? "white" : palette.clay,
                }}
              >
                <FileText className="h-3.5 w-3.5" />
                {f.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar: name + meta · open · remove */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
        <div className="min-w-0">
          <p className="font-heading font-semibold text-[13px] truncate" style={{ color: palette.ink }}>{active.name}</p>
          {fileMetaLabel(active) && (
            <p className="text-[11px]" style={{ color: palette.clay }}>{fileMetaLabel(active)}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all hover:opacity-90"
            style={{ background: "rgba(140,100,55,0.10)", color: palette.ink }}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
          {onRemove && (
            <button
              onClick={() => onRemove(active.key)}
              aria-label={`Remove ${active.name}`}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full transition-all hover:opacity-90"
              style={{ background: "rgba(194,78,107,0.10)", color: palette.rose }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* The document itself */}
      {ios ? (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl text-center px-6"
          style={{ border: "1.5px dashed rgba(140,100,55,0.3)", minHeight: 280 }}
        >
          <FileText className="h-8 w-8" style={{ color: palette.rose }} />
          <p className="text-[13px]" style={{ color: palette.clay }}>
            Tap to open “{active.name}” in your PDF viewer.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-heading font-bold text-[13px]"
            style={{ background: palette.rose, color: "white" }}
          >
            <ExternalLink className="h-4 w-4" /> Open PDF
          </a>
        </div>
      ) : (
        <iframe
          key={active.key}
          src={url}
          title={active.name}
          className="flex-1 w-full rounded-2xl"
          style={{ border: "1px solid rgba(140,100,55,0.2)", minHeight: 320 }}
        />
      )}
    </div>
  );
}
