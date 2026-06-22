import type { Request } from "express";
import { isProfileId, DEFAULT_PROFILE_ID } from "../shared/profiles";

// Resolve the active family profile from ?profile=<id>. Defaults to Larissa so
// pre-profile clients (and service-worker-cached requests) keep working.
export function profileOf(req: Request): string {
  const p = String(req.query.profile ?? "").trim();
  return isProfileId(p) ? p : DEFAULT_PROFILE_ID;
}

// Cap free-text that gets interpolated into AI prompts — keeps a stray paste
// (or anything malicious) from ballooning token spend or hijacking the prompt.
export function capText(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
