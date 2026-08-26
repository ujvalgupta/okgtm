import { LINKEDIN_LEADS_CONFIG } from "@/config/linkedin-leads";
import { generateOtp } from "@/lib/linkedin-leads/otp";
import { sendOtpCode } from "@/lib/linkedin-leads/email";

interface RequestPayload {
  email?: unknown;
  profileUrl?: unknown;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request): Promise<Response> {
  if (!LINKEDIN_LEADS_CONFIG.requireEmailVerification) {
    return Response.json({ ok: false, error: "email verification is currently disabled" }, { status: 403 });
  }

  let payload: RequestPayload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const { email, profileUrl } = payload;
  if (typeof email !== "string" || !isValidEmail(email)) {
    return Response.json({ ok: false, error: "valid email is required" }, { status: 400 });
  }
  if (typeof profileUrl !== "string" || !profileUrl.trim()) {
    return Response.json({ ok: false, error: "profileUrl is required" }, { status: 400 });
  }

  try {
    const { code, token, expiresAt } = generateOtp({ email, profileUrl });
    await sendOtpCode(email, code);
    return Response.json({ ok: true, token, expiresAt });
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
