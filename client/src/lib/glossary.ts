// Stitch glossary — plain-language explanations + a help-video link per
// abbreviation. Video links are YouTube searches (stable, never dead links).
export interface GlossaryEntry {
  abbr: string;
  name: string;
  explain: string;
  videoQuery: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  { abbr: "CH", name: "Chain", explain: "Yarn over, pull through the loop on your hook. The foundation of almost everything.", videoQuery: "crochet chain stitch tutorial" },
  { abbr: "SL ST", name: "Slip stitch", explain: "Insert hook, yarn over, pull through both the stitch and the loop on your hook. Used to join rounds and travel invisibly.", videoQuery: "crochet slip stitch tutorial" },
  { abbr: "SC", name: "Single crochet", explain: "Insert hook, yarn over, pull up a loop (2 loops on hook), yarn over, pull through both. The amigurumi workhorse.", videoQuery: "single crochet tutorial" },
  { abbr: "HDC", name: "Half double crochet", explain: "Yarn over first, insert hook, pull up a loop (3 loops), yarn over, pull through all three.", videoQuery: "half double crochet tutorial" },
  { abbr: "DC", name: "Double crochet", explain: "Yarn over, insert hook, pull up a loop, then (yarn over, pull through 2) twice. Taller and faster than SC.", videoQuery: "double crochet tutorial" },
  { abbr: "TR", name: "Treble crochet", explain: "Yarn over twice, insert hook, pull up a loop, then (yarn over, pull through 2) three times.", videoQuery: "treble crochet tutorial" },
  { abbr: "MR", name: "Magic ring", explain: "An adjustable loop you crochet into, then pull tight — the seamless way to start working in the round.", videoQuery: "magic ring crochet tutorial" },
  { abbr: "INC", name: "Increase", explain: "Work 2 stitches into the same stitch. Each INC grows the round by one stitch.", videoQuery: "crochet increase tutorial" },
  { abbr: "DEC", name: "Decrease", explain: "Crochet 2 stitches together into one (for amigurumi, use the invisible decrease: front loops only).", videoQuery: "invisible decrease amigurumi tutorial" },
  { abbr: "FO", name: "Fasten off", explain: "Cut the yarn and pull the tail through the last loop to secure your work.", videoQuery: "fasten off crochet tutorial" },
  { abbr: "BLO", name: "Back loop only", explain: "Work into just the back loop of each stitch — leaves a ridge, adds stretch.", videoQuery: "back loop only crochet tutorial" },
  { abbr: "FLO", name: "Front loop only", explain: "Work into just the front loop — the unworked loops make a neat line for adding pieces later.", videoQuery: "front loop only crochet tutorial" },
];

/** Find glossary entries that appear in a step's text (longest match first). */
export function termsInText(text: string): GlossaryEntry[] {
  const upper = text.toUpperCase();
  return GLOSSARY.filter((g) => new RegExp(`\\b${g.abbr.replace(" ", "\\s?")}\\b`, "i").test(upper))
    .sort((a, b) => b.abbr.length - a.abbr.length);
}

export function videoUrl(entry: GlossaryEntry): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(entry.videoQuery)}`;
}
