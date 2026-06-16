import { palette } from "@/lib/theme";

interface WizardChromeProps {
  steps: string[];
  currentStep: number;
  tips: string[];
  modeAccent: string;
  modeAccentRgb: string;
  charImg: string;
}

/** Shared wizard chrome: the numbered step progress bar + the character tip line. */
export default function WizardChrome({ steps, currentStep, tips, modeAccent, modeAccentRgb, charImg }: WizardChromeProps) {
  return (
    <>
      {/* ── Progress bar ── */}
      <div className="flex items-center gap-1.5 mb-4">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                style={{
                  background: i < currentStep ? palette.sage : i === currentStep ? modeAccent : "rgba(140,100,55,0.12)",
                  color: i <= currentStep ? "white" : palette.clay,
                  boxShadow: i === currentStep ? `0 3px 10px rgba(${modeAccentRgb},0.35)` : "none",
                }}>
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span className="text-[9px] font-semibold whitespace-nowrap"
                style={{ color: i === currentStep ? modeAccent : i < currentStep ? palette.sage : "#B0908A" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] rounded-full mt-[-12px] sm:mt-[-20px]"
                style={{ background: i < currentStep ? palette.sage : "rgba(140,100,55,0.15)" }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Character tip ── */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl mb-5"
        style={{ background: "rgba(124,95,168,0.07)", border: "1px dashed rgba(124,95,168,0.22)" }}>
        <img src={charImg} alt="Helper"
          style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <p className="text-[12px] italic leading-snug" style={{ color: "#7C5FA8" }}>
          "{tips[Math.min(currentStep, tips.length - 1)]}"
        </p>
      </div>
    </>
  );
}
