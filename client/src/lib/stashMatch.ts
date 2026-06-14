import { Pattern, StashItem, StashItemType } from "./types";

/**
 * Stash-aware matching: compares what a pattern *requires* against what is
 * actually in the materials inventory ("stash"), so the app can answer
 * "Can I make this right now?" and "What can I make with my leftovers?".
 *
 * Matching is intentionally forgiving — yarn colours and hook sizes are free
 * text entered by a human ("3.5mm" vs "3.5 mm", "Cream" vs "cream aran"), so we
 * normalise and do bidirectional substring matching rather than exact equality.
 */

export interface CoverageItem {
  /** Human-readable requirement, e.g. "Cream (~50g)" or "3.5mm hook". */
  label: string;
  /** Whether a matching stash item was found. */
  have: boolean;
  /** The matched stash item's display name, when found. */
  matchedWith?: string;
}

export interface CategoryCoverage {
  category: StashItemType;
  title: string;
  items: CoverageItem[];
}

export interface StashCoverage {
  categories: CategoryCoverage[];
  haveCount: number;
  totalCount: number;
  /** Labels of everything still missing, across all categories. */
  missing: string[];
  /** True when every yarn and hook requirement is covered (the essentials). */
  canMake: boolean;
  /** 0–100 over all requirements (yarn, hooks, notions, tools). */
  coveragePct: number;
}

function norm(s?: string | null): string {
  return (s ?? "").toLowerCase().replace(/\s+/g, "").trim();
}

/** Bidirectional, normalised substring match — tolerant of human-entered text. */
function looseMatch(a?: string | null, b?: string | null): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function stashOfType(stash: StashItem[], type: StashItemType): StashItem[] {
  return stash.filter((s) => s.type === type);
}

function findYarn(stash: StashItem[], color?: string): StashItem | undefined {
  return stashOfType(stash, "yarn").find(
    (s) => looseMatch(s.color, color) || looseMatch(s.name, color),
  );
}

function findBy(stash: StashItem[], type: StashItemType, ...needles: (string | undefined)[]): StashItem | undefined {
  return stashOfType(stash, type).find((s) =>
    needles.some((n) => looseMatch(s.name, n) || looseMatch(s.size, n) || looseMatch(s.color, n)),
  );
}

/**
 * Compute how well the stash covers a pattern's material requirements.
 */
export function analyzeStashCoverage(pattern: Pattern, stash: StashItem[]): StashCoverage {
  const categories: CategoryCoverage[] = [];

  // ── Yarn ──────────────────────────────────────────────────────────────────
  const yarnItems: CoverageItem[] = (pattern.yarnRequirements ?? []).map((req) => {
    const match = findYarn(stash, req.color);
    const vol = req.volume ? ` (${req.volume})` : "";
    return { label: `${req.color || "Yarn"}${vol}`, have: !!match, matchedWith: match?.name };
  });
  if (yarnItems.length) categories.push({ category: "yarn", title: "Yarn", items: yarnItems });

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const hookItems: CoverageItem[] = (pattern.hookRequirements ?? []).map((req) => {
    const match = findBy(stash, "hook", req.size);
    return { label: `${req.size || "Hook"} hook`, have: !!match, matchedWith: match?.name };
  });
  if (hookItems.length) categories.push({ category: "hook", title: "Hooks", items: hookItems });

  // ── Notions ───────────────────────────────────────────────────────────────
  const notionItems: CoverageItem[] = (pattern.notionsRequirements ?? []).map((req) => {
    const match = findBy(stash, "notion", req.name);
    return { label: req.name, have: !!match, matchedWith: match?.name };
  });
  if (notionItems.length) categories.push({ category: "notion", title: "Notions", items: notionItems });

  // ── Tools ─────────────────────────────────────────────────────────────────
  const toolItems: CoverageItem[] = (pattern.toolRequirements ?? []).map((req) => {
    const match = findBy(stash, "tool", req.name);
    return { label: req.name, have: !!match, matchedWith: match?.name };
  });
  if (toolItems.length) categories.push({ category: "tool", title: "Tools", items: toolItems });

  const allItems = categories.flatMap((c) => c.items);
  const haveCount = allItems.filter((i) => i.have).length;
  const totalCount = allItems.length;
  const missing = allItems.filter((i) => !i.have).map((i) => i.label);

  // Essentials = yarn + hooks. If a pattern declares neither, treat as makeable.
  const essentials = [...yarnItems, ...hookItems];
  const canMake = essentials.length === 0 ? true : essentials.every((i) => i.have);

  const coveragePct = totalCount === 0 ? 100 : Math.round((haveCount / totalCount) * 100);

  return { categories, haveCount, totalCount, missing, canMake, coveragePct };
}

/**
 * The distinct stash items a pattern's YARN requirements match. Used to offer
 * "deduct what you used" when a project is finished — only yarn is consumable,
 * so hooks/notions/tools are deliberately excluded.
 */
export function matchedYarnsForPattern(pattern: Pattern, stash: StashItem[]): StashItem[] {
  const seen = new Set<string>();
  const out: StashItem[] = [];
  for (const req of pattern.yarnRequirements ?? []) {
    const match = findYarn(stash, req.color);
    if (match && !seen.has(match.id)) {
      seen.add(match.id);
      out.push(match);
    }
  }
  return out;
}

export interface RankedPattern {
  pattern: Pattern;
  coverage: StashCoverage;
}

/**
 * Rank patterns by how ready-to-make they are given the current stash.
 * Fully-makeable first, then by coverage %, then by fewest missing items.
 */
export function rankByStash(patterns: Pattern[], stash: StashItem[]): RankedPattern[] {
  return patterns
    .map((pattern) => ({ pattern, coverage: analyzeStashCoverage(pattern, stash) }))
    .sort((a, b) => {
      if (a.coverage.canMake !== b.coverage.canMake) return a.coverage.canMake ? -1 : 1;
      if (b.coverage.coveragePct !== a.coverage.coveragePct) return b.coverage.coveragePct - a.coverage.coveragePct;
      return a.coverage.missing.length - b.coverage.missing.length;
    });
}
