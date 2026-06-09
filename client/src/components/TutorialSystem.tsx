import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react";
import { ViewType } from "../lib/types";

const STORAGE_KEY = "crochet-time-tutorial-v1";

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
    text: "This is Home — your active project sits here so you can pick up right where you left off. You'll also spot quick links to create, your stats, and your favourite patterns.",
    navigateTo: "home",
  },
  {
    id: "create",
    emoji: "✨",
    title: "Create a pattern",
    text: "This is the Create screen. Describe your idea and Yala (AI) writes you a full pattern — stitch counts, row instructions, everything. Or tap 'Add my own' at the top to bring in a pattern from a book, website, or your own notes.",
    navigateTo: "input",
  },
  {
    id: "library",
    emoji: "📚",
    title: "Your library",
    text: "Every pattern you create or import lives here. Tap any card to open it — inside you can tick off rows as you work, snap progress photos, count stitches, and write notes.",
    navigateTo: "library",
  },
  {
    id: "projects",
    emoji: "🗂️",
    title: "Active projects",
    text: "This screen tracks everything you're actively crocheting. You'll see a progress bar for each make, time spent, and a quick button to jump straight back in — perfect when you've got multiple things on the go.",
    navigateTo: "projects",
  },
  {
    id: "community",
    emoji: "👥",
    title: "Community library",
    text: "Browse patterns shared by other crafters. Save anything you like straight to your own library and start working through it straight away. Great for inspiration when you're not sure what to make next!",
    navigateTo: "community",
  },
  {
    id: "yarn",
    emoji: "🎨",
    title: "Yarn recommendations",
    text: "Not sure which yarn to use for a project? Describe what you're making and Ashi will suggest the ideal yarn weight, fibre, and amount — based on the pattern, your skill level, and what's already in your stash.",
    navigateTo: "yarn-recs",
  },
  {
    id: "done",
    emoji: "🎉",
    title: "You're all set!",
    text: "That's the whole app! Head Home to get started. Tap the ❓ button at any time to take this tour again, or find it in Settings.",
    navigateTo: "home",
  },
];

export function restartTutorial() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("crochet-start-tutorial"));
}

interface TutorialSystemProps {
  onNavigate: (view: ViewType) => void;
  activeView: ViewType;
}

export default function TutorialSystem({ onNavigate, activeView }: TutorialSystemProps) {
  const [phase, setPhase] = useState<"idle" | "welcome" | "touring">("idle");
  const [step, setStep] = useState(0);

  // Show welcome prompt on first visit
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen && activeView !== "splash" && activeView !== "loading") {
      const t = setTimeout(() => setPhase("welcome"), 1200);
      return () => clearTimeout(t);
    }
  }, []); // run once on mount

  // Listen for restartTutorial() calls from Settings
  useEffect(() => {
    const handler = () => { setStep(0); setPhase("welcome"); };
    window.addEventListener("crochet-start-tutorial", handler);
    return () => window.removeEventListener("crochet-start-tutorial", handler);
  }, []);

  // Navigate when step changes during tour
  useEffect(() => {
    if (phase !== "touring") return;
    const dest = STEPS[step]?.navigateTo;
    if (dest) onNavigate(dest);
  }, [step, phase]);

  const startTour = useCallback(() => { setStep(0); setPhase("touring"); }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setPhase("idle");
  }, []);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "completed");
    setPhase("idle");
  }, []);

  const handleNext = useCallback(() => {
    if (step >= STEPS.length - 1) finish();
    else setStep((s) => s + 1);
  }, [step, finish]);

  const handleBack = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const openHelp = useCallback(() => { setStep(0); setPhase("welcome"); }, []);

  const isFullscreen = activeView === "splash" || activeView === "loading";
  if (isFullscreen) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* ── Welcome modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "welcome" && (
          <motion.div
            key="welcome-backdrop"
            className="fixed inset-0 z-[300] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(30,10,5,0.5)", backdropFilter: "blur(3px)" }}
              onClick={dismiss}
            />

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
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-black/10"
                style={{ color: "#9A7868" }}
                aria-label="Skip tutorial"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center gap-3 mb-5">
                <motion.img
                  src="/characters/char-ashi-transparent.png"
                  alt="Ashi"
                  style={{
                    width: 96, height: 96, objectFit: "contain",
                    filter: "drop-shadow(0 6px 18px rgba(50,20,5,0.28))",
                  }}
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="text-center">
                  <p className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>
                    Hi! I'm Ashi 👋
                  </p>
                  <p className="text-[13.5px] mt-2 leading-snug" style={{ color: "#5C3A28" }}>
                    Would you like a quick tour of Crochet Time? I'll walk you through each screen — it only takes a minute!
                  </p>
                </div>
              </div>

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
                  No thanks, I'll explore myself
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tour card — above mobile nav on small screens ──────────── */}
      <AnimatePresence>
        {phase === "touring" && (
          <motion.div
            key="tour-card"
            className="fixed left-3 right-3 bottom-20 md:bottom-4 md:left-4 md:right-4 z-[300] pointer-events-none"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
          >

            <div
              className="pointer-events-auto rounded-3xl p-4 shadow-2xl max-w-lg mx-auto"
              style={{
                background: "linear-gradient(145deg, #FFF8F0, #FFEFD4)",
                border: "1.5px solid rgba(61,143,163,0.35)",
                boxShadow: "0 8px 36px rgba(30,10,5,0.25)",
              }}
            >
              {/* Ashi + step text + close */}
              <div className="flex items-start gap-3">
                <motion.img
                  src="/characters/char-ashi-transparent.png"
                  alt="Ashi"
                  style={{
                    width: 50, height: 50, objectFit: "contain", flexShrink: 0,
                    filter: "drop-shadow(0 4px 10px rgba(50,20,5,0.22))",
                  }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />

                <div className="flex-1 min-w-0">
                  {/* Step counter + title */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(61,143,163,0.12)", color: "#2A6E7E" }}>
                      {step + 1} / {STEPS.length}
                    </span>
                    <p className="font-heading font-bold text-[13px]" style={{ color: "#3D2318" }}>
                      {currentStep.emoji} {currentStep.title}
                    </p>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={step}
                      className="text-[11.5px] leading-snug"
                      style={{ color: "#5C3A28" }}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
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
                  aria-label="End tour"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Progress dots + nav buttons */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <motion.div
                      key={i}
                      className="rounded-full cursor-pointer"
                      onClick={() => setStep(i)}
                      animate={{
                        width: i === step ? 20 : 6,
                        background: i === step
                          ? "#3D8FA3"
                          : i < step
                          ? "#84934F"
                          : "rgba(140,100,55,0.2)",
                      }}
                      style={{ height: 6 }}
                      transition={{ duration: 0.28 }}
                      title={STEPS[i].title}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
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
                    className="px-4 py-1.5 rounded-xl text-[12px] font-semibold flex items-center gap-1 transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{
                      background: isLast
                        ? "linear-gradient(135deg, #84934F, #5A6E30)"
                        : "linear-gradient(135deg, #3D8FA3, #2A6E7E)",
                      color: "white",
                      boxShadow: `0 3px 12px rgba(${isLast ? "132,147,79" : "61,143,163"},0.4)`,
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

      {/* ── Help button — above mobile nav on small screens ────────── */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.button
            key="help-btn"
            onClick={openHelp}
            className="fixed right-4 bottom-20 md:bottom-5 z-[200] w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
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
            transition={{ delay: 0.6, type: "spring", stiffness: 280, damping: 22 }}
          >
            <HelpCircle className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
