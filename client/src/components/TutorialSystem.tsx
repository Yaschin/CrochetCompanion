import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react";
import { ViewType } from "../lib/types";

const STORAGE_KEY = "crochet-time-tutorial-v1";

// ─── Tour steps ────────────────────────────────────────────────────────────────
interface Step {
  id: string;
  title: string;
  text: string;
  navigateTo?: ViewType;
  emoji: string;
}

const STEPS: Step[] = [
  {
    id: "home",
    emoji: "🏠",
    title: "Your crafting hub",
    text: "This is Home — your active project lives here so you can jump straight back in. You'll also see your favourites and recent activity at a glance.",
    navigateTo: "home",
  },
  {
    id: "create",
    emoji: "✨",
    title: "Create a pattern",
    text: "Tap Create to start something new. Ask Yala (AI) to write you a full pattern from a description — or tap 'Add my own' to bring in a pattern from a book, website, or your own notes.",
    navigateTo: "input",
  },
  {
    id: "library",
    emoji: "📚",
    title: "Your library",
    text: "Every pattern you create or import lives here. Tap any card to open it — inside you can tick off rows as you go, use the stitch counter, snap photos, and write notes.",
    navigateTo: "library",
  },
  {
    id: "projects",
    emoji: "🗂️",
    title: "Active projects",
    text: "Projects tracks everything you're actively crocheting at a glance. Great when you've got multiple makes on the go and need to quickly switch between them.",
    navigateTo: "projects",
  },
  {
    id: "community",
    emoji: "👥",
    title: "Community library",
    text: "Browse patterns shared by other crafters for inspiration. Save any pattern to your own library and start working through it straight away.",
    navigateTo: "community",
  },
  {
    id: "yarn",
    emoji: "🎨",
    title: "Yarn recommendations",
    text: "Not sure what yarn to buy? Ashi looks at your pattern, your stash, and your skill level to suggest exactly the right yarn for the job.",
    navigateTo: "yarn-recs",
  },
  {
    id: "done",
    emoji: "🎉",
    title: "You're all set!",
    text: "That's the whole app! Tap the ❓ button at any time to take this tour again. Now go make something beautiful — happy crocheting! 🧶",
  },
];

// ─── Exported helper to re-trigger from anywhere ──────────────────────────────
export function restartTutorial() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("crochet-start-tutorial"));
}

// ─── Main component ───────────────────────────────────────────────────────────
interface TutorialSystemProps {
  onNavigate: (view: ViewType) => void;
  activeView: ViewType;
}

