import type { AuditResult, CheckResult } from "./types";

/**
 * Deterministic scoring engine.
 * Starts at 100 and deducts per failed/warned check weighted by each check's
 * scoreImpact (its area weight). UNKNOWN and INFO never penalize — a DNS
 * failure must not read as a configuration failure. No LLM anywhere.
 */

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

export function gradeFor(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Needs attention";
  if (score >= 25) return "Poor";
  return "Critical";
}

export function computeScore(checks: CheckResult[]): { score: number; grade: string } {
  let score = 100;
  for (const c of checks) {
    if (c.status === "FAIL") score -= c.scoreImpact;
    else if (c.status === "WARN") score -= c.scoreImpact / 2;
    // PASS / INFO / UNKNOWN: no deduction
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, grade: gradeFor(score) };
}

export function summarizeChecks(checks: CheckResult[]): AuditResult["summary"] {
  const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0, unknown: 0 };
  for (const c of checks) {
    if (c.severity === "CRITICAL") summary.critical += 1;
    else if (c.severity === "HIGH") summary.high += 1;
    else if (c.severity === "MEDIUM") summary.medium += 1;
    else if (c.severity === "LOW") summary.low += 1;
    else summary.info += 1;
    if (c.status === "UNKNOWN") summary.unknown += 1;
  }
  return summary;
}

export function sortChecks(checks: CheckResult[]): CheckResult[] {
  return [...checks].sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 9;
    const sb = SEVERITY_ORDER[b.severity] ?? 9;
    return sa - sb;
  });
}
