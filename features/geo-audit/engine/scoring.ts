/**
 * Deterministic scoring for the GEO audit.
 * Category weights match the reference project; categories whose checks could
 * not run (browser-only) are excluded and the total renormalized, so a check
 * that cannot run never counts for or against the score.
 */

import type { GeoCategory, GeoCheckResult, GeoClassification, GeoIssue } from "./types";

export const CATEGORY_ORDER: { key: string; label: string; weight: number }[] = [
  { key: "fetchability", label: "Fetchability", weight: 10 },
  { key: "botAccess", label: "Bot Access", weight: 15 },
  { key: "crawlSignals", label: "Crawl Signals", weight: 18 },
  { key: "structuredData", label: "Structured Data & Authority", weight: 20 },
  { key: "rendering", label: "Rendering & Performance", weight: 10 },
  { key: "contentQuality", label: "Content Quality", weight: 15 },
  { key: "siteHealth", label: "Site Health", weight: 12 },
];

/** Intra-category check weights (fractional shares within the category). */
const INTRA_WEIGHTS: Record<string, Record<string, number>> = {
  botAccess: { "robots-txt": 0.4, "bot-simulation": 0.4, "llms-txt": 0.2 },
  crawlSignals: { "meta-robots": 0.25, canonical: 0.3, sitemap: 0.25, "link-depth": 0.2 },
  structuredData: { "structured-data": 0.6, "eeat-signals": 0.4 },
  rendering: { "js-rendering": 0.55, "core-web-vitals": 0.45 },
  contentQuality: { "content-extraction": 0.35, "open-graph": 0.3, "content-freshness": 0.35 },
};

export function classifyGeoScore(score: number): GeoClassification {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Risky";
  return "Broken";
}

export function overallStatusFor(score: number): "PASS" | "WARNING" | "FAIL" {
  const c = classifyGeoScore(score);
  if (c === "Excellent" || c === "Good") return "PASS";
  if (c === "Risky") return "WARNING";
  return "FAIL";
}

export function buildCategories(checks: GeoCheckResult[]): GeoCategory[] {
  const cats = CATEGORY_ORDER.map((meta) => {
    const members = checks.filter((c) => c.categoryKey === meta.key);
    const available = members.filter((c) => c.available);
    const intra = INTRA_WEIGHTS[meta.key] ?? {};

    let score: number;
    if (available.length === 0) {
      score = 0;
    } else if (available.length === 1) {
      score = available[0].normalizedScore ?? 0;
    } else {
      // Renormalize over available members of the category.
      const totalW = available.reduce((a, c) => a + (intra[c.id] ?? 0), 0);
      score = totalW === 0 ? 0 : available.reduce((a, c) => a + (c.normalizedScore ?? 0) * (intra[c.id] ?? 0), 0) / totalW;
    }
    score = Math.round(score * 100) / 100;

    return {
      key: meta.key,
      label: meta.label,
      weight: meta.weight,
      available: available.length > 0,
      score,
      checks: members,
    };
  });
  return cats;
}

export function computeGeoScore(categories: GeoCategory[]): { score: number; breakdown: Record<string, number> } {
  const available = categories.filter((c) => c.available);
  const totalWeight = available.reduce((a, c) => a + c.weight, 0);
  const breakdown: Record<string, number> = {};
  let weighted = 0;
  for (const c of available) {
    breakdown[c.key] = c.score;
    weighted += c.score * c.weight;
  }
  const score = totalWeight === 0 ? 0 : Math.round((weighted / totalWeight) * 100);
  return { score, breakdown };
}

export function deriveIssues(checks: GeoCheckResult[]): GeoIssue[] {
  const issues: GeoIssue[] = [];
  for (const c of checks) {
    if (c.status === "FAIL") {
      issues.push({
        id: c.id,
        title: c.title,
        status: "FAIL",
        severity: "HIGH",
        what: c.reason,
        fix: c.recommendation ?? "Investigate this finding and apply the fix above.",
      });
    } else if (c.status === "WARNING") {
      issues.push({
        id: c.id,
        title: c.title,
        status: "WARNING",
        severity: "MEDIUM",
        what: c.reason,
        fix: c.recommendation ?? "Review the evidence and decide whether a change is warranted.",
      });
    }
  }
  return issues;
}
