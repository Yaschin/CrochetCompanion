import { Pattern } from "./types";
import { isMaterialsSection } from "@shared/sections";

/** Minimal HTML escaping for values interpolated into the print document. */
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Open a branded, ink-friendly printable view of a pattern in a new window and
 * trigger the browser print dialog — from which the user can "Save as PDF".
 * Dependency-free (no jsPDF), works offline. Each step gets a checkbox so the
 * paper copy can be marked up while crocheting.
 */
export function printPattern(pattern: Pattern): void {
  const win = window.open("", "_blank", "width=820,height=1040");
  if (!win) return;

  const sections = (pattern.sections ?? []).filter((s) => !isMaterialsSection(s.name));

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
          ${s.steps
            .map(
              (st) => `<li><span class="cb" aria-hidden="true"></span><span class="step">${esc(st.text)}${
                st.notes ? `<span class="step-note">${esc(st.notes)}</span>` : ""
              }</span></li>`,
            )
            .join("")}
        </ol>
      </section>`,
    )
    .join("");

  const meta = [pattern.projectType, pattern.skillLevel, pattern.yarnType, pattern.size]
    .filter(Boolean)
    .map((m) => `<span class="chip">${esc(m)}</span>`)
    .join("");

  // The cover photo is same-origin (/api/media/…) or an external URL; if it
  // fails to load we simply print without it.
  const cover = pattern.endProductImage
    ? `<img class="cover" src="${esc(pattern.endProductImage)}" alt="" onerror="this.remove()">`
    : "";

  const userNotes = pattern.userNotes
    ? `<section><h2>My Notes</h2><p class="notes">${esc(pattern.userNotes)}</p></section>`
    : "";

  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(pattern.title)} — Crochet Time</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #2a1c12; max-width: 720px; margin: 32px auto; padding: 0 24px; line-height: 1.5; }
  .brand { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #c24e6b; margin: 0 0 10px; }
  .head { display: flex; gap: 20px; align-items: flex-start; }
  .head > div { flex: 1; min-width: 0; }
  h1 { font-size: 28px; margin: 0 0 8px; }
  .cover { width: 168px; height: 168px; object-fit: cover; border-radius: 12px; border: 1px solid #e3d5c8; }
  .chip { display: inline-block; font-size: 12px; color: #7a5a48; border: 1px solid #e3d5c8; border-radius: 999px; padding: 2px 10px; margin: 0 6px 6px 0; }
  .desc { font-style: italic; color: #4a3526; margin: 10px 0 0; }
  h2 { font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 24px 0 8px; break-after: avoid; }
  h3 { font-size: 14px; margin: 12px 0 4px; }
  ul { margin: 6px 0 6px 22px; padding: 0; }
  ol { list-style: none; counter-reset: step; margin: 6px 0; padding: 0; }
  ol li { counter-increment: step; display: flex; gap: 9px; align-items: flex-start; margin: 7px 0; break-inside: avoid; }
  .cb { flex-shrink: 0; width: 13px; height: 13px; margin-top: 4px; border: 1.5px solid #b09a88; border-radius: 3px; }
  .step::before { content: counter(step) ". "; font-weight: bold; color: #84934f; }
  .step-note { display: block; color: #6a4a38; font-size: 13px; font-style: italic; }
  .notes { color: #6a4a38; font-size: 13.5px; margin: 2px 0 8px; white-space: pre-wrap; }
  .footer { margin-top: 28px; color: #9a8878; font-size: 11px; border-top: 1px dashed #ccc; padding-top: 8px; }
  @media print { body { margin: 0; } a { display: none; } }
</style></head>
<body>
  <p class="brand">🧶 Crochet Time</p>
  <div class="head">
    <div>
      <h1>${esc(pattern.title)}</h1>
      ${meta ? `<p>${meta}</p>` : ""}
      ${pattern.description ? `<p class="desc">${esc(pattern.description)}</p>` : ""}
    </div>
    ${cover}
  </div>
  ${materials ? `<section><h2>Materials</h2>${materials}</section>` : ""}
  <section><h2>Abbreviations (US terms)</h2>
    <p class="notes">CH chain · SL ST slip stitch · SC single crochet · HDC half double crochet ·
    DC double crochet · MR magic ring · INC increase · DEC decrease · ST(S) stitch(es) ·
    RND round — the number in parentheses at the end of a round, e.g. (24), is the stitch
    count you should have when the round is complete.</p>
  </section>
  ${body}
  ${userNotes}
  <p class="footer">Made with Crochet Time ♡ — printed ${esc(new Date().toLocaleDateString())}. Tick each step as you go!</p>
</body></html>`);

  win.document.close();
  win.focus();
  // Print once the cover image has settled (or after a short fallback delay).
  const doPrint = () => {
    try { win.print(); } catch { /* user can print manually */ }
  };
  const img = win.document.querySelector("img.cover") as HTMLImageElement | null;
  if (img && !img.complete) {
    let printed = false;
    const once = () => { if (!printed) { printed = true; doPrint(); } };
    img.addEventListener("load", once);
    img.addEventListener("error", once);
    setTimeout(once, 2500);
  } else {
    setTimeout(doPrint, 250);
  }
}
