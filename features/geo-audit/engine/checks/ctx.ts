import type { HttpSnapshot } from "@/lib/shared/http";

export interface CheckCtx {
  inputUrl: string;
  normalizedUrl: URL;
  /** Populated by the fetchability check, consumed by the page-level checks. */
  base?: HttpSnapshot;
}

export interface RawCheck {
  status: "PASS" | "WARNING" | "FAIL";
  reason: string;
  metadata: Record<string, unknown>;
}
