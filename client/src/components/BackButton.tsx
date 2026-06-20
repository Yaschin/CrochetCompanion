import { ChevronLeft } from "lucide-react";

/**
 * The shared circular "go back" header button. Centralises the markup that was
 * duplicated across every screen header and the `aria-label` that icon-only
 * buttons need; the per-screen tint is passed in.
 */
export function BackButton({
  onClick,
  bg,
  color,
  label = "Go back",
}: {
  onClick: () => void;
  bg: string;
  color: string;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
      style={{ background: bg, color }}
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  );
}
