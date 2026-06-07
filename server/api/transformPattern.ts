import OpenAI from "openai";

/**
 * Phase 2 — connective intelligence: transform an existing pattern with AI.
 *  - "resize": scale stitch/round counts so the finished piece changes size.
 *  - "substitute": swap the yarn weight and adjust hook size / amounts / gauge.
 *
 * Mirrors generatePattern.ts (same model + JSON-object response + retry). The
 * result is a NEW pattern object (Omit<Pattern,"id"|"createdAt">-shaped) so the
 * caller can save it non-destructively.
 *
 * NOTE: drafted without a live key — the prompts will likely want tuning once
 * they can be run against real OpenAI output.
 */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const API_KEY_VALID = /^sk-[A-Za-z0-9_\-+/]{32,}$/.test(OPENAI_API_KEY.trim());
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4.1";
const openai = OPENAI_API_KEY && API_KEY_VALID ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export type TransformMode = "resize" | "substitute";

function normalizeSections(sections: any[]): any[] {
  let nextId = 1;
  return (Array.isArray(sections) ? sections : []).map((s: any) => ({
    name: String(s?.name ?? "Section"),
    notes: typeof s?.notes === "string" ? s.notes : "",
    locked: false,
    partImageUrl: null,
    steps: (Array.isArray(s?.steps) ? s.steps : []).map((st: any) => ({
      id: typeof st?.id === "number" ? st.id : nextId++,
      text: String(st?.text ?? ""),
      locked: false,
      count: 0,
      notes: "",
      photo: null,
      aiStepImage: null,
      completed: false,
    })),
  }));
}

export async function transformPattern(pattern: any, mode: TransformMode, instruction: string): Promise<any> {
  if (!openai) {
    throw new Error("OpenAI API key is missing or invalid. Add OPENAI_API_KEY to adapt patterns.");
  }

  const modeGuidance =
    mode === "resize"
      ? `Resize the pattern as requested ("${instruction}"). Scale stitch counts, round/row counts, and repeats proportionally so the finished piece changes size accordingly, while keeping the same construction, sections, and techniques. Recalculate the finished size and yarn amount estimates. Keep the stitch pattern recognisable and the maths self-consistent (e.g. increases still total correctly).`
      : `Substitute the yarn as requested ("${instruction}"). Change the recommended yarn weight to the requested one, adjust the recommended hook size to suit that weight, and update yarn amount estimates. Keep the stitch instructions and counts the same — the finished size will change with the new yarn/hook, so note the approximate new finished size and add a short gauge note in the relevant section's notes.`;

  const system = `You are an expert crochet pattern designer. You will receive an existing crochet pattern as JSON plus a transformation request. Apply the transformation and return the COMPLETE updated pattern as JSON in the SAME structure.

${modeGuidance}

Use standard crochet terms (SC, MR, INC, DEC). Keep the sections and their order. Return ONLY JSON of this shape:
{
  "title": "Updated title",
  "size": "New finished size",
  "yarnType": "Yarn weight/type",
  "description": "One or two sentences describing the adapted pattern",
  "sections": [ { "name": "...", "notes": "", "locked": false, "steps": [ { "id": 1, "text": "..." } ] } ],
  "yarnRequirements": [ { "color": "", "volume": "" } ],
  "hookRequirements": [ { "size": "", "quantity": 1, "note": "" } ],
  "notionsRequirements": [ { "name": "", "description": "", "quantity": 1 } ],
  "toolRequirements": [ { "name": "", "description": "" } ],
  "needsStuffing": ""
}`;

  const compact = {
    title: pattern.title,
    projectType: pattern.projectType,
    skillLevel: pattern.skillLevel,
    yarnType: pattern.yarnType,
    size: pattern.size,
    description: pattern.description,
    sections: pattern.sections,
    yarnRequirements: pattern.yarnRequirements,
    hookRequirements: pattern.hookRequirements,
    notionsRequirements: pattern.notionsRequirements,
    toolRequirements: pattern.toolRequirements,
    needsStuffing: pattern.needsStuffing,
  };
  const user = `Existing pattern JSON:\n${JSON.stringify(compact)}\n\nTransformation request: ${instruction}`;

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      const response = await openai.chat.completions.create({
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      });
      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error("OpenAI returned an empty response");
      const out = JSON.parse(content);
      if (!out.title || !Array.isArray(out.sections)) {
        throw new Error("AI response missing required fields (title, sections)");
      }
      return {
        title: out.title,
        projectType: pattern.projectType,
        skillLevel: pattern.skillLevel,
        yarnType: out.yarnType ?? pattern.yarnType,
        size: out.size ?? pattern.size,
        description: out.description ?? pattern.description ?? "",
        materialsNotes: pattern.materialsNotes ?? "",
        sections: normalizeSections(out.sections),
        yarnRequirements: Array.isArray(out.yarnRequirements) ? out.yarnRequirements : pattern.yarnRequirements ?? [],
        hookRequirements: Array.isArray(out.hookRequirements) ? out.hookRequirements : pattern.hookRequirements ?? [],
        notionsRequirements: Array.isArray(out.notionsRequirements) ? out.notionsRequirements : pattern.notionsRequirements ?? [],
        toolRequirements: Array.isArray(out.toolRequirements) ? out.toolRequirements : pattern.toolRequirements ?? [],
        needsStuffing: out.needsStuffing ?? pattern.needsStuffing ?? "",
        favorite: false,
        status: "pattern",
      };
    } catch (error) {
      lastError = error;
      const msg = String(error);
      const retryable = /429|rate limit|ECONNREFUSED|ETIMEDOUT|timeout|socket hang up|network/i.test(msg);
      if (!retryable || attempt === 2) {
        throw new Error(`Failed to adapt pattern: ${msg}`);
      }
    }
  }
  throw new Error(`Failed to adapt pattern: ${String(lastError)}`);
}
