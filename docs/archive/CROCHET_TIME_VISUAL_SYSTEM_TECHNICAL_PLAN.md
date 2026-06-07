# Crochet Time — Visual System Technical Plan

> ℹ️ **Note (2026-06-07).** Still valid as a forward-looking design plan. Two status claims have since drifted: characters shipped as **PNG in `client/public/characters/`** (not WebP/AVIF in object storage), and **routing is still `useState`** (wouter not yet adopted). See **[`CROCHET_TIME_STATUS_REVIEW_2026-06-07.md`](../CROCHET_TIME_STATUS_REVIEW_2026-06-07.md)** for current state.

**Prepared:** 2026-06-06  
**Scope:** Design-system implementation plan only. No code was modified, no libraries installed, no assets created.  
**Reference image:** `attached_assets/image_1780782331250.png`

---

## 1. Executive Summary

Crochet Time has a genuinely strong foundation — warm color tokens, premium typefaces, a linen texture, and `framer-motion` are already present in the codebase but either under-used or completely dormant. The gap between the current appearance (a generic pastel shadcn dashboard) and the target (a premium tactile crochet studio built for Larissa) is primarily a **wiring and asset problem**, not a framework or architecture problem.

**The minimum-change path is:**
1. Extend the existing CSS token layer with ~20 new custom properties for surfaces, shadows, texture intensity, motion, and character accents — without touching any component logic.
2. Add character-asset images (Aloo, Yala, Ashi, Bee, Sheep) as optimized WebP/AVIF files served from object storage.
3. Wire `framer-motion` (already installed as v11, which is Motion for React) into a small set of purposeful interactions — no additional animation runtime is needed for Tier 3 and 4 moments.
4. Add Rive **selectively** for exactly three signature assets: the yarn-drawn logo, the crochet-hook loader, and the Bee celebration.
5. Rebuild the home screen as Larissa's workbench composition — Aloo and Yala as emotional anchors, not equal-weight dashboard tiles.
6. Leave all utility screens (pattern reader, stitch counter, form flows) visually lighter and fully usable.

`tsc` currently passes at 0 errors (as of the object-storage work). The animation library, the font stack, the color palette, and the token architecture are already largely correct. Implementation is additive, not destructive.

---

## 2. Current Frontend Stack Assessment

### 2.1 Verified stack

| Layer | Technology | Version | Status |
|---|---|---|---|
| Framework | React | 18.3.1 | Stable |
| Language | TypeScript | 5.6.3 | Passing (`tsc` 0 errors) |
| Build | Vite | 5.4.14 | Stable |
| Styling | Tailwind CSS | 3.4.14 | Active; token layer in place |
| UI primitives | shadcn/ui + Radix | Full set | Active and clean |
| Animation | framer-motion (Motion for React) | 11.13.1 | **Installed, never used** |
| Routing | wouter | 3.3.5 | **Installed, never used** — `useState` view-switching instead |
| Server state | TanStack React Query | 5.60.5 | Active |
| Icons | lucide-react + 4 custom SVGs | — | Active |
| Fonts | Fraunces (heading) + Nunito Sans (body) | — | Declared in Tailwind; must be loaded via `<link>` |
| Background texture | SVG linen weave | — | Applied to `body` via `tailwind.config.ts` |
| Color tokens | CSS custom properties in `index.css` | — | Correct warm palette defined |
| Brand color scales | Defined in `tailwind.config.ts` | — | Rose-madder primary, sage secondary, honey accent, warm grays |
| Object storage | Replit Object Storage via GCS | — | Active (just wired) |
| AI | OpenAI gpt-4o + DALL-E 3 | — | Active |

### 2.2 Key gaps identified

| Gap | Impact | Fix category |
|---|---|---|
| Google Fonts not loaded in `client/index.html` | Fraunces and Nunito Sans fall back to system fonts | Low-effort fix |
| `framer-motion` installed but zero imports | No purposeful animation anywhere | Wire-up — no install needed |
| `theme.json` does not exist | Not a blocker — `index.css` + `tailwind.config.ts` handle tokens correctly | No action needed |
| Character assets do not exist | No amigurumi companions rendered anywhere | Asset creation + integration |
| Home screen is `PatternInputRefactored` — a form, not a workbench | No emotional entry point; no Aloo/Yala presence | Redesign one component |
| Rive not installed | Needed for logo, hook loader, Bee celebration | Install when building those three assets |
| No `prefers-reduced-motion` check in JS | CSS rule exists; Motion for React can mirror it | Wire-up during animation pass |
| Navigation is `useState` view-switching | No URL routing, no deep links | Adopt `wouter` (already installed) during shell rebuild |

