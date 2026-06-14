/**
 * Full-stack API smoke test — runs against a REAL server + REAL Postgres
 * (AI endpoints degrade gracefully without an OpenAI key, which is asserted).
 *
 *   1. createdb + create base tables (or `npm run db:push`)
 *   2. DATABASE_URL=postgres://… npx tsx server/index.ts
 *   3. npm run smoke          (SMOKE_BASE_URL overrides http://localhost:5000)
 */
const BASE = process.env.SMOKE_BASE_URL || "http://localhost:5000";

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ✘ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

const samplePattern = (title) => ({
  title,
  projectType: "Toy",
  skillLevel: "Beginner",
  description: "Smoke-test pattern",
  materialsNotes: "",
  sections: [
    {
      name: "Body",
      notes: "",
      locked: false,
      steps: [
        { id: 1, text: "Round 1: 6 SC in MR. (6)", locked: false, count: 0, notes: "", photo: null, completed: false },
        { id: 2, text: "Round 2: INC in each st. (12)", locked: false, count: 0, notes: "", photo: null, completed: false },
      ],
    },
  ],
  yarnRequirements: [{ color: "Cream", volume: "~20g" }],
  hookRequirements: [{ size: "3.5mm", quantity: 1 }],
  notionsRequirements: [],
  toolRequirements: [],
  favorite: false,
  status: "pattern",
  startedAt: null,
  finishedAt: null,
});

console.log(`\nFull-stack smoke against ${BASE}\n`);

// ── Profiles & scoping ─────────────────────────────────────────────────────
{
  const { status, json } = await api("GET", "/api/profiles");
  check("profiles: 4 family members", status === 200 && Array.isArray(json) && json.length === 4);
}
let larissaCount = 0;
{
  const a = await api("GET", "/api/patterns?profile=larissa");
  const b = await api("GET", "/api/patterns?profile=vumsh");
  larissaCount = a.json?.length ?? 0;
  check("patterns scoped per profile", a.status === 200 && b.status === 200 && a.json.length !== b.json.length,
    `larissa=${a.json?.length} vumsh=${b.json?.length}`);
}
let vumshPattern;
{
  const { status, json } = await api("POST", "/api/patterns?profile=vumsh", samplePattern("Smoke Bunny (Vumsh)"));
  vumshPattern = json;
  check("create pattern as Vumsh", status === 201 && json?.id);
  const larissa = await api("GET", "/api/patterns?profile=larissa");
  check("Vumsh's pattern is NOT in Larissa's library",
    !larissa.json.some((p) => p.id === json?.id));
}

// ── Doing = starting ───────────────────────────────────────────────────────
{
  const sections = structuredClone(vumshPattern.sections);
  sections[0].steps[0].completed = true;
  const { json } = await api("PUT", `/api/patterns/${vumshPattern.id}?profile=vumsh`, { sections });
  check("completing a step auto-starts the project", json?.status === "active" && !!json?.startedAt,
    `status=${json?.status}`);
}
{
  const { json: fresh } = await api("POST", "/api/patterns?profile=vumsh", samplePattern("Smoke Counter (Vumsh)"));
  const { json } = await api("PUT", `/api/patterns/${fresh.id}?profile=vumsh`, { counterState: { stitches: 3, rows: 2, target: 0, history: [] } });
  check("counting rows auto-starts the project", json?.status === "active");
  check("counterState persists on the pattern", json?.counterState?.rows === 2);
}

// ── Notes, rename, lifecycle ───────────────────────────────────────────────
{
  await api("PUT", `/api/patterns/${vumshPattern.id}?profile=vumsh`, { userNotes: "use 3.25mm for ears" });
  const { json } = await api("GET", `/api/patterns/${vumshPattern.id}`);
  check("userNotes persist", json?.userNotes === "use 3.25mm for ears");
  const renamed = await api("PUT", `/api/patterns/${vumshPattern.id}?profile=vumsh`, { title: "Renamed Smoke Bunny" });
  check("rename persists", renamed.json?.title === "Renamed Smoke Bunny");
  const finished = await api("PUT", `/api/patterns/${vumshPattern.id}?profile=vumsh`, { status: "finished", finishedAt: new Date().toISOString() });
  check("mark finished persists", finished.json?.status === "finished");
}

// ── Up-next & gauge & activity (per-profile app_meta) ──────────────────────
{
  await api("PUT", "/api/up-next?profile=akka", { patternId: vumshPattern.id });
  const akka = await api("GET", "/api/up-next?profile=akka");
  const mummy = await api("GET", "/api/up-next?profile=mummy");
  check("up-next set for Akka", akka.json?.patternId === vumshPattern.id);
  check("up-next empty for Mummy (per-profile)", !mummy.json?.patternId);
}
{
  await api("PUT", "/api/gauge?profile=mummy", { stitches: 18, rows: 22 });
  const { json } = await api("GET", "/api/gauge?profile=mummy");
  check("gauge round-trips per profile", json?.stitches === 18 && json?.rows === 22);
}
{
  await api("POST", "/api/activity?profile=akka", { days: ["2026-06-10", "2026-06-11"] });
  const { json } = await api("GET", "/api/activity?profile=akka");
  check("activity days recorded", Array.isArray(json?.days) && json.days.includes("2026-06-11"));
  const other = await api("GET", "/api/activity?profile=vumsh");
  check("activity scoped per profile", !(other.json?.days ?? []).includes("2026-06-10"));
}

