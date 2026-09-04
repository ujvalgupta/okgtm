import { NextRequest, NextResponse } from "next/server";
import { normalizeGeoInput } from "@/lib/geo-audit/normalize";
import { runLlmsTxtAudit } from "@/lib/llms-txt/validator";
import { RateLimiter } from "@/lib/shared/rate-limit";
import { clientIp, invalidJsonResponse, rateLimitError, readJsonBody, scheduleCleanup } from "@/lib/shared/api-route";
import { GENERIC_ERROR } from "@/lib/ui-copy";

/**
 * POST /api/llms-txt — validate a site's llms.txt.
 * { url: string } → { result } | { error }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const limiter = new RateLimiter(10, 10 * 60_000);
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
    return rateLimitError(limiter, ip, `Too many checks. Try again in ${Math.ceil(retryAfter / 60)} minutes.`);
  }

  const normalized = normalizeGeoInput(raw);
  if (!normalized.ok || !normalized.url) {
    return NextResponse.json({ error: normalized.error ?? "Invalid URL." }, { status: 400 });
  }

  try {
    const result = await runLlmsTxtAudit(normalized.url);
    return NextResponse.json({ result, url: normalized.url }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
