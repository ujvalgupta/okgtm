/**
 * Shared scaffolding for the public tool API routes (app/api/*). Each tool
 * route used to repeat the same client-IP, JSON-parse, cleanup-interval and
 * 429 plumbing; it lives here once. Route-specific validation and limits stay
 * in the routes.
 */

import { NextResponse, type NextRequest } from "next/server";
import type { RateLimiter } from "./rate-limit";

/** Best-effort client IP from x-forwarded-for (Vercel sets it). */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}

/** Reads and JSON-parses the request body. Returns null when unparseable. */
export async function readJsonBody(req: NextRequest): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function invalidJsonResponse(): NextResponse {
  return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
}

/** Standard 429 for the shared rate limiter, with Retry-After. */
export function rateLimitError(limiter: RateLimiter, ip: string, message: string): NextResponse {
  const retryAfter = limiter.retryAfterSeconds(ip);
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/**
 * Opportunistic per-instance cleanup loop for a module-scoped limiter.
 * `.unref()` keeps it from holding a serverless instance open.
 */
export function scheduleCleanup(limiter: RateLimiter, everyMs = 5 * 60_000): void {
  setInterval(() => limiter.cleanup(), everyMs).unref?.();
}
