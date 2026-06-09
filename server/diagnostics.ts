import OpenAI from "openai";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { uploadBufferWithKey, objectExists } from "./objectStorage";

const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();
const API_KEY_VALID_FORMAT = /^sk-[A-Za-z0-9_\-+/]{32,}$/.test(OPENAI_API_KEY);
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4.1";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

export interface DiagnosticCheck {
  name: string;
  ok: boolean;
  detail: string;
  ms: number;
}

export interface DiagnosticsReport {
  ok: boolean;
  ranAt: string;
  checks: DiagnosticCheck[];
}

async function timed(
  name: string,
  fn: () => Promise<string>
): Promise<DiagnosticCheck> {
  const start = Date.now();
  try {
    const detail = await fn();
    return { name, ok: true, detail, ms: Date.now() - start };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: (error as Error).message || String(error),
      ms: Date.now() - start,
    };
  }
}

function openaiClient(): OpenAI {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set — AI features are running on fallback templates/placeholders.");
  }
  if (!API_KEY_VALID_FORMAT) {
    throw new Error("OPENAI_API_KEY looks invalid (expected 'sk-…'). AI features are running on fallbacks.");
  }
  return new OpenAI({ apiKey: OPENAI_API_KEY });
}

// Quick checks: cheap, safe to run any time. No tokens are consumed except
// two models.retrieve metadata calls.
export async function runQuickDiagnostics(): Promise<DiagnosticsReport> {
  const checks: DiagnosticCheck[] = [];

  checks.push(
    await timed("Database", async () => {
      const r = await db.execute(sql`SELECT count(*)::int AS n FROM patterns`);
      const n = (r.rows?.[0] as { n?: number } | undefined)?.n ?? 0;
      return `Connected — ${n} patterns in the library.`;
    })
  );

  checks.push(
    await timed("Object storage", async () => {
      const key = "diagnostics-probe";
      await uploadBufferWithKey(key, Buffer.from("ok"), "text/plain");
      if (!(await objectExists(key))) throw new Error("Probe object not readable after write.");
      return "Write + read probe succeeded.";
    })
  );

  checks.push(
    await timed("OpenAI API key", async () => {
      const client = openaiClient();
      await client.models.list();
      return "Key accepted by the OpenAI API.";
    })
  );

  checks.push(
    await timed(`Text model (${TEXT_MODEL})`, async () => {
      await openaiClient().models.retrieve(TEXT_MODEL);
      return "Model is available to this account.";
    })
  );

  checks.push(
    await timed(`Image model (${IMAGE_MODEL})`, async () => {
      await openaiClient().models.retrieve(IMAGE_MODEL);
      return "Model is available to this account.";
    })
  );

  return { ok: checks.every((c) => c.ok), ranAt: new Date().toISOString(), checks };
}

// Deep checks: run one real (tiny) text generation and one real image
// generation, so they cost a small amount of API credit. User-initiated only.
export async function runDeepDiagnostics(): Promise<DiagnosticsReport> {
  const checks: DiagnosticCheck[] = [];

  checks.push(
    await timed("Live text generation", async () => {
      const client = openaiClient();
      const res = await client.chat.completions.create({
        model: TEXT_MODEL,
        messages: [{ role: "user", content: "Reply with the single word: ok" }],
        max_tokens: 5,
      });
      const text = res.choices[0]?.message?.content?.trim() || "";
      if (!text) throw new Error("Model returned an empty response.");
      return `Model responded ("${text}").`;
    })
  );

  checks.push(
    await timed("Live image generation", async () => {
      const client = openaiClient();
      const res = await client.images.generate({
        model: IMAGE_MODEL,
        prompt: "A tiny pink crocheted heart on a plain cream background.",
        n: 1,
        size: "1024x1024",
        // gpt-image-1 quality tier; the installed SDK types still describe dall-e values.
        quality: "low" as any,
      });
      const data = (res as { data?: Array<{ b64_json?: string; url?: string }> }).data?.[0];
      if (!data?.b64_json && !data?.url) throw new Error("Image model returned no image data.");
      return "Image generated successfully.";
    })
  );

  return { ok: checks.every((c) => c.ok), ranAt: new Date().toISOString(), checks };
}
