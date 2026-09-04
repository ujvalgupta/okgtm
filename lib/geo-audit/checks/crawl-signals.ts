/**
 * Crawl-signals category: meta robots, canonical, sitemap, internal link depth.
 * Ported from geo-stuff with tighter fan-out caps for serverless budgets.
 */

import type { GeoCheckResult } from "../types";
import { fetchText, sitemapIndexUrl, sitemapUrl } from "../../shared/http";
import type { CheckCtx } from "./ctx";

function wrap(status: "PASS" | "WARNING" | "FAIL", reason: string, metadata: Record<string, unknown>, recommendation?: string) {
  const score = metadata["normalizedScore"];
  return { status, reason, metadata, recommendation, normalizedScore: typeof score === "number" ? score : status === "PASS" ? 1 : status === "WARNING" ? 0.5 : 0 };
}
function pageResult(id: string, title: string, categoryKey: string, r: ReturnType<typeof wrap>): GeoCheckResult {
  return { id, title, categoryKey, status: r.status, reason: r.reason, recommendation: r.recommendation, metadata: r.metadata, available: true, normalizedScore: r.normalizedScore };
}

const BLOCKING = ["noindex", "nosnippet", "noarchive", "none"];
const AI_BOT_NAMES = ["gptbot", "claudebot", "perplexitybot", "bingbot", "applebot"];

export function metaRobotsCheck(ctx: CheckCtx): GeoCheckResult {
  const html = ctx.base?.body ?? "";
  const headers = ctx.base?.headers ?? {};
  const found: { source: string; rawContent: string; directives: string[]; blocks: string[] }[] = [];

  const xRobots = headers["x-robots-tag"];
  if (xRobots) {
    const directives = xRobots.toLowerCase().split(",").map((d) => d.trim()).filter(Boolean);
    const blocks = directives.filter((d) => BLOCKING.some((b) => d.startsWith(b)));
    found.push({ source: "X-Robots-Tag header", rawContent: xRobots, directives, blocks });
  }

  const metaRe = /<meta\s+[^>]*name=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) !== null) {
    const name = m[1].toLowerCase();
    const content = m[2];
    if (name === "robots" || name === "googlebot" || AI_BOT_NAMES.includes(name)) {
      const directives = content.toLowerCase().split(",").map((d) => d.trim()).filter(Boolean);
      const blocks = directives.filter((d) => BLOCKING.some((b) => d.startsWith(b)));
      found.push({ source: `<meta name="${m[1]}">`, rawContent: content, directives, blocks });
    }
  }

  if (found.length === 0) {
    return pageResult("meta-robots", "Meta robots + X-Robots-Tag", "crawlSignals", wrap("PASS", "No blocking meta robots or X-Robots-Tag directives found", { normalizedScore: 1, found: [] }));
  }

  const allBlocks = found.flatMap((f) => f.blocks);
  if (allBlocks.length > 0) {
    return pageResult("meta-robots", "Meta robots + X-Robots-Tag", "crawlSignals", wrap("FAIL", `Blocking directives found (${allBlocks.join(", ")}) — AI engines may refuse to index this page`, {
      normalizedScore: 0, found: found.map((f) => ({ source: f.source, content: f.rawContent })), blocking: allBlocks,
    }, "Remove noindex/nosnippet directives from this page unless you intentionally want it out of AI answers."));
  }

  return pageResult("meta-robots", "Meta robots + X-Robots-Tag", "crawlSignals", wrap("PASS", "Robots meta tags present but not blocking", { normalizedScore: 1, found: found.map((f) => ({ source: f.source, content: f.rawContent })) }));
}

function normalizeUrl(url: string): string {
  try {
    const p = new URL(url);
    p.hostname = p.hostname.toLowerCase();
    if (p.pathname === "/") return p.origin + "/";
    p.pathname = p.pathname.replace(/\/+$/, "");
    return p.toString();
  } catch {
    return url.trim();
  }
}

export function canonicalCheck(ctx: CheckCtx): GeoCheckResult {
  const html = ctx.base?.body ?? "";
  if (!html) {
    return pageResult("canonical", "Canonical tag", "crawlSignals", wrap("WARNING", "No HTML available to check the canonical tag", { normalizedScore: 0.5, canonicalUrl: null }));
  }
  const match =
    html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) ??
    html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);

  if (!match) {
    return pageResult("canonical", "Canonical tag", "crawlSignals", wrap("WARNING", "No canonical tag found — search engines may treat duplicates of this URL as separate pages", {
      normalizedScore: 0.5, canonicalUrl: null,
    }, "Add <link rel=\"canonical\" href=\"...\"> to declare the preferred URL for this page."));
  }

  const canonicalUrl = match[1].trim();
  const self = normalizeUrl(canonicalUrl) === normalizeUrl(ctx.normalizedUrl.toString());
  if (self) {
    return pageResult("canonical", "Canonical tag", "crawlSignals", wrap("PASS", "Canonical tag is self-referencing — this URL owns its content", { normalizedScore: 1, canonicalUrl, isSelfReferencing: true }));
  }
  return pageResult("canonical", "Canonical tag", "crawlSignals", wrap("FAIL", `Canonical points to ${canonicalUrl} — AI engines will attribute this page's content there instead`, {
    normalizedScore: 0, canonicalUrl, isSelfReferencing: false,
  }, "Point the canonical at this URL if this page should be indexed on its own, or expect the target URL to receive the credit."));
}

