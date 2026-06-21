import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { palette } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import {
  pushSupported, isIosUninstalled, isSubscribed, enablePush, disablePush,
  getReminderPrefs, saveReminderPrefs, sendTestPush, type ReminderPrefs,
} from "@/lib/push";

const DEFAULTS: ReminderPrefs = { dailyEnabled: false, dailyTime: "18:00", timezone: "UTC", inactiveEnabled: false };

/** Settings card: turn on push reminders for this device and tune what arrives. */
export default function RemindersCard() {
  const { toast } = useToast();
  const supported = pushSupported();
  const [on, setOn] = useState(false); // this device is subscribed
  const [prefs, setPrefs] = useState<ReminderPrefs>(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!supported) { setLoaded(true); return; }
    Promise.all([isSubscribed(), getReminderPrefs().catch(() => DEFAULTS)])
      .then(([sub, p]) => { setOn(sub); setPrefs({ ...DEFAULTS, ...p }); })
      .finally(() => setLoaded(true));
  }, [supported]);

  const turnOn = async () => {
    setBusy(true);
    try {
      const result = await enablePush(prefs);
      if (result === "subscribed") {
        setOn(true);
        toast({ title: "Reminders on for this device ♡" });
      } else if (result === "denied") {
        toast({ title: "Notifications are blocked", description: "Allow notifications for this site in your browser settings, then try again.", duration: 8000 });
      } else if (result === "no-key") {
        toast({ title: "Reminders aren't set up yet", description: "The server needs its push keys configured first.", duration: 8000 });
      } else {
        toast({ title: "This device can't do push notifications", duration: 6000 });
      }
    } catch {
      toast({ title: "Couldn't turn on reminders", description: "Please try again.", duration: 6000 });
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await disablePush();
      setOn(false);
      toast({ title: "Reminders off for this device" });
    } finally {
      setBusy(false);
    }
  };

  const update = async (patch: Partial<ReminderPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try { await saveReminderPrefs(patch); } catch { /* best-effort; UI already reflects intent */ }
  };

  const test = async () => {
    setBusy(true);
    try {
      const sent = await sendTestPush();
      toast({ title: sent > 0 ? "Test reminder sent 🧶" : "No devices to notify yet", description: sent > 0 ? "Check your notifications." : undefined });
    } catch {
      toast({ title: "Couldn't send a test", description: "Make sure reminders are on for this device.", duration: 6000 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="craft-card p-5">
      <div className="flex items-center gap-2 mb-1">
        {on ? <Bell className="h-4 w-4" style={{ color: palette.rose }} /> : <BellOff className="h-4 w-4" style={{ color: palette.clay }} />}
        <p className="font-heading font-semibold text-[15px]" style={{ color: palette.ink }}>Reminders</p>
      </div>
      <p className="text-[12px] mb-3" style={{ color: palette.clay }}>
        Gentle nudges to keep your crochet cosy — a daily make-time and a poke when a project's been waiting.
      </p>

      {!supported && (
        <p className="text-[12px]" style={{ color: palette.clay }}>
          {isIosUninstalled()
            ? "On iPhone/iPad, add Crochet Time to your home screen first — then reminders can be turned on here."
            : "This browser doesn't support notifications."}
        </p>
      )}

      {supported && loaded && (
        <>
          <button
            onClick={on ? turnOff : turnOn}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-bold text-[13px] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{
              background: on ? "rgba(140,100,55,0.10)" : "linear-gradient(135deg, #C24E6B, #A23A55)",
              color: on ? palette.ink : "white",
              boxShadow: on ? "none" : "0 3px 12px rgba(194,78,107,0.35)",
            }}
          >
            {on ? <><BellOff className="h-4 w-4" /> Turn off on this device</> : <><Bell className="h-4 w-4" /> Turn on reminders</>}
          </button>

          {on && (
            <div className="mt-4 flex flex-col gap-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-[13px]" style={{ color: palette.ink }}>Daily crochet-time nudge</span>
                <input
                  type="checkbox"
                  checked={prefs.dailyEnabled}
                  onChange={(e) => update({ dailyEnabled: e.target.checked })}
                  className="h-5 w-5 accent-[#C24E6B]"
                />
              </label>
              {prefs.dailyEnabled && (
                <label className="flex items-center justify-between gap-3 pl-1">
                  <span className="text-[12px]" style={{ color: palette.clay }}>Remind me at</span>
                  <input
                    type="time"
                    value={prefs.dailyTime}
                    onChange={(e) => update({ dailyTime: e.target.value })}
                    className="rounded-xl px-3 py-1.5 text-[13px]"
                    style={{ background: palette.cream, border: "1.5px solid rgba(140,100,55,0.25)", color: palette.ink }}
                  />
                </label>
              )}

              <label className="flex items-center justify-between gap-3">
                <span className="text-[13px]" style={{ color: palette.ink }}>"Your project misses you" nudge</span>
                <input
                  type="checkbox"
                  checked={prefs.inactiveEnabled}
                  onChange={(e) => update({ inactiveEnabled: e.target.checked })}
                  className="h-5 w-5 accent-[#C24E6B]"
                />
              </label>

              <button
                onClick={test}
                disabled={busy}
                className="text-[12px] font-bold self-start mt-1 disabled:opacity-60"
                style={{ color: palette.rose }}
              >
                Send a test reminder
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