export default function TutorialSystem({ onNavigate, activeView }: TutorialSystemProps) {
  const [phase, setPhase] = useState<"idle" | "welcome" | "touring">("idle");
  const [step, setStep] = useState(0);

  // Initialise — check if first visit
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    // Don't interrupt splash/loading screens
    if (!seen && activeView !== "splash" && activeView !== "loading") {
      // Small delay so the home screen renders first
      const t = setTimeout(() => setPhase("welcome"), 1200);
      return () => clearTimeout(t);
    }
  }, []); // intentionally run once on mount

  // Listen for external restart requests (from Settings page)
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setPhase("welcome");
    };
    window.addEventListener("crochet-start-tutorial", handler);
    return () => window.removeEventListener("crochet-start-tutorial", handler);
  }, []);

  // Navigate when step changes during tour
  useEffect(() => {
    if (phase !== "touring") return;
    const dest = STEPS[step]?.navigateTo;
    if (dest) onNavigate(dest);
  }, [step, phase]);

  const startTour = useCallback(() => {
    setStep(0);
    setPhase("touring");
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setPhase("idle");
  }, []);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "completed");
    setPhase("idle");
  }, []);

  const handleNext = useCallback(() => {
    if (step >= STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, finish]);

  const handleBack = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  const openHelp = useCallback(() => {
    setStep(0);
    setPhase("welcome");
  }, []);

  // Don't render on full-screen views
  const isFullscreen = activeView === "splash" || activeView === "loading";
  if (isFullscreen) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* ── Welcome modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "welcome" && (
          <motion.div
            key="welcome-backdrop"
            className="fixed inset-0 z-[300] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{ background: "rgba(30,10,5,0.45)", backdropFilter: "blur(2px)" }}
              onClick={dismiss}
            />

            {/* Modal card */}
            <motion.div
              className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl"
              style={{
                background: "linear-gradient(145deg, #FFF8F0, #FFF0DC)",
                border: "1.5px solid rgba(212,146,26,0.3)",
              }}
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
            >
              {/* Close */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-black/10"
                style={{ color: "#9A7868" }}
              >
                <X className="h-4 w-4" />
              </button>

              {/* Ashi + greeting */}
              <div className="flex flex-col items-center gap-3 mb-5">
                <motion.img
                  src="/characters/char-ashi-transparent.png"
                  alt="Ashi"
                  style={{ width: 90, height: 90, objectFit: "contain",
                    filter: "drop-shadow(0 6px 16px rgba(50,20,5,0.25))" }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="text-center">
                  <p className="font-heading font-bold text-[20px]" style={{ color: "#3D2318" }}>
                    Hi! I'm Ashi 👋
                  </p>
                  <p className="text-[13px] mt-1.5 leading-snug" style={{ color: "#5C3A28" }}>
                    I can show you around Crochet Time — it only takes a minute and covers everything you need to get started.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={startTour}
                  className="w-full py-3.5 rounded-2xl font-heading font-bold text-[15px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #3D8FA3, #2A6E7E)",
                    color: "white",
                    boxShadow: "0 6px 20px rgba(61,143,163,0.4)",
                  }}
                >
                  Yes, show me around! 🎉
                </button>
                <button
                  onClick={dismiss}
                  className="w-full py-2.5 rounded-2xl text-[13px] font-semibold transition-all hover:opacity-75"
                  style={{ color: "#9A7868" }}
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tour card (bottom sheet) ───────────────────────────────────── */}
      <AnimatePresence>
        {phase === "touring" && (
          <motion.div
            key="tour-card"
            className="fixed bottom-4 left-4 right-4 z-[300] pointer-events-none"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
          >
            <div
              className="pointer-events-auto rounded-3xl p-4 shadow-2xl max-w-lg mx-auto"
              style={{
                background: "linear-gradient(145deg, #FFF8F0, #FFEFD4)",
                border: "1.5px solid rgba(61,143,163,0.3)",
                boxShadow: "0 8px 32px rgba(30,10,5,0.22)",
              }}
            >
              {/* Top: Ashi + text + close */}
              <div className="flex items-start gap-3">
                <motion.img
                  src="/characters/char-ashi-transparent.png"
                  alt="Ashi"
                  style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0,
                    filter: "drop-shadow(0 4px 10px rgba(50,20,5,0.22))" }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />

                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-[13.5px] mb-0.5" style={{ color: "#3D2318" }}>
                    {currentStep.emoji} {currentStep.title}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={step}
                      className="text-[12px] leading-snug"
                      style={{ color: "#5C3A28" }}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {currentStep.text}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <button
                  onClick={finish}
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 mt-0.5"
                  style={{ color: "#9A7868" }}
                  title="End tour"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Bottom: dots + buttons */}
              <div className="flex items-center justify-between mt-3.5">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <motion.div
                      key={i}
                      className="rounded-full"
                      animate={{
                        width: i === step ? 18 : 6,
                        background: i === step
                          ? "#3D8FA3"
                          : i < step
                          ? "#84934F"
                          : "rgba(140,100,55,0.2)",
                      }}
                      style={{ height: 6 }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>

                {/* Nav buttons */}
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      onClick={handleBack}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                      style={{ background: "rgba(140,100,55,0.1)", color: "#5C3A28" }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-4 py-1.5 rounded-xl text-[12px] font-semibold flex items-center gap-1 transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{
                      background: isLast
                        ? "linear-gradient(135deg, #84934F, #5A6E30)"
                        : "linear-gradient(135deg, #3D8FA3, #2A6E7E)",
                      color: "white",
                      boxShadow: `0 3px 12px rgba(${isLast ? "132,147,79" : "61,143,163"},0.4)`,
                    }}
                  >
                    {isLast ? (
                      "Done! 🎉"
                    ) : (
                      <>Next <ChevronRight className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Persistent help button (when not touring) ─────────────────── */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.button
            key="help-btn"
            onClick={openHelp}
            className="fixed bottom-5 right-5 z-[200] w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #3D8FA3, #2A6E7E)",
              color: "white",
              boxShadow: "0 4px 16px rgba(61,143,163,0.45)",
            }}
            title="Take the tour"
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
