import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import HomeWorkbench from "./components/HomeWorkbench";
import PatternInputRefactored from "./components/PatternInputRefactored";
import PatternViewer from "./components/PatternViewer";
import PatternLibrary from "./components/PatternLibrary";
import MaterialsInventory from "./components/MaterialsInventory";
import { Pattern, ViewType } from "./lib/types";
import { AnimatePresence, motion } from "framer-motion";

function App() {
  const [activeView, setActiveView] = useState<ViewType>("home");
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);

  const navigateToView = (view: ViewType) => {
    setActiveView(view);
  };

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
      <div className="flex min-h-screen flex-col">
        <Navigation onNavigate={navigateToView} activeView={activeView} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {activeView === "viewer" && (
            <button
              onClick={() => navigateToView("library")}
              className="mb-4 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to My Patterns
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <ErrorBoundary key={activeView} componentName={activeView}>
                {activeView === "home" && (
                  <HomeWorkbench onNavigate={navigateToView} />
                )}

                {activeView === "input" && (
                  <PatternInputRefactored onPatternCreated={handlePatternCreated} />
                )}

                {activeView === "viewer" && currentPattern && (
                  <PatternViewer
                    pattern={currentPattern}
                    onPatternUpdated={setCurrentPattern}
                  />
                )}

                {activeView === "library" && (
                  <PatternLibrary
                    onPatternSelected={handlePatternLoaded}
                    onCreateNew={() => navigateToView("input")}
                  />
                )}

                {activeView === "stash" && <MaterialsInventory />}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
