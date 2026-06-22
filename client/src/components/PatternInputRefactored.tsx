import { palette, gradients } from "@/lib/theme";
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, BookOpen, FileUp } from 'lucide-react';
import { PatternInputFormData, Pattern } from '../lib/types';
import GenerationLoadingScreen from '../pages/GenerationLoadingScreen';
import { showAiErrorToast } from '@/lib/aiErrorToast';
import { AI_STEPS, OWN_STEPS, AI_TIPS, OWN_TIPS } from './pattern-input/constants';
import { fileToDataUrl, buildPatternToSave } from './pattern-input/helpers';
import AiWizard from './pattern-input/AiWizard';
import OwnWizard from './pattern-input/OwnWizard';
import PdfWizard from './pattern-input/PdfWizard';
import WizardChrome from './pattern-input/WizardChrome';

interface PatternInputProps {
  onPatternCreated: (pattern: Pattern, skipLoading?: boolean) => void;
  initialMode?: "ai" | "own" | "pdf";
}

const PatternInputRefactored: React.FC<PatternInputProps> = ({ onPatternCreated, initialMode }) => {
  const { toast } = useToast();

  // ── Shared mode toggle ───────────────────────────────────────────────────────
  const [mode, setMode] = useState<"ai" | "own" | "pdf">(initialMode ?? "ai");

  // ── AI wizard state ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<PatternInputFormData>({
    prompt: '', projectType: '', skillLevel: '', yarnType: '', size: '',
  });
  const [file, setFile]               = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  // Real generation progress (0–100) for the controlled loading screen. It only
  // jumps forward when an actual phase completes; a gentle trickle keeps it
  // alive during the long AI call without ever lying that it's finished.
  const [genProgress, setGenProgress] = useState(0);
  const [wizardStep, setWizardStep]   = useState(0);
  const [wizardColors, setWizardColors] = useState<string[]>([]);

  // ── "Add My Own" wizard state ────────────────────────────────────────────────
  const [ownStep, setOwnStep]         = useState(0);
  const [ownTitle, setOwnTitle]       = useState("");
  const [ownRawText, setOwnRawText]   = useState("");
  const [ownParsing, setOwnParsing]   = useState(false);

  // Reset all wizards when switching mode
  const switchMode = (m: "ai" | "own" | "pdf") => {
    setMode(m);
    setWizardStep(0);
    setOwnStep(0);
    setFormData({ prompt: '', projectType: '', skillLevel: '', yarnType: '', size: '' });
    setOwnTitle("");
    setOwnRawText("");
    setWizardColors([]);
    setFile(null);
  };

  // ── Mutations ────────────────────────────────────────────────────────────────
  const generatePatternMutation = useMutation({
    mutationFn: async (data: PatternInputFormData & { colors?: string[] }) => {
      const referenceImage = file ? await fileToDataUrl(file) : undefined;
      const colorHint = data.colors && data.colors.length > 0
        ? ` Colour palette: ${data.colors.join(', ')}.` : '';
      const res = await apiRequest('POST', '/api/generate-pattern', {
        prompt: data.prompt + colorHint,
        projectType: data.projectType,
        skillLevel: data.skillLevel,
        yarnType: data.yarnType || undefined,
        size: data.size || undefined,
        referenceImage,
      });
      return res.json();
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async (data: { prompt: string; projectType: string; yarnType?: string }) => {
      const res = await apiRequest('POST', '/api/generate-image', {
        prompt: data.prompt, type: 'final',
        projectType: data.projectType, yarnType: data.yarnType,
      });
      return res.json();
    },
  });

  const savePatternMutation = useMutation({
    mutationFn: async (pattern: Omit<Pattern, 'id' | 'createdAt'>) => {
      const res = await apiRequest('POST', '/api/patterns', pattern);
      return res.json();
    },
  });

  const parsePatternMutation = useMutation({
    mutationFn: async (body: {
      title: string; projectType: string; skillLevel: string;
      yarnType?: string; size?: string; rawText?: string;
    }) => {
      const res = await apiRequest('POST', '/api/parse-pattern', body);
      return res.json();
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const f = e.target.files[0];
    if (!['image/jpeg','image/png','image/gif'].includes(f.type)) {
      toast({ title: "Invalid file type", description: "JPG, PNG or GIF only.", variant: "destructive" }); return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10 MB.", variant: "destructive" }); return;
    }
    setFile(f);
    setFormData(p => ({ ...p, prompt: p.prompt || `Create a crochet pattern based on the attached reference image.` }));
    toast({ title: "Reference Image Added", description: "Used as a reference during generation." });
  };

  // ── AI wizard: can advance? ──────────────────────────────────────────────────
  const canAdvance = () => {
    if (wizardStep === 0) return !!formData.projectType;
    if (wizardStep === 1) return !!formData.prompt && !!formData.skillLevel;
    return true;
  };

  // ── AI wizard: generate handler ──────────────────────────────────────────────
  const handleGeneratePattern = async () => {
    if (!formData.prompt || !formData.projectType || !formData.skillLevel) {
      toast({ title: "Missing information", description: "Please fill in the prompt, project type, and skill level.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGenProgress(8);
    // Gentle trickle so the ring keeps moving during the long AI call; it never
    // passes 90 until a real phase completes, so it can't claim to be done early.
    const trickle = setInterval(() => {
      setGenProgress((p) => (p < 90 ? p + 1 : p));
    }, 600);
    try {
      const generatedPatternData = await generatePatternMutation.mutateAsync({ ...formData, colors: wizardColors });
      setGenProgress((p) => Math.max(p, 70));

      const imagePrompt = generatedPatternData.title || formData.prompt;
      const imageResponse = await generateImageMutation.mutateAsync({
        prompt: imagePrompt, projectType: formData.projectType, yarnType: formData.yarnType,
      });
      setGenProgress((p) => Math.max(p, 90));

      const patternToSave = buildPatternToSave(generatedPatternData, formData, imageResponse.url);
      const savedPattern  = await savePatternMutation.mutateAsync(patternToSave);
      setGenProgress(100);
      clearInterval(trickle);
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      // The pattern is already saved — go straight to the viewer. The real wait
      // above WAS the loading screen; no fake post-hoc timer.
      onPatternCreated(savedPattern, true);

      if ((generatedPatternData as any)?.aiUnavailable) {
        // The server returned a generic sample because the OpenAI key is missing
        // or invalid — make that unmistakable instead of passing it off as a
        // real AI-generated make.
        toast({
          title: "AI is offline — sample pattern saved",
          description: `"${savedPattern.title}" is a generic starter you can edit. Add an OpenAI key in Settings to generate real patterns.`,
          variant: "destructive",
          duration: 9000,
        });
      } else {
        toast({ title: "Pattern Generated!", description: `"${savedPattern.title}" is ready.`, duration: 5000 });
      }
    } catch (error) {
      clearInterval(trickle);
      showAiErrorToast(error, { action: "generate patterns", fallbackTitle: "Generation Failed" });
    } finally {
      clearInterval(trickle);
      setIsGenerating(false);
    }
  };

  // ── "Add My Own": save handler ───────────────────────────────────────────────
  const handleSaveOwn = async () => {
    if (!ownTitle.trim() || !formData.projectType || !formData.skillLevel) {
      toast({ title: "Missing info", description: "Please add a name, type, and skill level.", variant: "destructive" });
      return;
    }
    setOwnParsing(true);
    try {
      const parsed = await parsePatternMutation.mutateAsync({
        title: ownTitle.trim(),
        projectType: formData.projectType,
        skillLevel: formData.skillLevel,
        yarnType: formData.yarnType || undefined,
        size: formData.size || undefined,
        rawText: ownRawText.trim() || undefined,
      });

      const patternToSave = buildPatternToSave(parsed, {
        ...formData,
        prompt: ownTitle.trim(),
      }, undefined);

      const savedPattern = await savePatternMutation.mutateAsync(patternToSave);
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      onPatternCreated(savedPattern, true);
      toast({
        title: "Pattern added! 🎉",
        description: `"${savedPattern.title}" is in your library. Tap any step to tick it off as you work.`,
        duration: 6000,
      });
    } catch (err) {
      console.error('Error saving own pattern:', err);
      toast({ title: "Couldn't save", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setOwnParsing(false);
    }
  };

  // ── Own wizard: can advance? ──────────────────────────────────────────────────
  const ownCanAdvance = () => {
    if (ownStep === 0) return !!ownTitle.trim() && !!formData.projectType;
    if (ownStep === 1) return !!formData.skillLevel;
    return true;
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const steps       = mode === "ai" ? AI_STEPS : OWN_STEPS;
  const currentStep = mode === "ai" ? wizardStep : ownStep;
  const tips        = mode === "ai" ? AI_TIPS : OWN_TIPS;

  const modeAccent  = mode === "ai" ? palette.rose : palette.sage;
  const modeAccentRgb = mode === "ai" ? "194,78,107" : "132,147,79";
  const charImg = mode === "ai"
    ? "/characters/char-yala-transparent.png"
    : "/characters/char-ashi-transparent.png";

  // While the AI request is actually in flight, show the honest, progress-bound
  // loading screen — the real wait, not a fake timer played after the fact.
  if (isGenerating) {
    return <GenerationLoadingScreen progress={genProgress} />;
  }

  return (
    <div className="flex flex-col gap-0 max-w-lg mx-auto w-full">

      {/* ── Mode toggle ── */}
      <div className="flex rounded-2xl overflow-hidden mb-5 p-1"
        style={{ background: "rgba(140,100,55,0.08)", border: "1px solid rgba(140,100,55,0.18)" }}>
        <button
          onClick={() => switchMode("ai")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: mode === "ai" ? gradients.rose : "transparent",
            color: mode === "ai" ? "white" : palette.clay,
            boxShadow: mode === "ai" ? "0 3px 12px rgba(194,78,107,0.35)" : "none",
          }}>
          <Sparkles className="h-3.5 w-3.5" /> Create with AI
        </button>
        <button
          onClick={() => switchMode("own")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: mode === "own" ? "linear-gradient(135deg, #84934F, #5A6E30)" : "transparent",
            color: mode === "own" ? "white" : palette.clay,
            boxShadow: mode === "own" ? "0 3px 12px rgba(132,147,79,0.35)" : "none",
          }}>
          <BookOpen className="h-3.5 w-3.5" /> Add my own
        </button>
        <button
          onClick={() => switchMode("pdf")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: mode === "pdf" ? "linear-gradient(135deg, #3D8FA3, #2A6B7D)" : "transparent",
            color: mode === "pdf" ? "white" : palette.clay,
            boxShadow: mode === "pdf" ? "0 3px 12px rgba(61,143,163,0.35)" : "none",
          }}>
          <FileUp className="h-3.5 w-3.5" /> Import PDF
        </button>
      </div>

      {/* Step chrome (progress bar + tip) — PdfWizard renders its own */}
      {mode !== "pdf" && (
        <WizardChrome
          steps={steps}
          currentStep={currentStep}
          tips={tips}
          modeAccent={modeAccent}
          modeAccentRgb={modeAccentRgb}
          charImg={charImg}
        />
      )}

      {mode === "ai" && (
        <AiWizard
          formData={formData}
          setFormData={setFormData}
          wizardStep={wizardStep}
          setWizardStep={setWizardStep}
          wizardColors={wizardColors}
          setWizardColors={setWizardColors}
          file={file}
          setFile={setFile}
          handleFileChange={handleFileChange}
          isGenerating={isGenerating}
          handleGeneratePattern={handleGeneratePattern}
          canAdvance={canAdvance}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          "ADD MY OWN" WIZARD
      ═══════════════════════════════════════════════════════════════════════ */}
      {mode === "own" && (
        <OwnWizard
          formData={formData}
          setFormData={setFormData}
          ownStep={ownStep}
          setOwnStep={setOwnStep}
          ownTitle={ownTitle}
          setOwnTitle={setOwnTitle}
          ownRawText={ownRawText}
          setOwnRawText={setOwnRawText}
          ownParsing={ownParsing}
          handleSaveOwn={handleSaveOwn}
          ownCanAdvance={ownCanAdvance}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          IMPORT PDF WIZARD
      ═══════════════════════════════════════════════════════════════════════ */}
      {mode === "pdf" && (
        <PdfWizard onPatternCreated={onPatternCreated} />
      )}

    </div>
  );
};

export default PatternInputRefactored;
