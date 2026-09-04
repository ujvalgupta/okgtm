/**
 * GEO audit orchestrator.
 * Runs the fetchability probe first (populates the shared snapshot), then the
 * remaining checks in parallel. Deterministic; no LLM anywhere.
 */

import { randomUUID } from "node:crypto";
import type { GeoAuditResult, GeoCheckResult } from "./types";
import { GEO_SCHEMA_VERSION } from "./types";
import type { CheckCtx } from "./checks/ctx";
import { fetchabilityCheck } from "./checks/fetchability";
import { robotsTxtCheck, botAccessSimulationCheck, llmsTxtCheck } from "./checks/bot-access";
import { metaRobotsCheck, canonicalCheck, sitemapCheck, internalLinkDepthCheck } from "./checks/crawl-signals";
import { structuredDataCheck, eeatSignalsCheck } from "./checks/schema-authority";
import { contentExtractionCheck, contentFreshnessCheck, openGraphCheck } from "./checks/content";
import { multiPageSampleCheck } from "./checks/site-health";
import { javascriptRenderingSkipped, coreWebVitalsSkipped } from "./checks/browser";
import { buildCategories, classifyGeoScore, computeGeoScore, deriveIssues, overallStatusFor } from "./scoring";

export async function runGeoAudit(inputUrl: string, opts?: { budgetMs?: number }): Promise<GeoAuditResult> {
  const started = Date.now();
  const budgetMs = opts?.budgetMs ?? 40_000;
  const normalizedUrl = new URL(inputUrl);

  const ctx: CheckCtx = {
    inputUrl,
    normalizedUrl,
  };

  // Phase 1: fetchability populates the shared page snapshot.
  const { result: fetchability, snapshot } = await withBudget(fetchabilityCheck(ctx), budgetMs, started, "Fetching the page timed out");
  ctx.base = snapshot;

  // Phase 2: everything else in parallel.
  const results = await withBudget(
    Promise.all([
      robotsTxtCheck(ctx),
      botAccessSimulationCheck(ctx),
      llmsTxtCheck(ctx),
      metaRobotsCheck(ctx),
      canonicalCheck(ctx),
      sitemapCheck(ctx),
      internalLinkDepthCheck(ctx),
      structuredDataCheck(ctx),
      eeatSignalsCheck(ctx),
      contentExtractionCheck(ctx),
      contentFreshnessCheck(ctx),
      openGraphCheck(ctx),
      multiPageSampleCheck(ctx),
    ]),
    budgetMs,
    started,
    "Audit timed out"
  );

  const checks: GeoCheckResult[] = [
    fetchability,
    ...results,
    javascriptRenderingSkipped(),
    coreWebVitalsSkipped(),
  ];

  const categories = buildCategories(checks);
  const { score } = computeGeoScore(categories);
  const classification = classifyGeoScore(score);
  const overallStatus = overallStatusFor(score);
  const topIssues = deriveIssues(checks);
  const fails = topIssues.filter((i) => i.status === "FAIL").length;
  const warns = topIssues.filter((i) => i.status === "WARNING").length;

  const summaryText = `${score}/100 — ${classification}. ${fails} failing and ${warns} warning finding${fails + warns === 1 ? "" : "s"}${
    topIssues.length ? `: fix the highest-impact one first (${topIssues[0].title}).` : ". No blocking issues found."
  }`;

  return {
    schemaVersion: GEO_SCHEMA_VERSION,
    auditId: randomUUID(),
    inputUrl,
    url: normalizedUrl.toString(),
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    score,
    classification,
    overallStatus,
    categories,
    checks,
    topIssues,
    summaryText,
  };
}

async function withBudget<T>(p: Promise<T>, budgetMs: number, startedAt: number, timeoutMessage: string): Promise<T> {
  const remaining = Math.max(1, budgetMs - (Date.now() - startedAt));
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), remaining);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
