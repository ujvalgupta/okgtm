/**
 * Geo/GEO audit — "can AI engines find, parse and cite this page?"
 * Ported from the user's geo-stuff project (ujvalgupta/geo-stuff) into the
 * OkGTM app as a deterministic, browser-free engine.
 *
 * Status semantics: PASS/WARNING/FAIL from the checks, plus SKIPPED for the
 * two checks that need a headless browser (JS rendering, Core Web Vitals) —
 * skipped checks never count for or against the score (weight renormalized).
 */

export type GeoStatus = "PASS" | "WARNING" | "FAIL" | "SKIPPED";
export type GeoClassification = "Excellent" | "Good" | "Risky" | "Broken";

export interface GeoCheckResult {
  id: string;
  /** Human label shown in the UI. */
  title: string;
  categoryKey: string;
  status: GeoStatus;
  reason: string;
  /** Actionable guidance, when the finding has one. */
  recommendation?: string;
  metadata: Record<string, unknown>;
  /** false when the check could not run in this environment. */
  available: boolean;
  /** 0..1 fraction earned by this check within its category (null if unavailable). */
  normalizedScore: number | null;
}

export interface GeoCategory {
  key: string;
  label: string;
  /** Weight of this category out of the full 100 (renormalized when a category is unavailable). */
  weight: number;
  available: boolean;
  score: number; // 0..1
  checks: GeoCheckResult[];
}

export interface GeoIssue {
  /** Check id. */
  id: string;
  title: string;
  status: Exclude<GeoStatus, "PASS" | "SKIPPED">;
  severity: "HIGH" | "MEDIUM" | "LOW";
  what: string;
  fix: string;
}

export interface GeoSnapshot {
  url: string;
  finalUrl: string;
  statusCode: number | null;
  statusText: string | null;
  headers: Record<string, string>;
  body: string | null;
  fetchError?: string;
  durationMs: number;
  redirectChain?: { url: string; statusCode: number }[];
}

export interface GeoAuditResult {
  schemaVersion: string;
  auditId: string;
  inputUrl: string;
  url: string; // normalized analyzed URL
  checkedAt: string;
  durationMs: number;
  score: number;
  classification: GeoClassification;
  overallStatus: Exclude<GeoStatus, "SKIPPED">;
  categories: GeoCategory[];
  checks: GeoCheckResult[];
  topIssues: GeoIssue[];
  summaryText: string;
}

export const GEO_SCHEMA_VERSION = "geo-v1.0";
