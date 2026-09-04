/**
 * Bot-access category: robots.txt, AI-bot simulation, llms.txt.
 * Logic ported from geo-stuff.
 */

import type { GeoCheckResult } from "../types";
import { fetchText, robotsTxtUrl } from "@/lib/shared/http";
import { evaluateRobotsAccess, parseCrawlDelay } from "../robots";
import type { CheckCtx, RawCheck } from "./ctx";

const TARGET_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Googlebot", "Bingbot", "Applebot", "Meta-ExternalAgent"];
const AGGRESSIVE_CRAWL_DELAY_SECONDS = 300;

function wrap(id: string, title: string, categoryKey: string, c: RawCheck, recommendation?: string): GeoCheckResult {
  const score = c.metadata["normalizedScore"];
  return {
    id,
    title,
    categoryKey,
    status: c.status,
    reason: c.reason,
    recommendation,
    metadata: c.metadata,
    available: true,
    normalizedScore: typeof score === "number" ? score : c.status === "PASS" ? 1 : c.status === "WARNING" ? 0.5 : 0,
  };
}

export async function robotsTxtCheck(ctx: CheckCtx): Promise<GeoCheckResult> {
  const robotsUrl = robotsTxtUrl(ctx.normalizedUrl);
  const snapshot = await fetchText(robotsUrl);

  if (snapshot.fetchError) {
    return wrap("robots-txt", "Robots.txt", "botAccess", {
      status: "WARNING",
      reason: "robots.txt could not be fetched",
      metadata: { normalizedScore: 0.5, robotsUrl, fetchError: snapshot.fetchError },
    });
  }
  if (snapshot.statusCode === 404) {
    return wrap("robots-txt", "Robots.txt", "botAccess", {
      status: "PASS",
      reason: "No robots.txt found — no crawler restrictions declared",
      metadata: { normalizedScore: 1, robotsUrl, statusCode: 404 },
    });
  }

  const body = snapshot.body ?? "";
  const path = `${ctx.normalizedUrl.pathname}${ctx.normalizedUrl.search}`;
  const evaluations = TARGET_BOTS.map((bot) => {
    const e = evaluateRobotsAccess(body, bot, path);
    return { userAgent: bot, allowed: e.allowed, matchedRule: e.matchedRule ?? null };
  });
  const crawlDelay = parseCrawlDelay(body);
  const crawlDelayProblematic = crawlDelay !== null && crawlDelay >= AGGRESSIVE_CRAWL_DELAY_SECONDS;
  const blockedBots = evaluations.filter((e) => !e.allowed);

  let status: "PASS" | "WARNING" | "FAIL";
  let reason: string;
  if (blockedBots.length === TARGET_BOTS.length) {
    status = "FAIL";
    reason = "robots.txt blocks every tested AI crawler";
  } else if (blockedBots.length > 0) {
    status = "FAIL";
    reason = `robots.txt blocks: ${blockedBots.map((b) => b.userAgent).join(", ")}`;
  } else if (crawlDelayProblematic) {
    status = "WARNING";
    reason = `All bots allowed, but Crawl-delay is ${crawlDelay}s — AI crawlers may index very infrequently`;
  } else {
    status = "PASS";
    reason = "robots.txt allows all tested AI crawlers";
  }

  return wrap(
    "robots-txt",
    "Robots.txt",
    "botAccess",
    { status, reason, metadata: { normalizedScore: status === "PASS" ? 1 : status === "WARNING" ? 0.7 : 0, robotsUrl, statusCode: snapshot.statusCode, evaluations, crawlDelay, crawlDelayProblematic } },
    status === "FAIL" ? "Allow the AI crawlers you want indexed (GPTBot, ClaudeBot, PerplexityBot, Googlebot) in robots.txt." : undefined
  );
}

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
const BOT_UAS: { name: string; ua: string }[] = [
  { name: "GPTBot", ua: "GPTBot/1.0" },
  { name: "ClaudeBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/0.1; +claude.ai/bot)" },
  { name: "PerplexityBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" },
  { name: "Googlebot", ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  { name: "Bingbot", ua: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" },
  { name: "Applebot", ua: "Mozilla/5.0 (compatible; Applebot/0.1; +http://www.apple.com/go/applebot)" },
  { name: "Meta-ExternalAgent", ua: "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/bot/)" },
];

function isBlocked(snapshot: Awaited<ReturnType<typeof fetchText>>): boolean {
  const body = snapshot.body?.toLowerCase() ?? "";
  return snapshot.statusCode === 401 || snapshot.statusCode === 403 || snapshot.statusCode === 429 ||
    ["access denied", "forbidden", "captcha", "blocked"].some((k) => body.includes(k));
}

function wordTokens(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/<[^>]+>/g, " ").split(/\W+/).filter((t) => t.length > 3));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const inter = [...a].filter((t) => b.has(t)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 1 : Number((inter / union).toFixed(2));
}

export async function botAccessSimulationCheck(ctx: CheckCtx): Promise<GeoCheckResult> {
  const url = ctx.normalizedUrl.toString();
  const browser = await fetchText(url, { headers: { "user-agent": BROWSER_UA } });
  const browserTokens = wordTokens(browser.body ?? "");
  const browserLength = browser.body?.length ?? 0;

  const sims = await Promise.all(
    BOT_UAS.map(async ({ name, ua }) => {
      const snap = await fetchText(url, { headers: { "user-agent": ua } });
      const blocked = snap.fetchError ? true : isBlocked(snap);
      const accessible = !snap.fetchError && !blocked && (snap.statusCode ?? 500) < 400;
      const len = snap.body?.length ?? 0;
      const deltaPct = browserLength === 0 ? (len === 0 ? 0 : 100) : Number(((Math.abs(len - browserLength) / browserLength) * 100).toFixed(2));
      const diffStatus = snap.statusCode !== browser.statusCode;
      const similarity = jaccard(browserTokens, wordTokens(snap.body ?? ""));
      const diverged = similarity < 0.6 && len > 200;
      return {
        botName: name,
        statusCode: snap.statusCode,
        accessible,
        blocked,
        responseLength: len,
        reason: snap.fetchError ? snap.fetchError : blocked ? `Blocked — HTTP ${snap.statusCode}` : diffStatus || diverged ? `Divergent response (similarity: ${similarity})` : "Accessible — matches browser baseline",
        comparisonToBrowser: { differentStatusCode: diffStatus, responseLengthDeltaPercent: deltaPct, similarityScore: similarity },
      };
    })
  );

  const blocked = sims.filter((s) => !s.accessible);
  const divergent = sims.filter((s) => s.accessible && (s.comparisonToBrowser?.differentStatusCode || (s.comparisonToBrowser?.similarityScore ?? 1) < 0.6));
  const blockedNames = blocked.map((s) => s.botName);
  const divergentNames = divergent.map((s) => s.botName);

  let status: "PASS" | "WARNING" | "FAIL";
  let reason: string;
  if (blocked.length === sims.length) {
    status = "FAIL";
    reason = `All ${sims.length} AI crawlers appear blocked`;
  } else if (blocked.length > 0) {
    status = "FAIL";
    reason = `Blocked for: ${blockedNames.join(", ")}`;
  } else if (divergent.length > 0) {
    status = "WARNING";
    reason = `Divergent response for: ${divergentNames.join(", ")}`;
  } else {
    status = "PASS";
    reason = `All ${sims.length} AI crawlers received an accessible response`;
  }

  return wrap(
    "bot-simulation",
    "AI bot access simulation",
    "botAccess",
    { status, reason, metadata: { normalizedScore: status === "PASS" ? 1 : status === "WARNING" ? 0.5 : 0, blockedBots: blockedNames, divergentBots: divergentNames, simulations: sims } },
    blocked.length ? "If the block is unintentional, remove the firewall rule or bot challenge that is returning a 401/403 for these user agents." : undefined
  );
}

export async function llmsTxtCheck(ctx: CheckCtx): Promise<GeoCheckResult> {
  const origin = ctx.normalizedUrl.origin;
  const filePaths = ["/llms.txt", "/ai.txt", "/llms-full.txt"];
  const results = await Promise.all(
    filePaths.map(async (path) => {
      const url = `${origin}${path}`;
      const resp = await fetchText(url);
      const found = !resp.fetchError && resp.statusCode === 200 && !!resp.body;
      return { path, found, statusCode: resp.statusCode, size: resp.body?.length ?? 0, content: found ? resp.body : null };
    })
  );
  const foundFiles = results.filter((r) => r.found);

  if (foundFiles.length === 0) {
    return wrap("llms-txt", "llms.txt / ai.txt", "botAccess", {
      status: "WARNING",
      reason: "No llms.txt or ai.txt found — this emerging standard helps AI engines understand your site's structure",
      metadata: { normalizedScore: 0.4, filesChecked: filePaths, foundFiles: [] },
    }, "Add /llms.txt (see llmstxt.org). It signals AI-readiness and can improve citation quality.");
  }

  const primary = foundFiles[0];
  const content = primary.content ?? "";
  const lines = content.split(/\r?\n/);
  let title: string | null = null;
  let description: string | null = null;
  let sections = 0;
  let links = 0;
  const hasBlock = /(noindex|disallow|block|deny|opt-out|no-ai)/i.test(content);
  const hasAllow = /(allow|index|permit|opt-in|welcome)/i.test(content);
  for (const raw of lines) {
    const t = raw.trim();
    if (/^#\s+/.test(t) && !title) title = t.replace(/^#+\s*/, "");
    else if (/^#{2,3}\s+/.test(t)) sections += 1;
    else if (t.startsWith(">") && !description) description = t.slice(1).trim();
    else if (/^[-*]\s+\[[^\]]+\]\([^)]+\)/.test(t)) links += 1;
  }

  let score: number;
  let status: "PASS" | "WARNING" | "FAIL";
  let reason: string;
  if (hasBlock && !hasAllow) {
    score = 0.2;
    status = "WARNING";
    reason = `${primary.path} found but contains restrictive directives — AI engines may be excluded`;
  } else if (title || description || sections > 0 || links > 0) {
    const quality = (title ? 0.2 : 0) + (description ? 0.2 : 0) + (sections > 0 ? 0.2 : 0) + (links > 0 ? 0.3 : 0) + (!hasBlock ? 0.1 : 0);
    score = Number(Math.min(1, 0.5 + quality * 0.5).toFixed(2));
    status = score >= 0.75 ? "PASS" : "WARNING";
    reason = score >= 0.75 ? `${primary.path} found and well structured (${links} links, ${sections} sections)` : `${primary.path} found but could be more detailed — add a title, description and content links`;
  } else {
    score = 0.55;
    status = "WARNING";
    reason = `${primary.path} found but its content could not be parsed`;
  }

  return wrap("llms-txt", "llms.txt / ai.txt", "botAccess", {
    status,
    reason,
    metadata: { normalizedScore: score, foundFiles: foundFiles.map((f) => f.path), primaryFile: primary.path, fileSize: primary.size, parsed: { title, description, sectionCount: sections, linkCount: links, hasBlockRules: hasBlock, hasAllowRules: hasAllow } },
  });
}
