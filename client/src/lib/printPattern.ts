import { Pattern } from "./types";

/** Minimal HTML escaping for values interpolated into the print document. */
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Open a clean, ink-friendly printable view of a pattern in a new window and
 * trigger the browser print dialog — from which the user can "Save as PDF".
 * Dependency-free (no jsPDF), works offline.
 */
export function printPattern(pattern: Pattern): void {
  const win = window.open("", "_blank", "width=820,height=1040");
  if (!win) return;

  const sections = (pattern.sections ?? []).filter((s) => s.name.toLowerCase() !== "materials");

  const reqList = (title: string, rows: string[]) =>
    rows.length ? `<h3>${esc(title)}</h3><ul>${rows.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : "";

  const materials = [
    reqList("Yarn", (pattern.yarnRequirements ?? []).map((y) => `${y.color}${y.volume ? ` — ${y.volume}` : ""}`)),
    reqList("Hooks", (pattern.hookRequirements ?? []).map((h) => `${h.size}${h.quantity ? ` ×${h.quantity}` : ""}`)),
    reqList("Notions", (pattern.notionsRequirements ?? []).map((n) => `${n.name}${n.quantity ? ` ×${n.quantity}` : ""}${n.description ? ` (${n.description})` : ""}`)),
    reqList("Tools", (pattern.toolRequirements ?? []).map((t) => t.name)),
    pattern.needsStuffing ? `<h3>Stuffing</h3><p>${esc(pattern.needsStuffing)}</p>` : "",
  ].join("");

  const body = sections
    .map(
      (s) => `
      <section>
        <h2>${esc(s.name)}</h2>
        ${s.notes ? `<p class="notes">${esc(s.notes)}</p>` : ""}
        <ol>
          ${s.steps.map((st) => `<li>${esc(st.text)}</li>`).join("")}
        </ol>
      </section>`,
    )
    .join("");

  const meta = [pattern.projectType, pattern.skillLevel, pattern.yarnType, pattern.size]
    .filter(Boolean)
    .map((m) => esc(m))
    .join(" · ");

  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(pattern.title)} — Crochet Time</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #2a1c12; max-width: 720px; margin: 32px auto; padding: 0 24px; line-height: 1.5; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  .meta { color: #7a5a48; font-size: 13px; margin: 0 0 16px; }
  .desc { font-style: italic; color: #4a3526; margin: 0 0 20px; }
  h2 { font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 22px 0 8px; }
  h3 { font-size: 14px; margin: 12px 0 4px; }
  ol, ul { margin: 6px 0 6px 22px; padding: 0; }
  li { margin: 3px 0; }
  .notes { color: #6a4a38; font-size: 13px; margin: 2px 0 8px; }
  .footer { margin-top: 28px; color: #9a8878; font-size: 11px; border-top: 1px dashed #ccc; padding-top: 8px; }
  @media print { body { margin: 0; } a { display: none; } }
</style></head>
<body>
  <h1>${esc(pattern.title)}</h1>
  ${meta ? `<p class="meta">${meta}</p>` : ""}
  ${pattern.description ? `<p class="desc">${esc(pattern.description)}</p>` : ""}
  ${materials ? `<section><h2>Materials</h2>${materials}</section>` : ""}
  ${body}
  <p class="footer">Made with Crochet Time ♡ — printed ${esc(new Date().toLocaleDateString())}</p>
</body></html>`);

  win.document.close();
  win.focus();
  // Give the new document a tick to render before invoking print.
  setTimeout(() => {
    try { win.print(); } catch { /* user can print manually */ }
  }, 250);
}
