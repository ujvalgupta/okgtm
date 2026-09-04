import { NextRequest, NextResponse } from "next/server";
import { validateDomain } from "@/lib/email-audit/normalize";
import { NodeDNSResolver } from "@/lib/email-audit/dns";
import { RateLimiter } from "@/lib/shared/rate-limit";
import { clientIp, invalidJsonResponse, rateLimitError, readJsonBody, scheduleCleanup } from "@/lib/shared/api-route";
import { GENERIC_ERROR } from "@/lib/ui-copy";

/**
 * POST /api/email-predict/domain — lightweight helper for the Email
 * Predictor: given a company domain, say whether the domain can receive mail
 * (MX records exist) and list the mail hosts. No person data ever leaves the
 * browser; only the domain is checked here.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = new RateLimiter(30, 10 * 60_000);
scheduleCleanup(limiter);

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);
  if (body === null) return invalidJsonResponse();

  const raw = (body as { domain?: unknown })?.domain;
  if (typeof raw !== "string" || !raw.trim()) {
    return NextResponse.json({ error: "Send a domain." }, { status: 400 });
  }

  const ip = clientIp(req);
  if (!limiter.allow(ip)) {
    return rateLimitError(limiter, ip, "Too many requests. Try again in a minute.");
  }

  const validated = validateDomain(raw);
  if (!validated.ok || !validated.ascii) {
    return NextResponse.json({ error: validated.error ?? "Invalid domain." }, { status: 400 });
  }

  try {
    const resolver = new NodeDNSResolver();
    const mx = await resolver.resolveMX(validated.ascii);
    if (mx.status === "RECORD_FOUND") {
      const hosts = mx.values.map((v) => v.replace(/^\d+\s+/, "")).slice(0, 6);
      return NextResponse.json({ ok: true, domain: validated.ascii, mxPresent: true, mxHosts: hosts });
    }
    const unknown = mx.status === "TIMEOUT" || mx.status === "SERVFAIL" || mx.status === "NETWORK_ERROR";
    return NextResponse.json({
      ok: true,
      domain: validated.ascii,
      mxPresent: false,
      mxStatus: unknown ? mx.status : "no MX records",
      mxHosts: [],
    });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
