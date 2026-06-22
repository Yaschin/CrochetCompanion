import { ReactNode } from "react";
import { palette } from "@/lib/theme";

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Render the label (text and/or icon) for an option. */
  renderLabel: (option: T) => ReactNode;
  /** Stretch segments to fill the row (equal-width tabs) vs. hug their content. */
  fullWidth?: boolean;
  /** Extra classes on the container (e.g. spacing). */
  className?: string;
}

/**
 * The cream pill-toggle used for the pattern viewer's tabs and the library's
 * Patterns/Files switch. `fullWidth` gives equal-width tabs; omit it for inline
 * pills that hug their labels.
 */
export default function SegmentedControl<T extends string>({
  options, value, onChange, renderLabel, fullWidth = false, className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`${fullWidth ? "flex" : "inline-flex"} gap-1 p-1 rounded-xl ${className}`}
      style={{ background: "rgba(140,100,55,0.08)" }}
    >
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`${fullWidth ? "flex-1 justify-center py-2" : "px-4 py-1.5"} inline-flex items-center gap-1.5 rounded-lg text-[12.5px] font-semibold transition-all`}
            style={{
              background: active ? "white" : "transparent",
              color: active ? palette.rose : palette.clay,
              boxShadow: active ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {renderLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
