/**
 * Global per-email rate limiting shared by ALL free tools.
 * Third-party services (e.g. Mindcase) are paid — a user should not be able
 * to burn credits repeatedly from the same email within a short window.
 */

export const RATE_LIMIT_MS = 60_000; // 60s global window per email

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

export function rateLimitCheck(
  lastCallAt: number | undefined,
  now: number
): RateLimitResult {
  if (lastCallAt === undefined) return { allowed: true };
  const elapsed = now - lastCallAt;
  if (elapsed < RATE_LIMIT_MS) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((RATE_LIMIT_MS - elapsed) / 1000)),
    };
  }
  return { allowed: true };
}


/**
 * GLOBAL paid-call cap — independent of email. Even with the per-email 60s
 * window, a scripted attacker rotating emails could burn credits. This caps
 * total paid calls across ALL users per minute-window.
 */
export const MAX_GLOBAL_PER_MIN = 20;

export function globalWindowKey(now: number): string {
  return `usage-${Math.floor(now / 60_000)}`;
}

export function globalCapAllowed(current: number | undefined): boolean {
  return (current ?? 0) < MAX_GLOBAL_PER_MIN;
}
