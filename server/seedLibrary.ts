import { patternService } from "./patternService";
import { stashService } from "./stashService";
import { db } from "./db";
import { patterns, stashItems } from "../shared/schema";
import { getMeta, setMeta } from "./ensureSchema";
import { seedAdditionalPatterns } from "./seedAdditionalPatterns";

const SEED_PATTERNS: Omit<import("../shared/schema").Pattern, "id" | "createdAt">[] = [
  {
    title: "Rosie the Strawberry Amigurumi",
    projectType: "Toy",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "~12cm tall",
    description: "A sweet little strawberry amigurumi with seed-dot embroidery and a leafy green crown. Perfect first amigurumi project!",
    materialsNotes: "Use safety eyes for kids 3+. Polyester fiberfill for stuffing.",
    favorite: true,
    status: "finished",
    startedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: "Yes — polyester fiberfill",
    yarnRequirements: [
      { color: "Strawberry Red", volume: "~40g / ~90 yards" },
      { color: "Sage Green", volume: "~15g / ~35 yards" },
      { color: "Cream", volume: "~5g / ~10 yards" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1, note: "Use a smaller hook to keep stuffing from showing." }],
    notionsRequirements: [
      { name: "Safety eyes", description: "9mm black", quantity: 2 },
      { name: "Polyester fiberfill", description: "Soft stuffing", quantity: 1 },
      { name: "Stitch markers", description: "For marking rounds", quantity: 3 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For weaving in ends and embroidery" },
      { name: "Scissors", description: "Sharp embroidery scissors" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "Red DK for body, green DK for leaves, cream for highlights.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Gather: Red DK (~40g), Sage Green DK (~15g), Cream DK (~5g)", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 2, text: "3.5mm crochet hook, 9mm safety eyes (x2), polyester fiberfill, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Strawberry Body",
        notes: "Work in continuous rounds. Do not join unless specified.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 3, text: "MR, 6 SC into ring. Pull tight. (6)", locked: false, count: 6, notes: "", photo: null, completed: true },
          { id: 4, text: "Round 2: INC in each st. (12)", locked: false, count: 12, notes: "", photo: null, completed: true },
          { id: 5, text: "Round 3: *SC, INC* repeat 6x. (18)", locked: false, count: 18, notes: "", photo: null, completed: true },
          { id: 6, text: "Round 4: *SC 2, INC* repeat 6x. (24)", locked: false, count: 24, notes: "", photo: null, completed: true },
          { id: 7, text: "Round 5: *SC 3, INC* repeat 6x. (30)", locked: false, count: 30, notes: "", photo: null, completed: true },
          { id: 8, text: "Rounds 6–10: SC in each st. (30)", locked: false, count: 30, notes: "", photo: null, completed: true },
          { id: 9, text: "Attach safety eyes between rounds 7–8, 6 sts apart.", locked: false, count: 0, notes: "Position eyes before closing!", photo: null, completed: true },
          { id: 10, text: "Round 11: *SC 3, DEC* repeat 6x. (24)", locked: false, count: 24, notes: "", photo: null, completed: true },
          { id: 11, text: "Round 12: *SC 2, DEC* repeat 6x. (18)", locked: false, count: 18, notes: "", photo: null, completed: true },
          { id: 12, text: "Stuff firmly with fiberfill.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 13, text: "Round 13: *SC, DEC* repeat 6x. (12)", locked: false, count: 12, notes: "", photo: null, completed: true },
          { id: 14, text: "Round 14: DEC 6x. (6) Fasten off, close opening.", locked: false, count: 6, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Leaf Crown",
        notes: "Make 3 leaves and sew to top of body.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 15, text: "With green: Ch 6, SC in 2nd ch from hook, HDC, DC, HDC, SC. Ch 1, turn. Work back along chain the same way. Join to form leaf. Make 3.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 16, text: "Sew leaves evenly around the top opening. Weave in all ends.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 17, text: "Embroider cream seed dots randomly over the body with tapestry needle.", locked: false, count: 0, notes: "Use small straight stitches for seeds.", photo: null, completed: true },
        ],
      },
    ],
  },

  {
    title: "Daisy Bucket Hat",
    projectType: "Wearable",
    skillLevel: "Beginner",
    yarnType: "Worsted Weight",
    size: "Adult S/M (56cm head circumference)",
    description: "A breezy summer bucket hat worked top-down in the round. Textured SC brim and a relaxed fit that suits everyone.",
    materialsNotes: "Block lightly after finishing to even the brim.",
    favorite: false,
    status: "active",
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Cream / Off-white", volume: "~150g / ~300 yards" },
    ],
    hookRequirements: [{ size: "5.0mm", quantity: 1, note: "Use 4.5mm for a tighter fabric if needed." }],
    notionsRequirements: [
      { name: "Stitch markers", description: "To mark round start", quantity: 2 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For finishing" },
      { name: "Measuring tape", description: "Check sizing regularly" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~150g worsted weight yarn in cream, 5.0mm hook, stitch markers, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Crown",
        notes: "Work in continuous rounds from the top down.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "MR, 6 SC. (6)", locked: false, count: 6, notes: "", photo: null, completed: true },
          { id: 3, text: "Round 2: INC x6. (12)", locked: false, count: 12, notes: "", photo: null, completed: true },
          { id: 4, text: "Round 3: *SC, INC* x6. (18)", locked: false, count: 18, notes: "", photo: null, completed: true },
          { id: 5, text: "Round 4: *SC 2, INC* x6. (24)", locked: false, count: 24, notes: "", photo: null, completed: true },
          { id: 6, text: "Round 5: *SC 3, INC* x6. (30)", locked: false, count: 30, notes: "", photo: null, completed: true },
          { id: 7, text: "Round 6: *SC 4, INC* x6. (36)", locked: false, count: 36, notes: "", photo: null, completed: true },
          { id: 8, text: "Round 7: *SC 5, INC* x6. (42)", locked: false, count: 42, notes: "", photo: null, completed: true },
          { id: 9, text: "Round 8: *SC 6, INC* x6. (48)", locked: false, count: 48, notes: "", photo: null, completed: true },
          { id: 10, text: "Round 9: *SC 7, INC* x6. (54)", locked: false, count: 54, notes: "", photo: null, completed: true },
          { id: 11, text: "Round 10: *SC 8, INC* x6. (60)", locked: false, count: 60, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Band",
        notes: "Keep tension even — this section sets the hat's depth.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 12, text: "Rounds 11–18: SC in each st. (60) — 8 rounds straight.", locked: false, count: 60, notes: "Try on as you go!", photo: null, completed: false },
          { id: 13, text: "Round 19 (brim ridge): Working in BLO, SC all around. (60)", locked: false, count: 60, notes: "BLO creates a fold line for the brim.", photo: null, completed: false },
        ],
      },
      {
        name: "Brim",
        notes: "Increases make the brim flare outward.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 14, text: "Round 20: *SC 9, INC* x6. (66)", locked: false, count: 66, notes: "", photo: null, completed: false },
          { id: 15, text: "Round 21: SC all. (66)", locked: false, count: 66, notes: "", photo: null, completed: false },
          { id: 16, text: "Round 22: *SC 10, INC* x6. (72)", locked: false, count: 72, notes: "", photo: null, completed: false },
          { id: 17, text: "Round 23: SC all. (72)", locked: false, count: 72, notes: "", photo: null, completed: false },
          { id: 18, text: "Round 24: *SC 11, INC* x6. (78)", locked: false, count: 78, notes: "", photo: null, completed: false },
          { id: 19, text: "Round 25: SC all. (78) Fasten off, weave in ends. Block lightly.", locked: false, count: 78, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Chunky Cloud Throw Blanket",
    projectType: "Home Decor",
    skillLevel: "Intermediate",
    yarnType: "Super Bulky",
    size: "120cm × 150cm",
    description: "A squishy, cloud-soft throw in a simple shell stitch. Works up fast in super bulky yarn — a cosy weekend project.",
    materialsNotes: "Hand wash cold, lay flat to dry.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Cloud White", volume: "~600g / ~180 yards" },
    ],
    hookRequirements: [{ size: "10.0mm", quantity: 1, note: "A larger hook gives a fluffier drape." }],
    notionsRequirements: [
      { name: "Stitch markers", description: "To count repeats", quantity: 4 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "Large eye for super bulky yarn" },
      { name: "Blocking mat", description: "For final blocking" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~600g super bulky yarn in white/cream, 10.0mm hook, tapestry needle, stitch markers", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Foundation",
        notes: "Starting chain sets the width. Adjust in multiples of 3 for different sizes.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 66 (multiples of 3 + 3 for turning). Foundation counts as 120cm width.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "Row 1 (RS): DC in 4th ch from hook, *skip 2 ch, (2 DC, ch 2, 2 DC) in next ch* across, end DC 2 in last ch. Ch 3, turn.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Shell Stitch Body",
        notes: "Repeat Row 2 until blanket measures 150cm.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "Row 2 (shell row): *(2 DC, ch 2, 2 DC) into each ch-2 space across.* End DC in top of turning ch. Ch 3, turn.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "Repeat Row 2 until piece measures ~148cm. Approximately 35–40 rows in super bulky yarn.", locked: false, count: 0, notes: "Measure flat — super bulky compresses under tension.", photo: null, completed: false },
        ],
      },
      {
        name: "Border",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 6, text: "Join yarn at any corner. Ch 1. Work 1 round SC evenly around all 4 edges, working 3 SC in each corner. Join with slip stitch.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 7, text: "Round 2: Ch 1, *SC, skip 2, 5 DC fan in next st, skip 2* around. Fasten off. Weave in ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Autumn Leaf Coaster Set",
    projectType: "Home Decor",
    skillLevel: "Beginner",
    yarnType: "Cotton DK",
    size: "~10cm across each",
    description: "A set of 4 maple-leaf shaped coasters in warm autumn tones. Great stash-buster and a lovely handmade gift.",
    materialsNotes: "Use 100% cotton yarn so coasters can be machine-washed.",
    favorite: true,
    status: "finished",
    startedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Rust Orange", volume: "~30g / ~65 yards" },
      { color: "Burnt Amber", volume: "~30g / ~65 yards" },
      { color: "Mustard Yellow", volume: "~20g / ~45 yards" },
    ],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Stitch markers", description: "To mark leaf points", quantity: 5 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For finishing" },
      { name: "Scissors", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "Make 4 total — mix colours for the set.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Cotton DK in rust, amber, and mustard (~80g total), 4.0mm hook, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Leaf Body (make 4)",
        notes: "Each leaf is worked in rounds from a centre chain.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 12. SC in 2nd ch, SC 8, HDC, (SC, Ch 2, SC) in last ch for tip. Turn, work back along other side: HDC, SC 8, SC. Join.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 3, text: "Round 2: Ch 1, SC around entire oval. Work 3 SC at each pointed end. PM at each end for lobes.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 4, text: "Rounds 3–4: Continue SC all around, increasing at each tip to maintain leaf shape.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 5, text: "Stem: Ch 6 at base of leaf, slip stitch back along chain. Fasten off. Weave in ends.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },

  {
    title: "Boho Market Bag",
    projectType: "Accessory",
    skillLevel: "Intermediate",
    yarnType: "Worsted Cotton",
    size: "~35cm wide × 40cm deep",
    description: "An open-mesh market bag in a simple chainspace pattern. Sturdy enough for shopping, pretty enough for the beach.",
    materialsNotes: "Stretch the bag slightly when wet to open the mesh.",
    favorite: false,
    status: "active",
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Natural / Ecru", volume: "~200g / ~350 yards" },
    ],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Stitch markers", description: "To mark round start", quantity: 2 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "Weaving ends" },
      { name: "Scissors", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~200g worsted cotton in natural/ecru, 5.0mm hook, stitch markers", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Bag Base",
        notes: "The base is a flat oval worked in rounds.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 20. SC in 2nd ch from hook, SC 17, 3 SC in last ch. Continue around to opposite side: SC 17, 2 SC in first ch. Join. (40)", locked: false, count: 40, notes: "", photo: null, completed: true },
          { id: 3, text: "Round 2: INC, SC 17, INC x3, SC 17, INC x2. (46)", locked: false, count: 46, notes: "", photo: null, completed: true },
          { id: 4, text: "Round 3: SC 2, INC, SC 17, *SC, INC* x3, SC 17, *SC, INC* x2. (52)", locked: false, count: 52, notes: "", photo: null, completed: false },
          { id: 5, text: "Round 4: SC all even. (52) — base complete.", locked: false, count: 52, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Mesh Body",
        notes: "Chain spaces create the open mesh pattern.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 6, text: "Round 1 (mesh start): Ch 1, *SC, ch 2, skip 2* around. Join. (17 mesh spaces + remainder SC)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 7, text: "Rounds 2–20: Ch 1, *SC into each SC, ch 2 into each ch-2 space* around. Join.", locked: false, count: 0, notes: "Approx 20 rounds = 40cm depth.", photo: null, completed: false },
          { id: 8, text: "After round 20: SC one solid round to firm up the top edge. (52)", locked: false, count: 52, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Handles",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 9, text: "Mark two points 10 sts apart at front and back of bag. Ch 40, skip 10 sts, SC to rejoin. Repeat for second handle.", locked: false, count: 0, notes: "Handles should be equal length!", photo: null, completed: false },
          { id: 10, text: "SC firmly along each handle chain 2–3 times to reinforce. Fasten off. Weave in all ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Honeycomb Headband",
    projectType: "Accessory",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "Adult one-size (52–58cm head)",
    description: "A chunky cabled-look headband using front post DC stitches to create a honeycomb texture. Quick to make and beautiful to wear.",
    materialsNotes: "Stretchy yarn works best for a comfortable fit.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Dusty Rose", volume: "~60g / ~140 yards" },
    ],
    hookRequirements: [{ size: "4.5mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Stitch markers", description: "Mark pattern repeats", quantity: 3 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For seaming" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~60g DK weight in dusty rose, 4.5mm hook, stitch markers, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Headband Strip",
        notes: "Worked flat, then seamed at the ends to form a circle.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 13 (odd number for pattern).", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "Row 1 (WS): SC in 2nd ch from hook, SC across. (12) Ch 2, turn.", locked: false, count: 12, notes: "", photo: null, completed: false },
          { id: 4, text: "Row 2 (RS): *FPDC around post of next st, DC in next st* across. Ch 2, turn.", locked: false, count: 12, notes: "FPDC = Front Post Double Crochet — creates the texture.", photo: null, completed: false },
          { id: 5, text: "Row 3: DC in each st across. Ch 2, turn. (12)", locked: false, count: 12, notes: "", photo: null, completed: false },
          { id: 6, text: "Repeat Rows 2–3 until strip measures 50cm (approx 34 rows). Fasten off leaving 30cm tail.", locked: false, count: 12, notes: "Measure unstretched — it will stretch 10–15% when worn.", photo: null, completed: false },
          { id: 7, text: "Fold strip into a loop, join short ends with mattress stitch using the tail. Weave in ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
];

const SEED_STASH: Omit<import("../shared/schema").StashItem, "id">[] = [
  { type: "yarn", name: "Lion Brand Wool-Ease", color: "Dusty Rose", volume: "197 yards / 85g", quantity: 3, description: "DK weight acrylic/wool blend", notes: "Great for accessories" },
  { type: "yarn", name: "Paintbox Cotton DK", color: "Cream", volume: "270 yards / 100g", quantity: 2, description: "100% cotton DK", notes: "Perfect for amigurumi and home decor" },
  { type: "yarn", name: "Loops & Threads Charisma", color: "Sage Green", volume: "109 yards / 100g", quantity: 4, description: "Super bulky acrylic", notes: "Quick blanket projects" },
  { type: "yarn", name: "WeCrochet Swish DK", color: "Rust Orange", volume: "123 yards / 50g", quantity: 2, description: "DK superwash merino", notes: "Lovely hand feel, great for wearables" },
  { type: "yarn", name: "Scheepjes Catona", color: "Navy Blue", volume: "62 yards / 25g", quantity: 5, description: "Fingering weight cotton", notes: "Stash from a CAL — lots of small balls" },
  { type: "yarn", name: "Red Heart Super Saver", color: "Sunflower Yellow", volume: "364 yards / 198g", quantity: 1, description: "Worsted acrylic", notes: "In good condition, still on skein" },
  { type: "yarn", name: "Paintbox Cotton DK", color: "Strawberry Red", volume: "270 yards / 100g", quantity: 2, description: "100% cotton DK", notes: "Stash from coaster project, a bit left over" },
  { type: "hook", name: "Clover Amour Hook", size: "4.0mm", quantity: 1, description: "Ergonomic soft-grip handle", notes: "My go-to for DK weight" },
  { type: "hook", name: "Clover Amour Hook", size: "5.0mm", quantity: 1, description: "Ergonomic soft-grip handle", notes: "Worsted weight hook" },
  { type: "hook", name: "Boye Steel Hook Set", size: "3.5mm", quantity: 1, description: "Standard aluminium", notes: "For amigurumi tight stitches" },
  { type: "hook", name: "Jumbo Plastic Hook", size: "10.0mm", quantity: 1, description: "Large plastic hook for bulky projects", notes: "Blankets and scarves" },
  { type: "notion", name: "Clover Locking Stitch Markers", description: "Pack of 10 assorted colours", quantity: 10, notes: "Always losing these!" },
  { type: "notion", name: "Safety Eyes", description: "9mm black — pack of 50 pairs", quantity: 50, notes: "For amigurumi" },
  { type: "notion", name: "Polyester Fiberfill", description: "500g bag, soft-grade", quantity: 1, notes: "Half used" },
  { type: "tool", name: "Tapestry Needles", description: "Set of 6 blunt-tip needles, assorted sizes", quantity: 6 },
  { type: "tool", name: "Yarn Swift + Ball Winder", description: "Tabletop yarn swift with metal ball winder", quantity: 1, notes: "Saves so much time winding skeins" },
];

// Starter content is a one-time gift: it seeds only on a genuinely fresh install
// (empty tables, no marker) and never returns once the marker is set — so user
// deletions stick across restarts. Installs that already have content just get
// the marker so they are never re-seeded either.
const STARTER_FLAG = "starter_content_seeded_v1";

export async function seedStarterContentOnce(): Promise<void> {
  try {
    if (await getMeta(STARTER_FLAG)) {
      console.log("Library/stash: starter content already handled, skipping.");
      return;
    }

    const existingPatterns = await db.select({ id: patterns.id }).from(patterns);
    if (existingPatterns.length === 0) {
      console.log("Library: fresh install — seeding starter patterns…");
      for (const p of SEED_PATTERNS) {
        await patternService.createPattern(p);
      }
      await seedAdditionalPatterns();
      console.log("Library: starter patterns seeded ✓");
    } else {
      console.log(`Library: ${existingPatterns.length} patterns already exist — marking starter content as seeded.`);
    }

    const existingStash = await db.select({ id: stashItems.id }).from(stashItems);
    if (existingStash.length === 0) {
      console.log("Stash: seeding starter items…");
      for (const s of SEED_STASH) {
        await stashService.createItem(s);
      }
      console.log(`Stash: ${SEED_STASH.length} items seeded ✓`);
    } else {
      console.log(`Stash: ${existingStash.length} items already exist, skipping seed.`);
    }

    await setMeta(STARTER_FLAG, new Date().toISOString());
  } catch (error) {
    console.error("Library/stash seed error:", error);
  }
}
