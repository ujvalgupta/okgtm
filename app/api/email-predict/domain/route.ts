import { NextRequest, NextResponse } from "next/server";
import { validateDomain } from "@/lib/email-audit/normalize";
import { NodeDNSResolver } from "@/lib/email-audit/dns";
import { RateLimiter } from "@/lib/email-audit/rateLimit";
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
  const raw = (body as { domain?: unknown })?.domain;
  if (typeof raw !== "string" || !raw.trim()) {
    return NextResponse.json({ error: "Send a domain." }, { status: 400 });
  }

  const ip = clientIp(req);
  if (!limiter.allow(ip)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
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
