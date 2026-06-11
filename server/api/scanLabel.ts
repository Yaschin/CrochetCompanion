import OpenAI from "openai";

const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();
const API_KEY_VALID = /^sk-[A-Za-z0-9_\-+/]{32,}$/.test(OPENAI_API_KEY);
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4.1";
const openai = OPENAI_API_KEY && API_KEY_VALID ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export interface ScannedLabel {
  type: "yarn" | "hook" | "notion" | "tool";
  name: string;
  color?: string;
  volume?: string;
  size?: string;
  notes?: string;
}

/**
 * Read a yarn ball band (or hook/notion packaging) photo with the vision model
 * and return a pre-filled stash item. Removes the typing friction that keeps
 * stashes empty.
 */
export async function scanLabel(imageDataUrl: string): Promise<ScannedLabel> {
  if (!openai) {
    throw new Error("OpenAI API key missing or invalid — label scanning needs AI vision.");
  }

  const response = await openai.chat.completions.create({
    model: TEXT_MODEL,
    response_format: { type: "json_object" },
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content: `You read photos of yarn ball bands and craft-supply packaging for a crochet stash app.
Extract what you can actually see and return STRICT JSON:
{
  "type": "yarn" | "hook" | "notion" | "tool",
  "name": "Brand + product line, e.g. 'Paintbox Cotton Aran'",
  "color": "colour name and/or shade number if shown",
  "volume": "weight and length, e.g. '50g / 125m' (yarn only)",
  "size": "yarn weight category (e.g. 'Aran / Worsted') or hook size (e.g. '5.0mm')",
  "notes": "anything else useful: fibre content, recommended hook, care symbols summarised"
}
Omit fields you cannot read. Never invent values. If the photo isn't craft supplies, return {"type":"yarn","name":"","notes":"Could not read a label in this photo"}.`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Read this label and extract the stash item details." },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  const type = ["yarn", "hook", "notion", "tool"].includes(parsed.type) ? parsed.type : "yarn";
  return {
    type,
    name: typeof parsed.name === "string" ? parsed.name.slice(0, 120) : "",
    color: typeof parsed.color === "string" ? parsed.color.slice(0, 80) : undefined,
    volume: typeof parsed.volume === "string" ? parsed.volume.slice(0, 80) : undefined,
    size: typeof parsed.size === "string" ? parsed.size.slice(0, 80) : undefined,
    notes: typeof parsed.notes === "string" ? parsed.notes.slice(0, 300) : undefined,
  };
}
