import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const API_KEY_AVAILABLE = Boolean(OPENAI_API_KEY);
const API_KEY_VALID_FORMAT = /^sk-[A-Za-z0-9_\-+/]{32,}$/.test(OPENAI_API_KEY.trim());

const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4.1";
const openai = (API_KEY_AVAILABLE && API_KEY_VALID_FORMAT)
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

export interface ParsePatternInput {
  title: string;
  projectType: string;
  skillLevel: string;
  yarnType?: string;
  size?: string;
  rawText?: string;
}

export async function parsePattern(input: ParsePatternInput) {
  const { title, projectType, skillLevel, yarnType, size, rawText } = input;

  if (!openai || !rawText?.trim()) {
    return buildSkeleton(title, projectType, skillLevel, yarnType);
  }

  const systemPrompt = `You are an expert crochet pattern organizer. Take raw crochet pattern text and structure it into clear sections with individual steps.

Return ONLY a JSON object with this exact structure:
{
  "title": string,
  "description": string (1-2 sentences describing the project),
  "materialsNotes": string,
  "yarnRequirements": [{ "color": string, "volume": string }],
  "hookRequirements": [{ "size": string, "quantity": number, "note": string }],
  "notionsRequirements": [{ "name": string, "description": string, "quantity": number }],
  "toolRequirements": [{ "name": string, "description": string }],
  "sections": [
    {
      "name": string,
      "notes": string,
      "steps": [{ "id": number, "text": string, "count": number }]
    }
  ]
}

Rules:
- Always include a "Materials" section first when materials/yarns/hooks are mentioned
- Each step is one single action (one row, one round, one instruction)
- Preserve stitch counts exactly as written, e.g. "(12)"
- Extract yarn colours into yarnRequirements
- Create logical section breaks (by body part, garment section, etc.)
- Title must be exactly: "${title}"
- Number "id" fields sequentially starting from 1 across ALL steps
- "count" is the stitch count for that step (0 if none mentioned)`;

  const userPrompt = `Title: ${title}
Type: ${projectType} | Skill: ${skillLevel}${yarnType ? ` | Yarn: ${yarnType}` : ""}${size ? ` | Size: ${size}` : ""}

Raw pattern:
${(rawText ?? "").slice(0, 20000)}`;

  try {
    const resp = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = resp.choices[0]?.message?.content;
    if (!content) return buildSkeleton(title, projectType, skillLevel, yarnType);
    return JSON.parse(content);
  } catch (e) {
    console.error("[parsePattern] error:", e);
    return buildSkeleton(title, projectType, skillLevel, yarnType);
  }
}

// ── PDF import: infer all metadata from extracted text ──────────────────────
export async function parsePdfText(rawText: string) {
  if (!openai || !rawText.trim()) {
    return buildSkeleton("Imported Pattern", "Other", "Beginner", undefined);
  }

  const systemPrompt = `You are an expert crochet pattern organiser. Read this raw crochet pattern text extracted from a PDF and structure it into a clean JSON object.

Return ONLY a JSON object with this exact structure:
{
  "title": string (the pattern name, inferred from the text heading or title),
  "projectType": string (one of exactly: "Amigurumi", "Wearable", "Home Decor", "Accessory", "Other"),
  "skillLevel": string (one of exactly: "Beginner", "Intermediate", "Advanced"),
  "yarnType": string (e.g. "Cotton", "Wool", "Acrylic", "Blend", or "" if unknown),
  "description": string (1-2 sentences describing the project),
  "materialsNotes": string,
  "yarnRequirements": [{ "color": string, "volume": string }],
  "hookRequirements": [{ "size": string, "quantity": number, "note": string }],
  "notionsRequirements": [{ "name": string, "description": string, "quantity": number }],
  "toolRequirements": [{ "name": string, "description": string }],
  "sections": [
    {
      "name": string,
      "notes": string,
      "steps": [{ "id": number, "text": string, "count": number }]
    }
  ]
}

Rules:
- Infer the title from the document's first prominent heading or title line
- Infer projectType: toys/stuffed animals/amigurumi → "Amigurumi"; hats/jumpers/garments → "Wearable"; blankets/cushions/home items → "Home Decor"; bags/pouches/jewellery → "Accessory"; otherwise "Other"
- Infer skillLevel from explicit mentions or complexity of techniques used
- Each step is one single action (one row, one round, one instruction)
- Preserve stitch counts exactly as written, e.g. "(12)"
- Extract yarn colours into yarnRequirements
- Create logical section breaks (by body part, garment section, etc.)
- Number "id" fields sequentially starting from 1 across ALL steps
- "count" is the stitch count for that step (0 if none mentioned)`;

  try {
    const resp = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Raw PDF pattern text:\n\n${rawText.slice(0, 20000)}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = resp.choices[0].message.content;
    if (!content) return buildSkeleton("Imported Pattern", "Other", "Beginner", undefined);
    return JSON.parse(content);
  } catch (e) {
    console.error("[parsePdfText] error:", e);
    return buildSkeleton("Imported Pattern", "Other", "Beginner", undefined);
  }
}

function buildSkeleton(title: string, projectType: string, skillLevel: string, yarnType?: string) {
  return {
    title,
    description: `A ${(skillLevel || "beginner").toLowerCase()} ${(projectType || "crochet").toLowerCase()} project.`,
    materialsNotes: "",
    yarnRequirements: yarnType ? [{ color: "Main colour", volume: "" }] : [],
    hookRequirements: [],
    notionsRequirements: [],
    toolRequirements: [],
    sections: [
      {
        name: "Materials",
        notes: "",
        steps: [{ id: 1, text: "Add your materials here", count: 0 }],
      },
      {
        name: "Pattern",
        notes: "",
        steps: [{ id: 2, text: "Add your pattern steps here", count: 0 }],
      },
    ],
  };
}
