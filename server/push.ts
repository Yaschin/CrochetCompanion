/**
 * Web-push plumbing: VAPID config, subscription storage, and a send helper that
 * prunes subscriptions the push service has retired.
 *
 * Opt-in, like the household gate: with the VAPID env vars unset the whole
 * feature is dormant (`pushConfigured()` is false), so dev, CI and smoke need no
 * keys. Generate a key pair once with `npx web-push generate-vapid-keys` and set
 * VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY (+ optional VAPID_SUBJECT) to switch on.
 */
import webpush from "web-push";
import { sql } from "drizzle-orm";
import { db } from "./db";

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface ReminderPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const publicKey = (process.env.VAPID_PUBLIC_KEY ?? "").trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY ?? "").trim();
  if (!publicKey || !privateKey) return false;
  const subject = (process.env.VAPID_SUBJECT ?? "").trim() || "mailto:crochet@example.com";
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/** Whether reminders can actually be sent (VAPID keys present). */
export function pushConfigured(): boolean {
  return configure();
}

export function vapidPublicKey(): string {
  return (process.env.VAPID_PUBLIC_KEY ?? "").trim();
}

interface SubRow {
  endpoint: string;
  profileId: string;
  p256dh: string;
  auth: string;
}

export async function saveSubscription(profileId: string, sub: PushSubscriptionJSON): Promise<void> {
  await db.execute(
    sql`INSERT INTO push_subscriptions (endpoint, "profileId", p256dh, auth)
        VALUES (${sub.endpoint}, ${profileId}, ${sub.keys.p256dh}, ${sub.keys.auth})
        ON CONFLICT (endpoint) DO UPDATE SET
          "profileId" = EXCLUDED."profileId",
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth`
  );
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await db.execute(sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`);
}

export async function listSubscriptions(profileId: string): Promise<SubRow[]> {
  const res = await db.execute(
    sql`SELECT endpoint, "profileId", p256dh, auth FROM push_subscriptions WHERE "profileId" = ${profileId}`
  );
  return (res.rows ?? []) as unknown as SubRow[];
}

/**
 * Send a payload to every given subscription. Subscriptions the push service
 * reports as gone (404/410) are deleted so they don't pile up. Returns how many
 * were delivered without error.
 */
export async function sendToSubscriptions(subs: SubRow[], payload: ReminderPayload): Promise<number> {
  if (!configure()) return 0;
  const body = JSON.stringify(payload);
  let delivered = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        delivered++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await deleteSubscription(s.endpoint).catch(() => {});
        } else {
          console.error("[push] send failed:", status ?? err);
        }
      }
    }),
  );
  return delivered;
}
