# Photo "Fix-My-Mistake" Coach — Design (built 2026-06-14)

> **📦 Archived 2026-06-22.** Shipped feature; design record kept for provenance.
> Current state: [`../CROCHET_TIME_ROADMAP_2026-06-09.md`](../CROCHET_TIME_ROADMAP_2026-06-09.md).

**Status:** Designed **and built** 2026-06-14. This documents the shipped feature; the build checklist at the end is complete.

**Owner decisions (Yash, 2026-06-14):**
1. **Tone:** *Gentle observation + nudges* — supportive, low false-alarm, never prescribes drastic fixes (e.g. no "frog 3 rounds").
2. **Placement:** *Follow Mode only* — no standalone viewer tool.

---

## 1. User problem & goal

Mid-make — especially for beginners — you can't tell you've gone wrong until several rounds later. *"Did I miss an increase? Am I on the right round?"* There is no in-the-moment second opinion.

**Goal:** From inside Follow Mode, photograph the work-in-progress and get a gentle, round-aware read from Ashi: *does this look on track, and what's worth double-checking?* — without ever confidently issuing a costly, wrong instruction.

## 2. Why this is low-risk to build

It is a thin extension of pipelines that already exist and are proven by the full-stack smoke:

| Reuse | Where it lives today |
|---|---|
| Vision call (photo + text → `gpt-4.1` → strict JSON), with **honest failure** when no key | `server/api/analyzeAlignment.ts`, mirrored by `server/api/coach.ts` |
| Object-storage image → data URL (so the model can see stored reference art) | `getObjectDataUrl` in `server/objectStorage.ts` |
| Camera capture UX (`<input type="file" accept="image/*" capture="environment">` → FileReader → data URL) | ball-band scanner in `client/src/components/MaterialsInventory.tsx`; step-photo uploads |
| Result sheet + "Ashi is thinking" UX, current-round context (`sectionName`, `stepText`, history) | `client/src/components/CoachChat.tsx` inside `client/src/components/FollowMode.tsx` |
| Per-round target stitch count parsed from the trailing `(N)` | `FollowMode.tsx` (tally logic) |

No schema change. The check photo is **ephemeral** by default (not persisted).

## 3. UX flow (Follow Mode only)

1. Follow Mode already knows the current flattened step (`pos`) and its `sectionName` / `stepText`, plus the round's target count parsed from the trailing `(N)`.
2. A new **"📷 Check my work"** button sits beside the existing tally / Ashi-coach controls.
3. Tap → camera/file picker (`capture="environment"`) → read as a data URL.
4. Show an "Ashi is looking…" loading state in a sheet (same Drawer/sheet pattern as `CoachChat`).
5. Render the result:
   - **Looks on track ✓** (sage) — short reassurance.
   - **Worth a look 👀** (honey/amber) — one or two gentle, specific things to double-check.
   - **Hard to tell 🤔** (neutral) — when the photo is too dark/blurry/far to judge; suggests a clearer shot. *(Critical: this state is what keeps noisy vision from crying wolf.)*
6. Dismiss and keep crocheting. Nothing is saved.

## 4. Server

### New module `server/api/checkWork.ts`
Mirror `analyzeAlignment.ts` (same key handling, model, `null`-client honest throw). Signature:

```ts
export interface WorkCheckResult {
  status: "on_track" | "check" | "unsure";
  note: string; // one or two short, supportive sentences
}

export async function checkWork(input: {
  wipImageUrl: string;        // data URL of the just-taken WIP photo
  referenceImageUrl?: string; // optional: section reference art, as a data URL
  sectionName: string;
  currentRound: string;       // the exact step text the maker is on
  targetCount?: number;       // parsed (N), if any
  precedingRounds: string[];  // a few prior rounds for context
}): Promise<WorkCheckResult>;
```

**Prompt design (gentle, round-aware, non-prescriptive):**
- System: *"You are Ashi, a warm, encouraging crochet helper. You'll see a photo of someone's work IN PROGRESS and the round they're currently on. Judge gently whether the work looks consistent with that round."*
- Rules baked in:
  - Prefer reassurance; only flag an issue when reasonably confident.
  - Phrase issues as *"you may want to double-check…"*, never as commands; **never** tell them to frog/undo rounds or take drastic action.
  - If the photo is too dark/blurry/far, or you genuinely can't tell, return `status:"unsure"` and ask for a clearer, well-lit, closer shot — **do not guess**.
  - No numeric scores in the output (a "47% match" on live yarn reads as judgmental and is noisy).
