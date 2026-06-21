/**
 * Client-side web-push: feature detection, permission + subscription, and the
 * reminder-preferences API. The subscription is stamped to the active profile
 * server-side (every /api/ call carries ?profile=), so each person's devices and
 * reminder settings stay separate.
 */
import { apiRequest } from "./queryClient";

export interface ReminderPrefs {
  dailyEnabled: boolean;
  dailyTime: string; // "HH:MM"
  timezone: string;
  inactiveEnabled: boolean;
}

export type EnableResult = "subscribed" | "denied" | "unsupported" | "no-key";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** iOS only allows web push from an installed (home-screen) PWA. */
export function isIosUninstalled(): boolean {
  if (typeof navigator === "undefined") return false;
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  return existing ?? (await navigator.serviceWorker.register("/sw.js"));
}

export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return !!(await reg?.pushManager.getSubscription());
}

export async function getReminderPrefs(): Promise<ReminderPrefs> {
  const res = await apiRequest("GET", "/api/push/prefs");
  return res.json();
}

export async function saveReminderPrefs(prefs: Partial<ReminderPrefs>): Promise<ReminderPrefs> {
  const res = await apiRequest("POST", "/api/push/prefs", prefs);
  return res.json();
}

/** Request permission, subscribe this device, and register it with the server. */
export async function enablePush(prefs?: Partial<ReminderPrefs>): Promise<EnableResult> {
  if (!pushSupported()) return "unsupported";

  const { configured, publicKey } = await (await apiRequest("GET", "/api/push/vapid-key")).json();
  if (!configured || !publicKey) return "no-key";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const reg = await registration();
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  await apiRequest("POST", "/api/push/subscribe", {
    subscription: sub.toJSON(),
    prefs: { timezone, ...prefs },
  });
  return "subscribed";
}

/** Unsubscribe this device and forget it on the server. */
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await apiRequest("POST", "/api/push/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export async function sendTestPush(): Promise<number> {
  const data = await (await apiRequest("POST", "/api/push/test")).json();
  return data.sent ?? 0;
}
