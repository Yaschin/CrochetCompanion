import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "./components/Navigation";
import PatternInput from "./components/PatternInput";
import PatternViewer from "./components/PatternViewer";
import PatternLibrary from "./components/PatternLibrary";
import { Pattern } from "./lib/types";

// View options
type ViewType = "input" | "viewer" | "library";

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
          <div className="mb-8 border-b border-gray-200">
            <div className="flex space-x-8">
              <button 
                onClick={() => navigateToView("input")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === "input" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Pattern Input
              </button>
              <button 
                onClick={() => navigateToView("viewer")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === "viewer" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Pattern Viewer
              </button>
              <button 
                onClick={() => navigateToView("library")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === "library" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Library
              </button>
            </div>
          </div>

          {/* Conditional content based on active view */}
          {activeView === "input" && (
            <PatternInput onPatternCreated={handlePatternCreated} />
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
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