- Output: strict JSON `{"status": "on_track"|"check"|"unsure", "note": "..."}`.
- Inputs length-capped (`currentRound`, each `precedingRounds` entry), consistent with `coach.ts`.

### New route `POST /api/patterns/:id/check-work`
- Body: `{ sectionIndex: number, stepIndex: number, imageBase64: string }` (validate: `imageBase64` starts with `data:image/`, indices are integers).
- Handler: load the pattern (`patternService.getPattern`); resolve `section = pattern.sections[sectionIndex]` and the current step; build `currentRound = step.text`, `precedingRounds` = the prior 2–3 step texts in the section, `targetCount` parsed from the trailing `(N)`; if `section.partImageUrl` exists, convert it via `getObjectDataUrl` and pass as `referenceImageUrl` (gpt-4.1 accepts multiple `image_url` parts).
- Call `checkWork(...)`; return `{ success: true, ...result }`.
- **Degradation:** no/invalid key → `checkWork` throws → 500 with a clear message ("Ashi needs an OpenAI key to check your work"), exactly like `coach`/`scan-label`. Add a smoke assertion: *check-work fails CLEANLY without key*.

## 5. Client

`client/src/components/FollowMode.tsx`:
- Carry `sectionIndex` + `stepIndex` on each flattened step entry (the section-map already tracks section identity for its chips — extend that metadata so the current `pos` maps back to `(sectionIndex, stepIndex)`).
- Add the hidden file input + "📷 Check my work" button near the tally/coach row.
- On file pick: `FileReader.readAsDataURL` → `apiRequest("POST", \`/api/patterns/${id}/check-work\`, { sectionIndex, stepIndex, imageBase64 })`.
- Reuse the `CoachChat`-style sheet for loading/result/error; map `status` → colour + icon (✓ / 👀 / 🤔). Reset the file input value after each use (as `MaterialsInventory` does) so the same photo can be re-picked.

## 6. Cost, data, degradation
- **One vision call per tap**, user-initiated — consistent with the accepted-risk cost posture (no new gate, per the earlier decision).
- **Ephemeral photo** — not stored. *(Future option, out of scope: a "save this photo to the step" affordance reusing the existing step-photo upload, for a progress record.)*
- Honest failure without a key; the result sheet surfaces the error rather than fabricating a verdict.

## 7. Effort, risks, mitigations
- **Effort:** Medium — 1 server module + 1 route + 1 smoke assertion; a button, file input, and result sheet in Follow Mode reusing existing patterns. No schema/migration.
- **Risk:** vision on *in-progress* yarn is noisier than on a finished piece.
  - **Mitigations:** the gentle, reassurance-biased prompt; the explicit `unsure` escape hatch; no numeric score; never prescribing drastic fixes.

## 8. Acceptance criteria
1. In Follow Mode, "📷 Check my work" captures/uploads a photo and returns a result without leaving the round.
2. With no OpenAI key, the sheet shows a clear, friendly error (never a fabricated verdict); smoke asserts the clean 500.
3. A clearly-wrong / too-dark photo yields `unsure` (a clearer-shot prompt), not a false "you made a mistake."
4. Feedback never instructs frogging/undoing rounds; tone stays supportive.
5. `tsc` clean · build green · smoke green (incl. the new no-key assertion).

## 9. Explicitly out of scope (for this feature)
Standalone (non-Follow-Mode) entry point; saving check photos; auto-corrective actions ("frog N rounds"); numeric match scores; multi-photo batches. Each can be revisited later if the gentle v1 proves valuable.

## 10. Build checklist
- [x] `server/api/checkWork.ts` — gentle round-aware vision module, honest throw without key.
- [x] `server/routes.ts` — `POST /api/patterns/:id/check-work` (validate, build round context, optional reference image, call `checkWork`).
- [x] `client/src/components/WorkCheckButton.tsx` — "📷 Check my work" button + hidden capture input + result sheet (✓ / 👀 / 🤔); dropped into the Follow Mode header (`FlatStep` already carries `(sectionIndex, stepIndex)`).
- [x] `scripts/fullstack-smoke.mjs` — asserts check-work fails cleanly without a key.
- [x] Docs — status flipped to built; smoke count bumped (35 → 36).
