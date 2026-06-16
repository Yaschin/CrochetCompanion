import { Pattern, PatternInputFormData } from "@/lib/types";

export const fileToDataUrl = (f: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

export const fileToBase64 = (f: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

// ── Shared helper: normalise parsed data → save payload ─────────────────────
export function buildPatternToSave(
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
