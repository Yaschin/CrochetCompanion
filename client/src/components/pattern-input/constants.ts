import { palette } from "@/lib/theme";

export const CATEGORIES = [
  { id: "Amigurumi",  label: "Toys & Amigurumi", emoji: "🧸", color: palette.rose },
  { id: "Wearable",   label: "Wearables",         emoji: "👒", color: palette.purple },
  { id: "Home Decor", label: "Home Decor",         emoji: "🏠", color: palette.sage },
  { id: "Accessory",  label: "Accessories",        emoji: "👜", color: palette.amber },
  { id: "Other",      label: "Other",              emoji: "✨", color: palette.teal },
];
export const SKILL_LEVELS = [
  { id: "Beginner",     emoji: "🌱", desc: "First-timers welcome" },
  { id: "Intermediate", emoji: "🌿", desc: "Some experience needed" },
  { id: "Advanced",     emoji: "🌳", desc: "Complex techniques" },
];
export const YARN_TYPES = ["Cotton", "Wool", "Acrylic", "Blend", "Mohair", "Not specified"];
export const COLOR_PALETTE = [
  palette.rose,palette.purple,palette.sage,palette.amber,palette.teal,
  "#F0C840","#E88050","#C8A0D8","#90C898","#F0A0B8",
  "#E8D0C0","#B0D0E8","#D8E0B0","#F8E8C0",palette.cocoa,
];
export const SIZE_OPTIONS = ["5 cm", "10 cm", "15 cm", "20 cm", "30 cm", "40 cm+"];

export const AI_STEPS  = ["Item", "Details", "Yarn & Colours", "Inspiration", "Review"];
export const OWN_STEPS = ["Pattern", "Details", "Paste & Save"];
export const PDF_STEPS = ["Upload", "Review"];

export const AI_TIPS = [
  "Pick a category and I'll tailor the pattern just for you! 🐾",
  "More detail = a better pattern. Tell me everything! ✨",
  "Great colour choices make the magic happen 🎨",
  "A reference photo helps me imagine exactly what you want!",
  "I've got everything I need — let's create something beautiful! 🌟",
];
export const OWN_TIPS = [
  "Name your pattern and pick a type to get started 📝",
  "Tell me the yarn and skill level — it helps with tracking 🧶",
  "Paste your pattern text and I'll organise it into sections for you ✨",
];
export const PDF_TIPS = [
  "Upload a PDF from Etsy, Ravelry or anywhere — I'll read it and organise it for you 📄",
  "Check the title and details look right, then save to your library 🎉",
];
export const PDF_LOADING_MSGS = [
  "Reading your PDF…",
  "Finding the materials list…",
  "Spotting the stitch counts…",
  "Organising into sections…",
  "Checking yarn requirements…",
  "Almost ready…",
];
