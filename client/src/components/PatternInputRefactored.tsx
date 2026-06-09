import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Key, ExternalLink, AlertCircle, BookOpen, Plus } from 'lucide-react';
import { PatternInputFormData, Pattern } from '../lib/types';

interface PatternInputProps {
  onPatternCreated: (pattern: Pattern) => void;
}

const CATEGORIES = [
  { id: "Amigurumi",  label: "Toys & Amigurumi", emoji: "🧸", color: "#C24E6B" },
  { id: "Wearable",   label: "Wearables",         emoji: "👒", color: "#7C5FA8" },
  { id: "Home Decor", label: "Home Decor",         emoji: "🏠", color: "#84934F" },
  { id: "Accessory",  label: "Accessories",        emoji: "👜", color: "#D4921A" },
  { id: "Other",      label: "Other",              emoji: "✨", color: "#3D8FA3" },
];
const SKILL_LEVELS = [
  { id: "Beginner",     emoji: "🌱", desc: "First-timers welcome" },
  { id: "Intermediate", emoji: "🌿", desc: "Some experience needed" },
  { id: "Advanced",     emoji: "🌳", desc: "Complex techniques" },
];
const YARN_TYPES = ["Cotton", "Wool", "Acrylic", "Blend", "Mohair", "Not specified"];
const COLOR_PALETTE = [
  "#C24E6B","#7C5FA8","#84934F","#D4921A","#3D8FA3",
  "#F0C840","#E88050","#C8A0D8","#90C898","#F0A0B8",
  "#E8D0C0","#B0D0E8","#D8E0B0","#F8E8C0","#5C3A28",
];
const SIZE_OPTIONS = ["5 cm", "10 cm", "15 cm", "20 cm", "30 cm", "40 cm+"];

const AI_STEPS    = ["Item", "Details", "Yarn & Colours", "Inspiration", "Review"];
const OWN_STEPS   = ["Pattern", "Details", "Paste & Save"];

