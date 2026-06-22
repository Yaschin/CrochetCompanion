/**
 * Imported source documents (the original PDFs kept so you can refer back to
 * them). Pure helpers here are unit-tested; the API helpers wrap the server
 * endpoints added in routes.ts.
 */
import type { Pattern, SourceFile } from "./types";
import { apiRequest } from "./queryClient";
import { fileToBase64 } from "./utils";

/** Servable URL for a stored object (PDFs render inline; see streamObject). */
export function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}

/** Human-readable byte size, e.g. "874 KB" or "1.2 MB". */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** Short meta line for a file, e.g. "4 pages · 1.2 MB" (omits unknown parts). */
export function fileMetaLabel(file: SourceFile): string {
  const parts: string[] = [];
  if (file.pages && file.pages > 0) parts.push(`${file.pages} page${file.pages === 1 ? "" : "s"}`);
  const size = formatBytes(file.size);
  if (size) parts.push(size);
  return parts.join(" · ");
}

export interface PatternDocuments {
  pattern: Pattern;
  files: SourceFile[];
}

/**
 * The files library: every pattern that has imported originals, newest file
 * first. Pure derivation over the already-fetched patterns — no extra request.
 */
export function collectDocuments(patterns: Pattern[]): PatternDocuments[] {
  const recency = (f: SourceFile) => Date.parse(f.addedAt) || 0;
  return patterns
    .filter((p) => (p.sourceFiles?.length ?? 0) > 0)
    .map((pattern) => ({
      pattern,
      files: [...(pattern.sourceFiles ?? [])].sort((a, b) => recency(b) - recency(a)),
    }))
    .sort((a, b) => recency(b.files[0]) - recency(a.files[0]));
}

/** Total count of imported files across patterns (for badges/empty states). */
export function totalDocumentCount(patterns: Pattern[]): number {
  return patterns.reduce((n, p) => n + (p.sourceFiles?.length ?? 0), 0);
}

/** iOS renders PDFs in iframes unreliably → we lead with an "Open" button there. */
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iP(hone|ad|od)/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as Mac; detect by touch.
    (navigator.platform === "MacIntel" && (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints! > 1);
}

// ── Server API ───────────────────────────────────────────────────────────────

/** Upload originals to a saved pattern. Returns the pattern's full file list. */
export async function attachSourceFiles(patternId: string, files: File[]): Promise<SourceFile[]> {
  const payload = await Promise.all(
    files.map(async (f) => ({ name: f.name, base64: await fileToBase64(f) })),
  );
  const res = await apiRequest("POST", `/api/patterns/${patternId}/source-files`, { files: payload });
  const data = await res.json();
  return data.sourceFiles ?? [];
}

export async function deleteSourceFile(patternId: string, key: string): Promise<SourceFile[]> {
  const res = await apiRequest("DELETE", `/api/patterns/${patternId}/source-files/${encodeURIComponent(key)}`);
  const data = await res.json();
  return data.sourceFiles ?? [];
}
