import { createRoot } from "react-dom/client";
import App from "./App";
import AuthGate from "./components/AuthGate";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthGate>
    <App />
  </AuthGate>,
);

// Register the offline service worker (production only — avoids clashing with
// Vite's dev HMR). Safe no-op where service workers aren't supported.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
