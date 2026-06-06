import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import PatternInputRefactored from "./components/PatternInputRefactored";
import PatternViewer from "./components/PatternViewer";
import PatternLibrary from "./components/PatternLibrary";
import MaterialsInventory from "./components/MaterialsInventory";
import { Pattern, ViewType } from "./lib/types";

function App() {
  const [activeView, setActiveView] = useState<ViewType>("input");
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);

  // Handle view changes
  const navigateToView = (view: ViewType) => {
    setActiveView(view);
  };

  // Handle pattern creation/editing
  const handlePatternCreated = (pattern: Pattern) => {
    setCurrentPattern(pattern);
    setActiveView("viewer");
  };

  // Handle loading a pattern from library
  const handlePatternLoaded = (pattern: Pattern) => {
    setCurrentPattern(pattern);
    setActiveView("viewer");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Navigation onNavigate={navigateToView} activeView={activeView} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* The viewer is reached by opening a pattern, so it has no top-nav
              entry — give it an explicit way back to the library. */}
          {activeView === "viewer" && (
            <button
              onClick={() => navigateToView("library")}
              className="mb-4 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to My Patterns
            </button>
          )}

          {/* Conditional content based on active view.
              Wrapped in an ErrorBoundary (keyed by view) so a crash in one
              screen surfaces a recoverable dialog instead of blanking the app. */}
          <ErrorBoundary key={activeView} componentName={activeView}>
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
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
