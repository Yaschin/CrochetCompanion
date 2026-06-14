import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Key, ExternalLink, AlertCircle, BookOpen, Plus, FileUp, ChevronRight } from 'lucide-react';
import { PatternInputFormData, Pattern } from '../lib/types';
import GenerationLoadingScreen from '../pages/GenerationLoadingScreen';

interface PatternInputProps {
  onPatternCreated: (pattern: Pattern, skipLoading?: boolean) => void;
  initialMode?: "ai" | "own" | "pdf";
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

const AI_STEPS  = ["Item", "Details", "Yarn & Colours", "Inspiration", "Review"];
const OWN_STEPS = ["Pattern", "Details", "Paste & Save"];
const PDF_STEPS = ["Upload", "Review"];

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

  // ── PDF import state ─────────────────────────────────────────────────────────
  const [pdfStep, setPdfStep]         = useState(0);
  const [pdfFiles, setPdfFiles]       = useState<File[]>([]);
  const [pdfParsing, setPdfParsing]   = useState(false);
  const [pdfResult, setPdfResult]     = useState<any>(null);
  const [pdfEditTitle, setPdfEditTitle] = useState("");
  const [pdfSaving, setPdfSaving]         = useState(false);
  const [pdfEditType, setPdfEditType]     = useState("");
  const [pdfEditSkill, setPdfEditSkill]   = useState("");
  const [pdfEditYarnType, setPdfEditYarnType] = useState("");
  const [pdfEditYarnReqs, setPdfEditYarnReqs] = useState<Array<{color: string; volume: string}>>([]);
  const [pdfEditHooks, setPdfEditHooks]   = useState<Array<{size: string; note: string}>>([]);
  const [pdfEditSections, setPdfEditSections] = useState<Array<{name: string; steps: Array<{instruction: string; count?: string}>}>>([]);
  const [pdfExpandedSec, setPdfExpandedSec]   = useState<number | null>(null);
  const [pdfLoadingMsgIdx, setPdfLoadingMsgIdx] = useState(0);

  const PDF_LOADING_MSGS = [
    "Reading your PDF…",
    "Finding the materials list…",
    "Spotting the stitch counts…",
    "Organising into sections…",
    "Checking yarn requirements…",
    "Almost ready…",
  ];

  useEffect(() => {
    if (!pdfParsing) { setPdfLoadingMsgIdx(0); return; }
    const id = setInterval(() => setPdfLoadingMsgIdx(i => (i + 1) % PDF_LOADING_MSGS.length), 2800);
    return () => clearInterval(id);
  }, [pdfParsing]);

