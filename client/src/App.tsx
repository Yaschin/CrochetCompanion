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
import { Pattern, ViewType } from "./lib/types";
import { AnimatePresence, motion } from "framer-motion";

function App() {
  const [activeView, setActiveView] = useState<ViewType>("home");
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);

  const navigateToView = (view: ViewType) => setActiveView(view);

  const handlePatternCreated = (pattern: Pattern) => {
    setCurrentPattern(pattern);
    setActiveView("viewer");
  };

  const handlePatternLoaded = (pattern: Pattern) => {
    setCurrentPattern(pattern);
    setActiveView("viewer");
  };

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
                  <button
                    onClick={() => navigateToView("library")}
                    className="mb-4 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:opacity-75"
                    style={{ color: "#C24E6B", background: "rgba(194,78,107,0.08)", border: "1px solid rgba(194,78,107,0.2)" }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to My Patterns
                  </button>
                  <PatternViewer
                    pattern={currentPattern}
                    onPatternUpdated={setCurrentPattern}
                  />
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
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </AppShell>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