### 2.3 What is already correct and should not be changed

- The CSS custom-property token architecture in `index.css`
- The Tailwind color scales (rose-madder, sage, honey, warm grays)
- The font family declarations in `tailwind.config.ts`
- The linen background texture utility
- The `stitch-draw` and `yarn-float` keyframe definitions
- The `surface-card` utility class
- The `prefers-reduced-motion` CSS rule
- The shadcn/Radix primitive layer
- The Express + Drizzle + React Query data layer

---

## 3. Recommended Minimum-Change Architecture

The strategy is **extend, wire, add assets** — not rewrite or migrate.

### Implementation order

```
Phase 1 — Tokens & Typography (no visual regressions possible)
  └─ Extend CSS token layer
  └─ Load Google Fonts in index.html
  └─ Map new tokens into tailwind.config.ts

Phase 2 — Character Assets & Static Composition
  └─ Generate/source Aloo, Yala, Ashi, Bee, Sheep as WebP/AVIF
  └─ Upload to object storage public/ directory
  └─ Build CharacterSpot component (image + subtle Motion wrapper)
  └─ Rebuild home workbench composition

Phase 3 — Motion for React (framer-motion wiring)
  └─ Button press states (Tier 4)
  └─ Card lift on hover (Tier 4)
  └─ Page/view transitions (Tier 2)
  └─ Gentle character presence animations (Tier 4)
  └─ Yarn-trail progress (Tier 2, SVG path)
  └─ Stitch-based progress indicator (Tier 3)

Phase 4 — Rive Signature Moments (three only)
  └─ Yarn-drawn logo (Tier 1)
  └─ Crochet-hook loader (Tier 3)
  └─ Bee celebration (Tier 1)

Phase 5 — Utility Screen Polish
  └─ Pattern reader typography + lock/unlock treatment
  └─ Stitch counter mobile-first rebuild
  └─ Fabric-patch card variants
```

---

## 4. Existing Libraries to Retain

| Library | Keep | Reason |
|---|---|---|
| `framer-motion` v11 | Yes, rename mentally to **Motion for React** | Already installed; v11 IS the Motion for React release. All Tier 2–4 animation runs here. Zero additional install cost. |
| `tailwindcss` + `tailwindcss-animate` | Yes | Token layer is well-structured; only needs extension. |
| `@tailwindcss/typography` | Yes | Pattern reader content uses `.prose`. |
| `lucide-react` | Yes, supplemented | Generic icons stay; supplement with hand-drawn SVG set for crochet-specific icons (hook, stitch marker, yarn, row counter). |
| `react-icons/si` | Yes | Company logos as needed. |
| `wouter` | Yes — activate | Already installed; use it to introduce real URL routing during shell rebuild, removing `useState` view-switching. |
| `shadcn/ui` + all Radix primitives | Yes | Clean, accessible primitives; styled through tokens. |
| `@tanstack/react-query` | Yes | Server state is solid. |
| `embla-carousel-react` | Yes | Pattern library browsing may use horizontal carousel on mobile. |

---

## 5. Libraries to Add Later, With Justification

| Library | When | Justification |
|---|---|---|
| `@rive-app/react-canvas` | Phase 4 | Required for yarn-drawn logo, hook-loader, and Bee celebration state machines. Use the `react-canvas` renderer (not WebGL) for correct performance profile on mobile. Install only when building those specific assets. |
| `@lottiefiles/dotlottie-react` | Phase 3–4 (optional) | Use **instead of** Rive for short, pre-authored, non-interactive animations (e.g., a heart-patch "saved" moment) where state logic is not required. Lighter than Rive for one-shot plays. Only add if Rive proves too heavy for a given asset. |
| `sharp` (build-time only) | Phase 2 | AVIF/WebP conversion of character source images at build time. Alternatively, convert manually and commit the outputs — sharp is not a runtime dependency. |