  // Reset all wizards when switching mode
  const switchMode = (m: "ai" | "own" | "pdf") => {
    setMode(m);
    setWizardStep(0);
    setOwnStep(0);
    setPdfStep(0);
    setFormData({ prompt: '', projectType: '', skillLevel: '', yarnType: '', size: '' });
    setOwnTitle("");
    setOwnRawText("");
    setWizardColors([]);
    setFile(null);
    setPdfFiles([]);
    setPdfResult(null);
    setPdfEditTitle("");
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

  const parsePdfMutation = useMutation({
    mutationFn: async (filesBase64: string[]) => {
      const res = await apiRequest('POST', '/api/parse-pdf', { filesBase64 });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to process PDF');
      }
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

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
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

  // ── PDF handlers ─────────────────────────────────────────────────────────────
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const incoming = Array.from(e.target.files);
    const errors: string[] = [];
    const valid: File[] = [];
    for (const f of incoming) {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        errors.push(`${f.name} is not a PDF`); continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        errors.push(`${f.name} is over 10 MB`); continue;
      }
      valid.push(f);
    }
    if (errors.length) toast({ title: "Some files skipped", description: errors.join(' · '), variant: "destructive" });
    setPdfFiles(prev => {
      const combined = [...prev, ...valid];
      if (combined.length > 5) {
        toast({ title: "Max 5 PDFs", description: "Only the first 5 files will be used.", variant: "destructive" });
        return combined.slice(0, 5);
      }
      return combined;
    });
    e.target.value = "";
  };

  const handlePdfUpload = async () => {
    if (!pdfFiles.length) return;
    setPdfParsing(true);
    try {
      const allBase64 = await Promise.all(pdfFiles.map(fileToBase64));
      const result = await parsePdfMutation.mutateAsync(allBase64);
      setPdfResult(result);
      setPdfEditTitle(result.title || "Imported Pattern");
      setPdfEditType(result.projectType || "Other");
      setPdfEditSkill(result.skillLevel || "Beginner");
      setPdfEditYarnType(result.yarnType || "Not specified");
      setPdfEditYarnReqs(result.yarnRequirements || []);
      setPdfEditHooks(result.hookRequirements || []);
      setPdfEditSections(result.sections || []);
      setPdfExpandedSec(null);
      setPdfStep(1);
    } catch (err: any) {
      const raw = err.message || "Something went wrong.";
      const clean = raw.replace(/^API request failed \(\d+\):\s*/i, "");
      toast({
        title: "Couldn't read PDF",
        description: clean || "Try 'Add my own' and paste the text manually.",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setPdfParsing(false);
    }
  };

  const handlePdfSave = async () => {
    if (!pdfResult) return;
    setPdfSaving(true);
    try {
      const title = pdfEditTitle.trim() || pdfResult.title || "Imported Pattern";
      const merged = {
        ...pdfResult,
        title,
        projectType: pdfEditType || "Other",
        skillLevel:  pdfEditSkill || "Beginner",
        yarnType:    pdfEditYarnType === "Not specified" ? "" : (pdfEditYarnType || ""),
        yarnRequirements: pdfEditYarnReqs.filter(y => y.color.trim()),
        hookRequirements: pdfEditHooks.filter(h => h.size.trim()),
        sections:    pdfEditSections,
      };
      const patternToSave = buildPatternToSave(
        merged,
        {
          prompt: title,
          projectType: merged.projectType,
          skillLevel:  merged.skillLevel,
          yarnType:    merged.yarnType,
          size: "",
        },
        undefined,
      );
      const savedPattern = await savePatternMutation.mutateAsync(patternToSave);
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      onPatternCreated(savedPattern, true);
      toast({
        title: "Pattern imported! 🎉",
        description: `"${savedPattern.title}" is now in your library. Tap any step to edit it.`,
        duration: 6000,
      });
    } catch (err) {
      console.error('Error saving PDF pattern:', err);
      toast({ title: "Couldn't save", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setPdfSaving(false);
    }
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
      handleGenerationError(error);
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
  const PDF_TIPS = [
    "Upload a PDF from Etsy, Ravelry or anywhere — I'll read it and organise it for you 📄",
    "Check the title and details look right, then save to your library 🎉",
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
  const steps       = mode === "ai" ? AI_STEPS  : mode === "own" ? OWN_STEPS : PDF_STEPS;
  const currentStep = mode === "ai" ? wizardStep : mode === "own" ? ownStep : pdfStep;
  const tips        = mode === "ai" ? AI_TIPS    : mode === "own" ? OWN_TIPS : PDF_TIPS;

  const modeAccent = mode === "ai" ? "#C24E6B" : mode === "own" ? "#84934F" : "#3D8FA3";
  const modeAccentRgb = mode === "ai" ? "194,78,107" : mode === "own" ? "132,147,79" : "61,143,163";
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
            background: mode === "ai" ? "linear-gradient(135deg, #C24E6B, #A83050)" : "transparent",
            color: mode === "ai" ? "white" : "#9A7868",
            boxShadow: mode === "ai" ? "0 3px 12px rgba(194,78,107,0.35)" : "none",
          }}>
          <Sparkles className="h-3.5 w-3.5" /> Create with AI
        </button>
        <button
          onClick={() => switchMode("own")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: mode === "own" ? "linear-gradient(135deg, #84934F, #5A6E30)" : "transparent",
            color: mode === "own" ? "white" : "#9A7868",
            boxShadow: mode === "own" ? "0 3px 12px rgba(132,147,79,0.35)" : "none",
          }}>
          <BookOpen className="h-3.5 w-3.5" /> Add my own
        </button>
        <button
          onClick={() => switchMode("pdf")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: mode === "pdf" ? "linear-gradient(135deg, #3D8FA3, #2A6B7D)" : "transparent",
            color: mode === "pdf" ? "white" : "#9A7868",
            boxShadow: mode === "pdf" ? "0 3px 12px rgba(61,143,163,0.35)" : "none",
          }}>
          <FileUp className="h-3.5 w-3.5" /> Import PDF
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div className="flex items-center gap-1.5 mb-4">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                style={{
                  background: i < currentStep ? "#84934F" : i === currentStep ? modeAccent : "rgba(140,100,55,0.12)",
                  color: i <= currentStep ? "white" : "#9A7868",
                  boxShadow: i === currentStep ? `0 3px 10px rgba(${modeAccentRgb},0.35)` : "none",
                }}>
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span className="text-[9px] font-semibold whitespace-nowrap"
                style={{ color: i === currentStep ? modeAccent : i < currentStep ? "#84934F" : "#B0908A" }}>
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
        <img src={charImg} alt="Helper"
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

      {/* ═══════════════════════════════════════════════════════════════════════
          IMPORT PDF WIZARD
      ═══════════════════════════════════════════════════════════════════════ */}
      {mode === "pdf" && (
        <>
          {/* Step 0 — Upload */}
          {pdfStep === 0 && (
            <div className="flex flex-col gap-4">

              {/* ── Aloo loading card (shown while processing) ── */}
              {pdfParsing ? (
                <div className="flex flex-col items-center gap-5 py-8 px-4">
                  {/* Aloo with bounce animation */}
                  <div style={{ animation: "alooFloat 2s ease-in-out infinite" }}>
                    <img
                      src="/characters/char-aloo-transparent.png"
                      alt="Aloo is reading your pattern"
                      style={{ width: 110, height: 110, objectFit: "contain" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>

                  <div className="text-center">
                    <p className="font-heading font-bold text-[18px] mb-1" style={{ color: "#3D2318" }}>
                      Aloo is on it!
                    </p>
                    <p className="text-[14px] transition-all duration-700" style={{ color: "#3D8FA3" }}>
                      {PDF_LOADING_MSGS[pdfLoadingMsgIdx]}
                    </p>
                  </div>

                  {/* Animated dots */}
                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background: "#3D8FA3",
                          opacity: 0.3 + (pdfLoadingMsgIdx % 3 === i ? 0.7 : 0),
                          transform: pdfLoadingMsgIdx % 3 === i ? "scale(1.4)" : "scale(1)",
                          transition: "all 0.4s ease",
                        }} />
                    ))}
                  </div>

                  <p className="text-[11px] text-center" style={{ color: "#B0908A" }}>
                    This usually takes 10–30 seconds
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-1">
                    <h2 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>Upload your PDF</h2>
                    <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>From Etsy, Ravelry, a blog — anywhere</p>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => document.getElementById("pdf-file-input")?.click()}
                    className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                    style={{
                      borderColor: pdfFiles.length ? "#3D8FA3" : "rgba(61,143,163,0.40)",
                      background: pdfFiles.length ? "rgba(61,143,163,0.06)" : "rgba(255,252,245,0.7)",
                      minHeight: pdfFiles.length ? "auto" : 180,
                      padding: pdfFiles.length ? "14px 16px" : "24px 16px",
                    }}>
                    <input
                      id="pdf-file-input"
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      className="hidden"
                      onChange={handlePdfFileChange}
                    />
                    {pdfFiles.length > 0 ? (
                      <div className="w-full flex flex-col gap-2">
                        {pdfFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                            style={{ background: "rgba(61,143,163,0.10)" }}>
                            <span style={{ fontSize: 20, flexShrink: 0 }}>📄</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[12px] truncate" style={{ color: "#2A6B7D" }}>{f.name}</p>
                              <p className="text-[10px]" style={{ color: "#9A7868" }}>{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); setPdfFiles(prev => prev.filter((_, j) => j !== i)); }}
                              className="flex-shrink-0 text-[11px] px-2 py-0.5 rounded-lg hover:opacity-75"
                              style={{ color: "#9A7868", background: "rgba(0,0,0,0.06)" }}>
                              ✕
                            </button>
                          </div>
                        ))}
                        {pdfFiles.length < 5 && (
                          <div className="flex items-center justify-center gap-1.5 pt-1"
                            style={{ color: "#3D8FA3", fontSize: 12, fontWeight: 600 }}>
                            <FileUp className="h-3.5 w-3.5" /> Add another PDF
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <FileUp className="h-10 w-10" style={{ color: "rgba(61,143,163,0.55)" }} />
                        <div className="text-center">
                          <p className="font-heading font-semibold text-[14px]" style={{ color: "#5C3A28" }}>Tap to choose PDFs</p>
                          <p className="text-[12px] mt-0.5" style={{ color: "#9A7868" }}>Up to 5 files · 10 MB each · Text-based only</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Personal use note */}
                  <p className="text-[11px] text-center" style={{ color: "#B0908A" }}>
                    📋 Imported patterns are for your personal use only
                  </p>

                  <button
                    onClick={handlePdfUpload}
                    disabled={!pdfFiles.length}
                    className="w-full py-4 rounded-2xl font-heading font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: !pdfFiles.length ? "rgba(61,143,163,0.35)" : "linear-gradient(135deg, #3D8FA3, #2A6B7D)",
                      color: "white",
                      boxShadow: !pdfFiles.length ? "none" : "0 6px 24px rgba(61,143,163,0.38)",
                    }}>
                    <FileUp className="h-5 w-5" />
                    {pdfFiles.length > 1 ? `Read & Extract (${pdfFiles.length} PDFs)` : "Read & Extract Pattern"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 1 — Review & Edit */}
          {pdfStep === 1 && pdfResult && (
            <div className="flex flex-col gap-5">
              <div className="text-center mb-1">
                <h2 className="font-heading font-bold text-[22px]" style={{ color: "#3D2318" }}>Review & edit</h2>
                <p className="text-[13px] mt-1" style={{ color: "#9A7868" }}>Fix anything the AI got wrong before saving</p>
              </div>

              {/* Import banner */}
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl"
                style={{ background: "rgba(61,143,163,0.09)", border: "1px solid rgba(61,143,163,0.28)" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
                <p className="text-[12px] leading-snug" style={{ color: "#2A6B7D" }}>
                  <strong>From:</strong> {pdfFiles.map(f => f.name).join(', ')} · Diagrams weren't imported, only written instructions.
                </p>
              </div>

              {/* ── Title ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Pattern name</label>
                <input
                  type="text"
                  value={pdfEditTitle}
                  onChange={e => setPdfEditTitle(e.target.value)}
                  placeholder="Pattern name…"
                  className="w-full p-3.5 rounded-2xl text-[14px] outline-none"
                  style={{
                    background: "rgba(255,252,245,0.95)",
                    border: `1.5px solid ${pdfEditTitle.trim() ? "#3D8FA3" : "rgba(140,100,55,0.22)"}`,
                    color: "#3D2318",
                  }}
                />
              </div>

              {/* ── Project type ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Type</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setPdfEditType(c.id)}
                      className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                      style={{
                        background: pdfEditType === c.id ? c.color : "rgba(140,100,55,0.08)",
                        color: pdfEditType === c.id ? "white" : "#7A5A4A",
                        border: pdfEditType === c.id ? "none" : "1.5px solid rgba(140,100,55,0.15)",
                      }}>
                      {c.emoji} {c.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Skill level ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Skill level</label>
                <div className="flex gap-2">
                  {SKILL_LEVELS.map(s => (
                    <button key={s.id} onClick={() => setPdfEditSkill(s.id)}
                      className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: pdfEditSkill === s.id ? "#3D2318" : "rgba(140,100,55,0.08)",
                        color: pdfEditSkill === s.id ? "white" : "#7A5A4A",
                        border: pdfEditSkill === s.id ? "none" : "1.5px solid rgba(140,100,55,0.15)",
                      }}>
                      {s.emoji} {s.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Yarn type ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>Yarn type</label>
                <div className="flex gap-1.5 flex-wrap">
                  {YARN_TYPES.map(yt => (
                    <button key={yt} onClick={() => setPdfEditYarnType(yt)}
                      className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
                      style={{
                        background: pdfEditYarnType === yt ? "#D4921A" : "rgba(140,100,55,0.08)",
                        color: pdfEditYarnType === yt ? "white" : "#7A5A4A",
                        border: pdfEditYarnType === yt ? "none" : "1.5px solid rgba(140,100,55,0.15)",
                      }}>
                      {yt}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Yarn requirements ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-heading font-semibold text-[13px]" style={{ color: "#5C3A28" }}>Yarn needed</label>
                  <button onClick={() => setPdfEditYarnReqs(p => [...p, { color: "", volume: "" }])}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(61,143,163,0.12)", color: "#2A6B7D" }}>
                    + Add
                  </button>
                </div>
                {pdfEditYarnReqs.length === 0 && (
                  <p className="text-[12px] italic" style={{ color: "#B0908A" }}>Nothing detected — tap + Add to add yarn</p>
                )}
                {pdfEditYarnReqs.map((y, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <input value={y.color}
                      onChange={e => setPdfEditYarnReqs(p => p.map((r, j) => j === i ? { ...r, color: e.target.value } : r))}
                      placeholder="Colour / name"
                      className="flex-1 p-2.5 rounded-xl text-[12px] outline-none"
                      style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.18)", color: "#3D2318" }} />
                    <input value={y.volume}
                      onChange={e => setPdfEditYarnReqs(p => p.map((r, j) => j === i ? { ...r, volume: e.target.value } : r))}
                      placeholder="Amount (e.g. 50g)"
                      className="w-28 p-2.5 rounded-xl text-[12px] outline-none"
                      style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.18)", color: "#3D2318" }} />
                    <button onClick={() => setPdfEditYarnReqs(p => p.filter((_, j) => j !== i))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[15px] font-bold"
                      style={{ background: "rgba(194,78,107,0.12)", color: "#C24E6B" }}>×</button>
                  </div>
                ))}
              </div>

              {/* ── Hook requirements ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-heading font-semibold text-[13px]" style={{ color: "#5C3A28" }}>Hook size</label>
                  <button onClick={() => setPdfEditHooks(p => [...p, { size: "", note: "" }])}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(61,143,163,0.12)", color: "#2A6B7D" }}>
                    + Add
                  </button>
                </div>
                {pdfEditHooks.length === 0 && (
                  <p className="text-[12px] italic" style={{ color: "#B0908A" }}>Nothing detected — tap + Add to add a hook</p>
                )}
                {pdfEditHooks.map((h, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <input value={h.size}
                      onChange={e => setPdfEditHooks(p => p.map((r, j) => j === i ? { ...r, size: e.target.value } : r))}
                      placeholder="e.g. 4.0mm"
                      className="w-28 p-2.5 rounded-xl text-[12px] outline-none"
                      style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.18)", color: "#3D2318" }} />
                    <input value={h.note}
                      onChange={e => setPdfEditHooks(p => p.map((r, j) => j === i ? { ...r, note: e.target.value } : r))}
                      placeholder="Note (optional)"
                      className="flex-1 p-2.5 rounded-xl text-[12px] outline-none"
                      style={{ background: "rgba(255,252,245,0.9)", border: "1.5px solid rgba(140,100,55,0.18)", color: "#3D2318" }} />
                    <button onClick={() => setPdfEditHooks(p => p.filter((_, j) => j !== i))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[15px] font-bold"
                      style={{ background: "rgba(194,78,107,0.12)", color: "#C24E6B" }}>×</button>
                  </div>
                ))}
              </div>

              {/* ── Sections & steps ── */}
              <div>
                <label className="block font-heading font-semibold text-[13px] mb-2" style={{ color: "#5C3A28" }}>
                  Sections & steps
                  <span className="ml-1.5 font-normal text-[11px]" style={{ color: "#9A7868" }}>tap a section to edit its steps</span>
                </label>
                {pdfEditSections.map((sec, si) => (
                  <div key={si} className="mb-2 rounded-2xl overflow-hidden"
                    style={{ border: "1.5px solid rgba(140,100,55,0.18)" }}>
                    {/* Section header row */}
                    <div className="flex items-center gap-2 px-3 py-2.5"
                      style={{ background: pdfExpandedSec === si ? "rgba(61,143,163,0.08)" : "rgba(255,252,245,0.7)" }}>
                      <span className="text-[11px] font-bold flex-shrink-0" style={{ color: "#3D8FA3" }}>§{si + 1}</span>
                      <input
                        value={sec.name}
                        onChange={e => setPdfEditSections(p => p.map((s, j) => j === si ? { ...s, name: e.target.value } : s))}
                        className="flex-1 bg-transparent outline-none text-[13px] font-semibold"
                        style={{ color: "#3D2318" }}
                        placeholder="Section name"
                      />
                      <button
                        onClick={() => setPdfExpandedSec(pdfExpandedSec === si ? null : si)}
                        className="flex items-center gap-1 flex-shrink-0"
                        style={{ color: "#9A7868" }}>
                        <span className="text-[10px]">{sec.steps?.length ?? 0} steps</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform"
                          style={{ transform: pdfExpandedSec === si ? "rotate(90deg)" : "rotate(0deg)" }} />
                      </button>
                      <button onClick={() => { setPdfEditSections(p => p.filter((_, j) => j !== si)); if (pdfExpandedSec === si) setPdfExpandedSec(null); }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                        style={{ background: "rgba(194,78,107,0.10)", color: "#C24E6B" }}>×</button>
                    </div>

                    {/* Steps (expanded) */}
                    {pdfExpandedSec === si && (
                      <div className="px-3 py-3 flex flex-col gap-2"
                        style={{ background: "rgba(255,252,245,0.5)", borderTop: "1px solid rgba(140,100,55,0.10)" }}>
                        {(sec.steps || []).map((step: any, sti: number) => (
                          <div key={sti} className="flex gap-2 items-start">
                            <span className="text-[10px] font-semibold mt-2.5 w-4 text-right flex-shrink-0" style={{ color: "#B0908A" }}>{sti + 1}</span>
                            <textarea
                              value={step.instruction}
                              onChange={e => setPdfEditSections(p => p.map((s, j) => j === si
                                ? { ...s, steps: s.steps.map((st: any, k: number) => k === sti ? { ...st, instruction: e.target.value } : st) }
                                : s))}
                              rows={2}
                              className="flex-1 p-2 rounded-xl text-[12px] outline-none resize-none leading-snug"
                              style={{ background: "rgba(255,252,245,0.95)", border: "1.5px solid rgba(140,100,55,0.15)", color: "#3D2318" }}
                            />
                            <button
                              onClick={() => setPdfEditSections(p => p.map((s, j) => j === si
                                ? { ...s, steps: s.steps.filter((_: any, k: number) => k !== sti) }
                                : s))}
                              className="w-6 h-6 mt-1.5 rounded-lg flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                              style={{ background: "rgba(194,78,107,0.10)", color: "#C24E6B" }}>×</button>
                          </div>
                        ))}
                        <button
                          onClick={() => setPdfEditSections(p => p.map((s, j) => j === si
                            ? { ...s, steps: [...(s.steps || []), { instruction: "", count: "" }] }
                            : s))}
                          className="text-[11px] font-semibold py-1.5 rounded-xl w-full"
                          style={{ background: "rgba(61,143,163,0.10)", color: "#2A6B7D" }}>
                          + Add step
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => { setPdfEditSections(p => [...p, { name: "New section", steps: [{ instruction: "", count: "" }] }]); setPdfExpandedSec(pdfEditSections.length); }}
                  className="w-full py-2 rounded-xl text-[12px] font-semibold mt-1"
                  style={{ background: "rgba(140,100,55,0.06)", color: "#9A7868", border: "1.5px dashed rgba(140,100,55,0.22)" }}>
                  + Add section
                </button>
              </div>

              <button
                onClick={handlePdfSave}
                disabled={pdfSaving || !pdfEditTitle.trim()}
                className="w-full py-4 rounded-2xl font-heading font-bold text-[16px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: pdfSaving ? "rgba(61,143,163,0.35)" : "linear-gradient(135deg, #3D8FA3, #2A6B7D)",
                  color: "white",
                  boxShadow: pdfSaving ? "none" : "0 6px 24px rgba(61,143,163,0.38)",
                }}>
                {pdfSaving
                  ? <><span className="animate-spin">🧶</span> Saving…</>
                  : <><Plus className="h-5 w-5" /> Save to my library</>}
              </button>

              <button
                onClick={() => { setPdfStep(0); setPdfResult(null); setPdfFiles([]); }}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: "rgba(140,100,55,0.08)", color: "#9A7868" }}>
                ← Try a different PDF
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default PatternInputRefactored;
