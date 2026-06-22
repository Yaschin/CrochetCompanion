import { palette } from "@/lib/theme";
import { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { Pattern, ViewType } from '../lib/types';
import SourcePdfViewer from './SourcePdfViewer';
import { deleteSourceFile } from '../lib/documents';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import StitchCounter from './StitchCounter';
import FollowMode from './FollowMode';
import CelebrationOverlay from './CelebrationOverlay';
import StashDepletionSheet from './StashDepletionSheet';
import PatternViewerHeader from './pattern-viewer/PatternViewerHeader';
import OverviewTab from './pattern-viewer/OverviewTab';
import PatternTab from './pattern-viewer/PatternTab';
import NotesTab from './pattern-viewer/NotesTab';
import PatternViewerDialogs from './pattern-viewer/PatternViewerDialogs';
import { usePatternViewer } from './pattern-viewer/usePatternViewer';

interface PatternViewerProps {
  pattern: Pattern;
  onPatternUpdated: (pattern: Pattern) => void;
  onNavigate?: (view: ViewType) => void;
}

/**
 * PatternViewer component displays the pattern details and allows interaction
 * Optimized for memory efficiency and performance with large patterns
 */
export default function PatternViewer({ pattern, onPatternUpdated, onNavigate }: PatternViewerProps) {
  const {
    expandedSections,
    isRegenerating,
    isRegeneratingImage,
    imageDialogOpen,
    setImageDialogOpen,
    imageRefinements,
    setImageRefinements,
    counterOpen,
    setCounterOpen,
    activeTab,
    setActiveTab,
    regenSection,
    setRegenSection,
    regenNote,
    setRegenNote,
    notes,
    setNotes,
    showCelebration,
    setShowCelebration,
    showStashDeplete,
    setShowStashDeplete,
    regenAllConfirmOpen,
    setRegenAllConfirmOpen,
    regenAllNote,
    setRegenAllNote,
    shareConfirmOpen,
    setShareConfirmOpen,
    followOpen,
    setFollowOpen,
    editingTitle,
    setEditingTitle,
    titleDraft,
    setTitleDraft,
    adaptOpen,
    setAdaptOpen,
    adaptMode,
    setAdaptMode,
    adaptInstruction,
    setAdaptInstruction,
    alignmentResults,
    alignmentLoading,
    sharingStory,
    pendingDepleteRef,
    coverInputRef,
    formattedDate,
    timeEstimate,
    isUpNext,
    upNextLoading,
    updatePatternMutation,
    saveNotesMutation,
    coverPhotoMutation,
    upNextMutation,
    renameMutation,
    shareToCommunityMutation,
    adaptMutation,
    regenerateStepsMutation,
    regenerateImageMutation,
    handleStoryCard,
    checkAlignment,
    toggleSection,
    updateStep,
    deleteStep,
    addStep,
    addSection,
    handleRegeneratePattern,
    handleRegenerateImage,
    handleImageRefinementSubmit,
    handleExportPattern,
  } = usePatternViewer(pattern, onPatternUpdated);

  const { toast } = useToast();
  const sourceFiles = pattern.sourceFiles ?? [];
  const hasSource = sourceFiles.length > 0;
  // The "peek" sheet is lazy-mounted, then kept mounted so the PDF keeps its
  // place when you flip it open and shut while following a step.
  const [peekOpen, setPeekOpen] = useState(false);
  const [peekMounted, setPeekMounted] = useState(false);
  const openPeek = () => { setPeekMounted(true); setPeekOpen(true); };

  const handleRemoveSource = async (key: string) => {
    try {
      const remaining = await deleteSourceFile(pattern.id, key);
      onPatternUpdated({ ...pattern, sourceFiles: remaining });
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      toast({ title: "Original file removed" });
    } catch {
      toast({ title: "Couldn't remove the file", variant: "destructive" });
    }
  };

  const tabs: Array<"overview" | "pattern" | "source" | "notes"> = hasSource
    ? ["overview", "pattern", "source", "notes"]
    : ["overview", "pattern", "notes"];
  const tabLabel = (t: string) =>
    t === "overview" ? "Overview" : t === "pattern" ? "Pattern" : t === "source" ? "Source" : "Notes";

  return (
    <div className="mb-8 flex flex-col gap-4">
      <CelebrationOverlay
        show={showCelebration}
        onDone={() => {
          setShowCelebration(false);
          // Sequence the stash prompt after the confetti so they don't overlap.
          if (pendingDepleteRef.current) {
            pendingDepleteRef.current = false;
            setShowStashDeplete(true);
          }
        }}
        subtitle={`"${pattern.title}" is finished ♡`}
      />
      <StashDepletionSheet
        pattern={pattern}
        open={showStashDeplete}
        onClose={() => setShowStashDeplete(false)}
      />
      <StitchCounter
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        patternId={pattern.id}
        patternTitle={pattern.title}
      />
      <FollowMode
        pattern={pattern}
        open={followOpen}
        onClose={() => setFollowOpen(false)}
        onUpdateStep={updateStep}
        onMarkFinished={() => {
          // Close first so the confetti celebration is visible.
          setFollowOpen(false);
          updatePatternMutation.mutate({ ...pattern, status: "finished", finishedAt: new Date().toISOString() });
        }}
      />

      {/* ── Header ── */}
      <PatternViewerHeader
        pattern={pattern}
        formattedDate={formattedDate}
        editingTitle={editingTitle}
        titleDraft={titleDraft}
        onTitleDraftChange={setTitleDraft}
        onStartEditTitle={() => { setTitleDraft(pattern.title); setEditingTitle(true); }}
        onCancelEditTitle={() => { setEditingTitle(false); setTitleDraft(pattern.title); }}
        onSaveTitle={() => renameMutation.mutate(titleDraft.trim())}
        renaming={renameMutation.isPending}
        onToggleFavorite={() => updatePatternMutation.mutate({ ...pattern, favorite: !pattern.favorite })}
      />

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(140,100,55,0.08)" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold capitalize transition-all"
            style={{
              background: activeTab === tab ? "white" : "transparent",
              color: activeTab === tab ? palette.rose : palette.clay,
              boxShadow: activeTab === tab ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <OverviewTab
          pattern={pattern}
          formattedDate={formattedDate}
          timeEstimate={timeEstimate}
          onNavigate={onNavigate}
          onUpdatePattern={updatePatternMutation.mutate}
          onRegenerateImage={handleRegenerateImage}
          onExportPattern={handleExportPattern}
          onStoryCard={handleStoryCard}
          sharingStory={sharingStory}
          coverInputRef={coverInputRef}
          onCoverPhoto={(f) => coverPhotoMutation.mutate(f)}
          coverPhotoPending={coverPhotoMutation.isPending}
          isUpNext={isUpNext}
          upNextLoading={upNextLoading}
          onToggleUpNext={() => upNextMutation.mutate(!isUpNext)}
          upNextPending={upNextMutation.isPending}
          onOpenShare={() => setShareConfirmOpen(true)}
          sharePending={shareToCommunityMutation.isPending}
          onOpenCounter={() => setCounterOpen(true)}
          adaptOpen={adaptOpen}
          onToggleAdapt={() => setAdaptOpen(v => !v)}
          adaptMode={adaptMode}
          onAdaptModeChange={setAdaptMode}
          adaptInstruction={adaptInstruction}
          onAdaptInstructionChange={setAdaptInstruction}
          onAdapt={() => adaptMutation.mutate({ mode: adaptMode, instruction: adaptInstruction })}
          adaptPending={adaptMutation.isPending}
        />
      )}

      {/* ── Pattern tab ── */}
      {activeTab === "pattern" && (
        <PatternTab
          pattern={pattern}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          onUpdateStep={updateStep}
          onDeleteStep={deleteStep}
          onAddStep={addStep}
          onUpdatePattern={updatePatternMutation.mutate}
          onAddSection={addSection}
          onOpenFollow={() => setFollowOpen(true)}
          regenSection={regenSection}
          regenNote={regenNote}
          onRegenSectionChange={setRegenSection}
          onRegenNoteChange={setRegenNote}
          onRegenerateSection={handleRegeneratePattern}
          alignmentResults={alignmentResults}
          alignmentLoading={alignmentLoading}
          onCheckAlignment={checkAlignment}
          onOpenCounter={() => setCounterOpen(true)}
          isRegenerating={isRegenerating}
          onOpenRegenAll={() => setRegenAllConfirmOpen(true)}
        />
      )}

      {/* ── Source tab (kept mounted so the PDF keeps its page when you flip away) ── */}
      {hasSource && (
        <div
          className={activeTab === "source" ? "flex flex-col" : "hidden"}
          style={activeTab === "source" ? { height: "75vh" } : undefined}
        >
          <SourcePdfViewer files={sourceFiles} onRemove={handleRemoveSource} />
        </div>
      )}

      {/* ── Notes tab ── */}
      {activeTab === "notes" && (
        <NotesTab
          notes={notes}
          onNotesChange={setNotes}
          onSave={() => saveNotesMutation.mutate(notes)}
          saving={saveNotesMutation.isPending}
        />
      )}

      {/* Floating "peek the original" button while working the Pattern tab */}
      {hasSource && activeTab === "pattern" && (
        <button
          onClick={openPeek}
          className="fixed right-4 bottom-24 md:bottom-8 z-30 inline-flex items-center gap-2 px-4 py-3 rounded-full font-heading font-bold text-[13px] transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ background: palette.rose, color: "white", boxShadow: "0 4px 16px rgba(194,78,107,0.4)" }}
        >
          <FileText className="h-4 w-4" /> Original
        </button>
      )}

      {/* Peek sheet — see the original alongside the step you're on */}
      {hasSource && peekMounted && (
        <>
          <div
            onClick={() => setPeekOpen(false)}
            className="fixed inset-0 z-40"
            style={{
              background: "rgba(0,0,0,0.3)",
              opacity: peekOpen ? 1 : 0,
              pointerEvents: peekOpen ? "auto" : "none",
              transition: "opacity .25s",
            }}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl md:inset-y-0 md:left-auto md:right-0 md:w-[46%] md:rounded-t-none md:rounded-l-3xl"
            style={{
              height: "84vh",
              background: palette.cream,
              boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
              transform: peekOpen ? "translateY(0)" : "translateY(100%)",
              transition: "transform .28s ease",
            }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
              <p className="font-heading font-bold text-[15px]" style={{ color: palette.ink }}>Original pattern</p>
              <button
                onClick={() => setPeekOpen(false)}
                aria-label="Close original"
                className="inline-flex items-center justify-center h-9 w-9 rounded-full"
                style={{ background: "rgba(140,100,55,0.10)", color: palette.ink }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col">
              <SourcePdfViewer files={sourceFiles} />
            </div>
          </div>
        </>
      )}

      <PatternViewerDialogs
        pattern={pattern}
        regenAllOpen={regenAllConfirmOpen}
        onRegenAllOpenChange={(o) => { setRegenAllConfirmOpen(o); if (!o) setRegenAllNote(""); }}
        regenAllNote={regenAllNote}
        onRegenAllNoteChange={setRegenAllNote}
        onConfirmRegenAll={() => { setRegenAllConfirmOpen(false); handleRegeneratePattern(regenAllNote || undefined); setRegenAllNote(""); }}
        isRegenerating={isRegenerating}
        shareOpen={shareConfirmOpen}
        onShareOpenChange={setShareConfirmOpen}
        onConfirmShare={() => shareToCommunityMutation.mutate()}
        sharePending={shareToCommunityMutation.isPending}
        imageOpen={imageDialogOpen}
        onImageOpenChange={setImageDialogOpen}
        imageRefinements={imageRefinements}
        onImageRefinementsChange={setImageRefinements}
        onConfirmImage={handleImageRefinementSubmit}
        isRegeneratingImage={isRegeneratingImage}
      />
    </div>
  );
}
