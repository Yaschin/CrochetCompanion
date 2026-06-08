import { patternService } from "./patternService";
import { db } from "./db";
import { patterns } from "../shared/schema";

const ADDITIONAL_PATTERNS: Omit<import("../shared/schema").Pattern, "id" | "createdAt">[] = [

  // ─── TOYS (5) ──────────────────────────────────────────────────────────────

  {
    title: "Benny the Baby Elephant",
    projectType: "Toy",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "~18cm tall seated",
    description: "A classic chunky amigurumi elephant with big floppy ears, a curved trunk, and a knot tail. Based on the ever-popular Bella Coco and similar beginner elephant patterns.",
    materialsNotes: "Use yarn markers to track rounds. Safety eyes must be inserted before closing the head.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "Yes — polyester fiberfill",
    yarnRequirements: [
      { color: "Elephant Grey", volume: "~120g / ~270 yards" },
      { color: "Blush Pink", volume: "~20g / ~45 yards (ears lining)" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1, note: "Tight tension is key to hide stuffing." }],
    notionsRequirements: [
      { name: "Safety eyes", description: "12mm black", quantity: 2 },
      { name: "Polyester fiberfill", description: "Firm stuffing for body and limbs", quantity: 1 },
      { name: "Stitch markers", description: "Locking type", quantity: 4 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For sewing parts together" },
      { name: "Scissors", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Grey DK (~120g), blush pink DK (~20g), 3.5mm hook, 12mm safety eyes (x2), fiberfill, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Head",
        notes: "Work in continuous rounds. Mark first stitch of each round.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "MR, 6 SC. (6)", locked: false, count: 6, notes: "", photo: null, completed: false },
          { id: 3, text: "Rnd 2: INC x6. (12)", locked: false, count: 12, notes: "", photo: null, completed: false },
          { id: 4, text: "Rnd 3: *SC, INC* x6. (18)", locked: false, count: 18, notes: "", photo: null, completed: false },
          { id: 5, text: "Rnd 4: *SC 2, INC* x6. (24)", locked: false, count: 24, notes: "", photo: null, completed: false },
          { id: 6, text: "Rnd 5: *SC 3, INC* x6. (30)", locked: false, count: 30, notes: "", photo: null, completed: false },
          { id: 7, text: "Rnd 6: *SC 4, INC* x6. (36)", locked: false, count: 36, notes: "", photo: null, completed: false },
          { id: 8, text: "Rnds 7–12: SC all. (36)", locked: false, count: 36, notes: "", photo: null, completed: false },
          { id: 9, text: "Attach safety eyes between rnds 9–10, 8 sts apart. Begin stuffing.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 10, text: "Rnd 13: *SC 4, DEC* x6. (30)", locked: false, count: 30, notes: "", photo: null, completed: false },
          { id: 11, text: "Rnd 14: *SC 3, DEC* x6. (24)", locked: false, count: 24, notes: "", photo: null, completed: false },
          { id: 12, text: "Rnd 15: *SC 2, DEC* x6. (18)", locked: false, count: 18, notes: "", photo: null, completed: false },
          { id: 13, text: "Rnd 16: *SC, DEC* x6. (12) Fasten off, close. Leave tail to sew to body.", locked: false, count: 12, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Body",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 14, text: "MR, 6 SC. Rnd 2: INC x6. (12) Rnd 3: *SC, INC* x6. (18) Rnd 4: *SC 2, INC* x6. (24) Rnd 5: *SC 3, INC* x6. (30) Rnd 6: *SC 4, INC* x6. (36)", locked: false, count: 36, notes: "", photo: null, completed: false },
          { id: 15, text: "Rnds 7–14: SC all. (36) — 8 straight rounds for body height.", locked: false, count: 36, notes: "", photo: null, completed: false },
          { id: 16, text: "Rnd 15: *SC 4, DEC* x6. (30) Rnd 16: *SC 3, DEC* x6. (24) Stuff firmly. Rnd 17: *SC 2, DEC* x6. (18) Rnd 18: *SC, DEC* x6. (12) Fasten off.", locked: false, count: 12, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Trunk",
        notes: "Stuff lightly so trunk curves naturally.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 17, text: "MR, 6 SC. Rnds 2–3: SC all (6). Rnd 4: INC, SC 5. (7) Rnds 5–6: SC all (7). Rnd 7: INC, SC 6. (8) Rnds 8–10: SC all (8). Fasten off.", locked: false, count: 8, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Ears (make 2)",
        notes: "Each ear has a grey outer and pink inner piece sewn together.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 18, text: "Grey: MR 6, *INC x6 (12), *SC, INC* x6 (18), *SC 2, INC* x6 (24). SC 1 rnd even. Fasten off.", locked: false, count: 24, notes: "", photo: null, completed: false },
          { id: 19, text: "Pink: same as grey but stop at 18 sts. Fasten off.", locked: false, count: 18, notes: "", photo: null, completed: false },
          { id: 20, text: "Place pink on grey (wrong sides out), SC edges together around 3/4 of ear. Stuff lightly, close. Sew to head.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Legs (make 4) & Assembly",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 21, text: "MR 6, INC x6 (12), SC all x3 rnds, DEC x2, SC to end (10). Stuff. Fasten off.", locked: false, count: 10, notes: "", photo: null, completed: false },
          { id: 22, text: "Sew head to body. Sew 4 legs to underside of body. Sew trunk to centre front of head. Sew ears to sides. Make a tiny yarn knot tail and sew to back.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Noodle the Sleepy Cat",
    projectType: "Toy",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "~14cm tall seated",
    description: "A chubby sleeping-face amigurumi cat with embroidered closed eyes and little stitch whiskers. Inspired by Projectarian and similar viral sleepy cat patterns.",
    materialsNotes: "Embroidery floss for the face details — black for eyes and whiskers, pink for nose.",
    favorite: true,
    status: "finished",
    startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: "Yes — polyester fiberfill",
    yarnRequirements: [
      { color: "Warm Cream / Off-white", volume: "~80g / ~180 yards" },
      { color: "Caramel Brown", volume: "~10g / ~22 yards (ear tips, tail tip)" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Polyester fiberfill", description: "Soft stuffing", quantity: 1 },
      { name: "Black embroidery floss", description: "For eyes and whiskers", quantity: 1 },
      { name: "Pink embroidery floss", description: "For nose", quantity: 1 },
      { name: "Stitch markers", description: "Locking", quantity: 3 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Embroidery needle", description: "Sharp tip for face embroidery" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Cream DK (~80g), caramel DK (~10g), 3.5mm hook, embroidery floss (black + pink), fiberfill", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Head & Body (worked together)",
        notes: "Head and body worked as one piece — no assembly seam.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "MR, 6 SC. (6)", locked: false, count: 6, notes: "", photo: null, completed: true },
          { id: 3, text: "Rnd 2: INC x6. (12) Rnd 3: *SC, INC* x6. (18) Rnd 4: *SC 2, INC* x6. (24) Rnd 5: *SC 3, INC* x6. (30) Rnd 6: *SC 4, INC* x6. (36)", locked: false, count: 36, notes: "", photo: null, completed: true },
          { id: 4, text: "Rnds 7–14: SC all. (36) — head section.", locked: false, count: 36, notes: "", photo: null, completed: true },
          { id: 5, text: "Embroider face before closing: 2 curved lines (U-shape) for sleepy eyes between rnds 10–11, 6 sts wide. 3 straight lines from centre for whiskers. Small V for nose.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 6, text: "Rnd 15: *SC 4, DEC* x6. (30) Rnd 16: *SC 3, DEC* x6. (24) Begin stuffing firmly.", locked: false, count: 24, notes: "", photo: null, completed: true },
          { id: 7, text: "Body widening — Rnd 17: *SC 3, INC* x6. (30) Rnds 18–22: SC all (30). Rnd 23: *SC 3, DEC* x6. (24) Rnd 24: *SC 2, DEC* x6. (18) Stuff. Rnd 25: *SC, DEC* x6. (12) Rnd 26: DEC x6. (6) Close.", locked: false, count: 6, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Ears (make 2) & Tail",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 8, text: "Ear: MR 4. Rnd 2: INC x4. (8) Rnd 3: *SC, INC* x4. (12) Switch to caramel for tip: SC 1 rnd. Fasten off. Sew to top of head.", locked: false, count: 12, notes: "", photo: null, completed: true },
          { id: 9, text: "Tail: Ch 15 in cream, SC back along chain. Switch to caramel at tip, SC 3. Fasten off. Sew to back-bottom of body.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 10, text: "Add 4 tiny legs: SC flat ovals (ch 4, sc around) and sew to underside corners. Weave in all ends.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },

  {
    title: "Pearl the Plush Octopus",
    projectType: "Toy",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "~16cm body + 8 tentacles",
    description: "The internet-famous crochet octopus! Said to comfort premature babies in NICUs. A round squishy head with 8 curling tentacles. Based on The Danish Octo Friends pattern.",
    materialsNotes: "Tentacles curl naturally as you crochet — do not stretch them flat.",
    favorite: true,
    status: "project",
    startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "Yes — polyester fiberfill",
    yarnRequirements: [
      { color: "Teal / Ocean Blue", volume: "~80g / ~180 yards" },
      { color: "Cream", volume: "~10g / ~22 yards (face details)" },
    ],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Safety eyes", description: "15mm black", quantity: 2 },
      { name: "Polyester fiberfill", description: "Soft grade", quantity: 1 },
      { name: "Stitch markers", description: "", quantity: 2 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Teal DK (~80g), cream (~10g), 4.0mm hook, 15mm safety eyes (x2), fiberfill", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Head",
        notes: "The head is a large sphere.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "MR, 6 SC. (6) Rnd 2: INC x6. (12) Rnd 3: *SC, INC* x6. (18) Rnd 4: *SC 2, INC* x6. (24) Rnd 5: *SC 3, INC* x6. (30) Rnd 6: *SC 4, INC* x6. (36) Rnd 7: *SC 5, INC* x6. (42)", locked: false, count: 42, notes: "", photo: null, completed: true },
          { id: 3, text: "Rnds 8–17: SC all. (42)", locked: false, count: 42, notes: "", photo: null, completed: true },
          { id: 4, text: "Attach safety eyes between rnds 12–13, 10 sts apart. Begin stuffing.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "Rnd 18: *SC 5, DEC* x6. (36) Rnd 19: *SC 4, DEC* x6. (30) Rnd 20: *SC 3, DEC* x6. (24) Rnd 21: *SC 2, DEC* x6. (18) Rnd 22: *SC, DEC* x6. (12) Rnd 23: DEC x6. (6) Close.", locked: false, count: 6, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Tentacles (make 8)",
        notes: "Each tentacle curls as you increase — this is intentional!",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 6, text: "Ch 25. Row 1: SC in 2nd ch from hook, *2 SC in next ch* across. (36 SC — tentacle spirals naturally)", locked: false, count: 36, notes: "The double SCs into every other chain make it curl.", photo: null, completed: false },
          { id: 7, text: "Make 8 tentacles. Sew evenly around the bottom of the head, spacing 4–5 sts apart.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Starla the Rainbow Unicorn",
    projectType: "Toy",
    skillLevel: "Intermediate",
    yarnType: "DK Weight",
    size: "~20cm tall standing",
    description: "A pastel rainbow unicorn with a spiral horn, flowing mane, and embroidered eyes. Inspired by popular Etsy amigurumi patterns and Hooked by Robin.",
    materialsNotes: "Mane and tail are made from cut yarn loops tied through the body — no crochet needed.",
    favorite: true,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "Yes — polyester fiberfill",
    yarnRequirements: [
      { color: "White / Snow", volume: "~100g / ~225 yards" },
      { color: "Lavender", volume: "~20g / ~45 yards (mane + tail)" },
      { color: "Rose Pink", volume: "~15g / ~34 yards (mane accent)" },
      { color: "Pale Gold", volume: "~10g / ~22 yards (horn)" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Safety eyes", description: "10mm black", quantity: 2 },
      { name: "Polyester fiberfill", description: "", quantity: 1 },
      { name: "Pink embroidery floss", description: "For blush cheeks", quantity: 1 },
      { name: "Stitch markers", description: "", quantity: 4 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Crochet hook 2.0mm", description: "For pulling mane loops through" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "White DK (~100g), lavender + pink + gold (~45g total), 3.5mm hook, 10mm safety eyes, fiberfill, pink floss for blush", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Head",
        notes: "Same construction as classic round amigurumi head.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "MR 6, INC x6 (12), *SC INC* x6 (18), *SC 2 INC* x6 (24), *SC 3 INC* x6 (30), *SC 4 INC* x6 (36). Rnds 7–12: SC all (36).", locked: false, count: 36, notes: "", photo: null, completed: false },
          { id: 3, text: "Snout bump: MR 5, INC x5 (10). SC 2 rnds flat. Sew to front of head between rnds 10–12.", locked: false, count: 10, notes: "", photo: null, completed: false },
          { id: 4, text: "Attach safety eyes above snout, 7 sts apart. Embroider pink blush circles under eyes.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "*SC 4, DEC* x6 (30), *SC 3, DEC* x6 (24), stuff, *SC 2, DEC* x6 (18), *SC, DEC* x6 (12), DEC x6 (6). Close.", locked: false, count: 6, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Body & Legs (make 4 legs)",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 6, text: "Body: same as head to round 6 (36 sts). Rnds 7–16: SC all. Decrease to close same as head.", locked: false, count: 36, notes: "", photo: null, completed: false },
          { id: 7, text: "Legs (x4): MR 6, INC x6 (12), SC 2 rnds, DEC x2 (10), SC 8 rnds. Stuff. Fasten off.", locked: false, count: 10, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Horn & Ears",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 8, text: "Horn (gold): MR 3. Rnd 2: INC, SC 2 (4). Rnd 3: SC all. Rnd 4: INC, SC 3 (5). Continue increasing 1 st every other rnd until 9 sts. Rnds 12–14: SC all. Sew to forehead.", locked: false, count: 9, notes: "", photo: null, completed: false },
          { id: 9, text: "Ears (x2, white): MR 4, INC x4 (8), *SC, INC* x4 (12), SC 2 rnds. Flatten and sew to head.", locked: false, count: 12, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Mane & Tail",
        notes: "Cut yarn loops and tie through body — no crochet needed.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 10, text: "Cut 25cm lengths of lavender and pink yarn. Using 2.0mm hook, pull pairs of loops through head stitches along the top-center from forehead to neck. Knot each loop at the base.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 11, text: "Tail: same method at the back of the body. Bundle 6–8 loops together. Trim to desired length. Assemble all parts: head to body, 4 legs to underside.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Scout the Corgi",
    projectType: "Toy",
    skillLevel: "Intermediate",
    yarnType: "DK Weight",
    size: "~15cm tall seated",
    description: "A stumpy-legged pembroke corgi with big pointed ears and a fluffy cream chest patch. Based on popular Ravelry corgi amigurumi patterns.",
    materialsNotes: "Wire the legs if you want Scout to stand independently.",
    favorite: false,
    status: "project",
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "Yes — polyester fiberfill",
    yarnRequirements: [
      { color: "Golden Tan", volume: "~90g / ~200 yards" },
      { color: "Cream / Ivory", volume: "~30g / ~68 yards (chest, paw tips, face)" },
      { color: "White", volume: "~10g / ~22 yards (inner ears)" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Safety eyes", description: "9mm black", quantity: 2 },
      { name: "Polyester fiberfill", description: "", quantity: 1 },
      { name: "Black embroidery floss", description: "Nose and mouth", quantity: 1 },
      { name: "Stitch markers", description: "", quantity: 4 },
    ],
    toolRequirements: [{ name: "Tapestry needle", description: "" }],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Golden tan DK (~90g), cream (~30g), white (~10g), 3.5mm hook, 9mm safety eyes, fiberfill, black floss", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Head",
        notes: "Corgi head is slightly wider than tall — achieve this by working extra straight rounds.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "In cream: MR 6, INC x6 (12), *SC INC* x6 (18). Switch to tan: *SC 2, INC* x6 (24), *SC 3, INC* x6 (30), *SC 4, INC* x6 (36).", locked: false, count: 36, notes: "", photo: null, completed: true },
          { id: 3, text: "Rnds 7–8: SC all (36). Snout bump (cream): MR 5, INC x5 (10), SC 2 rnds. Sew to face before closing head.", locked: false, count: 36, notes: "", photo: null, completed: false },
          { id: 4, text: "Attach eyes between rnds 9–10, 8 sts apart. Embroider triangle nose in black, small curved mouth.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "Decrease: *SC 4, DEC* x6 (30), *SC 3, DEC* x6 (24), stuff, *SC 2, DEC* x6 (18), *SC DEC* x6 (12), DEC x6 (6). Close.", locked: false, count: 6, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Body",
        notes: "Corgi body is longer than typical amigurumi.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 6, text: "In tan: MR 6 → expand to 36 sts over 6 rnds. Rnds 7–18: SC all (36) — 12 straight rounds for elongated body. Decrease to close over 4 rnds.", locked: false, count: 36, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Ears (make 2) & Tail",
        notes: "Big pointed ears are the signature corgi feature.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 7, text: "Ear (tan + white inner): Ch 2, 4 SC in 2nd ch (4). INC x4 (8), *SC, INC* x4 (12), SC 2 rnds. Pinch and fold to form point. Sew white oval to inner ear. Sew to top-sides of head.", locked: false, count: 12, notes: "", photo: null, completed: false },
          { id: 8, text: "Tail: Ch 8, SC in 2nd ch, SC 5 more. Fasten off. Sew to back of body (corgis have tiny nub tails!).", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Legs (make 4) & Assembly",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 9, text: "Leg: in cream for 2 rnds (paw), switch to tan. MR 6, INC x6 (12), SC 6 rnds, DEC x2 (10). Stuff. Fasten off. Make 4.", locked: false, count: 10, notes: "", photo: null, completed: false },
          { id: 10, text: "Sew head to body. Attach 2 front legs to upper body sides, 2 back legs to lower body. Attach ears and tail. Weave in all ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  // ─── WEARABLES (5) ─────────────────────────────────────────────────────────

  {
    title: "Classic Ribbed Beanie",
    projectType: "Wearable",
    skillLevel: "Beginner",
    yarnType: "Worsted Weight",
    size: "Adult S/M — 54–58cm head",
    description: "A timeless ribbed crochet beanie worked from brim to crown using back-loop-only HDC for a stretchy, warm fabric. Based on numerous Ravelry top-free patterns.",
    materialsNotes: "BLO HDC creates the rib look. Gauge swatch before starting for best fit.",
    favorite: true,
    status: "finished",
    startedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Midnight Navy", volume: "~120g / ~240 yards" },
    ],
    hookRequirements: [{ size: "5.0mm", quantity: 1, note: "Or 5.5mm for a looser gauge." }],
    notionsRequirements: [
      { name: "Stitch markers", description: "Mark round start", quantity: 2 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Measuring tape", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~120g worsted weight in navy, 5.0mm hook, stitch marker, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Brim",
        notes: "Worked flat in rows, then seamed.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 16. Row 1: HDC in 3rd ch from hook, HDC across. (14) Ch 2, turn.", locked: false, count: 14, notes: "", photo: null, completed: true },
          { id: 3, text: "Row 2 (rib): BLO HDC across. Ch 2, turn. Repeat Row 2 for 58 rows total (or until brim fits around head). Seam first and last rows together with slip stitch.", locked: false, count: 14, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Crown",
        notes: "Worked in the round picking up from the brim.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "Join yarn to brim edge. Work 1 SC into each row end around the brim. (58 SC) PM at round start.", locked: false, count: 58, notes: "", photo: null, completed: true },
          { id: 5, text: "Rnds 1–5: BLO SC all. (58) — straight section for hat depth.", locked: false, count: 58, notes: "", photo: null, completed: true },
          { id: 6, text: "Rnd 6: *SC 8, DEC* x5, SC 8. (53) Rnd 7: *SC 7, DEC* x5, SC 8. (48) Rnd 8: *SC 6, DEC* x6. (42) Rnd 9: *SC 5, DEC* x6. (36) Rnd 10: *SC 4, DEC* x6. (30)", locked: false, count: 30, notes: "", photo: null, completed: true },
          { id: 7, text: "Rnd 11: *SC 3, DEC* x6. (24) Rnd 12: *SC 2, DEC* x6. (18) Rnd 13: *SC, DEC* x6. (12) Rnd 14: DEC x6. (6) Fasten off. Thread tail through remaining sts and pull tight. Weave in.", locked: false, count: 6, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },

  {
    title: "Granny Square Cardigan",
    projectType: "Wearable",
    skillLevel: "Intermediate",
    yarnType: "DK Weight",
    size: "Adult S (UK 10–12) — adjust granny count for other sizes",
    description: "The viral tiktok-famous granny square cardigan made of individual squares sewn together. Based on the Moogly and B.Hooked tutorials that took over social media.",
    materialsNotes: "Make extra granny squares as tension can vary. Pin out and block each square before assembling.",
    favorite: true,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Sage Green", volume: "~300g / ~680 yards (MC)" },
      { color: "Cream", volume: "~100g / ~225 yards (CC1, rounds 2–3 of each square)" },
      { color: "Mustard", volume: "~60g / ~135 yards (CC2, round 1 centres)" },
    ],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Stitch markers", description: "", quantity: 6 },
      { name: "Blocking mats + pins", description: "For squaring each granny square", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "For seaming and weaving ends" },
      { name: "Measuring tape", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Sage DK (~300g), cream (~100g), mustard (~60g), 4.0mm hook, blocking mats + pins, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Granny Squares (make 44 for size S)",
        notes: "Each square ~11cm × 11cm after blocking. Adjust count for other sizes.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Rnd 1 (mustard): MR. Ch 3 (= DC), 2 DC, *ch 2, 3 DC* x3, ch 2. Join. (4 clusters)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "Rnd 2 (cream): Join in any ch-2 corner. Ch 3, (2 DC, ch 2, 3 DC) in corner, *ch 1, (3 DC, ch 2, 3 DC) in next corner* x3, ch 1. Join.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Rnd 3 (cream): Join. Ch 3, *work (3 DC, ch 2, 3 DC) in each corner, 3 DC in each ch-1 space* around. Join.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "Rnd 4 (sage MC): Same structure as Rnd 3 but with one more 3-DC shell per side. Join. Fasten off.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Block each square to 11cm × 11cm. Make 44 total.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Assembly Layout",
        notes: "Layout: 4 rows of 4 squares = back panel. 3 squares each side = fronts. Sleeves from remaining squares.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 7, text: "Back: arrange 4×4 grid (16 squares). Seam together with sage using flat slip-stitch join (right sides facing).", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 8, text: "Front panels: 2×3 grids (6 squares each side). Seam to back at shoulders, leaving neck opening.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 9, text: "Sleeves: 2×3 grids (6 squares). Join side seam then attach to armhole openings.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 10, text: "Edging: work 1 round SC then 1 round crab stitch (reverse SC) around all raw edges for a neat finish.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Fingerless Gloves",
    projectType: "Wearable",
    skillLevel: "Beginner",
    yarnType: "DK Weight",
    size: "Adult M — 18cm hand circumference",
    description: "Simple top-down fingerless mitts with a thumb gap. Worked in the round with a ribbed cuff and smooth stockinette-style SC body. Based on Lion Brand and Yarnspirations free patterns.",
    materialsNotes: "Make both at the same time to ensure matching gauge and length.",
    favorite: false,
    status: "finished",
    startedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Heather Grey", volume: "~80g / ~180 yards (both gloves)" },
    ],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Stitch markers", description: "Mark thumb gap", quantity: 3 },
    ],
    toolRequirements: [{ name: "Tapestry needle", description: "" }],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~80g heather grey DK, 4.0mm hook, stitch markers, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Cuff",
        notes: "Ribbed cuff worked flat then seamed.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 10. BLO SC across 22 rows. Seam to form a ribbed tube that fits snugly around wrist. (22 sts around circumference)", locked: false, count: 22, notes: "", photo: null, completed: true },
          { id: 3, text: "Join yarn to edge of cuff tube. Work 1 round SC picking up sts from end of each rib row. (22 SC) PM.", locked: false, count: 22, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Hand & Thumb Gap",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "Rnds 1–5: SC all. (22)", locked: false, count: 22, notes: "", photo: null, completed: true },
          { id: 5, text: "Thumb gap rnd: SC 16, ch 5, skip 5 sts (thumb opening), SC to end. (22 + 5 ch)", locked: false, count: 22, notes: "", photo: null, completed: true },
          { id: 6, text: "Next rnd: SC all, working SC into each ch over thumb gap. (22)", locked: false, count: 22, notes: "", photo: null, completed: true },
          { id: 7, text: "Rnds 7–9: SC all. (22) Fasten off. Work 1 round SC around thumb gap opening. Weave in all ends.", locked: false, count: 22, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },

  {
    title: "Bubble Stitch Crop Top",
    projectType: "Wearable",
    skillLevel: "Intermediate",
    yarnType: "Cotton DK",
    size: "S/M — 35cm long, 38cm wide (laid flat)",
    description: "A summer crop top with a raised bubble stitch texture panel. Worked flat in rows. Based on the Mara and Maria and Knit.Love.Wool type beach tops that went viral on Instagram.",
    materialsNotes: "Cotton yarn is essential for drape and breathability. Block after washing.",
    favorite: false,
    status: "project",
    startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Natural / Ecru", volume: "~250g / ~560 yards" },
    ],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Stitch markers", description: "Mark side seams", quantity: 4 },
      { name: "Blocking mats", description: "", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Measuring tape", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~250g cotton DK in natural/ecru, 4.0mm hook, stitch markers, tapestry needle, measuring tape", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Front Panel",
        notes: "Worked flat. Bubble sts (BBS) are puff stitches from the wrong side so they pop forward on the right side.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 79. Row 1 (WS): SC in 2nd ch from hook, SC across. (78) Ch 1, turn.", locked: false, count: 78, notes: "", photo: null, completed: true },
          { id: 3, text: "Row 2 (RS): SC all. Ch 1, turn. Row 3 (WS — bubble row): SC 3, *puff st (YO, insert, pull up loop x4, YO, pull through all), SC 3* across. Turn.", locked: false, count: 78, notes: "Puff sts from WS create bubbles on RS.", photo: null, completed: false },
          { id: 4, text: "Row 4 (RS): SC all. Row 5 (WS): SC all. Repeat rows 3–5 until panel = 30cm. End on RS row.", locked: false, count: 78, notes: "", photo: null, completed: false },
          { id: 5, text: "Armhole shaping: next RS row, SC 20, turn (right shoulder). Work 6 rows. Fasten off. Skip 38 sts (neck). Rejoin for left shoulder, SC 20, work 6 rows.", locked: false, count: 20, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Back Panel & Assembly",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 6, text: "Work back panel same as front but all SC (no bubbles) for simplicity. Same armhole shaping.", locked: false, count: 78, notes: "", photo: null, completed: false },
          { id: 7, text: "Join shoulder seams. Sew side seams leaving 18cm arm openings. Work 1 round SC around neck, 2 rounds around each armhole, 1 round along hem. Fasten off.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Chunky Infinity Scarf",
    projectType: "Wearable",
    skillLevel: "Beginner",
    yarnType: "Super Bulky",
    size: "~140cm circumference × 30cm wide",
    description: "A lofty, quick-to-crochet infinity cowl in simple DC rounds. Takes only a couple of hours with super bulky yarn. Based on Persia Lou and similar weekend scarf patterns.",
    materialsNotes: "Loosening your tension on DCs helps the scarf drape beautifully.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Oatmeal / Cream", volume: "~200g / ~120 yards" },
    ],
    hookRequirements: [{ size: "10.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Stitch markers", description: "", quantity: 2 },
    ],
    toolRequirements: [{ name: "Tapestry needle", description: "" }],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~200g super bulky (size 6) in oatmeal, 10.0mm hook, stitch markers, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Scarf Body",
        notes: "Worked in the round — join the foundation chain before starting.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 60. Join with slip stitch being careful not to twist. (60)", locked: false, count: 60, notes: "", photo: null, completed: false },
          { id: 3, text: "Rnd 1: Ch 3 (= DC), DC in each ch around. Join to top of ch-3. (60 DC)", locked: false, count: 60, notes: "", photo: null, completed: false },
          { id: 4, text: "Rnds 2–9: Ch 3, DC in each st around. Join. (60) — 9 rounds total gives ~30cm width.", locked: false, count: 60, notes: "", photo: null, completed: false },
          { id: 5, text: "Fasten off. Weave in 2 ends. Wear doubled around neck.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  // ─── HOME DECOR (5) ────────────────────────────────────────────────────────

  {
    title: "C2C Plaid Lap Blanket",
    projectType: "Home Decor",
    skillLevel: "Intermediate",
    yarnType: "Worsted Weight",
    size: "~90cm × 90cm",
    description: "A cosy corner-to-corner lap blanket in a classic buffalo plaid check. Based on popular Yarnspirations and Daisy Farm Crafts C2C tutorials.",
    materialsNotes: "C2C creates a diagonal fabric — count graph squares, not stitches.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Classic Red", volume: "~250g / ~450 yards" },
      { color: "Charcoal Black", volume: "~250g / ~450 yards" },
      { color: "Cream / White", volume: "~100g / ~180 yards" },
    ],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Stitch markers", description: "", quantity: 4 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "Wide eye for weaving C2C ends" },
      { name: "Scissors", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Red worsted (~250g), charcoal (~250g), cream (~100g), 5.0mm hook, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "C2C Block Stitch",
        notes: "Each C2C block = ch 6 (first block) or ch 3 + 3 DC. Graph square = 1 block.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Increase phase: Row 1: Ch 6, DC in 4th–6th ch. (1 block) Row 2: Ch 6, DC in 4th–6th ch (new block), ch 3, slip stitch into ch-3 loop of prev row block, ch 3, DC x3 into same loop. (2 blocks) Continue adding 1 block per row until 30 blocks wide.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 3, text: "At 30 blocks: decrease phase. Each row, do NOT add a block at the start — only attach to existing blocks. Remove 1 block per row until 1 block remains.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Colour changes: follow the plaid chart — 4-block stripes of red, then 4-block stripes of black, with cream accent stripes at each colour boundary. Carry yarn loosely on wrong side.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Border",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 5, text: "Join cream yarn at any corner. Work 2 rounds SC all around, 3 SC in each corner. Fasten off. Weave in all ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Sunburst Mandala Wall Hanging",
    projectType: "Home Decor",
    skillLevel: "Intermediate",
    yarnType: "Cotton DK",
    size: "~38cm diameter",
    description: "A multi-round sunburst mandala in warm terracotta, cream, and sage, designed to be mounted on a wooden dowel. Inspired by numerous Ravelry mandala patterns and Nicki's Homemade Crafts.",
    materialsNotes: "Block the mandala flat before hanging — cotton responds well to wet blocking.",
    favorite: true,
    status: "project",
    startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Terracotta", volume: "~60g / ~135 yards" },
      { color: "Cream", volume: "~50g / ~112 yards" },
      { color: "Sage Green", volume: "~40g / ~90 yards" },
      { color: "Mustard", volume: "~20g / ~45 yards" },
    ],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Wooden dowel", description: "40cm long, 8mm diameter", quantity: 1 },
      { name: "Blocking mats + pins", description: "", quantity: 1 },
      { name: "Hanging cord", description: "Cotton macramé cord, ~80cm", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Scissors", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Cotton DK in terracotta, cream, sage, mustard. 4.0mm hook. 40cm wooden dowel. Blocking mats. Tapestry needle.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Mandala Rounds",
        notes: "All rounds joined. Change colour each round or every 2 rounds.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Rnd 1 (mustard): MR. Ch 3, 11 DC. Join. (12 DC)", locked: false, count: 12, notes: "", photo: null, completed: true },
          { id: 3, text: "Rnd 2 (cream): Ch 3, *DC, INC* x6. Join. (18)", locked: false, count: 18, notes: "", photo: null, completed: true },
          { id: 4, text: "Rnd 3 (terracotta): Ch 4, *DC, ch 1* x11, join. (12 DC, 12 ch-1 sp)", locked: false, count: 24, notes: "", photo: null, completed: true },
          { id: 5, text: "Rnd 4 (cream): Work 3 DC cluster in each ch-1 space, SC between clusters. (12 clusters)", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 6, text: "Rnd 5 (sage): Ch 1, SC all. INC x12 evenly. (36 SC)", locked: false, count: 36, notes: "", photo: null, completed: false },
          { id: 7, text: "Rnd 6 (terracotta): *Ch 5, SC in 3rd ch from hook (picot), skip 2 sts, DC 3 in next, skip 2, SC* around. (6 fan repeats)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 8, text: "Rnds 7–10 (cream/sage alternating): Continue expanding with DC fans, ch spaces, and petal clusters. Increase ~12 sts per round by adding DCs and ch-spaces in each petal.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 9, text: "Final round (cream): SC all around evenly. (approx 90 sts) Fasten off. Block flat.", locked: false, count: 90, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Hanging",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 10, text: "Fold top 4cm of mandala over the wooden dowel and sew in place using tapestry needle and matching yarn.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 11, text: "Tie macramé cord to each end of the dowel to create a hanging loop. Add fringe by knotting yarn lengths along the bottom edge if desired.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Boho Plant Hanger",
    projectType: "Home Decor",
    skillLevel: "Beginner",
    yarnType: "Cotton Worsted",
    size: "~65cm long, fits up to 15cm pot",
    description: "A crochet take on the macramé plant hanger — uses chains and slip stitches to create an open net basket. Based on popular Etsy-inspired crochet hanger patterns.",
    materialsNotes: "Natural cotton rope yarn (approx 3mm thickness) works better than regular yarn here.",
    favorite: false,
    status: "finished",
    startedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 46 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Natural / Undyed", volume: "~150g / ~90 yards cotton rope" },
    ],
    hookRequirements: [{ size: "6.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Wooden ring", description: "5cm diameter for hanging", quantity: 1 },
      { name: "Stitch markers", description: "", quantity: 3 },
    ],
    toolRequirements: [
      { name: "Scissors", description: "" },
      { name: "Tapestry needle", description: "Large eye" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~150g natural cotton rope yarn, 6.0mm hook, 5cm wooden ring, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Hanging Ring & Chains",
        notes: "All chains hang from a central ring.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "SC 20 around the wooden ring. Join into a circle.", locked: false, count: 20, notes: "", photo: null, completed: true },
          { id: 3, text: "Divide the ring into 4 sections of 5 SC. *Ch 40 from each section marker, join to next marker with slip stitch.* (4 chain loops hanging down)", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Net Basket",
        notes: "Chains are joined together to create the pot-holding net.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 4, text: "Count 20 chains down from ring on each of the 4 loops. Join adjacent loops together with 6 SC at that point. (4 joining points — creates the first basket tier)", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 5, text: "Continue 15 more chains down from each joining point. Join adjacent loops again with 6 SC. (second tier)", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 6, text: "Continue 10 more chains. Gather all 4 loops together and join with 8 SC worked in a circle. This forms the base of the pot cradle.", locked: false, count: 8, notes: "", photo: null, completed: true },
          { id: 7, text: "Leave 10cm tails below base, tie together in an overhand knot. Trim to even fringe.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },

  {
    title: "Farmhouse Dishcloth Set",
    projectType: "Home Decor",
    skillLevel: "Beginner",
    yarnType: "Cotton DK",
    size: "~25cm × 25cm each",
    description: "A set of 4 reusable cotton dishcloths in a simple diagonal stitch pattern. Classic farmhouse aesthetic — lovely gift and practical stash-buster. Based on the timeless Grandmother's Dishcloth pattern.",
    materialsNotes: "100% cotton yarn only — must be machine washable. Avoid acrylic for dishcloths.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "White", volume: "~60g / ~135 yards (x2 cloths)" },
      { color: "Sage Green", volume: "~60g / ~135 yards (x2 cloths)" },
    ],
    hookRequirements: [{ size: "4.0mm", quantity: 1 }],
    notionsRequirements: [],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Scissors", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~120g total 100% cotton DK (60g white, 60g sage), 4.0mm hook, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Dishcloth (make 4 — 2 each colour)",
        notes: "Classic diagonal increase-then-decrease method.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 4. Row 1: DC in 4th ch from hook. (2 DC) Ch 3, turn.", locked: false, count: 2, notes: "", photo: null, completed: false },
          { id: 3, text: "Row 2 (increase): DC in first st, DC, 2 DC in last st. (4) Ch 3, turn.", locked: false, count: 4, notes: "", photo: null, completed: false },
          { id: 4, text: "Rows 3–24 (increase): DC in first, DC across, 2 DC in top of turning ch. Continue adding 2 DC each row until 48 DC across. Ch 3, turn.", locked: false, count: 48, notes: "", photo: null, completed: false },
          { id: 5, text: "Row 25 (decrease starts): DC2TOG at start, DC across, DC2TOG at end. (46) Repeat decreasing 2 sts per row until 4 DC remain.", locked: false, count: 4, notes: "", photo: null, completed: false },
          { id: 6, text: "Final row: DC2TOG twice. (2) Ch 1, DC2TOG. (1) Fasten off. Weave in ends.", locked: false, count: 1, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Mini Cactus Pot Cover Set",
    projectType: "Home Decor",
    skillLevel: "Beginner",
    yarnType: "Cotton DK",
    size: "Fits 8cm, 10cm, and 12cm pots",
    description: "A set of 3 adorable cactus-shaped pot covers in sizes small, medium, and large. Worked in the round with raised bumps for the cactus texture. Based on viral Pinterest and Instagram patterns.",
    materialsNotes: "Make sure the base is wide enough to sit flat on a shelf.",
    favorite: true,
    status: "finished",
    startedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Cactus Green", volume: "~80g / ~180 yards" },
      { color: "Terracotta", volume: "~40g / ~90 yards" },
      { color: "Cream", volume: "~10g / ~22 yards (flower tops)" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Stitch markers", description: "", quantity: 3 },
    ],
    toolRequirements: [{ name: "Tapestry needle", description: "" }],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Cactus green (~80g), terracotta (~40g), cream (~10g), 3.5mm hook, stitch markers, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Base (terracotta)",
        notes: "Each pot cover starts with a flat terracotta base.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Small: MR 6, INC x6 (12), *SC INC* x6 (18), *SC 2 INC* x6 (24). SC 3 rnds straight.", locked: false, count: 24, notes: "Gives 8cm base diameter.", photo: null, completed: true },
          { id: 3, text: "Medium: continue to *SC 3 INC* x6 (30). SC 4 rnds straight.", locked: false, count: 30, notes: "", photo: null, completed: true },
          { id: 4, text: "Large: continue to *SC 4 INC* x6 (36). SC 5 rnds straight.", locked: false, count: 36, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Cactus Body (green)",
        notes: "Switch to green at the top edge of terracotta base. Add spines with FPSC.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 5, text: "Join green at top edge of base. Work SC all around (same count). Every 3rd stitch, work a FPSC (front post SC) for raised spine texture.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 6, text: "Work 6 rnds (small), 8 rnds (medium), or 10 rnds (large) in green, maintaining spine pattern on alternate rounds.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 7, text: "Final green round: SC all, no increases or decreases (open top — the pot goes inside!). Fasten off.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 8, text: "Flower top (cream, optional): MR 5, (SC, HDC, DC, HDC, SC) x5 petals. Sew to top of cactus body.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },

  // ─── ACCESSORIES (5) ───────────────────────────────────────────────────────

  {
    title: "Classic Granny Square Tote",
    projectType: "Accessory",
    skillLevel: "Beginner",
    yarnType: "Cotton Worsted",
    size: "~35cm × 32cm",
    description: "A structured 9-square tote bag made from large granny squares joined together. One of the most popular free patterns on Ravelry and Crochet.com — perfect stash buster.",
    materialsNotes: "Stiffen with fabric starch spray after assembling for a more structured bag.",
    favorite: false,
    status: "project",
    startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Cream (MC)", volume: "~150g / ~270 yards" },
      { color: "Terracotta", volume: "~60g / ~108 yards" },
      { color: "Sage Green", volume: "~40g / ~72 yards" },
      { color: "Dusty Rose", volume: "~30g / ~54 yards" },
    ],
    hookRequirements: [{ size: "5.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Stitch markers", description: "", quantity: 4 },
      { name: "Fabric lining (optional)", description: "35cm × 70cm cotton fabric", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Sewing needle + thread", description: "For fabric lining" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Cream worsted (~150g), terracotta, sage, dusty rose (~130g combined), 5.0mm hook, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Large Granny Squares (make 9)",
        notes: "Each square ~16cm × 16cm. Make 3 per colour combination.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Rnd 1 (terracotta/rose/sage): MR. Ch 3, 2 DC, *ch 2, 3 DC* x3, ch 2. Join to top of ch-3. Fasten off.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 3, text: "Rnd 2 (cream): Join in any ch-2 corner. (3 DC, ch 2, 3 DC) in corner, *ch 1, (3 DC ch 2 3 DC) in next corner* x3, ch 1. Join.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Rnd 3 (cream): Same structure, adding 1 more shell between corners. Join.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "Rnd 4 (cream): Final round — add 2 shells between corners. Join. Fasten off. Make 9 total.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Assembly & Handles",
        notes: "3×3 grid of squares forms bag front + bottom + back.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 6, text: "Arrange 9 squares in a 3×1 strip (top square = bag front top, middle = bag bottom, bottom = bag back). Seam together with cream using flat slip-stitch join.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 7, text: "Fold the strip in half at the middle square. Seam the side edges together on both sides. (3 sides closed, top open)", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 8, text: "Handles (make 2): Ch 80 in cream. SC back along chain (80 SC). SC one more row for thickness. Sew handles firmly to inside of bag top, 10cm from each side seam.", locked: false, count: 80, notes: "", photo: null, completed: false },
          { id: 9, text: "Optional: SC 1 round around the top opening. Sew in fabric lining for sturdiness.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Mini Zip Coin Purse",
    projectType: "Accessory",
    skillLevel: "Beginner",
    yarnType: "Fingering / Cotton DK",
    size: "~12cm × 9cm",
    description: "A sweet little zipped coin purse worked flat in rows. The crochet panel is stitched to a zip — no special tools needed. Based on Ravelry's top-rated quick purse patterns.",
    materialsNotes: "Use a 12cm zip. Pin the zip to the crochet before sewing for even placement.",
    favorite: false,
    status: "finished",
    startedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Dusty Rose", volume: "~30g / ~68 yards" },
    ],
    hookRequirements: [{ size: "3.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Zip", description: "12cm zipper in matching colour", quantity: 1 },
      { name: "Sewing needle + thread", description: "For attaching zip", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Pins / clips", description: "Hold zip in place while sewing" },
      { name: "Tapestry needle", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~30g dusty rose cotton DK, 3.0mm hook, 12cm zip, sewing needle + thread, pins", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Purse Panels (make 2)",
        notes: "Both panels are identical — front and back.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 26. Row 1: SC in 2nd ch from hook, SC across. (25) Ch 1, turn.", locked: false, count: 25, notes: "", photo: null, completed: true },
          { id: 3, text: "Rows 2–18: SC all. (25) — makes a rectangle ~12cm × 9cm at 3.0mm tension.", locked: false, count: 25, notes: "", photo: null, completed: true },
          { id: 4, text: "Make 2 identical panels. Fasten off both.", locked: false, count: 25, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Assembly",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 5, text: "Pin zip along the top edge of one panel (right side up). Using sewing needle and thread, backstitch zip tape firmly to the top row of SC.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 6, text: "Attach zip's other side to the second panel the same way.", locked: false, count: 0, notes: "", photo: null, completed: true },
          { id: 7, text: "Open zip halfway. With right sides together, whip stitch the 3 remaining edges together using the tapestry needle and yarn. Turn right side out through zip opening.", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
    ],
  },

  {
    title: "Crochet Sunglass Pouch",
    projectType: "Accessory",
    skillLevel: "Beginner",
    yarnType: "Cotton DK",
    size: "~17cm × 8cm",
    description: "A slim slip-in sunglasses case with a button flap. Protects glasses from scratches. Based on popular Etsy shop patterns and free Craft Passion tutorials.",
    materialsNotes: "Work tightly to create a firm fabric that protects glasses.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Mustard Yellow", volume: "~50g / ~112 yards" },
    ],
    hookRequirements: [{ size: "3.5mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Button", description: "20mm wooden button", quantity: 1 },
      { name: "Sewing needle + thread", description: "For attaching button", quantity: 1 },
    ],
    toolRequirements: [{ name: "Tapestry needle", description: "" }],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~50g mustard cotton DK, 3.5mm hook, 1x 20mm wooden button, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Case Body",
        notes: "Worked as a flat rectangle, folded and seamed.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 37. Row 1: HDC in 3rd ch from hook, HDC across. (35) Ch 2, turn.", locked: false, count: 35, notes: "", photo: null, completed: false },
          { id: 3, text: "Rows 2–26: HDC all. (35) — rectangle approx 17cm × 18cm.", locked: false, count: 35, notes: "", photo: null, completed: false },
          { id: 4, text: "Fasten off. Fold rectangle so bottom 8cm forms the case body, top 10cm forms the flap. Seam the side edges of the body section only. Leave flap open.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Flap & Button",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 5, text: "SC 1 round around the flap edge to neaten. On centre front of flap, work a button loop: Ch 5, slip stitch back to same st.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 6, text: "Sew button to corresponding position on the case body. Weave in all ends.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Chunky Crossbody Mini Bag",
    projectType: "Accessory",
    skillLevel: "Intermediate",
    yarnType: "Chunky Weight",
    size: "~20cm × 16cm body",
    description: "A structured mini crossbody bag with a magnetic snap and a long adjustable strap. Uses a linen stitch for a woven fabric look. Based on Jayda InStitches and similar trending bag patterns.",
    materialsNotes: "Stiffen with iron-on interfacing inside for a bag that holds its shape.",
    favorite: false,
    status: "project",
    startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Cognac / Tan", volume: "~200g / ~220 yards chunky" },
    ],
    hookRequirements: [{ size: "6.0mm", quantity: 1 }],
    notionsRequirements: [
      { name: "Magnetic snap", description: "18mm silver", quantity: 1 },
      { name: "D-rings", description: "25mm silver, for strap attachment", quantity: 2 },
      { name: "Slide adjuster", description: "25mm silver, for strap length", quantity: 1 },
      { name: "Iron-on interfacing", description: "Medium weight, 25cm × 40cm", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "" },
      { name: "Scissors", description: "" },
      { name: "Iron", description: "For interfacing" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "~200g cognac chunky, 6.0mm hook, magnetic snap, 2x D-rings, slide adjuster, iron-on interfacing, tapestry needle", locked: false, count: 0, notes: "", photo: null, completed: true },
        ],
      },
      {
        name: "Front & Back Panels (make 2)",
        notes: "Linen stitch creates a woven canvas texture.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Ch 22. Row 1: SC in 2nd ch, *ch 1, skip 1, SC* across. (11 SC, 10 ch-1 sp) Ch 1, turn.", locked: false, count: 21, notes: "", photo: null, completed: true },
          { id: 3, text: "Row 2 (linen stitch): SC in first ch-1 sp, *ch 1, SC in next ch-1 sp* across, SC in last st. Ch 1, turn.", locked: false, count: 21, notes: "", photo: null, completed: false },
          { id: 4, text: "Repeat Row 2 for 22 rows total (panel ~16cm tall). Fasten off. Make 2 panels.", locked: false, count: 21, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Gusset & Assembly",
        notes: "The gusset forms the sides and bottom of the bag.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 5, text: "Gusset: Ch 6. SC all rows until strip = (2 × panel height) + panel width = ~54cm. Fasten off.", locked: false, count: 5, notes: "", photo: null, completed: false },
          { id: 6, text: "Pin interfacing to wrong side of both panels and gusset. Iron to bond.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 7, text: "SC gusset around the 3 sides (bottom + 2 sides) of front panel. Repeat for back panel. SC top edges of gusset together.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 8, text: "Install magnetic snap halves on inside of front and back top edges. Loop yarn through D-rings and sew to gusset sides. Thread adjustable strap through D-rings and slide adjuster.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },

  {
    title: "Statement Hoop Earrings",
    projectType: "Accessory",
    skillLevel: "Beginner",
    yarnType: "Fingering / Lace",
    size: "~4cm diameter hoops",
    description: "Lightweight crochet-wrapped earring hoops in a simple SC wrap. Mix and match colours for a fun boho accessory. Based on viral TikTok and YouTube crochet earring tutorials.",
    materialsNotes: "Use the thinnest yarn possible for delicate lightweight earrings.",
    favorite: false,
    status: "pattern",
    startedAt: undefined,
    finishedAt: undefined,
    endProductImage: undefined,
    needsStuffing: "",
    yarnRequirements: [
      { color: "Terracotta", volume: "~5g / ~30 yards per pair" },
      { color: "Sage Green", volume: "~5g / ~30 yards per pair" },
      { color: "Cream", volume: "~5g / ~30 yards per pair" },
    ],
    hookRequirements: [{ size: "1.5mm", quantity: 1, note: "Or 2.0mm for slightly thicker wrapping." }],
    notionsRequirements: [
      { name: "Metal hoop earring bases", description: "4cm diameter, with closure", quantity: 6 },
      { name: "Earring hooks", description: "Gold plated", quantity: 6 },
      { name: "Jump rings", description: "6mm gold", quantity: 6 },
      { name: "Jewellery pliers", description: "Small needle-nose", quantity: 1 },
    ],
    toolRequirements: [
      { name: "Tapestry needle", description: "Tiny — for weaving in ends" },
      { name: "Scissors", description: "" },
    ],
    sections: [
      {
        name: "Materials",
        notes: "",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 1, text: "Lace / fingering yarn (~15g total in 3 colours), 1.5mm hook, 6x 4cm hoop bases, earring hooks, jump rings, pliers", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
      {
        name: "Wrapping the Hoop",
        notes: "SC around the hoop base — the hoop itself is the 'stitch holder'.",
        locked: false,
        partImageUrl: null,
        steps: [
          { id: 2, text: "Tie yarn to the hoop base with a slip knot. SC tightly around the hoop, working stitches side by side until the full hoop is covered (~60–70 SC depending on yarn weight).", locked: false, count: 65, notes: "", photo: null, completed: false },
          { id: 3, text: "For striped effect: switch colours every 10–15 SC. Fasten off with invisible join. Weave in ends to inside of hoop.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 4, text: "Using pliers, open a jump ring, thread it through the hoop closure loop and an earring hook. Close jump ring firmly.", locked: false, count: 0, notes: "", photo: null, completed: false },
          { id: 5, text: "Make 3 pairs (terracotta, sage, cream). Total time: ~15 mins per pair.", locked: false, count: 0, notes: "", photo: null, completed: false },
        ],
      },
    ],
  },
];

export async function seedAdditionalPatterns(): Promise<void> {
  try {
    const existingRows = await db.select({ id: patterns.id }).from(patterns);

    if (existingRows.length >= 25) {
      console.log(`Library: ${existingRows.length} patterns already exist, skipping additional seed.`);
      return;
    }

    console.log(`Library: seeding ${ADDITIONAL_PATTERNS.length} additional curated patterns…`);
    for (const p of ADDITIONAL_PATTERNS) {
      await patternService.createPattern(p);
    }
    console.log(`Library: ${ADDITIONAL_PATTERNS.length} additional patterns seeded ✓`);
  } catch (error) {
    console.error("Additional pattern seed error:", error);
  }
}