---

## 6. Libraries to Avoid, With Justification

| Library | Reason to avoid |
|---|---|
| Three.js / React Three Fiber | No 3D rendering in the design intent. Adds 400 KB+ to the bundle with no justified use case. |
| GSAP | Motion for React covers all required interactions. GSAP would be a duplicate animation runtime with a larger bundle cost and no accessibility-first API. |
| Animate.css | CSS-class animation library; superseded by `tailwindcss-animate` which is already present. |
| `react-spring` | Redundant alongside Motion for React; no unique capability needed here. |
| `styled-components` / `emotion` | CSS-in-JS at runtime adds hydration cost and fights the existing Tailwind token architecture. All styling should remain in Tailwind + CSS custom properties. |
| Any React framework migration (Next.js, Remix) | No server-side rendering requirement exists. Vite + React is stable and the cost of migration is unjustified for a visual redesign. |
| `react-router-dom` | `wouter` is already installed and is lighter. Use it. |
| Any icon library beyond lucide + custom SVGs | Adding a second icon library (e.g., Heroicons, Phosphor) creates inconsistency. Extend the custom SVG set (`icons/WoolIcons.tsx`) for crochet-specific icons instead. |

---

## 7. Design-Token Architecture

### 7.1 Existing tokens (retain as-is)

These are correctly defined in `client/src/index.css` as CSS custom properties and mapped to Tailwind utilities in `tailwind.config.ts`:

```
--background, --foreground
--card, --card-foreground
--popover, --popover-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--border, --input, --ring
--radius
--chart-1 through --chart-5
--sidebar-* (7 tokens)
```

Tailwind scales: `primary`, `secondary`, `honey`, `gray` (all warm-shifted), `backgroundImage.linen`  
Keyframes: `stitch-draw`, `yarn-float`, `accordion-down/up`

### 7.2 New tokens to add to `index.css`

```css
:root {
  /* --- Surface layers --- */
  --surface-base:        40 38% 97%;   /* same as --background; explicit alias */
  --surface-raised:      40 40% 99%;   /* same as --card; explicit alias */
  --surface-sunken:      36 28% 93%;   /* slightly deeper well — input areas */
  --surface-warm-patch:  32 40% 91%;   /* fabric-patch card background */
  --surface-linen-dark:  34 30% 88%;   /* heavier textile area */

  /* --- Shadows (box-shadow values, not HSL) --- */
  --shadow-card:         0 1px 4px hsl(25 20% 15% / 0.06), 0 2px 12px hsl(25 20% 15% / 0.04);
  --shadow-raised:       0 4px 16px hsl(25 20% 15% / 0.10), 0 1px 4px hsl(25 20% 15% / 0.06);
  --shadow-character:    0 8px 32px hsl(25 20% 15% / 0.14);

  /* --- Texture intensity --- */
  --texture-intensity:   0.018;        /* linen opacity multiplier; reduce to 0 in high-contrast mode */

  /* --- Border treatments --- */
  --border-stitch:       2px dashed hsl(34 22% 78%);   /* stitched border */
  --border-patch:        1.5px solid hsl(34 28% 82%);  /* fabric-patch card edge */

  /* --- Motion --- */
  --duration-instant:    80ms;
  --duration-quick:      150ms;
  --duration-standard:   250ms;
  --duration-entrance:   400ms;
  --duration-signature:  1100ms;       /* stitch-draw, yarn-trail */
  --ease-out-soft:       cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring:         cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-stitch:         cubic-bezier(0.4, 0, 0.2, 1);

  /* --- Character accent colours --- */
  --aloo-accent:         345 48% 53%;  /* rose — project companion */
  --yala-accent:         280 35% 52%;  /* plum — creative guide */
  --ashi-accent:         195 40% 46%;  /* teal — community explorer */
  --bee-accent:          42 80% 50%;   /* gold — celebration */
  --sheep-accent:        78 30% 44%;   /* sage — yarn expert */

  /* --- Z-index scale --- */
  --z-base:      0;
  --z-raised:    10;
  --z-overlay:   50;
  --z-drawer:    100;
  --z-modal:     200;
  --z-toast:     300;
  --z-character: 20;   /* characters sit above cards, below drawers */
}
```

