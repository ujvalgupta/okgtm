/**
 * Email gate helpers shared across tool flows.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/** Basic format validation (mirrors the client-side check; server is authoritative). */
export function isValidEmail(email: string): boolean {
  return (
    typeof email === "string" &&
    email.length > 0 &&
    email.length <= MAX_EMAIL_LENGTH &&
    EMAIL_RE.test(email.trim())
  );
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
