import { palette } from "@/lib/theme";
import { useState, useEffect, useCallback } from "react";
import { getActiveProfile } from "../lib/profile";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react";
import { ViewType } from "../lib/types";

// Per-family-member: each person gets the tour on their first session, and
// "App tour" in Settings restarts it for whoever is active right now.
const LEGACY_KEY = "crochet-time-tutorial-v1";
const storageKey = () => `crochet-time-tutorial-v1:${getActiveProfile().id}`;

function tutorialSeen(): string | null {
  try {
    // Migrate: a pre-profiles "seen" flag belonged to Larissa (she owned the device).
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy && getActiveProfile().id === "larissa" && !localStorage.getItem(storageKey())) {
      localStorage.setItem(storageKey(), legacy);
      localStorage.removeItem(LEGACY_KEY);
    }
    return localStorage.getItem(storageKey());
  } catch {
    return "completed"; // storage unavailable — never block the app with a tour
  }
}

interface Step {
  id: string;
  title: string;
  text: string;
  navigateTo?: ViewType;
  emoji: string;
}

// Short enough to read at a glance on a 375px phone
const STEPS: Step[] = [
  {
    id: "home",
    emoji: "🏠",
    title: "Your crafting hub",
    text: "Your active project lives here so you can jump straight back in. Quick links to create, your stats, and favourites are all on this screen.",
    navigateTo: "home",
  },
  {
    id: "create",
    emoji: "✨",
    title: "Create a pattern",
    text: "Describe your idea and Yala (AI) writes the full pattern for you. Or tap 'Add my own' at the top to bring in a pattern from a book, website, or your own notes.",
    navigateTo: "input",
  },
  {
    id: "library",
    emoji: "📚",
    title: "Your library",
    text: "Every pattern you create or import lives here. Tap any card to open it — tick off rows, count stitches, add photos, and write notes as you go.",
    navigateTo: "library",
  },
  {
    id: "projects",
    emoji: "🗂️",
    title: "Active projects",
    text: "See everything you're crocheting at a glance — progress bars, time spent, and a quick button to jump straight back in.",
    navigateTo: "projects",
  },
  {
    id: "community",
    emoji: "👥",
    title: "Community library",
    text: "Browse patterns from other crafters for inspiration. Save any pattern straight to your own library and start working through it right away.",
    navigateTo: "community",
  },
  {
    id: "yarn",
    emoji: "🎨",
    title: "Yarn recommendations",
    text: "Not sure which yarn to use? Describe your project and Ashi will suggest the perfect weight, fibre, and amount.",
    navigateTo: "yarn-recs",
  },
  {
    id: "done",
    emoji: "🎉",
    title: "You're all set!",
    text: "That's the whole app! Tap the ❓ button at any time to take this tour again, or find it in Settings. Happy crocheting! 🧶",
    navigateTo: "home",
  },
];

export function restartTutorial() {
  try { localStorage.removeItem(storageKey()); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("crochet-start-tutorial"));
}

interface TutorialSystemProps {
  onNavigate: (view: ViewType) => void;
  activeView: ViewType;
}

