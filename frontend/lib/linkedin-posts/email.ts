import { Resend } from "resend";
import { LINKEDIN_POSTS_CONFIG } from "@/config/linkedin-posts";

const FROM_ADDRESS = process.env.LEAD_FROM_ADDRESS ?? "OkGTM Labs <tools@okgtm.com>";

export async function sendOtpCode(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Your verification code: ${code}`,
    html:
      `<p>Your verification code is <strong>${code}</strong>.</p>` +
      `<p>It expires in ${LINKEDIN_POSTS_CONFIG.otpExpiryMinutes} minutes.</p>`,
  });
}
