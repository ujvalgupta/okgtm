import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { LINKEDIN_POSTS_CONFIG } from "@/config/linkedin-posts";

const SEPARATOR = "|";

export interface OtpRequestContext {
  email: string;
  profileUrl: string;
}

function getSecret(): string {
  const secret = process.env.OTP_SIGNING_SECRET;
  if (!secret) {
    throw new Error("OTP_SIGNING_SECRET is not configured");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function payloadFor(ctx: OtpRequestContext, code: string, expiresAt: number): string {
  return [ctx.email.trim().toLowerCase(), ctx.profileUrl.trim(), code, expiresAt].join(SEPARATOR);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function generateOtp(ctx: OtpRequestContext): { code: string; token: string; expiresAt: number } {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = Date.now() + LINKEDIN_POSTS_CONFIG.otpExpiryMinutes * 60_000;
  const signature = sign(payloadFor(ctx, code, expiresAt));
  const token = Buffer.from(`${expiresAt}${SEPARATOR}${signature}`).toString("base64url");
  return { code, token, expiresAt };
}

export function verifyOtp(ctx: OtpRequestContext & { code: string; token: string }): boolean {
  let expiresAtStr: string | undefined;
  let signature: string | undefined;
  try {
    [expiresAtStr, signature] = Buffer.from(ctx.token, "base64url").toString("utf8").split(SEPARATOR);
  } catch {
    return false;
  }
  if (!expiresAtStr || !signature) return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSignature = sign(payloadFor(ctx, ctx.code.trim(), expiresAt));
  return timingSafeEqualStr(expectedSignature, signature);
}