### 7.3 Map new tokens into `tailwind.config.ts`

```typescript
// Add inside theme.extend:
boxShadow: {
  'card':      'var(--shadow-card)',
  'raised':    'var(--shadow-raised)',
  'character': 'var(--shadow-character)',
},
transitionDuration: {
  'instant':   'var(--duration-instant)',
  'quick':     'var(--duration-quick)',
  'standard':  'var(--duration-standard)',
  'entrance':  'var(--duration-entrance)',
  'signature': 'var(--duration-signature)',
},
colors: {
  // Add to existing colors:
  surface: {
    base:   'hsl(var(--surface-base))',
    raised: 'hsl(var(--surface-raised))',
    sunken: 'hsl(var(--surface-sunken))',
    patch:  'hsl(var(--surface-warm-patch))',
    linen:  'hsl(var(--surface-linen-dark))',
  },
  aloo:  'hsl(var(--aloo-accent))',
  yala:  'hsl(var(--yala-accent))',
  ashi:  'hsl(var(--ashi-accent))',
  bee:   'hsl(var(--bee-accent))',
  sheep: 'hsl(var(--sheep-accent))',
},
```

### 7.4 New utility classes in `index.css`

```css
@layer utilities {
  /* Existing */
  .surface-card { @apply bg-card border border-border rounded-2xl shadow-card; }

  /* New */
  .surface-patch {
    background-color: hsl(var(--surface-warm-patch));
    border: var(--border-patch);
    @apply rounded-2xl shadow-card;
  }
  .border-stitch {
    border: var(--border-stitch);
    border-radius: var(--radius);
  }
  .character-shadow { box-shadow: var(--shadow-character); }
  .texture-none { background-image: none; }   /* utility screens: suppress linen */
}
```

---

## 8. Component Architecture

### 8.1 Component hierarchy

```
App
├── AppShell                    NEW — replaces the raw <div> wrapper
│   ├── NavigationBar           REDESIGN — single coherent nav, wouter-linked
│   └── ViewTransition          NEW — Motion for React page-switch wrapper
│       ├── HomeWorkbench       NEW — Larissa's studio landing screen
│       │   ├── WorkbenchStage      — layered backdrop + character placement
│       │   │   ├── CharacterSpot   NEW — image + Motion wrapper per character
│       │   │   └── YarnTrailSVG    NEW — decorative SVG thread separator
│       │   ├── ContinueProject     — Aloo-anchored active project card
│       │   ├── CreateWithYala      — Yala-anchored AI generation entry
│       │   └── FavoritesRow        — horizontal pattern strip
│       ├── PatternInputRefactored  REDESIGN shell; keep AI form logic
│       ├── PatternViewer           REDESIGN shell; keep pattern data
│       ├── PatternLibrary          IMPROVE — search/filter/favorites
│       └── MaterialsInventory      RETAIN with token polish
│
├── Shared components (extend existing):
│   ├── FabricPatchCard         NEW variant of Card — uses .surface-patch
│   ├── StitchedDivider         NEW — SVG horizontal thread separator
│   ├── CharacterBadge          NEW — small character avatar + role label
│   ├── YarnProgressBar         REDESIGN of PatternProgressBar — row-by-row fill
│   ├── HookLoader              NEW Rive asset wrapper (replaces CSS spinner)
│   └── HeartPatch              NEW — animated favourite toggle
│
└── Utility screens (minimal decoration):
    ├── StitchCounter           REBUILD — full-screen mobile-first
    └── PatternSection          RETAIN structure; typography + lock/unlock polish
```

### 8.2 Component design rules

**Foundation components** (Button, Input, Card, Badge, Separator):
- Styled entirely through Tailwind tokens — no inline styles
- All interactive states use Motion for React (`whileHover`, `whileTap`) at Tier 4 intensity only
- No textile treatment beyond the token surface colors

**Signature components** (FabricPatchCard, StitchedDivider, YarnProgressBar, HeartPatch):
- Use the new `surface-patch`, `border-stitch`, and character-accent tokens
- May carry restrained Motion for React entry animations (`initial`/`animate` with `var(--duration-entrance)`)
- One crochet detail maximum per component (a stitch border OR a yarn trail, not both)

