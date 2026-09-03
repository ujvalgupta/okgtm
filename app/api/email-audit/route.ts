import { NextRequest, NextResponse } from "next/server";
import { validateDomain } from "@/lib/email-audit/normalize";
import { runAudit } from "@/lib/email-audit/orchestrator";
import { DNSCache } from "@/lib/email-audit/cache";
import { RateLimiter } from "@/lib/email-audit/rateLimit";
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
const cache = new DNSCache();
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

  const rawDomain = (body as { domain?: unknown })?.domain;
  if (typeof rawDomain !== "string" || !rawDomain.trim()) {
    return NextResponse.json({ error: "Send a domain." }, { status: 400 });
  }

  const ip = clientIp(req);
  if (!limiter.allow(ip)) {
    const retryAfter = limiter.retryAfterSeconds(ip);
    return NextResponse.json(
      { error: `Too many audits. Try again in ${Math.ceil(retryAfter / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const validated = validateDomain(rawDomain);
  if (!validated.ok || !validated.ascii) {
    return NextResponse.json({ error: validated.error ?? "Invalid domain." }, { status: 400 });
  }

  try {
    const result = await runAudit({ domain: validated.ascii }, { cache });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
