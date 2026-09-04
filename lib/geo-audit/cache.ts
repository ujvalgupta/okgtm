/**
 * Result cache for GEO audits on top of the shared TtlCache. In-memory,
 * per-instance, 5-minute TTL. Failures (timeouts) cached for 60s so a hiccup
 * is not replayed forever.
 */

import type { GeoAuditResult } from "./types";
import { TtlCache } from "../shared/cache";

const OK_TTL_MS = 5 * 60_000;
const FAIL_TTL_MS = 60_000;

export class GeoResultCache {
  private store = new TtlCache<GeoAuditResult>(OK_TTL_MS);

  get(key: string): GeoAuditResult | undefined {
    return this.store.get(key);
  }

  set(key: string, result: GeoAuditResult): void {
    const failed = result.score === 0 && result.checks.every((c) => c.status === "FAIL");
    this.store.set(key, result, failed ? FAIL_TTL_MS : OK_TTL_MS);
  }
}
