import { palette } from "@/lib/theme";
import { useState } from "react";
import { Flame } from "lucide-react";
import { getStreak } from "../lib/activityLog";

/**
 * Shows the real, device-local crochet streak (current run, longest, total days).
 * Personal and warm — never shame-y; an empty state simply invites a first day.
 */
export default function StreakCard() {
  const [streak] = useState(() => getStreak());

  return (
    <div className="craft-card p-4 flex items-center gap-4">
      <div
        className="flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
        style={{ background: streak.current > 0 ? "rgba(212,146,26,0.14)" : "rgba(180,160,140,0.10)" }}
      >
        <Flame className="h-5 w-5" style={{ color: streak.current > 0 ? "#D4921A" : "#B0908A" }} />
        <span className="font-heading font-bold text-[16px] leading-none mt-0.5" style={{ color: streak.current > 0 ? "#A8761A" : "#B0908A" }}>
          {streak.current}
        </span>
      </div>
      <div className="flex-1">
        <p className="font-heading font-semibold text-[14px]" style={{ color: palette.ink }}>
          {streak.current > 0
            ? `${streak.current}-day streak${streak.activeToday ? " — today counts! ♡" : " — crochet today to keep it!"}`
            : "Start a streak today ♡"}
        </p>
        <p className="text-[11.5px] mt-0.5" style={{ color: palette.clay }}>
          {streak.totalDays} day{streak.totalDays === 1 ? "" : "s"} crocheted · longest {streak.longest}
        </p>
      </div>
    </div>
  );
}
