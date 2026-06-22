import type { Express, Request, Response } from "express";
import {
  authRequired, isAuthenticated, checkPasscode, setSessionCookie,
  clearSessionCookie, loginThrottled, noteFailedLogin, clearLoginAttempts,
} from "../auth";

/** Household passcode gate: status, login, logout. Exempt from requireAuth. */
export function registerAuthRoutes(app: Express): void {
  // Public status: tells the client whether to show the lock screen.
  app.get("/api/auth/status", (req: Request, res: Response) => {
    const required = authRequired();
    res.json({ required, authenticated: !required || isAuthenticated(req) });
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    if (!authRequired()) return res.json({ authenticated: true });
    const ip = req.ip ?? "unknown";
    if (loginThrottled(ip)) {
      return res.status(429).json({ message: "Too many tries. Wait a few minutes and try again.", code: "throttled" });
    }
    if (!checkPasscode(req.body?.passcode)) {
      noteFailedLogin(ip);
      return res.status(401).json({ message: "That passcode didn't match.", code: "bad_passcode" });
    }
    clearLoginAttempts(ip);
    setSessionCookie(req, res);
    res.json({ authenticated: true });
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    clearSessionCookie(res);
    res.json({ authenticated: false });
  });
}
