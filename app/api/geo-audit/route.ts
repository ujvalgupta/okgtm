import { NextRequest, NextResponse } from "next/server";
import { api as geoAudit } from "@/features/geo-audit";
import { RateLimiter } from "@/lib/shared/rate-limit";
import { clientIp, invalidJsonResponse, rateLimitError, readJsonBody, scheduleCleanup } from "@/lib/shared/api-route";
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

const cache = new geoAudit.Cache();
const limiter = new RateLimiter(AUDITS_PER_WINDOW, WINDOW_MS);
scheduleCleanup(limiter);

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);
  if (body === null) return invalidJsonResponse();

  const raw = (body as { url?: unknown })?.url;
  if (typeof raw !== "string" || !raw.trim()) {
    return NextResponse.json({ error: "Send a website URL." }, { status: 400 });
  }

  const ip = clientIp(req);
  if (!limiter.allow(ip)) {
    const retryAfter = limiter.retryAfterSeconds(ip);
    return rateLimitError(limiter, ip, `Too many audits. Try again in ${Math.ceil(retryAfter / 60)} minutes.`);
  }

  const normalized = geoAudit.validate(raw);
  if (!normalized.ok || !normalized.url) {
    return NextResponse.json({ error: normalized.error ?? "Invalid URL." }, { status: 400 });
  }

  const cacheKey = normalized.url;
  const hit = cache.get(cacheKey);
  if (hit) {
    return NextResponse.json({ report: hit }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const report = await geoAudit.run(normalized.url, { budgetMs: 40_000 });
    cache.set(cacheKey, report);
    return NextResponse.json({ report }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
