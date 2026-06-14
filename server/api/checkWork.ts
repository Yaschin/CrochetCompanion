import OpenAI from "openai";

// Vision module for the "check my work" coach: shows a photo of work IN
// PROGRESS to the model alongside the round the maker is on, and returns a
// gentle, round-aware read. Mirrors coach.ts / analyzeAlignment.ts (same key
// handling + honest throw when the key is missing, never a fabricated verdict).
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();
const API_KEY_VALID = /^sk-[A-Za-z0-9_\-+/]{32,}$/.test(OPENAI_API_KEY);
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4.1";
const openai = OPENAI_API_KEY && API_KEY_VALID ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export type WorkCheckStatus = "on_track" | "check" | "unsure";

export interface WorkCheckResult {
  status: WorkCheckStatus;
  note: string;
}

export interface WorkCheckInput {
  wipImageUrl: string; // data URL of the just-taken work-in-progress photo
  referenceImageUrl?: string; // optional: section reference art, as a data URL
  patternTitle: string;
  sectionName: string;
  currentRound: string;
  targetCount?: number;
  precedingRounds: string[];
}

export async function checkWork(input: WorkCheckInput): Promise<WorkCheckResult> {
  if (!openai) {
    throw new Error("OpenAI API key missing or invalid — Ashi needs it to check your work.");
  }

  const {
    wipImageUrl,
    referenceImageUrl,
    patternTitle,
    sectionName,
    currentRound,
    targetCount,
    precedingRounds,
  } = input;

  const context = [
    `Project: "${patternTitle}".`,
    `Section: "${sectionName}".`,
    precedingRounds.length
      ? `Recent rounds leading up to now:\n${precedingRounds.map((r) => `- ${String(r).slice(0, 200)}`).join("\n")}`
      : "",
    `The round they are ON RIGHT NOW: "${String(currentRound).slice(0, 250)}".`,
    targetCount ? `That round should end with about ${targetCount} stitches.` : "",
    referenceImageUrl ? "A reference image of the finished section is also attached for comparison." : "",
  ]
    .filter(Boolean)
    .join("\n");

  const userContent: any = [
    {
      type: "text",
      text: `Here is a photo of my crochet work in progress.\n\n${context}\n\nDoes it look on track for that round?`,
    },
    { type: "image_url", image_url: { url: wipImageUrl } },
  ];
  if (referenceImageUrl) {
    userContent.push({ type: "image_url", image_url: { url: referenceImageUrl } });
  }

  const response = await openai.chat.completions.create({
    model: TEXT_MODEL,
    max_tokens: 220,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are Ashi, a warm, encouraging crochet helper in a family app. You are shown a photo of someone's crochet work IN PROGRESS and the round they are currently on. Gently judge whether the work looks consistent with that round.

Be supportive and biased toward reassurance. Use US crochet terms (SC, HDC, DC, INC, DEC, MR). Rules:
- Only flag an issue when you are reasonably confident from the photo; otherwise encourage.
- Phrase any concern as a gentle "you may want to double-check…", NEVER as a command. NEVER tell them to frog, undo, rip out, or restart rounds.
- If the photo is too dark, blurry, far away, or you genuinely cannot tell, do NOT guess — return status "unsure" and kindly ask for a clearer, well-lit, closer shot.
- Do not mention numeric scores or percentages.
- Keep the note to one or two short, warm sentences.

Respond ONLY with strict JSON:
{"status": "on_track" | "check" | "unsure", "note": "<one or two short, warm sentences>"}`,
      },
      { role: "user", content: userContent },
    ],
  });

  const content = response.choices?.[0]?.message?.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned an unparseable response");
  }

  const status: WorkCheckStatus =
    parsed.status === "on_track" || parsed.status === "check" || parsed.status === "unsure"
      ? parsed.status
      : "unsure";
  const note = String(parsed.note || "").slice(0, 600);
  return { status, note };
}
