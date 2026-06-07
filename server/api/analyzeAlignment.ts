import OpenAI from "openai";

// Vision model used to compare a finished-work photo against the written
// pattern instructions. Shares the same env override as pattern generation.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const API_KEY_VALID_FORMAT = /^sk-[A-Za-z0-9_\-+/]{32,}$/.test(OPENAI_API_KEY.trim());
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4.1";

const openai = API_KEY_VALID_FORMAT
  ? new OpenAI({ apiKey: OPENAI_API_KEY.trim() })
  : null;

export const alignmentAiAvailable = Boolean(openai);

export interface AlignmentResult {
  score: number; // 0-100
  feedback: string;
}

/**
 * Compare a photo of a crocheted section against its written instructions and
 * return a genuine match score plus short feedback. Throws if the AI client is
 * unavailable so callers can surface an honest error (never a fabricated score).
 *
 * @param imageUrl A data URL (preferred) or publicly fetchable image URL.
 */
export async function analyzeAlignment(
  imageUrl: string,
  sectionName: string,
  sectionSteps: string
): Promise<AlignmentResult> {
  if (!openai) {
    throw new Error("OpenAI API key missing or invalid - cannot analyse alignment");
  }

  const systemPrompt = `You are an expert crochet inspector. You will be shown a photo of a crocheted piece and the written pattern instructions for one section of a project. Judge how closely the finished work in the photo matches those instructions.

Consider shape and proportions, colour, visible stitch work, and whether the elements described in the instructions are present. A perfect match scores 100; deduct points for missing or extra elements, wrong shape, wrong colour, or an obviously different stitch pattern. If the photo clearly is not the described piece, score low.

Respond ONLY with strict JSON of the form:
{"score": <integer 0-100>, "feedback": "<one or two short, constructive sentences>"}`;

  const userContent: any = [
    {
      type: "text",
      text: `Section: "${sectionName}".\n\nPattern instructions:\n${sectionSteps}\n\nHow well does the attached photo match these instructions?`,
    },
    { type: "image_url", image_url: { url: imageUrl } },
  ];

  const response = await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices?.[0]?.message?.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned an unparseable alignment response");
  }

  let score = Number(parsed.score);
  if (!Number.isFinite(score)) score = 0;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, feedback: String(parsed.feedback || "") };
}