function normalizeSitemapUrl(u: string): string {
  return u.replace(/\/+$/, "").split("?")[0].split("#")[0];
}

function analyzeSitemapQuality(body: string) {
  const locs = body.match(/<loc>[\s\S]*?<\/loc>/gi) ?? [];
  const urlCount = locs.length;
  const lastmod = body.match(/<lastmod>([\s\S]*?)<\/lastmod>/gi) ?? [];
  const dates: Date[] = [];
  for (const t of lastmod) {
    const d = new Date(t.replace(/<\/?lastmod>/gi, "").trim());
    if (!isNaN(d.getTime())) dates.push(d);
  }
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  return {
    urlCount,
    withLastmod: dates.length,
    pctWithLastmod: urlCount > 0 ? Math.round((dates.length / urlCount) * 100) : 0,
    exceedsLimit: urlCount >= 50_000,
    newestLastmod: sorted.length ? sorted[sorted.length - 1].toISOString() : null,
    oldestLastmod: sorted.length ? sorted[0].toISOString() : null,
  };
}

function urlInSitemap(body: string, target: string): boolean {
  const t = normalizeSitemapUrl(target);
  const tNoProto = t.replace(/^https?:\/\//, "");
  if (body.includes(t) || body.includes(tNoProto)) return true;
  const locs = body.match(/<loc>([\s\S]*?)<\/loc>/gi) ?? [];
  for (const tag of locs) {
    const loc = tag.replace(/<\/?loc>/gi, "").trim();
    const n = normalizeSitemapUrl(loc);
    if (n === t || n.replace(/^https?:\/\//, "") === tNoProto) return true;
  }
  return false;
}

const NESTED_SITEMAP_LIMIT = 4;

export async function sitemapCheck(ctx: CheckCtx): Promise<GeoCheckResult> {
  const target = ctx.normalizedUrl.toString();
  const [siteSitemapUrl, indexUrl] = [sitemapUrl(ctx.normalizedUrl), sitemapIndexUrl(ctx.normalizedUrl)];
  const [sitemapResp, indexResp] = await Promise.all([fetchText(siteSitemapUrl), fetchText(indexUrl)]);
  const sitemapFound = !sitemapResp.fetchError && sitemapResp.statusCode === 200 && !!sitemapResp.body;
  const indexFound = !indexResp.fetchError && indexResp.statusCode === 200 && !!indexResp.body;

  if (!sitemapFound && !indexFound) {
    return pageResult("sitemap", "Sitemap", "crawlSignals", wrap("FAIL", "No sitemap.xml or sitemap_index.xml found — AI and search crawlers may never discover your pages", {
      normalizedScore: 0.1, sitemapFound: false, sitemapIndexFound: false, urlInSitemap: false,
    }, "Create a sitemap.xml and submit it to Google Search Console."));
  }

  const primaryBody = (sitemapFound ? sitemapResp.body : indexResp.body) ?? "";
  let quality = analyzeSitemapQuality(primaryBody);
  let found = urlInSitemap(primaryBody, target);

  // Index file that lists nested sitemaps — probe a few to find this URL
  if (!found && indexFound && indexResp.body) {
    const locs = (indexResp.body.match(/<loc>([\s\S]*?)<\/loc>/gi) ?? []).slice(0, NESTED_SITEMAP_LIMIT);
    for (const tag of locs) {
      const nestedUrl = tag.replace(/<\/?loc>/gi, "").trim();
      const resp = await fetchText(nestedUrl);
      if (!resp.body) continue;
      if (urlInSitemap(resp.body, target)) {
        found = true;
        quality = analyzeSitemapQuality(resp.body);
        break;
      }
    }
  }

  const issues: string[] = [];
  if (quality.exceedsLimit) issues.push(`URL count (${quality.urlCount.toLocaleString()}) exceeds the 50k-per-file limit`);
  if (quality.pctWithLastmod < 50 && quality.urlCount > 5) issues.push(`Only ${quality.pctWithLastmod}% of URLs have a <lastmod>`);

  let score: number;
  if (!found) {
    score = 0.45;
  } else if (issues.length > 0) {
    score = 0.7;
  } else if (quality.pctWithLastmod >= 80) {
    score = 1;
  } else {
    score = 0.85;
  }
  const status: "PASS" | "WARNING" | "FAIL" = score >= 0.75 ? "PASS" : score >= 0.4 ? "WARNING" : "FAIL";
  const reason = !found
    ? `Sitemap exists (${quality.urlCount} URLs) but this URL is not listed`
    : issues.length > 0
      ? `URL is in the sitemap, but: ${issues.join("; ")}`
      : quality.pctWithLastmod >= 80
        ? `URL is in the sitemap with strong metadata (${quality.pctWithLastmod}% have lastmod)`
        : `URL found in sitemap (${quality.urlCount} URLs, ${quality.pctWithLastmod}% have lastmod)`;

  return pageResult("sitemap", "Sitemap", "crawlSignals", wrap(status, reason, {
    normalizedScore: score, sitemapUrl: sitemapUrl, sitemapIndexFound: indexFound, urlInSitemap: found, quality, qualityIssues: issues,
  }));
}

const MAX_PAGES_PER_LEVEL = 8;
const MAX_DEPTH = 3;
const LEVEL_FETCH_TIMEOUT_MS = 5000;

function extractInternalLinks(html: string, origin: string): string[] {
  const seen = new Set<string>();
  const re = /href=["']([^"'#?\s]+)[^"']*["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1], origin);
      if (u.origin === origin && u.pathname !== "/") {
        seen.add(u.pathname.replace(/\/+$/, "") || "/");
      }
    } catch {
      /* ignore */
    }
  }
  return [...seen];
}

async function safePageFetch(url: string): Promise<string | null> {
  try {
    const raced = await Promise.race([
      fetchText(url),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), LEVEL_FETCH_TIMEOUT_MS)),
    ]);
    if (!raced || typeof raced !== "object" || !("body" in raced)) return null;
    return (raced as { body: string | null }).body;
  } catch {
    return null;
  }
}

