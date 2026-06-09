import { patternService } from "./patternService";
import { stashService } from "./stashService";
import { getMeta, setMeta } from "./ensureSchema";
import type { Pattern, StashItem } from "../shared/schema";

type SeedPattern = Omit<Pattern, "id" | "createdAt">;

const VUMSH_PATTERNS: SeedPattern[] = [
  {
    title: "Roary the T-Rex Amigurumi",
    projectType: "Toy",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "~20cm tall",
    description: "A chunky, friendly T-Rex with tiny arms, a fat belly, and a big toothy grin. Quick to make in a weekend.",
    materialsNotes: "Use stitch markers to track rounds. Insert safety eyes before closing the head.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "Yes — polyester fiberfill",
    yarnRequirements: [
      { color: "Jungle Green", volume: "~100g / ~225 yards" },
      { color: "Cream", volume: "~15g / ~35 yards (belly)" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1, note: "Tight gauge hides stuffing." }],
    notionsRequirements: [
      { name: "Safety eyes", description: "12mm black", quantity: 2 },
      { name: "Polyester fiberfill", description: "Firm stuffing", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For sewing parts together" },
      { name: "Stitch markers", description: "Locking type" },
    ],
    sections: [
      {
        name: "Body",
        notes: "Work in continuous rounds.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "MR, 6 SC. (6)", locked: false, count: 6, notes: "", photo: null, completed: false },
          { id: 2, text: "Rnd 2: INC x6. (12)", locked: false, count: 12, notes: "", photo: null, completed: false },
          { id: 3, text: "Rnd 3: *SC, INC* x6. (18)", locked: false, count: 18, notes: "", photo: null, completed: false },
          { id: 4, text: "Rnds 4–8: SC all. (18) — change to cream for last 4 rounds of belly.", locked: false, count: 18, notes: "", photo: null, completed: false },
          { id: 5, text: "Rnd 9: *SC, DEC* x6. Stuff firmly. (12) — fasten off.", locked: false, count: 12, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Head",
        notes: "Attach to body and sew limbs on.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 6, text: "MR, 6 SC. INC x6 (12). *SC, INC* x6 (18). *SC 2, INC* x6 (24). Rnds 5–8: SC all.", locked: false, count: 24, notes: "", photo: null, completed: false },
          { id: 7, text: "Attach safety eyes between rnds 5–6, 7 sts apart. Stuff head.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 8, text: "*SC 2, DEC* x6 (18). *SC, DEC* x6 (12). DEC x6 (6). Close.", locked: false, count: 6, notes: "", photo: null, completed: false },
          { id: 9, text: "Make 2 tiny arms (Ch 4, SC back) and 2 legs (MR 6, INC x6, SC 4 rnds). Sew all parts to body.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
  {
    title: "Galaxy Beanie",
    projectType: "Wearable",
    skillLevel: "Beginner",
    yarnType: "Chunky Weight",
    size: "Adult M (56cm circumference)",
    description: "A slouchy ribbed beanie in midnight navy with streaks of purple and teal — cosmic and cosy at the same time.",
    materialsNotes: "Work in rows then seam, or directly in the round with a magic ring.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Midnight Navy", volume: "~120g / ~170 yards" },
      { color: "Cosmic Purple", volume: "~30g / ~45 yards" },
    ],
    hookRequirements: [{ size: "6mm", quantity: 1, note: "Or to match gauge." }],
    notionsRequirements: [
      { name: "Stitch marker", description: "1 locking", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For weaving ends" },
    ],
    sections: [
      {
        name: "Brim",
        notes: "Work in BLO for stretchy ribbing.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Ch 9. Row 1: SC in 2nd ch and each ch across. (8)", locked: false, count: 8, notes: "", photo: null, completed: false },
          { id: 2, text: "Rows 2–56: Ch 1, turn. SC BLO across. (8)", locked: false, count: 8, notes: "", photo: null, completed: false },
          { id: 3, text: "Join row 56 to row 1 with slip stitch to form a tube.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Crown",
        notes: "Pick up stitches along one edge of the brim.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "Pick up 56 SC evenly around top edge. Join purple. Work 10 rnds SC.", locked: false, count: 56, notes: "", photo: null, completed: false },
          { id: 5, text: "*SC 6, DEC* x7 (49). *SC 5, DEC* x7 (42). Continue decreasing until 6 sts remain. Pull tight, fasten off.", locked: false, count: 6, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
  {
    title: "Pixel Heart Keyring",
    projectType: "Accessory",
    skillLevel: "Beginner",
    yarnType: "4-ply / Fingering",
    size: "~5cm x 5cm",
    description: "A chunky 8-bit style heart keychain worked in red and outlined in black — great for backpacks and bags.",
    materialsNotes: "Use a 2.5mm hook for tighter fabric. Stuff very lightly so it holds its shape.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "Yes — a tiny pinch of fiberfill",
    yarnRequirements: [
      { color: "Pixel Red", volume: "~10g / ~30 yards" },
      { color: "Black", volume: "~3g / ~8 yards" },
    ],
    hookRequirements: [{ size: "2.5mm", quantity: 1, note: "" }],
    notionsRequirements: [
      { name: "Split ring keyring", description: "25mm", quantity: 1 },
      { name: "Polyester fiberfill", description: "Small amount", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For weaving ends and seaming" },
    ],
    sections: [
      {
        name: "Heart (make 2)",
        notes: "Work both halves flat then seam.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "With red: Ch 2. Make 3 SC in first ch. (3)", locked: false, count: 3, notes: "", photo: null, completed: false },
          { id: 2, text: "Row 2: Ch 1, turn. INC in each st. (6)", locked: false, count: 6, notes: "", photo: null, completed: false },
          { id: 3, text: "Row 3: Ch 1, turn. INC, SC 2, INC, INC, SC 2, INC. (10)", locked: false, count: 10, notes: "", photo: null, completed: false },
          { id: 4, text: "Rows 4–6: Ch 1, turn. SC all. (10)", locked: false, count: 10, notes: "", photo: null, completed: false },
          { id: 5, text: "Row 7: SC 3, skip 4, SC 3. Shape the dip at top. Fasten off.", locked: false, count: 6, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Finishing",
        notes: "Join with black SC border and attach keyring.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 6, text: "Hold both pieces WS together. With black, SC evenly around entire edge, inserting a tiny pinch of fiberfill before closing.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 7, text: "Before last few sts, loop a short ch through the split ring and attach. Fasten off, weave ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
  {
    title: "Cactus Desk Buddy",
    projectType: "Home",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "~12cm tall",
    description: "A smiling barrel cactus in a tiny terracotta pot — no watering required. Great desk ornament.",
    materialsNotes: "The pot base is crocheted separately and the cactus sits inside it.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "Yes — firm stuffing",
    yarnRequirements: [
      { color: "Cactus Green", volume: "~40g / ~90 yards" },
      { color: "Terracotta", volume: "~25g / ~55 yards" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1, note: "" }],
    notionsRequirements: [
      { name: "Safety eyes", description: "6mm black", quantity: 2 },
      { name: "Polyester fiberfill", description: "Firm grade", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For sewing and embroidery" },
    ],
    sections: [
      {
        name: "Cactus Body",
        notes: "Work in continuous rounds in green.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "MR, 6 SC. INC x6 (12). *SC, INC* x6 (18). Rnds 4–12: SC all. (18)", locked: false, count: 18, notes: "", photo: null, completed: false },
          { id: 2, text: "Attach safety eyes between rnds 7–8, 4 sts apart.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "Stuff firmly. *SC, DEC* x6 (12). DEC x6 (6). Close.", locked: false, count: 6, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Pot",
        notes: "Work in terracotta.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "MR, 6 SC. INC x6 (12). *SC, INC* x6 (18). Rnd 4: SC in BLO (forms base crease). Rnds 5–8: SC all. Fasten off.", locked: false, count: 18, notes: "", photo: null, completed: false },
          { id: 5, text: "Stuff the pot lightly, insert cactus body so it peeks out ~5cm. Stitch pot rim to cactus.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
  {
    title: "Controller Pouch",
    projectType: "Accessory",
    skillLevel: "Intermediate",
    yarnType: "DK Weight",
    size: "~16cm x 11cm",
    description: "A flat crochet pouch shaped like a retro game controller. Zip closure, perfect for cables, coins, or earbuds.",
    materialsNotes: "Work front and back flat, then join. A 20cm zipper is sewn in by hand.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Charcoal Grey", volume: "~60g / ~135 yards" },
      { color: "Red", volume: "~10g / ~22 yards" },
      { color: "Blue", volume: "~10g / ~22 yards" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1, note: "" }],
    notionsRequirements: [
      { name: "Zipper", description: "20cm, black or charcoal", quantity: 1 },
      { name: "Sewing needle & thread", description: "Black thread", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For weaving ends" },
    ],
    sections: [
      {
        name: "Main Panel (make 2)",
        notes: "Work in rows in charcoal.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Ch 35. SC across. (34)", locked: false, count: 34, notes: "", photo: null, completed: false },
          { id: 2, text: "Rows 2–22: Ch 1, turn. SC all. (34)", locked: false, count: 34, notes: "", photo: null, completed: false },
          { id: 3, text: "Shape grips: on last 2 rows, DEC at each end 3x to taper. Fasten off.", locked: false, count: 28, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Button Details & Assembly",
        notes: "Use surface slip stitch for button symbols.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "With red and blue, surface SC small circles for A/B/X/Y buttons on front panel.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "Hold panels WS together. SC around 3 sides with charcoal, leaving top open.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Sew zipper along the open top edge with needle and thread. Weave all ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
];

const AKKA_PATTERNS: SeedPattern[] = [
  {
    title: "Spring Daisy Headband",
    projectType: "Wearable",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "Fits most adults",
    description: "A stretchy earwarmer-style headband with a cluster of three crocheted daisies at one side. Sweet and quick.",
    materialsNotes: "The headband is worked in the round; daisies are made separately and sewn on.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Oat Beige", volume: "~50g / ~110 yards" },
      { color: "Buttercup Yellow", volume: "~10g / ~22 yards" },
      { color: "White", volume: "~10g / ~22 yards" },
    ],
    hookRequirements: [{ size: "4mm", quantity: 1, note: "" }],
    notionsRequirements: [
      { name: "Stitch marker", description: "1 locking", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For attaching daisies" },
    ],
    sections: [
      {
        name: "Headband Band",
        notes: "Join in round and work in rib pattern.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Ch 9. Join with slip st. Rnd 1: SC BLO in each st. (8)", locked: false, count: 8, notes: "", photo: null, completed: false },
          { id: 2, text: "Continue SC BLO each round until piece measures 52cm when lightly stretched.", locked: false, count: 8, notes: "", photo: null, completed: false },
          { id: 3, text: "Join to cast-on edge. Fasten off.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Daisies (make 3)",
        notes: "Work each daisy flat.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "With yellow: MR, 6 SC, join. Fasten off.", locked: false, count: 6, notes: "", photo: null, completed: false },
          { id: 5, text: "With white: join to any st. *Ch 4, SC in same st, move to next st* x6. Fasten off.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Sew 3 daisies in a cluster to one side of headband. Weave ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
  {
    title: "Sunflower Coasters (Set of 4)",
    projectType: "Home",
    skillLevel: "Beginner",
    yarnType: "Cotton DK",
    size: "~10cm diameter each",
    description: "Bright sunflower coasters in golden yellow with brown centres. Sturdy cotton yarn stands up to mugs and glasses.",
    materialsNotes: "Cotton is best for absorbency. Block lightly after finishing for a flat result.",
    favorite: true,
    status: "finished",
    startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Sunflower Yellow", volume: "~60g / ~130 yards (all 4)" },
      { color: "Chocolate Brown", volume: "~20g / ~45 yards (all 4)" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1, note: "Cotton knits up smaller — check gauge." }],
    notionsRequirements: [],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Spray bottle for blocking", description: "" },
    ],
    sections: [
      {
        name: "Centre (make 4)",
        notes: "Work in brown.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "MR, 6 SC. INC x6 (12). *SC, INC* x6 (18). Join, fasten off.", locked: false, count: 18, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Petals",
        notes: "Join yellow to any st of centre.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Join yellow. *Ch 5, SC in 2nd ch from hook, HDC, DC, HDC, SC back into same ring st, slip to next st* x18. Fasten off.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 3, text: "Weave ends. Block all 4 flat.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },
  {
    title: "Market Tote Bag",
    projectType: "Accessory",
    skillLevel: "Intermediate",
    yarnType: "Cotton Aran",
    size: "~35cm wide x 40cm deep",
    description: "A simple sturdy tote with open mesh body and solid base. Great for a farmers market or the library.",
    materialsNotes: "The base is worked in rounds then the mesh body is worked up in rows joined at sides.",
    favorite: false,
    status: "active",
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Natural Cream", volume: "~250g / ~400 yards" },
    ],
    hookRequirements: [{ size: "5mm", quantity: 1, note: "" }],
    notionsRequirements: [
      { name: "Stitch markers", description: "4 locking", quantity: 4 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Scissors", description: "" },
    ],
    sections: [
      {
        name: "Base",
        notes: "Work in continuous rounds.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Ch 25. SC in 2nd ch, SC across to end, 3 SC in last ch. Continue along other side. Join. (54)", locked: false, count: 54, notes: "", photo: null, completed: true },
          { id: 2, text: "Work 4 more rnds SC, increasing 2 sts each end every rnd to maintain oval. (70 approx)", locked: false, count: 70, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Mesh Body",
        notes: "Work in mesh stitch up from base.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 3, text: "Rnd 1: *Ch 1, skip 1, SC* repeat around. Join.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Rnds 2–20: *SC in ch-1 space, Ch 1* around. Join each rnd.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Handles (make 2)",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 5, text: "Ch 55. SC back along chain. (54) Repeat for second handle.", locked: false, count: 54, notes: "", photo: null, completed: false },
          { id: 6, text: "Sew handles firmly to inside top edge, 8 sts in from each side.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
  {
    title: "Lavender Eye Mask",
    projectType: "Accessory",
    skillLevel: "Beginner",
    yarnType: "Cotton DK",
    size: "~20cm x 9cm",
    description: "A soft cotton sleep eye mask in a muted lavender. Worked flat with an elastic strap for a snug fit.",
    materialsNotes: "Use 100% cotton for comfort against skin. The elastic is threaded through a channel at each end.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Soft Lavender", volume: "~30g / ~65 yards" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1, note: "" }],
    notionsRequirements: [
      { name: "Elastic band", description: "1cm wide, 40cm length", quantity: 1 },
      { name: "Sewing needle & thread", description: "Matching colour", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
    ],
    sections: [
      {
        name: "Main Panel",
        notes: "Work flat in rows.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Ch 41. SC across. (40)", locked: false, count: 40, notes: "", photo: null, completed: false },
          { id: 2, text: "Rows 2–3: SC all.", locked: false, count: 40, notes: "", photo: null, completed: false },
          { id: 3, text: "Row 4 (nose bridge shaping): SC 16, DEC x4, SC 16. (36)", locked: false, count: 36, notes: "", photo: null, completed: false },
          { id: 4, text: "Rows 5–6: SC all. (36)", locked: false, count: 36, notes: "", photo: null, completed: false },
          { id: 5, text: "Row 7: SC 16, INC x4, SC 16. (40) Rows 8–10: SC all. Fasten off.", locked: false, count: 40, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Strap Channels & Finishing",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 6, text: "Fold each short end over 1cm and slip stitch to form a channel. Thread elastic through, knot ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 7, text: "SC border around entire outer edge if desired. Weave all ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
  {
    title: "Mini Succulent in Pot",
    projectType: "Home",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "~8cm tall",
    description: "An adorably plump crocheted echeveria succulent sitting in a mini terracotta-coloured pot. No sunlight needed!",
    materialsNotes: "Use different greens and a touch of pink for realistic succulent colouring.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "Yes — small amount of fiberfill",
    yarnRequirements: [
      { color: "Sage Green", volume: "~20g / ~45 yards" },
      { color: "Dusty Pink", volume: "~5g / ~10 yards (petal tips)" },
      { color: "Terracotta", volume: "~15g / ~35 yards (pot)" },
    ],
    hookRequirements: [{ size: "3mm", quantity: 1, note: "" }],
    notionsRequirements: [
      { name: "Polyester fiberfill", description: "Small amount", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
    ],
    sections: [
      {
        name: "Leaves (make 8)",
        notes: "Work each petal flat.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Ch 6. SC in 2nd ch, SC 2, HDC, 3 DC in last ch. Work back: HDC, SC 2, SC. Join, fasten off. Change to pink for last 2 tips.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Centre & Pot",
        notes: "Assemble leaves around a small centre.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Make a small disc: MR, 6 SC, INC x6 (12). Join, fasten off.", locked: false, count: 12, notes: "", photo: null, completed: false },
          { id: 3, text: "Sew 4 leaves in a ring to outer edge of disc. Sew 4 more leaves layered on top, slightly offset.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Pot: MR, 6, INC x6 (12), *SC, INC* x6 (18). Rnd 4: BLO SC (crease). Rnds 5–6: SC. DO NOT close — tuck fiberfill in, sit succulent on top, stitch together.", locked: false, count: 18, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
];

const MUMMY_PATTERNS: SeedPattern[] = [
  {
    title: "Cosy Chunky Cushion Cover",
    projectType: "Home",
    skillLevel: "Beginner",
    yarnType: "Super Chunky",
    size: "45cm x 45cm",
    description: "A fast, satisfying chunky cushion cover in a simple waffle stitch. Done in one sitting on a rainy afternoon.",
    materialsNotes: "Use a matching or contrasting zip, or simply sew the opening closed with a few stitches.",
    favorite: true,
    status: "finished",
    startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Oatmeal Cream", volume: "~300g / ~150 yards" },
    ],
    hookRequirements: [{ size: "10mm", quantity: 1, note: "Large hook for super chunky." }],
    notionsRequirements: [
      { name: "45cm cushion insert", description: "", quantity: 1 },
      { name: "Sewing needle & thread", description: "", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
    ],
    sections: [
      {
        name: "Front Panel",
        notes: "Waffle stitch: *FPDC, SC* across, alternating rows.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Ch 28. HDC across. (27)", locked: false, count: 27, notes: "", photo: null, completed: true },
          { id: 2, text: "Rows 2–26: Ch 2, turn. *FPDC, SC* across. (27)", locked: false, count: 27, notes: "", photo: null, completed: true },
          { id: 3, text: "Fasten off. Make a second panel the same way for the back.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Assembly",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "Hold panels WS together. SC around 3 sides. Insert cushion. SC last side closed.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },
  {
    title: "Kitchen Dishcloth Set",
    projectType: "Home",
    skillLevel: "Beginner",
    yarnType: "Cotton DK",
    size: "~25cm x 25cm each",
    description: "Practical and pretty dishcloths in a simple basketweave. Great handmade gift too — everyone needs one.",
    materialsNotes: "100% cotton only — other fibres don't wash well or absorb properly.",
    favorite: false,
    status: "active",
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Sage Green", volume: "~80g / ~175 yards (2 cloths)" },
      { color: "Cream", volume: "~80g / ~175 yards (2 cloths)" },
    ],
    hookRequirements: [{ size: "4mm", quantity: 1, note: "Cotton benefits from a slightly larger hook than usual." }],
    notionsRequirements: [],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
    ],
    sections: [
      {
        name: "Dishcloth (make 4)",
        notes: "Work in basketweave: alternate FPDC and BPDC blocks every 2 rows.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Ch 31. DC across. (30)", locked: false, count: 30, notes: "", photo: null, completed: false },
          { id: 2, text: "Row 2: Ch 2, turn. *FPDC x3, BPDC x3* x5. (30)", locked: false, count: 30, notes: "", photo: null, completed: false },
          { id: 3, text: "Row 3: Ch 2, turn. *BPDC x3, FPDC x3* x5. (30)", locked: false, count: 30, notes: "", photo: null, completed: false },
          { id: 4, text: "Repeat rows 2–3 until piece is 25cm. Fasten off. SC border around entire edge.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
  {
    title: "Autumn Leaf Table Runner",
    projectType: "Home",
    skillLevel: "Intermediate",
    yarnType: "Cotton Aran",
    size: "~120cm x 28cm",
    description: "A seasonal table runner with crocheted leaves in rust, gold and burgundy stitched onto a linen-stitch base.",
    materialsNotes: "Work the base first, then make leaves separately and sew them on in a scattered arrangement.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Linen Cream", volume: "~200g / ~320 yards (base)" },
      { color: "Rust Orange", volume: "~40g / ~65 yards" },
      { color: "Mustard Gold", volume: "~30g / ~48 yards" },
      { color: "Burgundy", volume: "~30g / ~48 yards" },
    ],
    hookRequirements: [{ size: "4.5mm", quantity: 1, note: "" }],
    notionsRequirements: [],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Pins for blocking", description: "" },
    ],
    sections: [
      {
        name: "Base Runner",
        notes: "Linen stitch (alternating SC and ch-1 gaps) gives a fabric-like texture.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Ch 175. Row 1: SC in 2nd ch. *Ch 1, skip 1, SC* to end. (87 SC + 87 ch-1)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 2, text: "Rows 2–18: Ch 1, turn. SC in ch-1 sp, *ch 1, SC in next ch-1 sp* across.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "SC border all around. Block flat.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Leaves (make ~20)",
        notes: "Mix colours freely.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "Ch 11. SC in 2nd ch, HDC, DC 3, HDC, SC, slip. Ch 3, turn and work back: SC, HDC, DC 3, HDC, SC. Join at base. Fasten off.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "Embroider a centre vein line in a contrasting colour. Sew leaves across the runner in a scattered autumn arrangement.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
  {
    title: "Tea Cosy",
    projectType: "Home",
    skillLevel: "Beginner",
    yarnType: "Aran Weight",
    size: "Fits a standard 6-cup teapot",
    description: "A classic ribbed tea cosy with a little button loop on top. Keeps the pot warm through a whole pot of tea.",
    materialsNotes: "Worked in two flat halves then seamed, leaving gaps for the handle and spout.",
    favorite: false,
    status: "finished",
    startedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Dusty Rose", volume: "~120g / ~220 yards" },
    ],
    hookRequirements: [{ size: "5mm", quantity: 1, note: "" }],
    notionsRequirements: [
      { name: "Button", description: "15mm, decorative", quantity: 1 },
      { name: "Sewing needle & thread", description: "", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
    ],
    sections: [
      {
        name: "Main Panel (make 2)",
        notes: "Work flat in ribbed HDC.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Ch 28. HDC across. (27)", locked: false, count: 27, notes: "", photo: null, completed: true },
          { id: 2, text: "Rows 2–15: Ch 1, turn. HDC BLO across. (27)", locked: false, count: 27, notes: "", photo: null, completed: true },
          { id: 3, text: "Shape top: DEC at each end every row until 11 sts remain. Fasten off.", locked: false, count: 11, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Assembly",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "Seam the two panels tog at top and sides, leaving 7cm gaps on each side for spout and handle.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 5, text: "Ch 10 loop at crown, sew button on opposite side. Weave all ends.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },
  {
    title: "Heart Garland",
    projectType: "Home",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "~150cm long (10 hearts)",
    description: "A sweet bunting garland of crocheted hearts in mixed pinks and reds, threaded onto twine. Perfect for a mantelpiece.",
    materialsNotes: "Use up yarn scraps — no need for full balls of each colour.",
    favorite: true,
    status: "finished",
    startedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: undefined,
    yarnRequirements: [
      { color: "Assorted pinks, reds, and blush scraps", volume: "~5g / ~11 yards per heart" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1, note: "" }],
    notionsRequirements: [
      { name: "Twine or ribbon", description: "~180cm length", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
    ],
    sections: [
      {
        name: "Hearts (make 10)",
        notes: "Each heart is two lobes joined.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Lobe 1: MR, SC 6, join. Do not fasten off.", locked: false, count: 6, notes: "", photo: null, completed: true },
          { id: 2, text: "Lobe 2: Ch 1, MR, SC 6 into a new ring, join to lobe 1 slip st. (12 total forming top of heart)", locked: false, count: 12, notes: "", photo: null, completed: true },
          { id: 3, text: "Work around both lobes: SC 3, HDC 2, DC 1 (peak), HDC 2, SC 3 (bottom point), HDC 2, DC 1, HDC 2, SC 3. Join, fasten off.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Assembly",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "Thread twine through the top loop of each heart, spacing them ~12cm apart. Tie knots at each end.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },
];

const PROFILE_SEED_FLAG = "profile_content_seeded_v1";

// ── Starter stash items ────────────────────────────────────────────────────────

type SeedStash = Omit<StashItem, "id">;

const VUMSH_STASH: SeedStash[] = [
  { type: "yarn", name: "Paintbox Simply DK", color: "Jungle Green", volume: "~200g / 450 yards", quantity: 2, description: "Main colour for Roary & Cactus Buddy" },
  { type: "yarn", name: "Paintbox Simply DK", color: "Midnight Navy", volume: "~150g / 340 yards", quantity: 1, description: "Galaxy Beanie main colour" },
  { type: "yarn", name: "4-ply Fingering", color: "Pixel Red", volume: "~50g / 150 yards", quantity: 1, description: "Pixel Heart Keyring" },
  { type: "yarn", name: "Paintbox Simply DK", color: "Charcoal Grey", volume: "~100g / 225 yards", quantity: 1, description: "Controller Pouch main colour" },
  { type: "hook", name: "Prym Ergonomics Hook", size: "3.5mm", quantity: 1, description: "Go-to hook for DK amigurumi" },
  { type: "hook", name: "Clover Soft Touch Hook", size: "2.5mm", quantity: 1, description: "Fingering weight — keyring projects" },
  { type: "notion", name: "Safety Eyes", description: "Assorted black: 6mm, 9mm, 12mm", quantity: 12 },
  { type: "notion", name: "Polyester Fibrefill", description: "Premium grade, 200g bag", quantity: 1 },
  { type: "tool", name: "Tapestry Needles", description: "Pack of 6 assorted sizes", quantity: 1 },
];

const AKKA_STASH: SeedStash[] = [
  { type: "yarn", name: "Paintbox Cotton DK", color: "Oat Beige", volume: "~200g / 440 yards", quantity: 2, description: "Spring Daisy Headband + neutral projects" },
  { type: "yarn", name: "Paintbox Cotton DK", color: "Soft Lavender", volume: "~100g / 220 yards", quantity: 1, description: "Lavender Eye Mask" },
  { type: "yarn", name: "Paintbox Cotton DK", color: "Sunflower Yellow", volume: "~100g / 220 yards", quantity: 1, description: "Sunflower Coasters" },
  { type: "yarn", name: "Paintbox Cotton Aran", color: "Natural Cream", volume: "~250g / 400 yards", quantity: 1, description: "Market Tote Bag" },
  { type: "hook", name: "Clover Amour Hook", size: "3.5mm", quantity: 1, description: "Cotton DK projects" },
  { type: "hook", name: "Clover Amour Hook", size: "5mm", quantity: 1, description: "Aran weight tote bag" },
  { type: "notion", name: "Locking Stitch Markers", description: "Pack of 20 mixed colours", quantity: 1 },
  { type: "notion", name: "Elastic Band", description: "1cm wide, 50cm lengths — for headband & eye mask", quantity: 3 },
  { type: "tool", name: "Tapestry Needle", description: "Blunt-tip sewing up needle", quantity: 2 },
];

const MUMMY_STASH: SeedStash[] = [
  { type: "yarn", name: "Lion Brand Wool-Ease Thick & Quick", color: "Oatmeal", volume: "~400g / 320 yards", quantity: 2, description: "Chunky Cushion Cover main colour" },
  { type: "yarn", name: "Lion Brand 24/7 Cotton", color: "Dusty Rose", volume: "~200g / 380 yards", quantity: 1, description: "Kitchen Dishcloths + delicate makes" },
  { type: "yarn", name: "Paintbox Simply Aran", color: "Rust Orange", volume: "~200g / 400 yards", quantity: 1, description: "Autumn Leaf Runner + seasonal projects" },
  { type: "hook", name: "Boye Ergonomic Hook", size: "8mm", quantity: 1, description: "Chunky yarn — cushion cover" },
  { type: "hook", name: "Clover Amour Hook", size: "5mm", quantity: 1, description: "Aran weight projects" },
  { type: "hook", name: "Clover Amour Hook", size: "3.5mm", quantity: 1, description: "Cotton DK dishcloths" },
  { type: "notion", name: "Locking Stitch Markers", description: "Pack of 10", quantity: 1 },
  { type: "tool", name: "Tapestry Needle Set", description: "3 blunt-tip sizes", quantity: 1 },
  { type: "tool", name: "Fabric Scissors", description: "Dedicated yarn scissors", quantity: 1 },
];

const PROFILE_STASH_FLAG = "profile_stash_seeded_v1";

export async function seedProfileStash(): Promise<void> {
  try {
    if (await getMeta(PROFILE_STASH_FLAG)) {
      console.log("Profile stash: already done, skipping.");
      return;
    }

    console.log("Profile stash: seeding starter materials for Vumsh, Akka, Mummy…");

    for (const s of VUMSH_STASH) await stashService.createItem(s, "vumsh");
    console.log(`  Vumsh: ${VUMSH_STASH.length} stash items seeded ✓`);

    for (const s of AKKA_STASH) await stashService.createItem(s, "akka");
    console.log(`  Akka: ${AKKA_STASH.length} stash items seeded ✓`);

    for (const s of MUMMY_STASH) await stashService.createItem(s, "mummy");
    console.log(`  Mummy: ${MUMMY_STASH.length} stash items seeded ✓`);

    await setMeta(PROFILE_STASH_FLAG, new Date().toISOString());
    console.log("Profile stash: complete ✓");
  } catch (error) {
    console.error("Profile stash seed error:", error);
  }
}

export async function seedProfilePatterns(): Promise<void> {
  try {
    if (await getMeta(PROFILE_SEED_FLAG)) {
      console.log("Profile seeds: already done, skipping.");
      return;
    }

    console.log("Profile seeds: seeding starter patterns for Vumsh, Akka, Mummy…");

    for (const p of VUMSH_PATTERNS) {
      await patternService.createPattern(p, "vumsh");
    }
    console.log(`  Vumsh: ${VUMSH_PATTERNS.length} patterns seeded ✓`);

    for (const p of AKKA_PATTERNS) {
      await patternService.createPattern(p, "akka");
    }
    console.log(`  Akka: ${AKKA_PATTERNS.length} patterns seeded ✓`);

    for (const p of MUMMY_PATTERNS) {
      await patternService.createPattern(p, "mummy");
    }
    console.log(`  Mummy: ${MUMMY_PATTERNS.length} patterns seeded ✓`);

    await setMeta(PROFILE_SEED_FLAG, new Date().toISOString());
    console.log("Profile seeds: complete ✓");
  } catch (error) {
    console.error("Profile seed error:", error);
  }
}