const PatternInputRefactored: React.FC<PatternInputProps> = ({ onPatternCreated }) => {
  const { toast } = useToast();

  // ── Shared mode toggle ───────────────────────────────────────────────────────
  const [mode, setMode] = useState<"ai" | "own">("ai");

  // ── AI wizard state ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<PatternInputFormData>({
    prompt: '', projectType: '', skillLevel: '', yarnType: '', size: '10 cm',
  });
  const [file, setFile]               = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wizardStep, setWizardStep]   = useState(0);
  const [wizardColors, setWizardColors] = useState<string[]>([]);

  // ── "Add My Own" wizard state ────────────────────────────────────────────────
  const [ownStep, setOwnStep]         = useState(0);
  const [ownTitle, setOwnTitle]       = useState("");
  const [ownRawText, setOwnRawText]   = useState("");
  const [ownParsing, setOwnParsing]   = useState(false);

  // Reset both wizards when switching mode
  const switchMode = (m: "ai" | "own") => {
    setMode(m);
    setWizardStep(0);
    setOwnStep(0);
    setFormData({ prompt: '', projectType: '', skillLevel: '', yarnType: '', size: '10 cm' });
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

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const fileToDataUrl = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
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
    try {
      const generatedPatternData = await generatePatternMutation.mutateAsync({ ...formData, colors: wizardColors });
      const imagePrompt = generatedPatternData.title || formData.prompt;
      const imageResponse = await generateImageMutation.mutateAsync({
        prompt: imagePrompt, projectType: formData.projectType, yarnType: formData.yarnType,
      });
      const patternToSave = buildPatternToSave(generatedPatternData, formData, imageResponse.url);
      const savedPattern  = await savePatternMutation.mutateAsync(patternToSave);
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      onPatternCreated(savedPattern);
      toast({ title: "Pattern Generated!", description: `"${savedPattern.title}" is ready.`, duration: 5000 });
    } catch (error) {
      handleGenerationError(error);
    } finally {
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
      onPatternCreated(savedPattern);
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

  // ── Shared helper: normalise parsed data → save payload ─────────────────────
  function buildPatternToSave(
    data: any,
    input: PatternInputFormData,
    imageUrl?: string,
  ): Omit<Pattern, 'id' | 'createdAt'> {
    return {
      title: data.title || input.prompt,
      description: data.description || `A ${input.skillLevel} level ${input.projectType} crochet pattern.`,
      projectType: input.projectType,
      skillLevel: input.skillLevel,
      yarnType: input.yarnType || undefined,
      size: input.size || undefined,
      endProductImage: imageUrl,
      materialsNotes: data.materialsNotes || "",
      yarnRequirements: data.yarnRequirements || [],
      hookRequirements: data.hookRequirements || [],
      notionsRequirements: data.notionsRequirements || [],
      toolRequirements: data.toolRequirements || [],
      favorite: false,
      status: "pattern",
      startedAt: undefined,
      finishedAt: undefined,
      needsStuffing: undefined,
      sections: (data.sections || []).map((section: any) => ({
        name: section.name,
        notes: section.notes || "",
        locked: false,
        partImageUrl: section.partImageUrl || null,
        steps: (section.steps || []).map((step: any) => ({
          id: step.id,
          text: step.text,
          locked: false,
          count: step.count || 0,
          notes: '',
          photo: null,
          aiStepImage: null,
          completed: false,
        })),
      })),
    };
  }

  // ── AI error handler ─────────────────────────────────────────────────────────
  function handleGenerationError(error: unknown) {
    const s = String(error);
    if (s.includes('OPENAI_API_KEY') || s.includes('API key') || s.includes('401') || s.includes('403')) {
      toast({ title: "OpenAI API Key Required", description: "Add a valid key to generate patterns.",
        variant: "apiWarning", action: <ToastAction altText="Get Key" onClick={() => window.open('https://platform.openai.com/account/api-keys','_blank')}><Key className="mr-1 h-4 w-4"/>Get API Key</ToastAction>, duration: 10000 });
    } else if (s.includes('rate limit') || s.includes('429')) {
      toast({ title: "Rate Limit Reached", description: "Please wait a few minutes and try again.", variant: "apiWarning", duration: 8000 });
    } else if (s.includes('timeout') || s.includes('timed out')) {
      toast({ title: "Generation Timed Out", description: "Try a simpler description.", variant: "apiWarning", duration: 8000 });
    } else if (s.includes('billing') || s.includes('quota')) {
      toast({ title: "OpenAI Billing Issue", description: "Check your OpenAI account.", variant: "apiWarning",
        action: <ToastAction altText="Check Billing" onClick={() => window.open('https://platform.openai.com/account/billing','_blank')}><ExternalLink className="mr-1 h-4 w-4"/>Check Billing</ToastAction>, duration: 10000 });
    } else if (s.includes('content policy') || s.includes('safety')) {
      toast({ title: "Content Policy Violation", description: "Your description may violate OpenAI's usage policy.", variant: "apiWarning",
        action: <ToastAction altText="Learn More" onClick={() => window.open('https://openai.com/policies/usage-policies','_blank')}><AlertCircle className="mr-1 h-4 w-4"/>Learn More</ToastAction>, duration: 10000 });
    } else {
      toast({ title: "Generation Failed", description: s.substring(0, 80), variant: "destructive", duration: 6000 });
    }
  }

  const activeCategory = CATEGORIES.find(c => c.id === formData.projectType);
  const AI_TIPS = [
    "Pick a category and I'll tailor the pattern just for you! 🐾",
    "More detail = a better pattern. Tell me everything! ✨",
    "Great colour choices make the magic happen 🎨",
    "A reference photo helps me imagine exactly what you want!",
    "I've got everything I need — let's create something beautiful! 🌟",
  ];
  const OWN_TIPS = [
    "Name your pattern and pick a type to get started 📝",
    "Tell me the yarn and skill level — it helps with tracking 🧶",
    "Paste your pattern text and I'll organise it into sections for you ✨",
  ];

  // ── Shared category / skill / yarn / size pickers ────────────────────────────
  const CategoryPicker = () => (
    <div className="grid grid-cols-1 gap-3">
      {CATEGORIES.map((cat) => (
        <button key={cat.id}
          onClick={() => setFormData(p => ({ ...p, projectType: cat.id }))}
          className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: formData.projectType === cat.id ? `${cat.color}14` : "rgba(255,252,245,0.9)",
            border: `2px solid ${formData.projectType === cat.id ? cat.color : "rgba(140,100,55,0.18)"}`,
            boxShadow: formData.projectType === cat.id ? `0 4px 20px ${cat.color}25` : "0 1px 4px rgba(60,30,10,0.06)",
          }}>
          <span style={{ fontSize: 32 }}>{cat.emoji}</span>
          <div className="text-left flex-1">
            <p className="font-heading font-bold text-[15px]" style={{ color: "#3D2318" }}>{cat.label}</p>
          </div>
          {formData.projectType === cat.id && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: cat.color }}>
              <span className="text-white text-[11px] font-bold">✓</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );

  const SkillPicker = () => (
    <div>
      <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Skill Level</label>
      <div className="flex gap-2">
        {SKILL_LEVELS.map((lvl) => (
          <button key={lvl.id}
            onClick={() => setFormData(p => ({ ...p, skillLevel: lvl.id }))}
            className="flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all"
            style={{
              background: formData.skillLevel === lvl.id ? "rgba(194,78,107,0.10)" : "rgba(255,252,245,0.9)",
              border: `1.5px solid ${formData.skillLevel === lvl.id ? "#C24E6B" : "rgba(140,100,55,0.18)"}`,
            }}>
            <span style={{ fontSize: 22 }}>{lvl.emoji}</span>
            <span className="text-[11px] font-bold" style={{ color: formData.skillLevel === lvl.id ? "#C24E6B" : "#5C3A28" }}>{lvl.id}</span>
            <span className="text-[9.5px] text-center" style={{ color: "#9A7868" }}>{lvl.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const YarnPicker = () => (
    <div>
      <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Yarn Type <span className="font-normal text-[11px]" style={{ color: "#9A7868" }}>(optional)</span></label>
      <div className="flex flex-wrap gap-2">
        {YARN_TYPES.map((yt) => (
          <button key={yt}
            onClick={() => setFormData(p => ({ ...p, yarnType: yt === "Not specified" ? "" : yt }))}
            className="px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: (formData.yarnType === yt || (yt === "Not specified" && !formData.yarnType)) ? "rgba(212,146,26,0.14)" : "rgba(255,252,245,0.9)",
              border: `1.5px solid ${(formData.yarnType === yt || (yt === "Not specified" && !formData.yarnType)) ? "#D4921A" : "rgba(140,100,55,0.18)"}`,
              color: (formData.yarnType === yt || (yt === "Not specified" && !formData.yarnType)) ? "#D4921A" : "#5C3A28",
            }}>
            {yt}
          </button>
        ))}
      </div>
    </div>
  );

  const SizePicker = () => (
    <div>
      <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Approximate Size <span className="font-normal text-[11px]" style={{ color: "#9A7868" }}>(optional)</span></label>
      <div className="flex flex-wrap gap-2">
        {SIZE_OPTIONS.map((sz) => (
          <button key={sz}
            onClick={() => setFormData(p => ({ ...p, size: sz }))}
            className="px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: formData.size === sz ? "rgba(132,147,79,0.14)" : "rgba(255,252,245,0.9)",
              border: `1.5px solid ${formData.size === sz ? "#84934F" : "rgba(140,100,55,0.18)"}`,
              color: formData.size === sz ? "#84934F" : "#5C3A28",
            }}>
            {sz}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Own wizard: can advance? ──────────────────────────────────────────────────
  const ownCanAdvance = () => {
    if (ownStep === 0) return !!ownTitle.trim() && !!formData.projectType;
    if (ownStep === 1) return !!formData.skillLevel;
    return true;
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const steps       = mode === "ai" ? AI_STEPS  : OWN_STEPS;
  const currentStep = mode === "ai" ? wizardStep : ownStep;
  const tips        = mode === "ai" ? AI_TIPS    : OWN_TIPS;

  return (
    <div className="flex flex-col gap-0 max-w-lg mx-auto w-full">

      {/* ── Mode toggle ── */}
      <div className="flex rounded-2xl overflow-hidden mb-5 p-1"
        style={{ background: "rgba(140,100,55,0.08)", border: "1px solid rgba(140,100,55,0.18)" }}>
        <button
          onClick={() => switchMode("ai")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
          style={{
            background: mode === "ai" ? "linear-gradient(135deg, #C24E6B, #A83050)" : "transparent",
            color: mode === "ai" ? "white" : "#9A7868",
            boxShadow: mode === "ai" ? "0 3px 12px rgba(194,78,107,0.35)" : "none",
          }}>
          <Sparkles className="h-4 w-4" /> Create with AI
        </button>
        <button
          onClick={() => switchMode("own")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
          style={{
            background: mode === "own" ? "linear-gradient(135deg, #84934F, #5A6E30)" : "transparent",
            color: mode === "own" ? "white" : "#9A7868",
            boxShadow: mode === "own" ? "0 3px 12px rgba(132,147,79,0.35)" : "none",
          }}>
          <BookOpen className="h-4 w-4" /> Add my own
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div className="flex items-center gap-1.5 mb-4">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                style={{
                  background: i < currentStep ? "#84934F" : i === currentStep ? (mode === "ai" ? "#C24E6B" : "#84934F") : "rgba(140,100,55,0.12)",
                  color: i <= currentStep ? "white" : "#9A7868",
                  boxShadow: i === currentStep ? `0 3px 10px rgba(${mode === "ai" ? "194,78,107" : "132,147,79"},0.35)` : "none",
                }}>
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span className="text-[9px] font-semibold whitespace-nowrap"
                style={{ color: i === currentStep ? (mode === "ai" ? "#C24E6B" : "#84934F") : i < currentStep ? "#84934F" : "#B0908A" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] rounded-full mt-[-12px] sm:mt-[-20px]"
                style={{ background: i < currentStep ? "#84934F" : "rgba(140,100,55,0.15)" }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Character tip ── */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl mb-5"
        style={{ background: "rgba(124,95,168,0.07)", border: "1px dashed rgba(124,95,168,0.22)" }}>
        <img src={mode === "ai" ? "/characters/char-yala-transparent.png" : "/characters/char-ashi-transparent.png"}
          alt={mode === "ai" ? "Yala" : "Ashi"}
          style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <p className="text-[12px] italic leading-snug" style={{ color: "#7C5FA8" }}>
          "{tips[Math.min(currentStep, tips.length - 1)]}"
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          AI WIZARD
      ═══════════════════════════════════════════════════════════════════════ */}
      {mode === "ai" && (
        <>
          {/* Step 0 — What are you making? */}
          {wizardStep === 0 && (
            <div>
              <div className="text-center mb-5">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>What are you making?</h2>
                <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>Pick a category to get started</p>
              </div>
              {CategoryPicker()}
            </div>
          )}

          {/* Step 1 — Details */}
          {wizardStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>Tell us about it</h2>
                <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>Describe your vision and skill level</p>
              </div>
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Describe your idea ✨</label>
                <textarea rows={4}
                  placeholder="e.g. A cosy sunflower bag for everyday use, in pastel yellow and green…"
                  value={formData.prompt}
                  onChange={e => setFormData(p => ({ ...p, prompt: e.target.value }))}
                  className="w-full p-4 rounded-2xl text-[13px] leading-relaxed outline-none resize-none transition-all"
                  style={{ background: "rgba(255,252,245,0.95)", border: "1.5px solid rgba(140,100,55,0.22)", color: "#3D2318" }} />
              </div>
              {SkillPicker()}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Approximate Size</label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map(sz => (
                    <button key={sz} onClick={() => setFormData(p => ({ ...p, size: sz }))}
                      className="px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: formData.size === sz ? "rgba(132,147,79,0.14)" : "rgba(255,252,245,0.9)",
                        border: `1.5px solid ${formData.size === sz ? "#84934F" : "rgba(140,100,55,0.18)"}`,
                        color: formData.size === sz ? "#84934F" : "#5C3A28",
                      }}>{sz}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Yarn & Colours */}
          {wizardStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>Yarn & Colours</h2>
                <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>Choose your materials (optional)</p>
              </div>
              {YarnPicker()}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>
                  Colour Palette
                  {wizardColors.length > 0 && <span className="ml-2 text-[11px] font-normal" style={{ color: "#9A7868" }}>({wizardColors.length} selected)</span>}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_PALETTE.map(c => (
                    <button key={c}
                      onClick={() => setWizardColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                      className="w-9 h-9 rounded-xl transition-all hover:scale-110 active:scale-95"
                      style={{
                        background: c,
                        border: wizardColors.includes(c) ? "3px solid #3D2318" : "2px solid rgba(255,255,255,0.6)",
                        boxShadow: wizardColors.includes(c) ? "0 0 0 2px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.2)" : "0 1px 4px rgba(0,0,0,0.12)",
                      }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Inspiration photo */}
          {wizardStep === 3 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>Inspiration Photo</h2>
                <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>Upload a reference image (optional)</p>
              </div>
              <div
                onClick={() => document.getElementById("wizard-file-input")?.click()}
                className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                style={{ borderColor: file ? "#84934F" : "rgba(140,100,55,0.35)", background: file ? "rgba(132,147,79,0.06)" : "rgba(255,252,245,0.7)", minHeight: 200 }}>
                <input id="wizard-file-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {file ? (
                  <div className="text-center px-4">
                    <span style={{ fontSize: 40 }}>🖼️</span>
                    <p className="font-semibold text-[14px] mt-2" style={{ color: "#84934F" }}>{file.name}</p>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }} className="text-[11px] mt-1 underline" style={{ color: "#9A7868" }}>Remove</button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: 44 }}>📸</span>
                    <div className="text-center">
                      <p className="font-heading font-semibold text-[14px]" style={{ color: "#5C3A28" }}>Drop a photo here</p>
                      <p className="text-[12px] mt-0.5" style={{ color: "#9A7868" }}>or tap to browse</p>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setWizardStep(4)}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                style={{ background: "rgba(140,100,55,0.08)", color: "#9A7868", border: "1px dashed rgba(140,100,55,0.25)" }}>
                Skip this step →
              </button>
            </div>
          )}

          {/* Step 4 — Review & Generate */}
          {wizardStep === 4 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>Ready to create!</h2>
                <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>Yala will craft your pattern ✨</p>
              </div>
              <div className="craft-card p-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-3 pb-2.5" style={{ borderBottom: "1px dashed rgba(140,100,55,0.2)" }}>
                  <span style={{ fontSize: 28 }}>{activeCategory?.emoji ?? "🧶"}</span>
                  <div>
                    <p className="font-heading font-bold text-[15px]" style={{ color: "#3D2318" }}>{formData.projectType || "—"}</p>
                    <p className="text-[11px]" style={{ color: "#9A7868" }}>{formData.skillLevel}</p>
                  </div>
                </div>
                {formData.prompt && (
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#B0908A" }}>Description</p>
                    <p className="text-[12.5px] leading-snug" style={{ color: "#5C3A28" }}>{formData.prompt}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.size && <span className="badge-green">{formData.size}</span>}
                  {formData.yarnType && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "rgba(212,146,26,0.12)", color: "#D4921A" }}>{formData.yarnType}</span>}
                  {wizardColors.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {wizardColors.slice(0, 5).map(c => (
                        <div key={c} className="w-4 h-4 rounded-full border-2 border-white" style={{ background: c, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                      ))}
                      {wizardColors.length > 5 && <span className="text-[10px]" style={{ color: "#9A7868" }}>+{wizardColors.length - 5}</span>}
                    </div>
                  )}
                  {file && <span className="text-[11px]" style={{ color: "#84934F" }}>📸 Reference image</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl" style={{ background: "rgba(124,95,168,0.08)", border: "1px dashed rgba(124,95,168,0.25)" }}>
                <img src="/characters/char-yala-transparent.png" alt="Yala"
                  style={{ width: 48, height: 48, objectFit: "contain" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <p className="text-[12px] italic leading-snug" style={{ color: "#7C5FA8" }}>
                  "I've got everything I need. Let me weave some magic for you!"
                </p>
              </div>
              <button onClick={handleGeneratePattern} disabled={isGenerating}
                className="w-full py-4 rounded-2xl font-heading font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: isGenerating ? "rgba(194,78,107,0.4)" : "linear-gradient(135deg, #C24E6B, #A83050)",
                  color: "white",
                  boxShadow: isGenerating ? "none" : "0 6px 24px rgba(194,78,107,0.4)",
                }}>
                {isGenerating ? <><span className="animate-spin">🧶</span> Generating…</> : <><Sparkles className="h-5 w-5" /> Generate with Yala</>}
              </button>
            </div>
          )}

          {/* AI nav */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setWizardStep(s => Math.max(0, s - 1))} disabled={wizardStep === 0}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-80 disabled:opacity-30"
              style={{ background: "rgba(140,100,55,0.09)", color: "#5C3A28" }}>← Back</button>
            {wizardStep < 4 && (
              <button onClick={() => canAdvance() && setWizardStep(s => s + 1)} disabled={!canAdvance()}
                className="px-6 py-2.5 rounded-xl font-heading font-bold text-[13px] transition-all hover:opacity-90 disabled:opacity-35"
                style={{
                  background: canAdvance() ? "linear-gradient(135deg, #C24E6B, #A83050)" : "rgba(140,100,55,0.12)",
                  color: canAdvance() ? "white" : "#9A7868",
                  boxShadow: canAdvance() ? "0 3px 12px rgba(194,78,107,0.35)" : "none",
                }}>
                {wizardStep === 3 ? "Review →" : "Next →"}
              </button>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          "ADD MY OWN" WIZARD
      ═══════════════════════════════════════════════════════════════════════ */}
      {mode === "own" && (
        <>
          {/* Step 0 — Name + Type */}
          {ownStep === 0 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>Name your pattern</h2>
                <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>What's it called and what type is it?</p>
              </div>
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Pattern name *</label>
                <input
                  type="text"
                  value={ownTitle}
                  onChange={e => setOwnTitle(e.target.value)}
                  placeholder="e.g. Mum's Granny Square Blanket"
                  className="w-full p-4 rounded-2xl text-[14px] outline-none transition-all"
                  style={{ background: "rgba(255,252,245,0.95)", border: `1.5px solid ${ownTitle.trim() ? "#84934F" : "rgba(140,100,55,0.22)"}`, color: "#3D2318" }}
                />
              </div>
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Pattern type *</label>
                {CategoryPicker()}
              </div>
            </div>
          )}

          {/* Step 1 — Details */}
          {ownStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>A few details</h2>
                <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>Helps with tracking and yarn recs</p>
              </div>
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>
                  Skill Level <span style={{ color: "#C24E6B" }}>*</span>
                </label>
                <div className="flex gap-2">
                  {SKILL_LEVELS.map((lvl) => (
                    <button key={lvl.id}
                      onClick={() => setFormData(p => ({ ...p, skillLevel: lvl.id }))}
                      className="flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all"
                      style={{
                        background: formData.skillLevel === lvl.id ? "rgba(194,78,107,0.10)" : "rgba(255,252,245,0.9)",
                        border: `1.5px solid ${formData.skillLevel === lvl.id ? "#C24E6B" : "rgba(140,100,55,0.18)"}`,
                      }}>
                      <span style={{ fontSize: 22 }}>{lvl.emoji}</span>
                      <span className="text-[11px] font-bold" style={{ color: formData.skillLevel === lvl.id ? "#C24E6B" : "#5C3A28" }}>{lvl.id}</span>
                      <span className="text-[9.5px] text-center" style={{ color: "#9A7868" }}>{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              {YarnPicker()}
              {SizePicker()}
            </div>
          )}

          {/* Step 2 — Paste + Save */}
          {ownStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>Paste your pattern</h2>
                <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>From a book, website, or your own notes</p>
              </div>

              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>
                  Pattern instructions <span className="font-normal" style={{ color: "#9A7868" }}>(optional)</span>
                </label>
                <textarea
                  rows={10}
                  placeholder={"Paste your pattern text here — rounds, rows, materials, anything.\n\nLeave blank to create an empty pattern you can fill in manually."}
                  value={ownRawText}
                  onChange={e => setOwnRawText(e.target.value)}
                  className="w-full p-4 rounded-2xl text-[13px] leading-relaxed outline-none resize-none"
                  style={{ background: "rgba(255,252,245,0.95)", border: "1.5px solid rgba(140,100,55,0.22)", color: "#3D2318" }}
                />
                {ownRawText.trim() && (
                  <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: "#84934F" }}>
                    ✨ AI will organise this into sections and steps for you
                  </p>
                )}
                {!ownRawText.trim() && (
                  <p className="text-[11px] mt-1.5" style={{ color: "#9A7868" }}>
                    No text? No problem — we'll create a blank pattern you can fill in as you go.
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="craft-card p-4 flex flex-col gap-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: "#B0908A" }}>Summary</p>
                <div className="flex items-center gap-2.5">
                  <span style={{ fontSize: 24 }}>{CATEGORIES.find(c => c.id === formData.projectType)?.emoji ?? "🧶"}</span>
                  <div>
                    <p className="font-heading font-bold text-[14px]" style={{ color: "#3D2318" }}>{ownTitle}</p>
                    <p className="text-[11px]" style={{ color: "#9A7868" }}>{formData.projectType} · {formData.skillLevel}{formData.yarnType ? ` · ${formData.yarnType}` : ""}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveOwn}
                disabled={ownParsing}
                className="w-full py-4 rounded-2xl font-heading font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: ownParsing ? "rgba(132,147,79,0.4)" : "linear-gradient(135deg, #84934F, #5A6E30)",
                  color: "white",
                  boxShadow: ownParsing ? "none" : "0 6px 24px rgba(132,147,79,0.4)",
                }}>
                {ownParsing
                  ? <><span className="animate-spin">🧶</span> {ownRawText.trim() ? "Organising your pattern…" : "Saving…"}</>
                  : <><Plus className="h-5 w-5" /> Add to my library</>}
              </button>
            </div>
          )}

          {/* Own nav */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setOwnStep(s => Math.max(0, s - 1))} disabled={ownStep === 0}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:opacity-80 disabled:opacity-30"
              style={{ background: "rgba(140,100,55,0.09)", color: "#5C3A28" }}>← Back</button>
            {ownStep < 2 && (
              <button onClick={() => ownCanAdvance() && setOwnStep(s => s + 1)} disabled={!ownCanAdvance()}
                className="px-6 py-2.5 rounded-xl font-heading font-bold text-[13px] transition-all hover:opacity-90 disabled:opacity-35"
                style={{
                  background: ownCanAdvance() ? "linear-gradient(135deg, #84934F, #5A6E30)" : "rgba(140,100,55,0.12)",
                  color: ownCanAdvance() ? "white" : "#9A7868",
                  boxShadow: ownCanAdvance() ? "0 3px 12px rgba(132,147,79,0.35)" : "none",
                }}>
                Next →
              </button>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default PatternInputRefactored;