export async function internalLinkDepthCheck(ctx: CheckCtx): Promise<GeoCheckResult> {
  const targetPath = ctx.normalizedUrl.pathname.replace(/\/+$/, "") || "/";
  const origin = ctx.normalizedUrl.origin;

  if (targetPath === "/") {
    return pageResult("link-depth", "Internal link depth", "crawlSignals", wrap("PASS", "Analyzed URL is the homepage — link depth does not apply", { normalizedScore: 1, depth: 0, isHomepage: true }));
  }

  const homepageHtml = await safePageFetch(`${origin}/`);
  if (!homepageHtml) {
    return pageResult("link-depth", "Internal link depth", "crawlSignals", wrap("WARNING", "Could not fetch the homepage to evaluate link depth", { normalizedScore: 0.5, depth: null, error: "homepage fetch failed" }));
  }

  const level1 = extractInternalLinks(homepageHtml, origin);
  if (level1.includes(targetPath)) {
    return pageResult("link-depth", "Internal link depth", "crawlSignals", wrap("PASS", "Page is linked directly from the homepage (depth 1) — excellent crawlability", { normalizedScore: 1, depth: 1, homepageLinkCount: level1.length }));
  }

  const level2Candidates = level1.slice(0, MAX_PAGES_PER_LEVEL);
  const level2Pages = await Promise.all(level2Candidates.map(async (p) => ({ html: await safePageFetch(`${origin}${p}`), path: p })));
  const level2Links = new Set<string>();
  for (const p of level2Pages) {
    if (p.html) for (const link of extractInternalLinks(p.html, origin)) level2Links.add(link);
  }
  if (level2Links.has(targetPath)) {
    return pageResult("link-depth", "Internal link depth", "crawlSignals", wrap("PASS", "Page is reachable within 2 clicks from the homepage", { normalizedScore: 0.85, depth: 2, homepageLinkCount: level1.length, level2PagesChecked: level2Candidates.length }));
  }

  if (MAX_DEPTH < 3) {
    return pageResult("link-depth", "Internal link depth", "crawlSignals", wrap("WARNING", "Page not found within 2 clicks of the homepage — it may have reduced crawl priority", { normalizedScore: 0.4, depth: ">2", homepageLinkCount: level1.length }));
  }

  const level3Candidates = [...level2Links].slice(0, MAX_PAGES_PER_LEVEL);
  const level3Pages = await Promise.all(level3Candidates.map(async (p) => ({ html: await safePageFetch(`${origin}${p}`), path: p })));
  const level3Links = new Set<string>();
  for (const p of level3Pages) {
    if (p.html) for (const link of extractInternalLinks(p.html, origin)) level3Links.add(link);
  }
  if (level3Links.has(targetPath)) {
    return pageResult("link-depth", "Internal link depth", "crawlSignals", wrap("WARNING", "Page reachable only at depth 3 from the homepage — consider promoting it", {
      normalizedScore: 0.6, depth: 3, homepageLinkCount: level1.length, level2PagesChecked: level2Candidates.length, level3PagesChecked: level3Candidates.length,
    }, "Link this page from your main navigation, footer or a hub page to raise its crawl priority."));
  }

  return pageResult("link-depth", "Internal link depth", "crawlSignals", wrap("FAIL", "Page not reachable within 3 clicks from the homepage — it is effectively orphaned", {
    normalizedScore: 0.1, depth: ">3", homepageLinkCount: level1.length, level2PagesChecked: level2Candidates.length, level3PagesChecked: level3Candidates.length,
  }, "Add this page to your main navigation, footer or sitemap so crawlers can find it."));
}
