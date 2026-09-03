/**
 * Browser-only checks (JS rendering, Core Web Vitals).
 *
 * These genuinely need a headless browser to evaluate (executing the page's
 * JavaScript and measuring real CLS/LCP/INP). This engine runs without a
 * browser, so the checks are reported as SKIPPED — they never count for or
 * against the score, and the UI labels them clearly.
 */

import type { GeoCheckResult } from "../types";

const REASON =
  "Not assessed — this check needs a headless-browser run (JavaScript execution and real page-load metrics). Use Lighthouse in Chrome DevTools, PageSpeed Insights, or a VPS-side browser check.";

export function javascriptRenderingSkipped(): GeoCheckResult {
  return {
    id: "js-rendering",
    title: "JavaScript rendering",
    categoryKey: "rendering",
    status: "SKIPPED",
    reason: REASON,
    metadata: { note: "requires a browser" },
    available: false,
    normalizedScore: null,
  };
}

export function coreWebVitalsSkipped(): GeoCheckResult {
  return {
    id: "core-web-vitals",
    title: "Core Web Vitals",
    categoryKey: "rendering",
    status: "SKIPPED",
    reason: REASON,
    metadata: { note: "requires a browser" },
    available: false,
    normalizedScore: null,
  };
}
