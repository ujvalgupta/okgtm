/**
 * Short-lived in-memory DNS cache.
 * - Successful answers: 5-15 min TTL.
 * - Failures (SERVFAIL/TIMEOUT/NETWORK_ERROR): short TTL so a hiccup isn't
 *   remembered for long.
 * Per-process cache (VPS). On Vercel it is per-instance — fine for v1.
 */

import type { DNSResult } from "./types";

interface Entry {
  value: DNSResult;
  expires: number;
}

const GOOD_TTL_MS = 10 * 60_000;
const FAIL_TTL_MS = 30_000;

export class DNSCache {
  private store = new Map<string, Entry>();

  get(key: string): DNSResult | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, result: DNSResult): void {
    const isFailure =
      result.status === "SERVFAIL" ||
      result.status === "TIMEOUT" ||
      result.status === "NETWORK_ERROR";
    this.store.set(key, {
      value: result,
      expires: Date.now() + (isFailure ? FAIL_TTL_MS : GOOD_TTL_MS),
    });
  }
}
