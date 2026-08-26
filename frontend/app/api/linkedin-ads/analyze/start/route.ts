import { LINKEDIN_ADS_CONFIG } from "@/config/linkedin-ads";
import { verifyOtp } from "@/lib/linkedin-ads/otp";
import { buildAdvertiserSearchUrl } from "@/lib/linkedin-ads/ad-library-url";
import { startAdsJob } from "@/lib/linkedin-ads/mindcase";

interface StartPayload {
  email?: unknown;
  companyName?: unknown;
  code?: unknown;
  token?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let payload: StartPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const { email, companyName, code, token } = payload;
  if (typeof companyName !== "string" || !companyName.trim()) {
    return Response.json({ ok: false, error: "companyName is required" }, { status: 400 });
  }

  if (LINKEDIN_ADS_CONFIG.requireEmailVerification) {
    if (typeof email !== "string" || typeof code !== "string" || typeof token !== "string") {
      return Response.json({ ok: false, error: "email, code, and token are required" }, { status: 400 });
    }
    if (!verifyOtp({ email, companyName, code, token })) {
      return Response.json({ ok: false, error: "invalid or expired verification code" }, { status: 401 });
    }
  }

  try {
    const searchUrl = buildAdvertiserSearchUrl(companyName);
    const jobId = await startAdsJob(searchUrl, LINKEDIN_ADS_CONFIG.maxResults);
    return Response.json({ ok: true, jobId, companyName });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
