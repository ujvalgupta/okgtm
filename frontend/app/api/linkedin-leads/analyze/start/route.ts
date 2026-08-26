import { LINKEDIN_LEADS_CONFIG } from "@/config/linkedin-leads";
import { verifyOtp } from "@/lib/linkedin-leads/otp";
import { normalizeLinkedInUrl } from "@/lib/linkedin-leads/profile-url";
import { startPostsJob } from "@/lib/linkedin-leads/mindcase";

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

  if (LINKEDIN_LEADS_CONFIG.requireEmailVerification) {
    if (typeof email !== "string" || typeof code !== "string" || typeof token !== "string") {
      return Response.json({ ok: false, error: "email, code, and token are required" }, { status: 400 });
    }
    if (!verifyOtp({ email, profileUrl: normalizedUrl, code, token })) {
      return Response.json({ ok: false, error: "invalid or expired verification code" }, { status: 401 });
    }
  }

  try {
    const jobId = await startPostsJob(normalizedUrl, LINKEDIN_LEADS_CONFIG.maxPosts);
    return Response.json({ ok: true, phase: "posts", jobId, profileUrl: normalizedUrl });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
