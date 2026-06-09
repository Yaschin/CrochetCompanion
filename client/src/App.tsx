import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AppShell from "./components/AppShell";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
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
import FavoritesScreen from "./pages/FavoritesScreen";
import CommunityScreen from "./pages/CommunityScreen";
import CommunityDetailScreen from "./pages/CommunityDetailScreen";
import CommunitySubmitScreen from "./pages/CommunitySubmitScreen";
import PatternDetailScreen from "./pages/PatternDetailScreen";
import ProjectsScreen from "./pages/ProjectsScreen";
import SettingsScreen from "./pages/SettingsScreen";
import TutorialSystem from "./components/TutorialSystem";
import { Pattern, ViewType } from "./lib/types";
import { AnimatePresence, motion } from "framer-motion";

interface NavOpts {
  patternId?: string | null;
  communityId?: string | null;
}

// View → URL. Pattern/community screens carry their id in the path so they can
// be deep-linked, refreshed, and shared.
function pathFor(view: ViewType, opts: NavOpts = {}): string {
  const pid = opts.patternId;
  const cid = opts.communityId;
  switch (view) {
    case "splash": return "/";
    case "home": return "/home";
    case "input": return "/create";
    case "loading": return "/loading";
    case "library": return "/library";
    case "search": return "/search";
    case "stash": return "/stash";
    case "favorites": return "/favorites";
    case "projects": return "/projects";
    case "yarn-recs": return "/yarn";
    case "settings": return "/settings";
    case "community": return "/community";
    case "community-submit": return "/community/submit";
    case "community-detail": return cid ? `/community/${cid}` : "/community";
    case "viewer": return pid ? `/patterns/${pid}` : "/library";
    case "pattern-detail": return pid ? `/patterns/${pid}/details` : "/library";
    case "progress": return pid ? `/patterns/${pid}/progress` : "/library";
    case "photo-upload": return pid ? `/patterns/${pid}/photos` : "/library";
    case "stitch-counter": return pid ? `/patterns/${pid}/counter` : "/library";
    default: return "/home";
  }
}

// URL → view (+ ids). The inverse of pathFor.
function parseLocation(loc: string): { view: ViewType; patternId?: string; communityId?: string } {
  const segs = loc.split("?")[0].split("/").filter(Boolean);
  if (segs.length === 0) return { view: "splash" };
  const [a, b, c] = segs;
  switch (a) {
    case "home": return { view: "home" };
    case "create": return { view: "input" };
    case "loading": return { view: "loading" };
    case "library": return { view: "library" };
    case "search": return { view: "search" };
    case "stash": return { view: "stash" };
    case "favorites": return { view: "favorites" };
    case "projects": return { view: "projects" };
    case "yarn": return { view: "yarn-recs" };
    case "settings": return { view: "settings" };
    case "community":
      if (!b) return { view: "community" };
      if (b === "submit") return { view: "community-submit" };
      return { view: "community-detail", communityId: b };
    case "patterns":
      if (!b) return { view: "library" };
      if (c === "details") return { view: "pattern-detail", patternId: b };
      if (c === "progress") return { view: "progress", patternId: b };
      if (c === "photos") return { view: "photo-upload", patternId: b };
      if (c === "counter") return { view: "stitch-counter", patternId: b };
      return { view: "viewer", patternId: b };
    default:
      return { view: "home" };
  }
}

