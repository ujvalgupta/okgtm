/**
 * Simple in-memory sliding-window rate limiter for the public tool endpoints.
 * Per-process (VPS); per-instance on Vercel — fine for v1 (see cache comments
 * in the tool routes).
 */

interface Window {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  constructor(
    private limit: number,
    private windowMs: number
  ) {}

  private windows = new Map<string, Window>();

  /** Returns true if allowed, false if over the limit. */
  allow(key: string): boolean {
    const now = Date.now();
    const w = this.windows.get(key);
    if (!w || w.resetAt < now) {
      this.windows.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (w.count >= this.limit) return false;
    w.count += 1;
    return true;
  }

  /** Seconds until the current window resets (for the 429 Retry-After header). */
  retryAfterSeconds(key: string): number {
    const w = this.windows.get(key);
    if (!w) return 0;
    return Math.max(1, Math.ceil((w.resetAt - Date.now()) / 1000));
  }

  /** Opportunistic cleanup to stop unbounded growth. */
  cleanup(): void {
    const now = Date.now();
    for (const [k, w] of this.windows) {
      if (w.resetAt < now) this.windows.delete(k);
    }
  }
}
