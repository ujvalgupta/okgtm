import { NextRequest, NextResponse } from "next/server";
import { api as emailPredict } from "@/features/email-predict";
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

  const validated = emailPredict.validate(raw);
  if (!validated.ok || !validated.ascii) {
    return NextResponse.json({ error: validated.error ?? "Invalid domain." }, { status: 400 });
  }

  try {
    const info = await emailPredict.checkDomain(validated.ascii);
    return NextResponse.json({ ok: true, domain: validated.ascii, mxPresent: info.mxPresent, mxHosts: info.mxHosts ?? [], mxStatus: info.mxStatus });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
