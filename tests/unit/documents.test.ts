import { describe, it, expect } from "vitest";
import { formatBytes, fileMetaLabel, collectDocuments, totalDocumentCount } from "../../client/src/lib/documents";
import type { Pattern, SourceFile } from "../../client/src/lib/types";

const file = (over: Partial<SourceFile>): SourceFile => ({
  key: "k", name: "pattern.pdf", type: "pdf", addedAt: "2026-01-01T00:00:00Z", ...over,
});

const pat = (over: Partial<Pattern>): Pattern => ({
  id: "p", title: "Bunny", projectType: "Toy", skillLevel: "Beginner",
  sections: [], createdAt: "2026-01-01T00:00:00Z", ...over,
});

describe("formatBytes", () => {
  it("formats KB and MB, and hides unknown/zero", () => {
    expect(formatBytes(500 * 1024)).toBe("500 KB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(formatBytes(0)).toBe("");
    expect(formatBytes(undefined)).toBe("");
  });
});

describe("fileMetaLabel", () => {
  it("joins pages and size, pluralising pages", () => {
    expect(fileMetaLabel(file({ pages: 4, size: 1.2 * 1024 * 1024 }))).toBe("4 pages · 1.2 MB");
    expect(fileMetaLabel(file({ pages: 1, size: undefined }))).toBe("1 page");
    expect(fileMetaLabel(file({ pages: undefined, size: undefined }))).toBe("");
  });
});

describe("collectDocuments", () => {
  it("keeps only patterns with files, newest file first across and within patterns", () => {
    const a = pat({ id: "a", title: "Old", sourceFiles: [file({ key: "a1", addedAt: "2026-02-01T00:00:00Z" })] });
    const b = pat({ id: "b", title: "New", sourceFiles: [
      file({ key: "b1", addedAt: "2026-05-01T00:00:00Z" }),
      file({ key: "b2", addedAt: "2026-06-01T00:00:00Z" }),
    ] });
    const none = pat({ id: "c", title: "NoFiles" });
    const docs = collectDocuments([a, none, b]);
    expect(docs.map((d) => d.pattern.id)).toEqual(["b", "a"]); // b has the most-recent file
    expect(docs[0].files.map((f) => f.key)).toEqual(["b2", "b1"]); // newest within pattern first
    expect(docs.some((d) => d.pattern.id === "c")).toBe(false); // patterns without files excluded
  });

  it("returns empty when nothing has files", () => {
    expect(collectDocuments([pat({}), pat({ id: "x", sourceFiles: [] })])).toEqual([]);
  });
});

describe("totalDocumentCount", () => {
  it("sums files across patterns", () => {
    const patterns = [
      pat({ sourceFiles: [file({ key: "1" }), file({ key: "2" })] }),
      pat({ id: "y" }),
      pat({ id: "z", sourceFiles: [file({ key: "3" })] }),
    ];
    expect(totalDocumentCount(patterns)).toBe(3);
  });
});
