/**
 * Client-side email format validation (mirrors convex/emailGate.ts).
 * The server is authoritative — this only saves a round trip.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return (
    typeof email === "string" &&
    email.length > 0 &&
    email.length <= 254 &&
    EMAIL_RE.test(email.trim())
  );
}
