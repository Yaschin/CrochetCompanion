import { createRequire } from "module";

// pdf-parse@1.1.1's index.js has a test-runner bug (it reads ./test/data/ at
// import relative to CWD); require the library entry directly to avoid it.
const _require = createRequire(import.meta.url);

export const pdfParseFn: (buf: Buffer) => Promise<{ text: string; numpages: number }> =
  _require("pdf-parse/lib/pdf-parse");
