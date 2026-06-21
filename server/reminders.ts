/**
 * Reminder orchestration: read each profile's prefs/subscriptions/patterns and
 * send whatever is due. The pure "is it due?" logic lives in `reminderLogic.ts`
 * (and is unit-tested). Because the app deploys to Replit autoscale (no
 * always-on process), `runDueReminders` is meant to be driven by an external
 * scheduler hitting `POST /api/push/run-due`.
 */
import { PROFILES } from "../shared/profiles";
import { getMeta, setMeta } from "./ensureSchema";
import { patternService } from "./patternService";
import { listSubscriptions, sendToSubscriptions, pushConfigured } from "./push";
import {
  DEFAULT_PREFS, type ReminderPrefs, type ActivityPattern,
  localNow, dailyDue, inactiveDue, pickInactiveProject, lastActivity, daysSince,
} from "./reminderLogic";

export { DEFAULT_PREFS, type ReminderPrefs };

const prefsKey = (profileId: string) => `reminder_prefs:${profileId}`;

export async function getPrefs(profileId: string): Promise<ReminderPrefs> {
  const raw = await getMeta(prefsKey(profileId));
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<ReminderPrefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function savePrefs(profileId: string, prefs: ReminderPrefs): Promise<void> {
  await setMeta(prefsKey(profileId), JSON.stringify(prefs));
}

export interface RunResult { sent: number; profiles: number }

/** Send every reminder that's due right now across all profiles. */
export async function runDueReminders(now = new Date()): Promise<RunResult> {
  if (!pushConfigured()) return { sent: 0, profiles: 0 };
  let sent = 0;
  let profiles = 0;

  for (const profile of PROFILES) {
    const prefs = await getPrefs(profile.id);
    if (!prefs.dailyEnabled && !prefs.inactiveEnabled) continue;
    const subs = await listSubscriptions(profile.id);
    if (!subs.length) continue;

    let changed = false;
    const { date } = localNow(now, prefs.timezone);

    if (dailyDue(prefs, now)) {
      sent += await sendToSubscriptions(subs, {
        title: "Crochet time ♡",
        body: `Hi ${profile.name} — a few cozy rows today?`,
        url: "/home",
        tag: "daily-nudge",
      });
      prefs.lastDailySentOn = date;
      changed = true;
    }

    if (prefs.inactiveEnabled && inactiveDue(prefs, now)) {
      const patterns = (await patternService.getAllPatterns(profile.id)) as unknown as ActivityPattern[];
      const candidate = pickInactiveProject(patterns, now);
      if (candidate) {
        sent += await sendToSubscriptions(subs, {
          title: "A project misses you 🧶",
          body: `“${candidate.title}” has been waiting ${daysSince(lastActivity(candidate), now)} days — pick it back up?`,
          url: `/patterns/${candidate.id}`,
          tag: "inactive-nudge",
        });
        prefs.lastInactiveSentOn = date;
        changed = true;
      }
    }

    if (changed) {
      await savePrefs(profile.id, prefs);
      profiles++;
    }
  }

  return { sent, profiles };
}
