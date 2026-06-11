import OpenAI from "openai";

const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();
const API_KEY_VALID = /^sk-[A-Za-z0-9_\-+/]{32,}$/.test(OPENAI_API_KEY);
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4.1";
const openai = OPENAI_API_KEY && API_KEY_VALID ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export interface CoachTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CoachContext {
  patternTitle: string;
  skillLevel?: string;
  sectionName?: string;
  stepText?: string;
}

/**
 * Ashi the crochet coach: short, warm, practical answers about the exact
 * round the maker is on. Stateless on the server — the client sends the last
 * few turns; everything is capped to keep token spend tiny.
 */
export async function askCoach(
  question: string,
  context: CoachContext,
  history: CoachTurn[]
): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI API key missing or invalid — Ashi needs it to answer.");
  }

  const trimmedHistory = history.slice(-6).map((t) => ({
    role: t.role,
    content: String(t.content).slice(0, 400),
  }));

  const response = await openai.chat.completions.create({
    model: TEXT_MODEL,
    max_tokens: 350,
    messages: [
      {
        role: "system",
        content: `You are Ashi, a warm, encouraging crochet coach inside the Crochet Time family app.
The maker is mid-project and may have yarn in their hands — answer in under 120 words,
practically and step-by-step, using US crochet terms (SC, HDC, DC, INC, DEC, MR).
If they report a wrong stitch count, help them diagnose (usually a missed increase/decrease
or a miscounted first stitch) and reassure them it's fixable. Never rewrite the whole pattern;
focus on their question. A little warmth is welcome; fluff is not.

They are working on: "${context.patternTitle}"${context.skillLevel ? ` (${context.skillLevel})` : ""}.
${context.sectionName ? `Current section: ${context.sectionName}.` : ""}
${context.stepText ? `Current round/step: "${String(context.stepText).slice(0, 300)}"` : ""}`,
      },
      ...trimmedHistory,
      { role: "user", content: question.slice(0, 300) },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || "Hmm, I lost my train of thought — could you ask that again?";
}