export default function TutorialSystem({ onNavigate, activeView }: TutorialSystemProps) {
  const [phase, setPhase] = useState<"idle" | "welcome" | "touring">("idle");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = tutorialSeen();
    if (!seen && activeView !== "splash" && activeView !== "loading") {
      const t = setTimeout(() => setPhase("welcome"), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const handler = () => { setStep(0); setPhase("welcome"); };
    window.addEventListener("crochet-start-tutorial", handler);
    return () => window.removeEventListener("crochet-start-tutorial", handler);
  }, []);

  useEffect(() => {
    if (phase !== "touring") return;
    const dest = STEPS[step]?.navigateTo;
    if (dest) onNavigate(dest);
  }, [step, phase]);

  const startTour = useCallback(() => { setStep(0); setPhase("touring"); }, []);
  const dismiss = useCallback(() => {
    try { localStorage.setItem(storageKey(), "declined"); } catch { /* ignore */ }
    setPhase("idle");
  }, []);
  const finish = useCallback(() => {
    try { localStorage.setItem(storageKey(), "completed"); } catch { /* ignore */ }
    setPhase("idle");
  }, []);
  const handleNext = useCallback(() => {
    if (step >= STEPS.length - 1) finish();
    else setStep((s) => s + 1);
  }, [step, finish]);
  const handleBack = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const openHelp = useCallback(() => { setStep(0); setPhase("welcome"); }, []);

  if (activeView === "splash" || activeView === "loading") return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* ── Welcome modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "welcome" && (
          <motion.div
            key="welcome-backdrop"
            className="fixed inset-0 z-[300] flex items-center justify-center p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(30,10,5,0.52)", backdropFilter: "blur(3px)" }}
              onClick={dismiss}
            />

            <motion.div
              className="relative w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #FFF8F0, #FFF0DC)",
                border: "1.5px solid rgba(212,146,26,0.3)",
              }}
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
            >
              {/* Warm teal header band */}
              <div
                className="flex flex-col items-center pt-6 pb-4 px-6 gap-3"
                style={{ background: "linear-gradient(160deg, #E8F6FA, #D0EEF5)" }}
              >
                <button
                  onClick={dismiss}
                  className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.7)", color: "#5C3A28" }}
                  aria-label="Skip tutorial"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <motion.img
                  src="/characters/char-ashi-transparent.png"
                  alt="Ashi"
                  className="w-20 h-20 sm:w-24 sm:h-24"
                  style={{
                    objectFit: "contain",
                    filter: "drop-shadow(0 6px 16px rgba(50,20,5,0.25))",
                  }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="font-heading font-bold text-[20px] sm:text-[22px]" style={{ color: "#1E4E5A" }}>
                  Hi! I'm Ashi 👋
                </p>
              </div>

              {/* Body */}
              <div className="px-6 pt-4 pb-5">
                <p className="text-[13px] leading-snug text-center mb-5" style={{ color: "#5C3A28" }}>
                  Would you like a quick tour of Crochet Time? I'll walk you through each screen — it only takes a minute!
                </p>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={startTour}
                    className="w-full py-3 rounded-2xl font-heading font-bold text-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #3D8FA3, #2A6E7E)",
                      color: "white",
                      boxShadow: "0 5px 18px rgba(61,143,163,0.38)",
                    }}
                  >
                    Yes, show me around! 🎉
                  </button>
                  <button
                    onClick={dismiss}
                    className="w-full py-2 text-[12.5px] font-semibold transition-all hover:opacity-75"
                    style={{ color: palette.clay }}
                  >
                    No thanks, I'll explore myself
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tour card ─────────────────────────────────────────────────── */}
      {/* bottom-[76px] on mobile clears the ~60px nav + gap;
          md:bottom-4 sits near the bottom edge on desktop */}
      <AnimatePresence>
        {phase === "touring" && (
          <motion.div
            key="tour-card"
            className="fixed left-3 right-3 z-[300] pointer-events-none
                       bottom-[76px] md:bottom-4 md:left-4 md:right-4"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
          >
            <div
              className="pointer-events-auto rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-2xl max-w-lg mx-auto"
              style={{
                background: "linear-gradient(145deg, #FFF8F0, #FFEFD4)",
                border: "1.5px solid rgba(61,143,163,0.35)",
                boxShadow: "0 8px 36px rgba(30,10,5,0.22)",
              }}
            >
              {/* Row 1: Ashi + content + close */}
              <div className="flex items-start gap-2.5">
                <motion.img
                  src="/characters/char-ashi-transparent.png"
                  alt="Ashi"
                  className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0"
                  style={{
                    objectFit: "contain",
                    filter: "drop-shadow(0 3px 8px rgba(50,20,5,0.2))",
                  }}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />

                <div className="flex-1 min-w-0">
                  {/* Title line — badge + title separate rows on tiny screens */}
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mb-1">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "rgba(61,143,163,0.13)", color: "#2A6E7E" }}
                    >
                      {step + 1} / {STEPS.length}
                    </span>
                    <p className="font-heading font-bold text-[12.5px] md:text-[13.5px]" style={{ color: palette.ink }}>
                      {currentStep.emoji} {currentStep.title}
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={step}
                      className="text-[11px] md:text-[11.5px] leading-snug"
                      style={{ color: "#5C3A28" }}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16 }}
                    >
                      {currentStep.text}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <button
                  onClick={finish}
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-black/10"
                  style={{ color: palette.clay }}
                  title="End tour"
                  aria-label="End tour"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Row 2: dots + nav */}
              <div className="flex items-center justify-between mt-2.5">
                {/* Tappable progress dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <motion.div
                      key={i}
                      className="rounded-full cursor-pointer"
                      onClick={() => setStep(i)}
                      animate={{
                        width: i === step ? 16 : 6,
                        background: i === step
                          ? "#3D8FA3"
                          : i < step ? palette.sage : "rgba(140,100,55,0.22)",
                      }}
                      style={{ height: 6 }}
                      transition={{ duration: 0.25 }}
                      title={STEPS[i].title}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  {step > 0 && (
                    <button
                      onClick={handleBack}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                      style={{ background: "rgba(140,100,55,0.1)", color: "#5C3A28" }}
                      aria-label="Previous step"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-3.5 py-1.5 rounded-xl text-[11.5px] md:text-[12px] font-semibold flex items-center gap-1 transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{
                      background: isLast
                        ? "linear-gradient(135deg, #84934F, #5A6E30)"
                        : "linear-gradient(135deg, #3D8FA3, #2A6E7E)",
                      color: "white",
                      boxShadow: `0 3px 10px rgba(${isLast ? "132,147,79" : "61,143,163"},0.38)`,
                    }}
                  >
                    {isLast ? "Let's go! 🧶" : <>Next <ChevronRight className="h-3.5 w-3.5" /></>}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Persistent ❓ help button ──────────────────────────────────── */}
      {/* bottom-[76px] keeps it above the mobile nav; md:bottom-5 on desktop */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.button
            key="help-btn"
            onClick={openHelp}
            className="fixed right-4 bottom-[76px] md:bottom-5 z-40
                       w-10 h-10 rounded-full flex items-center justify-center shadow-lg
                       transition-all hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #3D8FA3, #2A6E7E)",
              color: "white",
              boxShadow: "0 4px 16px rgba(61,143,163,0.45)",
            }}
            title="Take the tour"
            aria-label="Take the app tour"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 280, damping: 22 }}
          >
            <HelpCircle className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
