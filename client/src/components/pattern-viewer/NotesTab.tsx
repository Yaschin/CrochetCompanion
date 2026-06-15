import { palette } from "@/lib/theme";

interface NotesTabProps {
  notes: string;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}

/** Notes tab — a free-text scratchpad saved with the pattern. */
const NotesTab: React.FC<NotesTabProps> = ({ notes, onNotesChange, onSave, saving }) => (
  <div className="surface-card p-4">
    <p className="font-heading font-semibold text-[13px] mb-3" style={{ color: "#5C3A28" }}>
      Pattern Notes
    </p>
    <textarea
      rows={10}
      placeholder="Add your notes, modifications, tips or reminders for this pattern…"
      value={notes}
      onChange={(e) => onNotesChange(e.target.value)}
      className="w-full p-3.5 rounded-xl text-[13px] leading-relaxed outline-none resize-none"
      style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.2)", color: palette.ink }}
    />
    <div className="flex justify-end mt-3">
      <button
        className="px-5 py-2 rounded-xl font-semibold text-[12.5px] transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: palette.rose, color: "white" }}
        disabled={saving}
        onClick={onSave}
      >
        {saving ? "Saving…" : "Save Notes"}
      </button>
    </div>
  </div>
);

export default NotesTab;
