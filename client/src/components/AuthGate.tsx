import { useEffect, useState, useCallback, FormEvent } from "react";
import { palette } from "@/lib/theme";

/**
 * Household gate. Wraps the whole app: on boot it asks the server whether a
 * passcode is required and whether this device is already trusted. Trusted
 * devices (and every environment where the gate is off) fall straight through
 * to the app; otherwise a cozy lock screen is shown until the passcode is
 * entered. A 401 from any later request (expired session) re-locks via the
 * "hh-auth-locked" window event dispatched from queryClient.
 */
type Phase = "checking" | "open" | "locked";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("checking");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status", { credentials: "same-origin" });
      const data = await res.json();
      setPhase(!data.required || data.authenticated ? "open" : "locked");
    } catch {
      // Can't reach the server — don't trap the user behind a lock we can't
      // verify; let the app render and surface its own offline/error states.
      setPhase("open");
    }
  }, []);

  useEffect(() => {
    refresh();
    const onLocked = () => setPhase((p) => (p === "open" ? "locked" : p));
    window.addEventListener("hh-auth-locked", onLocked);
    return () => window.removeEventListener("hh-auth-locked", onLocked);
  }, [refresh]);

  if (phase === "open") return <>{children}</>;
  if (phase === "checking") return <GateSplash />;
  return <LockScreen onUnlocked={() => setPhase("open")} />;
}

function GateSplash() {
  return (
    <div className="flex h-screen w-full items-center justify-center" style={{ background: palette.cream }}>
      <div className="h-10 w-10 animate-spin rounded-full border-b-2" style={{ borderColor: palette.rose }} />
    </div>
  );
}

function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passcode.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        onUnlocked();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.message || "That passcode didn't match.");
      setPasscode("");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center px-6" style={{ background: palette.cream }}>
      <form onSubmit={submit} className="craft-card craft-card-rose w-full max-w-sm p-7 flex flex-col items-center text-center gap-4">
        <div
          className="flex items-center justify-center rounded-2xl overflow-hidden"
          style={{ width: 84, height: 84, background: "rgba(194,78,107,0.10)" }}
        >
          <img
            src="/characters/char-aloo-transparent.png"
            alt="Aloo"
            style={{ width: 70, height: 70, objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(80,40,10,0.15))" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div>
          <h1 className="font-heading font-bold text-[22px]" style={{ color: palette.ink }}>
            Crochet Time
          </h1>
          <p className="text-[12.5px] mt-1" style={{ color: palette.clay }}>
            Enter the family passcode to come in ♡
          </p>
        </div>

        <input
          type="password"
          inputMode="text"
          autoFocus
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => { setPasscode(e.target.value); setError(null); }}
          placeholder="Passcode"
          aria-label="Family passcode"
          className="w-full rounded-xl px-4 py-3 text-[15px] text-center outline-none transition-all"
          style={{
            background: palette.cream,
            border: `1.5px solid ${error ? palette.rose : "rgba(140,100,55,0.25)"}`,
            color: palette.ink,
          }}
        />

        {error && (
          <p className="text-[12px] -mt-1" style={{ color: palette.rose }} role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !passcode.trim()}
          className="btn-craft btn-rose w-full py-3 text-[15px] disabled:opacity-60"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
