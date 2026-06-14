import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { ViewType, Pattern } from "../lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommunitySubmitScreenProps {
  onNavigate: (view: ViewType) => void;
  initialPattern?: Pattern;
}

const STEPS = ["Details", "Photos", "Pattern", "Review"];

export default function CommunitySubmitScreen({ onNavigate, initialPattern }: CommunitySubmitScreenProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: initialPattern?.title ?? "",
    category: initialPattern?.projectType ?? "Accessory",
    skillLevel: initialPattern?.skillLevel ?? "Easy",
    yarnWeight: initialPattern?.yarnType ?? "DK (Light Worsted)",
    description: initialPattern?.description ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { toast } = useToast();
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(
    initialPattern?.endProductImage && !initialPattern.endProductImage.includes("placehold")
      ? initialPattern.endProductImage
      : null
  );
  const [patternText, setPatternText] = useState(
    initialPattern
      ? initialPattern.sections
          .filter(s => s.name.toLowerCase() !== "materials")
          .flatMap(s => [`## ${s.name}`, ...s.steps.map(st => st.text)])
          .join("\n")
      : ""
  );

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Turn the pasted pattern text into a usable single section of steps.
      const lines = patternText.split("\n").map(l => l.trim()).filter(Boolean);
      const steps = (lines.length ? lines : [form.description || "See description."]).map((text, i) => ({
        id: i + 1, text, locked: false, count: 0, notes: "", photo: null, completed: false,
      }));
      const body = {
        title: form.name,
        projectType: form.category,
        skillLevel: form.skillLevel,
        description: form.description,
        yarnType: form.yarnWeight,
        endProductImage: photoDataUrl || undefined,
        sections: [{ name: form.name || "Pattern", notes: "", locked: false, steps }],
      };
      const res = await apiRequest("POST", "/api/community", body);
      if (!res.ok) throw new Error("submit failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      toast({ title: "Pattern shared! ✨", description: "Your pattern is now in the Community Library." });
      onNavigate("community");
    },
    onError: () => toast({ title: "Could not share pattern", description: "Please add a name and try again.", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid rgba(140,100,55,0.12)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => step === 0 ? onNavigate(initialPattern ? "pattern-detail" : "community") : setStep(s => s - 1)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: "rgba(140,100,55,0.08)", color: "#6B4B38" }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-[18px]" style={{ color: "#3D2318" }}>
              Share Your Pattern
            </h1>
          </div>
        </div>
        <span className="text-[12px] font-semibold" style={{ color: "#9A7868" }}>
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all"
                  style={{
                    background: i === step ? "#C24E6B" : i < step ? "#84934F" : "rgba(140,100,55,0.12)",
                    color: i <= step ? "white" : "#9A7868",
                  }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="text-[9px] font-semibold" style={{ color: i === step ? "#C24E6B" : "#9A7868" }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mb-4" style={{ background: i < step ? "#84934F" : "rgba(140,100,55,0.15)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="relative">
          {/* Step 1: Details */}
          {step === 0 && (
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-bold mb-1.5 block" style={{ color: "#6B4B38" }}>Pattern Name</label>
                  <input
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                    style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.22)", color: "#3D2318" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold mb-1.5 block" style={{ color: "#6B4B38" }}>Category</label>
                    <select
                      value={form.category}
                      onChange={e => set("category", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none appearance-none"
                      style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.22)", color: "#3D2318" }}>
                      {["Toy", "Wearable", "Home Decor", "Accessory", "Other"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold mb-1.5 block" style={{ color: "#6B4B38" }}>Skill Level</label>
                    <select
                      value={form.skillLevel}
                      onChange={e => set("skillLevel", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none appearance-none"
                      style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.22)", color: "#3D2318" }}>
                      {["Easy", "Intermediate", "Advanced"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold mb-1.5 block" style={{ color: "#6B4B38" }}>Yarn Weight</label>
                  <select
                    value={form.yarnWeight}
                    onChange={e => set("yarnWeight", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none appearance-none"
                    style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.22)", color: "#3D2318" }}>
                    {["Lace", "Fingering", "DK (Light Worsted)", "Worsted", "Chunky"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold mb-1.5 block" style={{ color: "#6B4B38" }}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                    maxLength={100}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                    style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.22)", color: "#3D2318" }}
                  />
                  <p className="text-[10px] text-right mt-0.5" style={{ color: "#B0908A" }}>
                    {form.description.length}/100
                  </p>
                </div>
              </div>

              {/* Sheep mascot */}
              <div className="flex-shrink-0 w-28 flex flex-col items-center gap-2 pt-2">
                <img
                  src="/characters/char-sheep-transparent.png"
                  alt="Sheep"
                  className="w-full object-contain"
                  style={{ filter: "drop-shadow(0 4px 12px rgba(80,40,10,0.18))" }}
                />
                <p className="text-[10px] text-center font-semibold" style={{ color: "#9A7868" }}>
                  Share your creativity with the community!
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4 items-center py-8">
              {photoDataUrl ? (
                <div className="relative w-full">
                  <img src={photoDataUrl} alt="Preview" className="w-full max-h-64 object-contain rounded-2xl"
                    style={{ background: "rgba(255,252,245,0.6)" }} />
                  <button onClick={() => setPhotoDataUrl(null)}
                    className="absolute top-2 right-2 px-3 py-1 rounded-full text-[12px] font-semibold"
                    style={{ background: "rgba(0,0,0,0.55)", color: "white" }}>
                    Remove
                  </button>
                </div>
              ) : (
                <label className="w-full rounded-2xl border-2 border-dashed py-12 flex flex-col items-center gap-3 cursor-pointer"
                  style={{ borderColor: "rgba(140,100,55,0.3)", background: "rgba(255,252,245,0.6)" }}>
                  <div className="text-3xl">📷</div>
                  <p className="font-heading font-semibold text-[14px]" style={{ color: "#6B4B38" }}>Add a Photo</p>
                  <p className="text-[12px]" style={{ color: "#9A7868" }}>Tap to upload your finished project</p>
                  <span className="mt-2 px-5 py-2 rounded-full font-semibold text-[12px]"
                    style={{ background: "rgba(194,78,107,0.1)", color: "#C24E6B", border: "1px solid rgba(194,78,107,0.3)" }}>
                    Choose Photo
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
                </label>
              )}
              <p className="text-[11.5px] text-center" style={{ color: "#9A7868" }}>
                A finished project photo helps others picture the result (optional).
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3 py-4 items-center">
              <div className="text-4xl">📝</div>
              <p className="font-heading font-semibold text-[16px]" style={{ color: "#3D2318" }}>Add Your Pattern</p>
              <p className="text-[13px] text-center" style={{ color: "#9A7868" }}>
                Paste your written pattern
              </p>
              <textarea
                value={patternText}
                onChange={e => setPatternText(e.target.value)}
                placeholder={"Round 1: 6 sc in magic ring (6)\nRound 2: inc in each st (12)\n..."}
                rows={8}
                className="w-full px-4 py-3 rounded-2xl text-[12px] outline-none resize-none mt-2"
                style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.22)", color: "#3D2318", fontFamily: "monospace" }}
              />
              <p className="text-[11px] text-center" style={{ color: "#9A7868" }}>
                Each line becomes a step. You can refine it later from your library.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,252,245,0.9)", border: "1px solid rgba(140,100,55,0.15)" }}>
                <p className="font-heading font-bold text-[14px] mb-3" style={{ color: "#3D2318" }}>Review Your Submission</p>
                {[
                  ["Pattern Name", form.name],
                  ["Category", form.category],
                  ["Skill Level", form.skillLevel],
                  ["Yarn Weight", form.yarnWeight],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2" style={{ borderBottom: "1px solid rgba(140,100,55,0.1)" }}>
                    <span className="text-[12px] font-semibold" style={{ color: "#9A7868" }}>{k}</span>
                    <span className="text-[12px] font-bold" style={{ color: "#3D2318" }}>{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-center" style={{ color: "#9A7868" }}>
                By submitting, you agree to share this pattern with the Crochet Time community.
              </p>
            </div>
          )}
        </div>

        {/* Next button */}
        <button
          onClick={() => {
            if (step === 0 && !form.name.trim()) {
              toast({ title: "Pattern name required", description: "Please enter a name before continuing.", variant: "destructive" });
              return;
            }
            if (step === 2 && !patternText.trim()) {
              toast({ title: "Pattern text required", description: "Paste at least a few rows of your pattern before continuing.", variant: "destructive" });
              return;
            }
            step < STEPS.length - 1 ? setStep(s => s + 1) : submitMutation.mutate();
          }}
          disabled={submitMutation.isPending}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px] transition-all hover:opacity-90 mt-2 disabled:opacity-50"
          style={{ background: "#C24E6B", color: "white", boxShadow: "0 4px 20px rgba(194,78,107,0.4)" }}>
          {step < STEPS.length - 1 ? (
            <>Next: {STEPS[step + 1]} <ChevronRight className="h-4 w-4" /></>
          ) : (
            submitMutation.isPending ? "Sharing…" : "Submit Pattern ✨"
          )}
        </button>
      </div>
    </div>
  );
}
