import { NextRequest, NextResponse } from "next/server";
import { api as emailAudit } from "@/features/email-audit";
import { RateLimiter } from "@/lib/shared/rate-limit";
import { clientIp, invalidJsonResponse, rateLimitError, readJsonBody, scheduleCleanup } from "@/lib/shared/api-route";
import { GENERIC_ERROR } from "@/lib/ui-copy";

/**
 * POST /api/email-audit — public endpoint, no auth (per spec).
 * { domain: string } → AuditResult | { error }
 *
 * - Node runtime (node:dns). No paid APIs, no AI, no external services
 *   except free public DoH for DS/DNSKEY only.
 * - 20 audits / IP / 10 min (429 with Retry-After).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUDITS_PER_WINDOW = 20;
const WINDOW_MS = 10 * 60_000;

// Module-scoped singletons (per serverless instance on Vercel; shared on VPS).
const cache = new emailAudit.Cache();
const limiter = new RateLimiter(AUDITS_PER_WINDOW, WINDOW_MS);
scheduleCleanup(limiter);

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);
  if (body === null) return invalidJsonResponse();

  const rawDomain = (body as { domain?: unknown })?.domain;
  if (typeof rawDomain !== "string" || !rawDomain.trim()) {
    return NextResponse.json({ error: "Send a domain." }, { status: 400 });
  }

  const ip = clientIp(req);
  if (!limiter.allow(ip)) {
    const retryAfter = limiter.retryAfterSeconds(ip);
    return rateLimitError(limiter, ip, `Too many audits. Try again in ${Math.ceil(retryAfter / 60)} minutes.`);
  }

  const validated = emailAudit.validate(rawDomain);
  if (!validated.ok || !validated.ascii) {
    return NextResponse.json({ error: validated.error ?? "Invalid domain." }, { status: 400 });
  }

  try {
    const result = await emailAudit.run({ domain: validated.ascii }, { cache });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
