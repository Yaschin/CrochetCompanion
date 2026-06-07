import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AppShell from "./components/AppShell";
import ErrorBoundary from "./components/ErrorBoundary";
import HomeWorkbench, { HomeRightPanel } from "./components/HomeWorkbench";
import PatternInputRefactored from "./components/PatternInputRefactored";
import PatternViewer from "./components/PatternViewer";
import PatternLibrary from "./components/PatternLibrary";
import MaterialsInventory from "./components/MaterialsInventory";
import SplashScreen from "./pages/SplashScreen";
import GenerationLoadingScreen from "./pages/GenerationLoadingScreen";
import SearchScreen from "./pages/SearchScreen";
import ProgressTrackingScreen from "./pages/ProgressTrackingScreen";
import PhotoUploadScreen from "./pages/PhotoUploadScreen";
import StitchCounterScreen from "./pages/StitchCounterScreen";
import YarnRecsScreen from "./pages/YarnRecsScreen";
import { Pattern, ViewType } from "./lib/types";
import { AnimatePresence, motion } from "framer-motion";

function App() {
  const [activeView, setActiveView] = useState<ViewType>("home");
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);

  const navigateToView = (view: ViewType) => setActiveView(view);

  const handlePatternCreated = (pattern: Pattern) => {
    setCurrentPattern(pattern);
    setActiveView("loading");
  };

  const handlePatternLoaded = (pattern: Pattern) => {
    setCurrentPattern(pattern);
    setActiveView("viewer");
  };

  const handleLoadingComplete = (view: ViewType) => {
    setActiveView(view);
  };

  // Splash screen — full-screen, no shell
  if (activeView === "splash") {
    return (
      <QueryClientProvider client={queryClient}>
        <div style={{ width: "100vw", height: "100vh" }}>
          <SplashScreen onNavigate={navigateToView} />
        </div>
        <Toaster />
      </QueryClientProvider>
    );
  }

  // Loading screen — full-screen, no shell
  if (activeView === "loading") {
    return (
      <QueryClientProvider client={queryClient}>
        <div style={{ width: "100vw", height: "100vh" }}>
          <GenerationLoadingScreen onComplete={handleLoadingComplete} />
        </div>
        <Toaster />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell
        activeView={activeView}
        onNavigate={navigateToView}
        rightPanel={
          activeView === "home" ? (
            <HomeRightPanel onNavigate={navigateToView} />
          ) : undefined
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col h-full"
          >
            <ErrorBoundary key={activeView} componentName={activeView}>

              {activeView === "home" && (
                <HomeWorkbench
                  onNavigate={navigateToView}
                  currentPattern={currentPattern}
                  onPatternSelected={handlePatternLoaded}
                />
              )}

              {activeView === "input" && (
                <div className="px-6 py-6">
                  <PatternInputRefactored onPatternCreated={handlePatternCreated} />
                </div>
              )}

              {activeView === "viewer" && currentPattern && (
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => navigateToView("library")}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:opacity-75"
                      style={{ color: "#C24E6B", background: "rgba(194,78,107,0.08)", border: "1px solid rgba(194,78,107,0.2)" }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to My Patterns
                    </button>
                    <button
                      onClick={() => navigateToView("progress")}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:opacity-75"
                      style={{ color: "#84934F", background: "rgba(132,147,79,0.08)", border: "1px solid rgba(132,147,79,0.2)" }}
                    >
                      📊 Track Progress
                    </button>
                    <button
                      onClick={() => navigateToView("stitch-counter")}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:opacity-75"
                      style={{ color: "#7C5FA8", background: "rgba(124,95,168,0.08)", border: "1px solid rgba(124,95,168,0.2)" }}
                    >
                      🧮 Counter
                    </button>
                    <button
                      onClick={() => navigateToView("yarn-recs")}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:opacity-75"
                      style={{ color: "#D4921A", background: "rgba(212,146,26,0.08)", border: "1px solid rgba(212,146,26,0.2)" }}
                    >
                      🧶 Yarn Picks
                    </button>
                  </div>
                  <PatternViewer
                    pattern={currentPattern}
                    onPatternUpdated={setCurrentPattern}
                  />
                </div>
              )}

              {activeView === "viewer" && !currentPattern && (
                <div className="px-6 py-6 flex flex-col items-center justify-center h-full gap-4">
                  <p className="font-heading font-semibold text-[16px]" style={{ color: "#9A7868" }}>
                    No pattern selected
                  </p>
                  <button onClick={() => navigateToView("library")}
                    className="btn-craft btn-rose px-5 py-2.5">
                    Browse Library →
                  </button>
                </div>
              )}

              {activeView === "library" && (
                <div className="px-6 py-6">
                  <PatternLibrary
                    onPatternSelected={handlePatternLoaded}
                    onCreateNew={() => navigateToView("input")}
                  />
                </div>
              )}

              {activeView === "stash" && (
                <div className="px-6 py-6">
                  <MaterialsInventory />
                </div>
              )}

              {activeView === "search" && (
                <SearchScreen
                  onNavigate={navigateToView}
                  onPatternSelected={handlePatternLoaded}
                />
              )}

              {activeView === "progress" && (
                <ProgressTrackingScreen
                  pattern={currentPattern}
                  onNavigate={navigateToView}
                />
              )}

              {activeView === "photo-upload" && (
                <PhotoUploadScreen onNavigate={navigateToView} />
              )}

              {activeView === "stitch-counter" && (
                <StitchCounterScreen onNavigate={navigateToView} />
              )}

              {activeView === "yarn-recs" && (
                <YarnRecsScreen onNavigate={navigateToView} />
              )}

            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </AppShell>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
