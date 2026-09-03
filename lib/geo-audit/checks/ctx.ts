import type { GeoSnapshot } from "../types";

export interface CheckCtx {
  inputUrl: string;
  normalizedUrl: URL;
  /** Populated by the fetchability check, consumed by the page-level checks. */
  base?: GeoSnapshot;
}

export interface RawCheck {
  status: "PASS" | "WARNING" | "FAIL";
  reason: string;
  metadata: Record<string, unknown>;
}
