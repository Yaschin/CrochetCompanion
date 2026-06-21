import { palette } from "@/lib/theme";
import { Pattern, ViewType } from '../lib/types';
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
        {(["overview", "pattern", "notes"] as const).map((tab) => (
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
            {tab === "overview" ? "Overview" : tab === "pattern" ? "Pattern" : "Notes"}
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

      {/* ── Notes tab ── */}
      {activeTab === "notes" && (
        <NotesTab
          notes={notes}
          onNotesChange={setNotes}
          onSave={() => saveNotesMutation.mutate(notes)}
          saving={saveNotesMutation.isPending}
        />
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
