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
${rawText}`;

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

    const content = resp.choices[0].message.content;
    if (!content) return buildSkeleton(title, projectType, skillLevel, yarnType);
    return JSON.parse(content);
  } catch (e) {
    console.error("[parsePattern] error:", e);
    return buildSkeleton(title, projectType, skillLevel, yarnType);
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
