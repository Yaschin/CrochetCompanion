import { palette } from "@/lib/theme";
import { PatternInputFormData } from "@/lib/types";
import { CATEGORIES, SKILL_LEVELS, YARN_TYPES, SIZE_OPTIONS } from "./constants";

interface PickerProps {
  formData: PatternInputFormData;
  setFormData: React.Dispatch<React.SetStateAction<PatternInputFormData>>;
}

export const CategoryPicker = ({ formData, setFormData }: PickerProps) => (
  <div className="grid grid-cols-1 gap-3">
    {CATEGORIES.map((cat) => (
      <button key={cat.id}
        onClick={() => setFormData(p => ({ ...p, projectType: cat.id }))}
        className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: formData.projectType === cat.id ? `${cat.color}14` : "rgba(255,252,245,0.9)",
          border: `2px solid ${formData.projectType === cat.id ? cat.color : "rgba(140,100,55,0.18)"}`,
          boxShadow: formData.projectType === cat.id ? `0 4px 20px ${cat.color}25` : "0 1px 4px rgba(60,30,10,0.06)",
        }}>
        <span style={{ fontSize: 32 }}>{cat.emoji}</span>
        <div className="text-left flex-1">
          <p className="font-heading font-bold text-[15px]" style={{ color: palette.ink }}>{cat.label}</p>
        </div>
        {formData.projectType === cat.id && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: cat.color }}>
            <span className="text-white text-[11px] font-bold">✓</span>
          </div>
        )}
      </button>
    ))}
  </div>
);

export const SkillPicker = ({ formData, setFormData }: PickerProps) => (
  <div>
    <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>Skill Level</label>
    <div className="flex gap-2">
      {SKILL_LEVELS.map((lvl) => (
        <button key={lvl.id}
          onClick={() => setFormData(p => ({ ...p, skillLevel: lvl.id }))}
          className="flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all"
          style={{
            background: formData.skillLevel === lvl.id ? "rgba(194,78,107,0.10)" : "rgba(255,252,245,0.9)",
            border: `1.5px solid ${formData.skillLevel === lvl.id ? palette.rose : "rgba(140,100,55,0.18)"}`,
          }}>
          <span style={{ fontSize: 22 }}>{lvl.emoji}</span>
          <span className="text-[11px] font-bold" style={{ color: formData.skillLevel === lvl.id ? palette.rose : palette.cocoa }}>{lvl.id}</span>
          <span className="text-[9.5px] text-center" style={{ color: palette.clay }}>{lvl.desc}</span>
        </button>
      ))}
    </div>
  </div>
);

export const YarnPicker = ({ formData, setFormData }: PickerProps) => (
  <div>
    <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>Yarn Type <span className="font-normal text-[11px]" style={{ color: palette.clay }}>(optional)</span></label>
    <div className="flex flex-wrap gap-2">
      {YARN_TYPES.map((yt) => (
        <button key={yt}
          onClick={() => setFormData(p => ({ ...p, yarnType: yt === "Not specified" ? "" : yt }))}
          className="px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: (formData.yarnType === yt || (yt === "Not specified" && !formData.yarnType)) ? "rgba(212,146,26,0.14)" : "rgba(255,252,245,0.9)",
            border: `1.5px solid ${(formData.yarnType === yt || (yt === "Not specified" && !formData.yarnType)) ? palette.amber : "rgba(140,100,55,0.18)"}`,
            color: (formData.yarnType === yt || (yt === "Not specified" && !formData.yarnType)) ? palette.amber : palette.cocoa,
          }}>
          {yt}
        </button>
      ))}
    </div>
  </div>
);

export const SizePicker = ({ formData, setFormData }: PickerProps) => (
  <div>
    <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: palette.cocoa }}>Approximate Size <span className="font-normal text-[11px]" style={{ color: palette.clay }}>(optional)</span></label>
    <div className="flex flex-wrap gap-2">
      {SIZE_OPTIONS.map((sz) => (
        <button key={sz}
          onClick={() => setFormData(p => ({ ...p, size: sz }))}
          className="px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: formData.size === sz ? "rgba(132,147,79,0.14)" : "rgba(255,252,245,0.9)",
            border: `1.5px solid ${formData.size === sz ? palette.sage : "rgba(140,100,55,0.18)"}`,
            color: formData.size === sz ? palette.sage : palette.cocoa,
          }}>
          {sz}
        </button>
      ))}
    </div>
  </div>
);
