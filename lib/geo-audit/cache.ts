/**
 * Result cache for GEO audits. In-memory, per-instance, 5-minute TTL.
 * Failures (timeouts) cached for 60s so a hiccup is not replayed forever.
 */

import type { GeoAuditResult } from "./types";

interface Entry {
  value: GeoAuditResult;
  expires: number;
}

const OK_TTL_MS = 5 * 60_000;
const FAIL_TTL_MS = 60_000;

export class GeoResultCache {
  private store = new Map<string, Entry>();

  get(key: string): GeoAuditResult | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, result: GeoAuditResult): void {
    const failed = result.score === 0 && result.checks.every((c) => c.status === "FAIL");
    this.store.set(key, { value: result, expires: Date.now() + (failed ? FAIL_TTL_MS : OK_TTL_MS) });
  }
}