function App() {
  const [location, setLocation] = useLocation();
  const parsed = parseLocation(location);
  const activeView = parsed.view;
  const patternId = parsed.patternId;
  const communityId = parsed.communityId ?? null;

  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);

  // Hydrate the current pattern from the URL id on deep-link / refresh, when it
  // isn't already loaded in memory.
  useEffect(() => {
    if (!patternId) return;
    if (currentPattern && currentPattern.id === patternId) return;
    let cancelled = false;
    fetch(`/api/patterns/${patternId}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => { if (!cancelled && p) setCurrentPattern(p as Pattern); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [patternId, currentPattern]);

  const navigateToView = (view: ViewType) =>
    setLocation(pathFor(view, { patternId: currentPattern?.id, communityId }));

  const handleCommunitySelected = (id: string) => setLocation(pathFor("community-detail", { communityId: id }));

  const handlePatternCreated = (pattern: Pattern, skipLoading?: boolean) => {
    setCurrentPattern(pattern);
    setLocation(pathFor(skipLoading ? "viewer" : "loading", { patternId: pattern.id }));
  };

  const handlePatternLoaded = (pattern: Pattern) => {
    setCurrentPattern(pattern);
    setLocation(pathFor("viewer", { patternId: pattern.id }));
  };

  const handleLoadingComplete = (view: ViewType) =>
    setLocation(pathFor(view, { patternId: currentPattern?.id }));

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
      <OfflineBanner />
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
                <div className="flex flex-col h-full overflow-y-auto px-6 py-6 pb-20 md:pb-6">
                  <PatternInputRefactored onPatternCreated={handlePatternCreated} />
                </div>
              )}

              {activeView === "viewer" && currentPattern && (
                <div className="flex flex-col h-full overflow-y-auto px-4 md:px-6 py-4 pb-20 md:pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => navigateToView("library")}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors hover:opacity-75"
                      style={{ color: "#C24E6B", background: "rgba(194,78,107,0.08)", border: "1px solid rgba(194,78,107,0.2)" }}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Patterns
                    </button>
                    <button
                      onClick={() => navigateToView("pattern-detail")}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors hover:opacity-75"
                      style={{ color: "#84934F", background: "rgba(132,147,79,0.08)", border: "1px solid rgba(132,147,79,0.2)" }}
                    >
                      Details →
                    </button>
                  </div>
                  <PatternViewer
                    pattern={currentPattern}
                    onPatternUpdated={setCurrentPattern}
                    onNavigate={navigateToView}
                  />
                </div>
              )}

              {activeView === "viewer" && !currentPattern && (
                <div className="px-6 py-6 pb-20 md:pb-6 flex flex-col items-center justify-center h-full gap-4">
                  <p className="font-heading font-semibold text-[16px]" style={{ color: "#9A7868" }}>
                    Loading pattern…
                  </p>
                  <button onClick={() => navigateToView("library")}
                    className="btn-craft btn-rose px-5 py-2.5">
                    Browse Library →
                  </button>
                </div>
              )}

              {activeView === "library" && (
                <div className="flex flex-col h-full overflow-y-auto px-6 py-6 pb-20 md:pb-6">
                  <PatternLibrary
                    onPatternSelected={handlePatternLoaded}
                    onCreateNew={() => navigateToView("input")}
                  />
                </div>
              )}

              {activeView === "stash" && (
                <div className="flex flex-col h-full overflow-y-auto px-6 py-6 pb-20 md:pb-6">
                  <MaterialsInventory />
                </div>
              )}

              {activeView === "projects" && (
                <ProjectsScreen
                  onNavigate={navigateToView}
                  onPatternSelected={handlePatternLoaded}
                />
              )}

              {activeView === "search" && (
                <SearchScreen
                  onNavigate={navigateToView}
                  onPatternSelected={handlePatternLoaded}
                />
              )}

              {activeView === "favorites" && (
                <FavoritesScreen onNavigate={navigateToView} onPatternSelected={handlePatternLoaded} />
              )}

              {activeView === "community" && (
                <CommunityScreen onNavigate={navigateToView} onPatternSelect={handleCommunitySelected} />
              )}

              {activeView === "community-detail" && (
                <CommunityDetailScreen
                  onNavigate={navigateToView}
                  communityId={communityId}
                  onPatternSelected={handlePatternLoaded}
                />
              )}

              {activeView === "community-submit" && (
                <CommunitySubmitScreen onNavigate={navigateToView} initialPattern={currentPattern ?? undefined} />
              )}

              {activeView === "progress" && (
                <ProgressTrackingScreen
                  pattern={currentPattern}
                  onNavigate={navigateToView}
                />
              )}

              {activeView === "photo-upload" && (
                <PhotoUploadScreen pattern={currentPattern} onNavigate={navigateToView} />
              )}

              {activeView === "stitch-counter" && (
                <StitchCounterScreen
                  onNavigate={navigateToView}
                  backView={currentPattern ? "viewer" : "home"}
                />
              )}

              {activeView === "yarn-recs" && (
                <YarnRecsScreen onNavigate={navigateToView} onPatternSelected={handlePatternLoaded} />
              )}

              {activeView === "pattern-detail" && currentPattern && (
                <PatternDetailScreen
                  pattern={currentPattern}
                  onNavigate={navigateToView}
                  onOpenPattern={handlePatternLoaded}
                />
              )}

              {activeView === "settings" && (
                <SettingsScreen onNavigate={navigateToView} />
              )}

            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </AppShell>
      <TutorialSystem onNavigate={navigateToView} activeView={activeView} />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
