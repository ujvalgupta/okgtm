/**
 * Short-lived in-memory DNS cache on top of the shared TtlCache.
 * - Successful answers: 5-15 min TTL.
 * - Failures (SERVFAIL/TIMEOUT/NETWORK_ERROR): short TTL so a hiccup isn't
 *   remembered for long.
 * Per-process cache (VPS). On Vercel it is per-instance — fine for v1.
 */

import type { DNSResult } from "./types";
import { TtlCache } from "../shared/cache";

const GOOD_TTL_MS = 10 * 60_000;
const FAIL_TTL_MS = 30_000;

export class DNSCache {
  private store = new TtlCache<DNSResult>(GOOD_TTL_MS);

  get(key: string): DNSResult | undefined {
    return this.store.get(key);
  }

  set(key: string, result: DNSResult): void {
    const isFailure =
      result.status === "SERVFAIL" ||
      result.status === "TIMEOUT" ||
      result.status === "NETWORK_ERROR";
    this.store.set(key, result, isFailure ? FAIL_TTL_MS : GOOD_TTL_MS);
  }
}
