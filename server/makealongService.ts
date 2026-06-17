import { sql } from "drizzle-orm";
import { db } from "./db";
import { patternService } from "./patternService";
import { communityService } from "./communityService";
import { profileById } from "../shared/profiles";
import { isMaterialsSection } from "@shared/sections";
import type { Pattern } from "@shared/schema";

export interface MakeAlongMember {
  profileId: string;
  name: string;
  color: string;
  patternId: string;
  pct: number;
  finished: boolean;
}

export interface MakeAlong {
  id: string;
  title: string;
  communityId: string;
  createdAt: string;
  members: MakeAlongMember[];
}

function progressOf(pattern: Pattern): { pct: number; finished: boolean } {
  const steps = (pattern.sections ?? [])
    .filter((s) => !isMaterialsSection(s.name))
    .flatMap((s) => s.steps);
  const done = steps.filter((s) => s.completed).length;
  const pct = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;
  return { pct, finished: pattern.status === "finished" };
}

async function importCopyFor(profileId: string, communityId: string): Promise<Pattern> {
  const source = await communityService.getById(communityId);
  if (!source) throw new Error("Community pattern not found");
  return patternService.createPattern(
    {
      title: source.title,
      description: source.description || "",
      projectType: source.projectType,
      skillLevel: source.skillLevel,
      yarnType: source.yarnType,
      size: source.size,
      endProductImage: source.endProductImage,
      materialsNotes: "",
      sections: source.sections as Pattern["sections"],
      yarnRequirements: source.yarnRequirements ?? [],
      hookRequirements: source.hookRequirements ?? [],
      notionsRequirements: source.notionsRequirements ?? [],
      toolRequirements: source.toolRequirements ?? [],
      needsStuffing: source.needsStuffing,
      favorite: false,
      status: "pattern",
      startedAt: null,
      finishedAt: null,
    },
    profileId
  );
}

export const makealongService = {
  // One active make-along per community pattern keeps the model simple.
  async create(communityId: string, profileId: string): Promise<MakeAlong> {
    const source = await communityService.getById(communityId);
    if (!source) throw new Error("Community pattern not found");

    // Atomic upsert: the unique index on "communityId" (ensureSchema) makes
    // concurrent creates collapse to one row instead of racing. Then resolve
    // the canonical id (ours if we inserted, the pre-existing one otherwise).
    const newId = crypto.randomUUID();
    await db.execute(
      sql`INSERT INTO makealongs (id, title, "communityId", "createdAt")
          VALUES (${newId}, ${source.title}, ${communityId}, ${new Date().toISOString()})
          ON CONFLICT ("communityId") DO NOTHING`
    );
    const row = await db.execute(
      sql`SELECT id FROM makealongs WHERE "communityId" = ${communityId}`
    );
    const id = (row.rows?.[0] as { id?: string } | undefined)?.id ?? newId;
    await this.join(id, profileId);
    return (await this.getById(id))!;
  },

  async join(makealongId: string, profileId: string): Promise<void> {
    const already = await db.execute(
      sql`SELECT "patternId" FROM makealong_members
          WHERE "makealongId" = ${makealongId} AND "profileId" = ${profileId}`
    );
    if (already.rows?.length) return; // joining twice is a no-op

    const row = await db.execute(sql`SELECT "communityId" FROM makealongs WHERE id = ${makealongId}`);
    const communityId = (row.rows?.[0] as { communityId?: string } | undefined)?.communityId;
    if (!communityId) throw new Error("Make-along not found");

    const copy = await importCopyFor(profileId, communityId);
    await db.execute(
      sql`INSERT INTO makealong_members ("makealongId", "profileId", "patternId")
          VALUES (${makealongId}, ${profileId}, ${copy.id})`
    );
  },

  async getById(id: string): Promise<MakeAlong | null> {
    const list = await this.getAll();
    return list.find((m) => m.id === id) ?? null;
  },

  async getAll(): Promise<MakeAlong[]> {
    const rows = await db.execute(
      sql`SELECT m.id, m.title, m."communityId", m."createdAt",
                 mm."profileId", mm."patternId"
          FROM makealongs m
          LEFT JOIN makealong_members mm ON mm."makealongId" = m.id
          ORDER BY m."createdAt" DESC`
    );

    const raw = (rows.rows ?? []) as Array<Record<string, unknown>>;

    // Fetch every member's pattern in ONE query (no per-member N+1).
    const patternIds = [...new Set(raw.filter((r) => r.patternId).map((r) => String(r.patternId)))];
    const patternMap = new Map(
      (await patternService.getPatternsByIds(patternIds)).map((p) => [p.id, p])
    );

    const byId = new Map<string, MakeAlong>();
    for (const r of raw) {
      const id = String(r.id);
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          title: String(r.title),
          communityId: String(r.communityId),
          createdAt: String(r.createdAt),
          members: [],
        });
      }
      if (r.profileId && r.patternId) {
        const pattern = patternMap.get(String(r.patternId));
        const profile = profileById(String(r.profileId));
        const prog = pattern ? progressOf(pattern) : { pct: 0, finished: false };
        byId.get(id)!.members.push({
          profileId: profile.id,
          name: profile.name,
          color: profile.color,
          patternId: String(r.patternId),
          pct: prog.pct,
          finished: prog.finished,
        });
      }
    }
    return [...byId.values()];
  },
};
