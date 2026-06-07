import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Slim banner shown only when the device goes offline, reassuring that saved
 * patterns and the counter still work (served by the service worker).
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-1.5 text-[11.5px] font-bold"
      style={{ background: "#3D2318", color: "#F2E4CE" }}
    >
      <WifiOff className="h-3.5 w-3.5" />
      Offline — your saved patterns &amp; counter still work ♡
    </div>
  );
}