// ── Community: list, like, server-stamped sharing ──────────────────────────
let communityId;
{
  const { status, json } = await api("GET", "/api/community");
  communityId = json?.[0]?.id;
  check("community gallery seeded (40+)", status === 200 && json?.length >= 40, `count=${json?.length}`);
  const before = json[0].likes;
  const like = await api("POST", `/api/community/${communityId}/like`);
  check("like increments", like.json?.likes === before + 1);
}
{
  const { status, json } = await api("POST", "/api/community?profile=akka", {
    ...samplePattern("Akka's Shared Smoke"),
    creator: "Spoofed Name", // must be overridden server-side
  });
  check("share stamps the REAL creator (not client value)",
    status === 201 && json?.creator === "Akka" && json?.creatorId === "akka",
    `creator=${json?.creator}`);
}

// ── Make-alongs ────────────────────────────────────────────────────────────
{
  const created = await api("POST", "/api/makealongs?profile=larissa", { communityId });
  check("make-along created with creator auto-joined",
    created.status === 201 && created.json?.members?.length === 1 && created.json.members[0].profileId === "larissa");
  const maId = created.json.id;
  const joined = await api("POST", `/api/makealongs/${maId}/join?profile=mummy`);
  check("second member joins", joined.json?.members?.length === 2);
  const again = await api("POST", `/api/makealongs/${maId}/join?profile=mummy`);
  check("joining twice is a no-op", again.json?.members?.length === 2);
  const mummyCopy = joined.json.members.find((m) => m.profileId === "mummy");
  const copy = await api("GET", `/api/patterns/${mummyCopy.patternId}`);
  check("joining imported a personal copy", copy.status === 200 && copy.json?.title);
  const list = await api("GET", "/api/makealongs");
  check("make-along board lists members with pct", Array.isArray(list.json) && typeof list.json[0]?.members?.[0]?.pct === "number");
}

// ── Export / import ────────────────────────────────────────────────────────
{
  const { json } = await api("GET", "/api/export?profile=mummy");
  check("export is v2 and profile-scoped", json?.version === 2 && json?.profile === "mummy" && Array.isArray(json?.patterns));
  check("export contains only Mummy's patterns", !json.patterns.some((p) => p.id === vumshPattern.id));
  const imp = await api("POST", "/api/import?profile=akka", { patterns: [samplePattern("Imported Smoke")], stash: [] });
  check("import lands in the active profile", imp.json?.importedPatterns === 1);
  // A corrupt row in a backup is skipped + reported, not crashed-on or stored.
  const imp2 = await api("POST", "/api/import?profile=akka", {
    patterns: [samplePattern("Valid Restore"), { title: "Corrupt", sections: "not-an-array" }],
    stash: [],
  });
  check("import skips invalid patterns and reports counts",
    imp2.json?.importedPatterns === 1 && imp2.json?.skippedPatterns === 1,
    `imported=${imp2.json?.importedPatterns} skipped=${imp2.json?.skippedPatterns}`);
}

// ── AI endpoints degrade gracefully without a key ──────────────────────────
{
  const gen = await api("POST", "/api/generate-pattern", { prompt: "a tiny bee", projectType: "Toy", skillLevel: "Beginner" });
  check("generation falls back to a labelled template", gen.status === 200 && /template/i.test(gen.json?.title ?? ""));
  check("fallback pattern is flagged for the UI (aiUnavailable)", gen.json?.aiUnavailable === true);
  const scan = await api("POST", "/api/stash/scan-label", { imageBase64: "data:image/png;base64,iVBORw0KGgo=" });
  check("label scan fails CLEANLY without key", scan.status === 500 && /key/i.test(scan.json?.message ?? ""));
  const coach = await api("POST", `/api/patterns/${vumshPattern.id}/coach`, { question: "help" });
  check("coach fails CLEANLY without key", coach.status === 500 && /key/i.test(coach.json?.message ?? ""));
  const work = await api("POST", `/api/patterns/${vumshPattern.id}/check-work`, {
    sectionIndex: 0, stepIndex: 0, imageBase64: "data:image/png;base64,iVBORw0KGgo=",
  });
  check("work check fails CLEANLY without key", work.status === 500 && /key/i.test(work.json?.message ?? ""));
  const diag = await api("GET", "/api/diagnostics");
  check("diagnostics reports failures instead of crashing", diag.status === 200 && diag.json?.ok === false && Array.isArray(diag.json?.checks));
}

// ── Same-title patterns coexist (boot dedup must NOT delete user data) ──────
// Regression guard for the ensureSchema dedup: it is now one-time and
// marker-guarded, so a person can keep two makes with the same title.
{
  const a = await api("POST", "/api/patterns?profile=akka", samplePattern("Twin Scarf"));
  const b = await api("POST", "/api/patterns?profile=akka", samplePattern("Twin Scarf"));
  check("two same-title patterns both persist", a.status === 201 && b.status === 201 && a.json?.id !== b.json?.id);
  const list = await api("GET", "/api/patterns?profile=akka");
  const twins = (list.json ?? []).filter((p) => p.title === "Twin Scarf");
  check("same-title patterns are not deduped away", twins.length === 2, `found=${twins.length}`);
  await api("DELETE", `/api/patterns/${a.json?.id}`);
  await api("DELETE", `/api/patterns/${b.json?.id}`);
}

// ── Delete ─────────────────────────────────────────────────────────────────
{
  const del = await api("DELETE", `/api/patterns/${vumshPattern.id}`);
  const gone = await api("GET", `/api/patterns/${vumshPattern.id}`);
  check("delete removes the pattern", del.status === 204 && gone.status === 404);
}

console.log(`\n${passed} passed · ${failed} failed${failed ? `  →  ${failures.join(" | ")}` : ""}\n`);
process.exit(failed ? 1 : 0);
