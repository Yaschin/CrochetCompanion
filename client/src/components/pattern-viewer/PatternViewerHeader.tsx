import { palette } from "@/lib/theme";
import { Pattern } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Heart, Pencil } from "lucide-react";

interface PatternViewerHeaderProps {
  pattern: Pattern;
  formattedDate: string;
  editingTitle: boolean;
  titleDraft: string;
  onTitleDraftChange: (value: string) => void;
  onStartEditTitle: () => void;
  onCancelEditTitle: () => void;
  onSaveTitle: () => void;
  renaming: boolean;
  onToggleFavorite: () => void;
}

/** Viewer header — editable title, status/spec badges, and the favorite toggle. */
const PatternViewerHeader: React.FC<PatternViewerHeaderProps> = ({
  pattern,
  formattedDate,
  editingTitle,
  titleDraft,
  onTitleDraftChange,
  onStartEditTitle,
  onCancelEditTitle,
  onSaveTitle,
  renaming,
  onToggleFavorite,
}) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex-1 min-w-0">
      {editingTitle ? (
        <div className="flex items-center gap-2">
          <input
            value={titleDraft}
            onChange={(e) => onTitleDraftChange(e.target.value)}
            aria-label="Pattern name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && titleDraft.trim()) onSaveTitle();
              if (e.key === 'Escape') onCancelEditTitle();
            }}
            className="font-heading text-xl font-bold leading-tight flex-1 min-w-0 rounded-lg px-2 py-1 outline-none"
            style={{ color: palette.ink, background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(194,78,107,0.4)" }}
          />
          <button
            onClick={() => titleDraft.trim() && onSaveTitle()}
            disabled={renaming || !titleDraft.trim()}
            aria-label="Save name"
            className="px-3 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-50"
            style={{ background: palette.rose, color: "white" }}
          >
            {renaming ? "…" : "Save"}
          </button>
        </div>
      ) : (
        <h2 className="font-heading text-xl font-bold leading-tight group" style={{ color: palette.ink }}>
          {pattern.title}
          <button
            onClick={onStartEditTitle}
            aria-label="Rename pattern"
            title="Rename pattern"
            className="ml-2 inline-flex align-middle opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: palette.clay }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </h2>
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {pattern.status === 'active' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">In progress</span>
        )}
        {pattern.status === 'finished' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">Finished ✓</span>
        )}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
          {pattern.projectType}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
          {pattern.skillLevel}
        </span>
        {pattern.yarnType && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">
            🧶 {pattern.yarnType}
          </span>
        )}
        {pattern.size && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
            📐 {pattern.size}
          </span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-[10px] font-medium hidden sm:block" style={{ color: "#B0908A" }}>
        Created {formattedDate}
      </span>
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={pattern.favorite ? 'Remove from favorites' : 'Add to favorites'}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110"
        style={{
          background: pattern.favorite ? "rgba(194,78,107,0.12)" : "rgba(140,100,55,0.08)",
          border: `1.5px solid ${pattern.favorite ? "rgba(194,78,107,0.3)" : "rgba(140,100,55,0.18)"}`,
        }}
      >
        <Heart className={cn('h-4.5 w-4.5', pattern.favorite ? 'fill-primary text-primary' : '')} style={{ width: 18, height: 18 }} />
      </button>
    </div>
  </div>
);

export default PatternViewerHeader;
