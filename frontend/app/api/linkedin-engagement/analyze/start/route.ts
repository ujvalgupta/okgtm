import { LINKEDIN_ENGAGEMENT_CONFIG } from "@/config/linkedin-engagement";
import { verifyOtp } from "@/lib/linkedin-engagement/otp";
import { normalizeLinkedInUrl } from "@/lib/linkedin-engagement/profile-url";
import { startProfileCommentsJob } from "@/lib/linkedin-engagement/mindcase";

interface StartPayload {
  email?: unknown;
  profileUrl?: unknown;
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

  const { email, profileUrl, code, token } = payload;
  if (typeof profileUrl !== "string" || !profileUrl.trim()) {
    return Response.json({ ok: false, error: "profileUrl is required" }, { status: 400 });
  }

  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeLinkedInUrl(profileUrl);
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }

  if (LINKEDIN_ENGAGEMENT_CONFIG.requireEmailVerification) {
    if (typeof email !== "string" || typeof code !== "string" || typeof token !== "string") {
      return Response.json({ ok: false, error: "email, code, and token are required" }, { status: 400 });
    }
    if (!verifyOtp({ email, profileUrl: normalizedUrl, code, token })) {
      return Response.json({ ok: false, error: "invalid or expired verification code" }, { status: 401 });
    }
  }

  try {
    const jobId = await startProfileCommentsJob(normalizedUrl, LINKEDIN_ENGAGEMENT_CONFIG.maxResults);
    return Response.json({ ok: true, jobId, profileUrl: normalizedUrl });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