**Character components** (CharacterSpot, CharacterBadge):
- Render a `<picture>` element with AVIF + WebP sources
- Wrap in a `motion.div` with a gentle `y` keyframe at 4px amplitude, 4-second duration, `repeat: Infinity` — only when `prefers-reduced-motion` is not set
- Never scale or distort character proportions

**Utility components** (PatternSection, StitchCounter, form fields):
- No ambient animation
- No textile decoration beyond background color
- Typography and spacing are the only visual tools

---

## 9. Asset Architecture

### 9.1 Directory layout

```
client/public/
  characters/
    aloo-400.webp          400 × 500 px — card use
    aloo-800.webp          800 × 1000 px — workbench hero
    aloo-400.avif          same sizes in AVIF
    aloo-800.avif
    yala-400.webp / yala-800.webp / *.avif
    ashi-400.webp / ashi-800.webp / *.avif
    bee-300.webp / bee-600.webp / *.avif   (smaller; supporting role)
    sheep-300.webp / sheep-600.webp / *.avif
  rive/
    crochet-logo.riv       yarn-drawn logo state machine
    hook-loader.riv        crochet hook looping loader
    bee-celebrate.riv      Bee milestone celebration
  svg/
    yarn-trail.svg         decorative thread separator
    stitch-divider.svg     horizontal dashed stitch line
    granny-square.svg      modular tile accent
    crochet-flower.svg     decorative accent
    hook-icon.svg          crochet hook (replaces generic icon)
    stitch-marker.svg      utility icon
  textures/
    linen-tile.png         40 × 40 px; referenced by tailwind.config.ts backgroundImage
    (already defined as SVG data URI — PNG fallback for wider support)
```

All character images and Rive files are served from Replit Object Storage (`/api/media/...`) for durability. SVGs and the linen texture are committed to the repository as static assets.

### 9.2 Image loading strategy

```tsx
// CharacterSpot.tsx — example for Aloo
<picture>
  <source
    srcSet="/characters/aloo-800.avif 800w, /characters/aloo-400.avif 400w"
    type="image/avif"
  />
  <source
    srcSet="/characters/aloo-800.webp 800w, /characters/aloo-400.webp 400w"
    type="image/webp"
  />
  <img
    src="/characters/aloo-400.webp"
    alt="Aloo, your project companion"
    width={400}
    height={500}
    loading="lazy"       // lazy for off-screen; "eager" only for above-fold
    decoding="async"
  />
</picture>
```

---

## 10. Character-Asset Strategy

### 10.1 Art direction requirements

All five characters must be generated or sourced as **photorealistic handmade amigurumi**, matching the reference image aesthetic:
- Visible crochet stitches and wool fibre texture
- Soft, warm editorial lighting from slightly above and to the left
- Natural drop shadow on a warm cream surface
- Consistent scale relative to each other
- Slightly expressive resting poses (not action poses)
- No cartoon outlines, no flat fills, no plastic highlights

### 10.2 Character weights and placement rules

| Character | Weight | Where they appear |
|---|---|---|
| **Aloo** | Primary | HomeWorkbench hero (large), ContinueProject card (medium), save confirmations (small badge) |
| **Yala** | Primary | HomeWorkbench hero (large), CreateWithYala area (medium), pattern generation loader |
| **Ashi** | Secondary | Community/library section header (medium), discovery empty states |
| **Bee** | Supporting | Milestone celebration only (Rive asset); small badge on FavoritesRow |
| **Sheep** | Supporting | Materials/yarn section header (medium); yarn recommendation tooltips |

**Rule:** Aloo and Yala are always present on the home workbench. Ashi, Bee, and Sheep appear only when contextually relevant. Never render all five simultaneously on the same screen.

### 10.3 Generation prompt guidance (for DALL-E or Midjourney sourcing)

```
Photorealistic handmade amigurumi [animal], sitting on a warm cream knitted surface.
Visible crochet stitches, soft wool fibres, dimensional construction.
Warm editorial lighting from upper-left, natural soft shadow below.
Premium handmade craft photography aesthetic.
White/transparent background.
No cartoon outlines. No plastic highlights. No flat fills.
```

