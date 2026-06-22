import type { Express, Request, Response } from "express";
import { z } from "zod";
import { profileOf } from "../httpHelpers";
import {
  pushConfigured, vapidPublicKey, saveSubscription, deleteSubscription,
  listSubscriptions, sendToSubscriptions,
} from "../push";
import { getPrefs, savePrefs, runDueReminders } from "../reminders";

/** Web-push reminder routes (subscriptions, prefs, test, and the cron run-due). */
export function registerPushRoutes(app: Express): void {
  const prefsInput = z.object({
    dailyEnabled: z.boolean().optional(),
    dailyTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    timezone: z.string().min(1).max(64).optional(),
    inactiveEnabled: z.boolean().optional(),
  });

  app.get("/api/push/vapid-key", (_req: Request, res: Response) => {
    res.json({ configured: pushConfigured(), publicKey: vapidPublicKey() });
  });

  app.get("/api/push/prefs", async (req: Request, res: Response) => {
    res.json(await getPrefs(profileOf(req)));
  });

  app.post("/api/push/prefs", async (req: Request, res: Response) => {
    const parsed = prefsInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid reminder settings" });
    const profileId = profileOf(req);
    const next = { ...(await getPrefs(profileId)), ...parsed.data };
    await savePrefs(profileId, next);
    res.json(next);
  });

  app.post("/api/push/subscribe", async (req: Request, res: Response) => {
    const sub = req.body?.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res.status(400).json({ message: "Invalid push subscription" });
    }
    const profileId = profileOf(req);
    await saveSubscription(profileId, sub);
    if (req.body?.prefs) {
      const parsed = prefsInput.safeParse(req.body.prefs);
      if (parsed.success) await savePrefs(profileId, { ...(await getPrefs(profileId)), ...parsed.data });
    }
    res.json({ ok: true });
  });

  app.post("/api/push/unsubscribe", async (req: Request, res: Response) => {
    const endpoint = req.body?.endpoint;
    if (typeof endpoint === "string" && endpoint) await deleteSubscription(endpoint);
    res.json({ ok: true });
  });

  // Send a test push to the current profile's devices (so people can confirm it works).
  app.post("/api/push/test", async (req: Request, res: Response) => {
    if (!pushConfigured()) return res.status(503).json({ message: "Reminders aren't set up on the server yet." });
    const subs = await listSubscriptions(profileOf(req));
    if (!subs.length) return res.status(404).json({ message: "No notification devices registered yet." });
    const sent = await sendToSubscriptions(subs, {
      title: "Crochet Time ♡",
      body: "Test reminder — notifications are working!",
      url: "/home",
      tag: "test",
    });
    res.json({ sent });
  });

  // Called by an external scheduler (autoscale has no always-on process).
  // Protect with CRON_SECRET when set; exempt from the household gate.
  app.post("/api/push/run-due", async (req: Request, res: Response) => {
    const secret = (process.env.CRON_SECRET ?? "").trim();
    if (secret) {
      const given = req.get("x-cron-secret") ?? (typeof req.query.secret === "string" ? req.query.secret : "");
      if (given !== secret) return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await runDueReminders();
    res.json(result);
  });
}
