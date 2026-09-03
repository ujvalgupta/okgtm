import { NextRequest, NextResponse } from "next/server";
import { normalizeGeoInput } from "@/lib/geo-audit/normalize";
import { runGeoAudit } from "@/lib/geo-audit/orchestrator";
import { GeoResultCache } from "@/lib/geo-audit/cache";
import { RateLimiter } from "@/lib/email-audit/rateLimit";
import { GENERIC_ERROR } from "@/lib/ui-copy";

/**
 * POST /api/geo-audit — public, no auth.
 * { url: string } → { report } | { error }
 *
 * Deterministic (no AI). Fetches the target site server-side with SSRF
 * guards. Heavier than the email auditor (multiple sub-fetches), so the rate
 * limit is lower: 6 audits / IP / 10 minutes.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const AUDITS_PER_WINDOW = 6;
const WINDOW_MS = 10 * 60_000;

const cache = new GeoResultCache();
const limiter = new RateLimiter(AUDITS_PER_WINDOW, WINDOW_MS);
setInterval(() => limiter.cleanup(), 5 * 60_000).unref?.();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (body as { url?: unknown })?.url;
  if (typeof raw !== "string" || !raw.trim()) {
    return NextResponse.json({ error: "Send a website URL." }, { status: 400 });
  }

  const ip = clientIp(req);
  if (!limiter.allow(ip)) {
    const retryAfter = limiter.retryAfterSeconds(ip);
    return NextResponse.json(
      { error: `Too many audits. Try again in ${Math.ceil(retryAfter / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const normalized = normalizeGeoInput(raw);
  if (!normalized.ok || !normalized.url) {
    return NextResponse.json({ error: normalized.error ?? "Invalid URL." }, { status: 400 });
  }

  const cacheKey = normalized.url;
  const hit = cache.get(cacheKey);
  if (hit) {
    return NextResponse.json({ report: hit }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const report = await runGeoAudit(normalized.url, { budgetMs: 40_000 });
    cache.set(cacheKey, report);
    return NextResponse.json({ report }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
