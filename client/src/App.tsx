import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "./components/Navigation";
import PatternInputRefactored from "./components/PatternInputRefactored";
import PatternViewer from "./components/PatternViewer";
import PatternLibrary from "./components/PatternLibrary";
import YarnStash from "./components/YarnStash";
import CalendarPlanner from "./components/CalendarPlanner";
import { Pattern } from "./lib/types";

// View options
type ViewType = "input" | "viewer" | "library" | "stash" | "calendar";

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
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navigation 
          onNavigate={navigateToView} 
          activeView={activeView}
        />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabbed navigation for view switching */}
          <div className="mb-6 sm:mb-8 border-b border-gray-200">
            <div className="flex justify-between sm:justify-start sm:space-x-8">
              <button 
                onClick={() => navigateToView("input")}
                className={`flex-1 sm:flex-initial whitespace-nowrap py-3 sm:py-4 text-center border-b-2 font-medium text-xs sm:text-sm ${
                  activeView === "input" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Pattern Input
              </button>
              <button 
                onClick={() => navigateToView("viewer")}
                className={`flex-1 sm:flex-initial whitespace-nowrap py-3 sm:py-4 text-center border-b-2 font-medium text-xs sm:text-sm ${
                  activeView === "viewer" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Pattern Viewer
              </button>
              <button 
                onClick={() => navigateToView("library")}
                className={`flex-1 sm:flex-initial whitespace-nowrap py-3 sm:py-4 text-center border-b-2 font-medium text-xs sm:text-sm ${
                  activeView === "library" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Library
              </button>
              <button 
                onClick={() => navigateToView("stash")}
                className={`flex-1 sm:flex-initial whitespace-nowrap py-3 sm:py-4 text-center border-b-2 font-medium text-xs sm:text-sm ${
                  activeView === "stash" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Stash
              </button>
              <button 
                onClick={() => navigateToView("calendar")}
                className={`flex-1 sm:flex-initial whitespace-nowrap py-3 sm:py-4 text-center border-b-2 font-medium text-xs sm:text-sm ${
                  activeView === "calendar" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Project Planner
              </button>
            </div>
          </div>

          {/* Conditional content based on active view */}
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
          
          {activeView === "stash" && (
            <YarnStash />
          )}
          
          {activeView === "calendar" && (
            <CalendarPlanner />
          )}
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