Generate at minimum 1024×1024; crop and export at 800 and 400 px widths.

### 10.4 Asset storage

Character images are stored in Replit Object Storage under `public/characters/` and served from `/api/media/...` URLs via the existing `streamObject` helper. This ensures they survive redeploys and autoscaling.

---

## 11. Animation Architecture

### 11.1 Implementation by tier

**Tier 1 — Signature moments (Rive only)**

| Moment | Implementation | Duration | Trigger |
|---|---|---|---|
| Yarn draws Crochet Time logo | `crochet-logo.riv` — path-draw state machine | ~1.8 s | First visit only (localStorage flag) |
| Bee-led milestone celebration | `bee-celebrate.riv` — confetti + Bee bounce | ~2.5 s | Pattern or project completion event |
| AI generation yarn trail | SVG path + Motion `pathLength` | Progressive | During pattern generation |

**Tier 2 — Journey guidance (Motion for React)**

```tsx
// View transition wrapper
<AnimatePresence mode="wait">
  <motion.div
    key={activeView}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**Tier 3 — Functional feedback (Motion for React)**

```tsx
// Crochet-hook loader (Rive asset, replaces CSS spinner)
// HeartPatch favourite toggle
<motion.div
  animate={{ scale: isFavorite ? [1, 1.35, 1] : 1 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
/>

// Progress bar — row-by-row fill
<motion.div
  style={{ scaleX: progress / 100, originX: 0 }}
  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
/>
```

**Tier 4 — Everyday tactility (Motion for React)**

```tsx
// Button press
<motion.button whileTap={{ scale: 0.96 }} transition={{ duration: 0.08 }}>

// Card lift
<motion.div whileHover={{ y: -3, boxShadow: 'var(--shadow-raised)' }}
  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}>

// Character gentle bob — only if !prefersReducedMotion
<motion.div
  animate={{ y: [0, -4, 0] }}
  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
```

### 11.2 Motion for React reduced-motion hook

```tsx
// hooks/use-reduced-motion.ts
import { useReducedMotion } from 'framer-motion';

export function useSafeMotion() {
  const reducedMotion = useReducedMotion();
  return {
    shouldAnimate: !reducedMotion,
    transition: reducedMotion
      ? { duration: 0 }
      : undefined,
  };
}
```

Use this hook in every animated component. When `reducedMotion` is true, pass `duration: 0` to all transitions and skip `animate` on character bob effects entirely.

### 11.3 What must not be animated

- Pattern-reading content while the user is actively reading
- Stitch-counter tap feedback (must be instant — no delay)
- Dense form fields
- Every card on a list simultaneously
- Mobile navigation transitions (keep to simple opacity only)
- Any animation without a `prefers-reduced-motion` fallback

---

## 12. Performance Strategy

### 12.1 Asset budgets

| Asset category | Budget | Strategy |
|---|---|---|
| Initial JS bundle | < 350 KB gzipped | Code-split Rive and dotLottie via dynamic `import()` |
| Each character image (large) | < 80 KB (AVIF), < 120 KB (WebP) | Export at 800 px max; AVIF first |
| Each character image (small) | < 25 KB (AVIF) | Export at 400 px |
| Each Rive file | < 150 KB | Keep state machines minimal; no raster assets inside .riv |
| Simultaneously active animations | ≤ 3 | Pause off-screen animations using `useInView` |
| Character images per screen | ≤ 2 large + 1 medium | Enforce via placement rules in §10.2 |

### 12.2 Code splitting

```tsx
// Lazy-load Rive wrapper — only loads when a Rive asset is needed
const RiveLogo = lazy(() => import('@/components/RiveLogo'));
const RiveHookLoader = lazy(() => import('@/components/RiveHookLoader'));
const RiveCelebration = lazy(() => import('@/components/RiveCelebration'));
```

Motion for React (framer-motion) is already in the main bundle as it is used pervasively. Rive is only loaded on first encounter of a Rive component — which happens post-interaction for the loader and post-completion for Bee.

### 12.3 Character image loading

- `loading="eager"` only for the two above-fold characters on the home workbench (Aloo and Yala at hero size)
- `loading="lazy"` for all other character appearances
- `fetchpriority="high"` for the hero Aloo and Yala images
- Use `<picture>` with AVIF/WebP sources as shown in §9.2

### 12.4 Texture and background performance

The linen texture is a 40 × 40 px SVG data URI applied via `background-attachment: fixed`. This is GPU-composited and low-cost. On lower-powered devices (detected via `navigator.hardwareConcurrency < 4` or battery API), suppress via the `.texture-none` utility.

### 12.5 Animation performance rules

- All transforms use only `transform` and `opacity` — no layout-triggering properties
- Character bob animations use `will-change: transform` only while the animation is active
- Use `useInView` from Motion for React to pause off-screen animations
- Limit `AnimatePresence` nesting to one level per screen

### 12.6 Caching

Character images served from object storage include `Cache-Control: public, max-age=31536000, immutable` (already implemented in `streamObject`). Rive files should be similarly cached.

---

## 13. Responsive Strategy

### 13.1 Breakpoints (existing + one addition)

```
xs:  480px   (already in tailwind.config.ts)
sm:  640px   (Tailwind default)
md:  768px   (Tailwind default)
lg:  1024px  (Tailwind default)
xl:  1280px  (Tailwind default)
2xl: 1536px  (Tailwind default)
```

### 13.2 Home workbench responsive behaviour

| Breakpoint | Layout |
|---|---|
| < sm (mobile) | Aloo + Yala stacked vertically as medium cards; no hero large format; simplified workbench strip |
| sm–md | Aloo + Yala side by side as medium cards; supporting characters hidden or minimal badges |
| lg+ | Full workbench composition with Aloo and Yala at large hero scale; supporting characters in sidebar areas |

### 13.3 Utility screen mobile-first rules

**Stitch counter:**
- Minimum tap target: 56 × 56 px for all increment/decrement controls
- Counter display: minimum 72px font size
- Full-screen mode: available via a dedicated route or modal
- One-handed reachability: primary controls in the bottom third of the screen

**Pattern reader:**
- Step text: minimum 16px / 1rem; line-height 1.6
- Section accordion headers: minimum 48px touch target
- Lock/complete toggles: minimum 44 × 44 px
- No ambient animation while a section is open and being read

**Navigation (mobile):**
- Bottom tab bar on < md viewports
- Top navigation bar on md+ viewports
- No horizontal overflow on any breakpoint

### 13.4 Character asset responsive srcSet

```html
<source
  srcSet="
    /characters/aloo-400.avif  400w,
    /characters/aloo-800.avif  800w
  "
  sizes="(max-width: 640px) 200px, (max-width: 1024px) 300px, 400px"
  type="image/avif"
/>
```

---

## 14. Accessibility and Reduced-Motion Strategy

### 14.1 Reduced-motion system

**CSS layer** (already implemented in `index.css`):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

**Motion for React layer** (to add):
- All animated components use the `useSafeMotion()` hook from §11.2
- When reduced motion is preferred: pass `{ duration: 0 }` to all transitions; skip `animate` on bob/float effects
- `AnimatePresence` exit animations are skipped (set `exit={{ opacity: 1 }}` in reduced-motion mode)

**Rive layer** (to implement at Phase 4):
- Rive state machines must have a "static" state that is entered immediately when `prefers-reduced-motion` is detected
- The yarn-drawn logo reverts to a static logotype with no draw animation
- The hook loader reverts to a static hook icon
- The Bee celebration shows a static success illustration

### 14.2 Reduced-motion substitutions

| Animation | Normal | Reduced-motion |
|---|---|---|
| Yarn-drawn logo | Rive path draw | Static SVG logotype |
| View transitions | Fade + slide (250 ms) | Simple fade (0 ms) |
| Character bob | 4 px y-oscillation | Static image |
| Card lift | `y: -3`, shadow | No transform, same shadow |
| Heart patch | Scale burst | Instant color change |
| Progress bar | `scaleX` animate | Instant width |
| Hook loader | Rive looping animation | Static hook SVG + CSS `opacity` pulse |
| Bee celebration | Full Rive sequence | Static illustrated card |
| Stitch-draw borders | SVG path animation | Dashed border, no draw |

### 14.3 Keyboard and focus

- All interactive elements must have a visible focus ring using the existing `ring-2 ring-ring ring-offset-2` system
- Character "spots" that are decorative (not interactive) use `aria-hidden="true"`
- Stitch counter increment/decrement buttons use `aria-label="Increase stitch count"` / `aria-label="Decrease stitch count"`
- Modal and drawer focus trapping is handled by Radix primitives (already correct)

### 14.4 Contrast requirements

Verify against WCAG AA (4.5:1 for normal text, 3:1 for large text) before shipping:
- Foreground on `--surface-warm-patch` (the fabric patch background)
- Character role labels on warm cream backgrounds
- Muted text (`--muted-foreground`) on card backgrounds — this is the most likely failure point

### 14.5 Touch target minimums

- All buttons and interactive controls: 44 × 44 px minimum
- Stitch counter controls: 56 × 56 px minimum
- Navigation items: 44 px height minimum
- Accordion section headers: 48 px height minimum

### 14.6 Screen reader considerations

- Rive canvas elements: `aria-label` on the container; provide a `<noscript>` static alternative
- Character images: descriptive `alt` text ("Aloo, your project companion — a photorealistic crocheted dog")
- Yarn-trail SVGs that are purely decorative: `aria-hidden="true"` and `role="presentation"`
- Progress indicators: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

---

## Appendix A — Opening Experience Specification

**Target sequence:**
1. SVG yarn thread appears (0 ms)
2. Thread stitches/draws the Crochet Time wordmark (0–1800 ms via Rive)
3. Thread fades out; workbench fades in (1800–2200 ms)
4. Aloo and Yala settle into position with a 4 px y entrance (2000–2400 ms)
5. App is fully interactive by 2200 ms

**First visit:** Full sequence plays once. `localStorage.setItem('ct-intro-seen', '1')` is set before the sequence ends so it is not seen again even if the user refreshes mid-sequence.

**Returning user:** Skip directly to the workbench with a simple 250 ms fade. Check `localStorage.getItem('ct-intro-seen')` before mounting the intro.

**Mobile:** Same sequence but at 80% speed. If `navigator.hardwareConcurrency < 4`, skip to the static logo + 250 ms fade.

**Reduced motion:** Skip all animation. Show static logo + instant workbench render.

**Duration budgets:**
- Full intro: 2.4 s from first paint to fully interactive
- Returning user: 250 ms fade
- Mobile reduced: 0 ms (instant)

---

## Appendix B — Home Workbench Composition Specification

The workbench is **not a grid of equal cards**. It uses a layered asymmetric composition:

```
┌─────────────────────────────────────────────────────────────────┐
│  [HANDMADE WITH CARE]                                           │
│  Crochet Time ♥                    [basket of yarn — right]     │
│  Your crochet studio. Your creative world.                      │
│                                                                 │
│  ┌───────────────────┐  ┌──────────────────┐                   │
│  │  [Aloo — large]   │  │  [Yala — large]   │                   │
│  │                   │  │                   │                   │
│  │  Continue your    │  │  Create with      │                   │
│  │  project          │  │  Yala             │                   │
│  │                   │  │                   │                   │
│  │  [active project  │  │  [AI generation   │                   │
│  │   summary card]   │  │   entry]          │                   │
│  └───────────────────┘  └──────────────────┘                   │
│                                                                 │
│  ── Larissa's Favourites ──────────────────────────────── [Bee] │
│  [horizontal pattern strip]                                     │
│                                                                 │
│  [stitch divider]                                               │
│                                                                 │
│  [Sheep small]  Materials     [Ashi small]  Explore            │
└─────────────────────────────────────────────────────────────────┘
```

Visual hierarchy:
1. **Primary focal area:** Aloo + Yala hero zone (50% of vertical space above fold)
2. **Secondary:** Larissa's Favourites strip
3. **Supporting:** Materials (Sheep) + Explore (Ashi) at smaller weight
4. **Decorative:** Yarn basket (top right, static image), stitch divider, loose thread motifs

The workbench uses a warm cream linen backdrop. Cards are `surface-patch` (fabric patch style). Character images sit slightly outside their card boundaries for a layered, dimensional feel.
