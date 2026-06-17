/**
 * Single source of truth for identifying a "materials" section.
 *
 * Materials sections are gather-checklists, not crochet rounds, so they are
 * excluded from progress denominators (and from print/photo/share section
 * lists) everywhere — the viewer, library cards, home card, projects screen,
 * progress screen, follow mode, make-along board, PDF export and so on.
 *
 * The match is normalised (trimmed, case-insensitive, prefix) so a stray space
 * or a name like "Materials & Tools" / "Materials list" can't slip a checklist
 * into the progress count and inflate the percentage complete.
 */
export function isMaterialsSection(name: string | undefined | null): boolean {
  return (name ?? "").trim().toLowerCase().startsWith("material");
}
