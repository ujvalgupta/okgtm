/**
 * Site-health category: multi-page sample of homepage + sitemap URLs.
 * Ported from geo-stuff with a tighter sample budget.
 */

import type { GeoCheckResult } from "../types";
import { fetchText } from "../http";
import type { CheckCtx } from "./ctx";

const SAMPLE_SIZE = 5;
const FETCH_TIMEOUT_MS = 8000;

function build(status: "PASS" | "WARNING" | "FAIL", reason: string, metadata: Record<string, unknown>, recommendation?: string): GeoCheckResult {
  const score = metadata["normalizedScore"];
  return {
    id: "site-health",
    title: "Site-wide sample",
    categoryKey: "siteHealth",
    status,
    reason,
    recommendation,
    metadata,
    available: true,
    normalizedScore: typeof score === "number" ? score : status === "PASS" ? 1 : status === "WARNING" ? 0.5 : 0,
  };
}

function normalizeForCompare(u: string): string {
  try {
    const p = new URL(u);
    p.hash = "";
    p.search = "";
    if (p.pathname === "/") return p.origin + "/";
    p.pathname = p.pathname.replace(/\/+$/, "");
    return p.toString();
  } catch {
    return u.trim();
  }
}

function analyzeHtml(html: string, url: string): { hasNoindex: boolean; hasJsonLd: boolean; hasSelfCanonical: boolean | null; hasTitle: boolean; hasMetaDesc: boolean } {
  const hasNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html) || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html);
  const hasJsonLd = /type=["']application\/ld\+json["']/i.test(html);
  const canon =
    html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) ??
    html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  let hasSelfCanonical: boolean | null = null;
  if (canon) {
    hasSelfCanonical = normalizeForCompare(canon[1].trim()) === normalizeForCompare(url);
  }
  const hasTitle = /<title[^>]*>[\s\S]*?<\/title>/i.test(html);
  const hasMetaDesc = /<meta[^>]+(?:name|property)=["']description["'][^>]+content=["'][^"']+["']/i.test(html) || /<meta[^>]+content=["'][^"']+["'][^>]+(?:name|property)=["']description["']/i.test(html);
  return { hasNoindex, hasJsonLd, hasSelfCanonical, hasTitle, hasMetaDesc };
}

async function safeFetch(url: string): Promise<{ url: string; statusCode: number | null; body: string | null; fetchError?: string }> {
  try {
    const raced = await Promise.race([
      fetchText(url),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), FETCH_TIMEOUT_MS)),
    ]);
    if (!raced || typeof raced !== "object" || !("body" in raced)) return { url, statusCode: null, body: null, fetchError: "Timeout" };
    return { url, statusCode: raced.statusCode, body: raced.body };
  } catch (err) {
    return { url, statusCode: null, body: null, fetchError: String(err) };
  }
}

async function extractSitemapUrls(origin: string, limit: number): Promise<string[]> {
  try {
    const resp = await fetchText(`${origin}/sitemap.xml`);
    if (!resp.body || resp.statusCode !== 200) return [];
    const locs = resp.body.match(/<loc>([\s\S]*?)<\/loc>/gi) ?? [];
    return locs
      .map((t) => t.replace(/<\/?loc>/gi, "").trim())
      .filter((u) => u.startsWith(origin))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function multiPageSampleCheck(ctx: CheckCtx): Promise<GeoCheckResult> {
  const origin = ctx.normalizedUrl.origin;
  const analyzedUrl = ctx.normalizedUrl.toString();

  const homepageUrl = `${origin}/`;
  const sitemapUrls = await extractSitemapUrls(origin, SAMPLE_SIZE - 1);
  const urls = [homepageUrl, ...sitemapUrls.filter((u) => u !== analyzedUrl && u !== homepageUrl)].slice(0, SAMPLE_SIZE);

  const pages = await Promise.all(urls.map(async (url) => {
    const resp = await safeFetch(url);
    if (!resp.body || resp.fetchError || (resp.statusCode ?? 500) >= 400) {
      return { url, statusCode: resp.statusCode, hasNoindex: false, hasJsonLd: false, hasSelfCanonical: null, hasTitle: false, hasMetaDesc: false, fetchError: resp.fetchError };
    }
    return { url, statusCode: resp.statusCode, ...analyzeHtml(resp.body, url) };
  }));

  const ok = pages.filter((p) => !p.fetchError && p.statusCode && p.statusCode < 400);
  if (ok.length === 0) {
    return build("WARNING", "Could not sample any pages from this site", { normalizedScore: 0.5, pagesAttempted: urls.length, pagesSampled: 0, pages });
  }

  const noindexCount = ok.filter((p) => p.hasNoindex).length;
  const jsonLdCount = ok.filter((p) => p.hasJsonLd).length;
  const canonicalTrue = ok.filter((p) => p.hasSelfCanonical === true).length;
  const missingTitle = ok.filter((p) => !p.hasTitle).length;
  const errorPages = pages.filter((p) => p.statusCode && p.statusCode >= 400);
  const pctNoindex = Math.round((noindexCount / ok.length) * 100);
  const pctJsonLd = Math.round((jsonLdCount / ok.length) * 100);

  const issues: string[] = [];
  if (pctNoindex > 0) issues.push(`${pctNoindex}% of sampled pages have noindex`);
  if (pctJsonLd < 50) issues.push(`Only ${pctJsonLd}% of sampled pages have JSON-LD`);
  if (canonicalTrue < ok.length * 0.5) issues.push("Less than half of sampled pages are self-canonical");
  if (errorPages.length > 0) issues.push(`${errorPages.length} page${errorPages.length > 1 ? "s" : ""} returning errors`);
  if (missingTitle > 0) issues.push(`${missingTitle} page${missingTitle > 1 ? "s" : ""} missing a title tag`);

  let score: number;
  if (issues.length === 0) score = 1;
  else if (issues.length === 1) score = 0.75;
  else if (issues.length === 2) score = 0.55;
  else score = 0.3;
  if (pctNoindex > 50) score = Math.min(score, 0.2);

  const status = score >= 0.75 ? "PASS" : score >= 0.4 ? "WARNING" : "FAIL";
  const reason = issues.length === 0
    ? `Site-wide patterns look healthy across ${ok.length} sampled pages`
    : `Site-wide issues: ${issues[0]}${issues.length > 1 ? ` (+${issues.length - 1} more)` : ""}`;

  return build(status, reason, {
    normalizedScore: Number(score.toFixed(2)),
    pagesSampled: ok.length,
    pagesAttempted: urls.length,
    siteWideStats: { pctWithJsonLd: pctJsonLd, pctWithNoindex: pctNoindex, pctWithSelfCanonical: Math.round((canonicalTrue / ok.length) * 100), errorPageCount: errorPages.length, missingTitleCount: missingTitle },
    issues,
    pages: pages.map((p) => ({ url: p.url, statusCode: p.statusCode, hasNoindex: p.hasNoindex, hasJsonLd: p.hasJsonLd, hasSelfCanonical: p.hasSelfCanonical, hasTitle: p.hasTitle, error: p.fetchError ?? null })),
  }, issues.length ? "Fix the site-wide issues above: noindex pages block indexing, missing JSON-LD or titles reduce AI understanding, and 404/500s waste crawl budget." : undefined);
}
