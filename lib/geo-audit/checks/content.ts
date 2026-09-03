/**
 * Content-quality category: content extraction, freshness, Open Graph.
 * Ported from geo-stuff.
 */

import type { GeoCheckResult } from "../types";
import { clip, extractPreferredContent, stripBoilerplate, stripTags, wordCount } from "../text";
import type { CheckCtx } from "./ctx";

function build(id: string, title: string, categoryKey: string, status: "PASS" | "WARNING" | "FAIL", reason: string, metadata: Record<string, unknown>, recommendation?: string): GeoCheckResult {
  const score = metadata["normalizedScore"];
  return { id, title, categoryKey, status, reason, recommendation, metadata, available: true, normalizedScore: typeof score === "number" ? score : status === "PASS" ? 1 : status === "WARNING" ? 0.5 : 0 };
}

export function contentExtractionCheck(ctx: CheckCtx): GeoCheckResult {
  const html = ctx.base?.body ?? "";
  if (!html) {
    return build("content-extraction", "Content extraction", "contentQuality", "FAIL", "No HTML content available to extract", { normalizedScore: 0 });
  }

  const { extractedHtml, source } = extractPreferredContent(html);
  const words = wordCount(stripTags(extractedHtml));
  const fullBody = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const fullText = stripTags(fullBody);
  const uniqueText = stripTags(stripBoilerplate(fullBody));

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1] ??
    "";

  const wScore = words >= 600 ? 1 : words >= 300 ? 0.75 : words >= 150 ? 0.55 : words >= 75 ? 0.35 : 0.15;
  const eScore = source === "article" || source === "main" || source === "role=main" ? 1 : source === "body" ? 0.6 : 0.35;
  const mScore = title && description ? 1 : title || description ? 0.5 : 0;
  const fullLen = fullText.length;
  const ratio = fullLen === 0 ? 0 : uniqueText.length / fullLen;
  const uScore = ratio > 0.5 ? 1 : ratio > 0.3 ? 0.75 : ratio > 0.15 ? 0.5 : 0.25;

  const contentScore = Number((wScore * 0.4 + eScore * 0.3 + mScore * 0.2 + uScore * 0.1).toFixed(2));
  const status = contentScore >= 0.7 ? "PASS" : contentScore >= 0.4 ? "WARNING" : "FAIL";
  const reason =
    status === "PASS"
      ? "Content is substantial and cleanly extractable"
      : status === "WARNING"
        ? words < 150
          ? `Thin content — only ${words} words extracted (aim for 300+)`
          : "Content extracted, but structure or metadata is weak"
        : words < 75
          ? `Too little content to extract (${words} words)`
          : "Content extraction quality is insufficient";

  return build("content-extraction", "Content extraction", "contentQuality", status, reason, {
    normalizedScore: contentScore,
    extractionSource: source,
    extractedWordCount: words,
    scores: { wordCount: wScore, extraction: eScore, metadata: mScore, uniqueContent: uScore },
    title: title || null,
    metaDescription: description || null,
    textSample: clip(stripTags(extractedHtml), 220),
  }, status === "FAIL" || status === "WARNING"
    ? words < 150
      ? "Add meaningful body content (300+ words), a unique title tag and a meta description to give AI engines material to cite."
      : "Add a unique title tag and meta description, and keep your main content inside <main> or <article>."
    : undefined);
}

const NEWS_TYPES = new Set(["NewsArticle", "ReportageNewsArticle", "LiveBlogPosting", "BlogPosting"]);
const EVERGREEN_TYPES = new Set(["HowTo", "FAQPage", "Recipe", "Course", "SoftwareApplication", "Product", "ProductGroup", "Organization", "Person", "LocalBusiness", "WebSite", "AboutPage", "ContactPage", "BreadcrumbList"]);

type ContentMode = "news" | "evergreen" | "article" | "unknown";

function detectContentMode(html: string): ContentMode {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const obj = JSON.parse(m[1]) as Record<string, unknown>;
      const items = Array.isArray(obj) ? obj : [obj];
      for (const item of items) {
        const t = (item as Record<string, unknown>)["@type"];
        const type = Array.isArray(t) ? String(t[0]) : String(t ?? "");
        if (NEWS_TYPES.has(type)) return "news";
        if (EVERGREEN_TYPES.has(type)) return "evergreen";
        if (["Article", "TechArticle", "ScholarlyArticle"].includes(type)) return "article";
      }
    } catch {
      /* skip */
    }
  }
  const og = html.match(/<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']+)["']/i);
  if (og) {
    const t = og[1].toLowerCase();
    if (t.includes("article") || t.includes("blog")) return "article";
    if (t.includes("website")) return "evergreen";
  }
  return "unknown";
}

function scoreAge(days: number, mode: ContentMode): number {
  switch (mode) {
    case "news":
      if (days <= 1) return 1;
      if (days <= 3) return 0.9;
      if (days <= 7) return 0.75;
      if (days <= 30) return 0.55;
      if (days <= 90) return 0.3;
      return 0.1;
    case "evergreen":
      if (days <= 180) return 1;
      if (days <= 365) return 0.9;
      if (days <= 730) return 0.8;
      if (days <= 1095) return 0.65;
      return 0.5;
    case "article":
      if (days <= 30) return 1;
      if (days <= 90) return 0.88;
      if (days <= 180) return 0.75;
      if (days <= 365) return 0.6;
      if (days <= 730) return 0.4;
      return 0.2;
    default:
      if (days <= 30) return 1;
      if (days <= 90) return 0.85;
      if (days <= 180) return 0.7;
      if (days <= 365) return 0.55;
      if (days <= 730) return 0.35;
      return 0.2;
  }
}

function extractMetaDate(html: string, property: string): string | null {
  const esc = property.replace(":", "\\:");
  const m1 = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${esc}["'][^>]+content=["']([^"']+)["']`, "i"));
  if (m1) return m1[1];
  const m2 = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${esc}["']`, "i"));
  return m2?.[1] ?? null;
}

export function contentFreshnessCheck(ctx: CheckCtx): GeoCheckResult {
  const html = ctx.base?.body ?? "";
  const headers = ctx.base?.headers ?? {};
  const mode = detectContentMode(html);
  const signals: { source: string; raw: string; date: Date | null }[] = [];
  const push = (source: string, raw: string) => {
    const d = new Date(raw.trim());
    signals.push({ source, raw, date: isNaN(d.getTime()) ? null : d });
  };

  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = ldRe.exec(html)) !== null) {
    try {
      const obj = JSON.parse(m[1]) as Record<string, unknown>;
      const items = Array.isArray(obj) ? obj : [obj];
      for (const item of items) {
        const o = item as Record<string, unknown>;
        if (typeof o["dateModified"] === "string") push("JSON-LD dateModified", o["dateModified"]);
        if (typeof o["datePublished"] === "string") push("JSON-LD datePublished", o["datePublished"]);
      }
    } catch {
      /* skip */
    }
  }
  if (headers["last-modified"]) push("HTTP Last-Modified", headers["last-modified"]);
  for (const p of ["article:modified_time", "article:published_time"]) {
    const v = extractMetaDate(html, p);
    if (v) push(p, v);
  }
  const genericDate = extractMetaDate(html, "date") ?? extractMetaDate(html, "pubdate");
  if (genericDate) push("meta date", genericDate);
  const timeMatch = html.match(/<time[^>]+datetime=["']([^"']+)["'][^>]*>/i);
  if (timeMatch) push("<time datetime>", timeMatch[1]);

  const modeLabel: Record<ContentMode, string> = { news: "News / Blog", evergreen: "Evergreen / Reference", article: "Article", unknown: "Unknown" };

  if (signals.length === 0) {
    return build("content-freshness", "Content freshness", "contentQuality", "WARNING",
      `No date signals found (content type: ${modeLabel[mode]}). AI engines cannot tell how fresh this is.`,
      { normalizedScore: mode === "evergreen" ? 0.55 : 0.3, contentMode: mode, contentModeLabel: modeLabel[mode], signals: [] },
      "Add datePublished and dateModified to your JSON-LD schema so AI engines know when this was written and updated.");
  }

  const best = signals.find((s) => s.date !== null);
  if (!best?.date) {
    return build("content-freshness", "Content freshness", "contentQuality", "WARNING", "Date fields found, but none could be parsed into a valid date", {
      normalizedScore: 0.35, contentMode: mode, contentModeLabel: modeLabel[mode], signals: signals.map((s) => ({ source: s.source, rawValue: s.raw, valid: false })),
    });
  }

  const days = Math.floor((Date.now() - best.date.getTime()) / 86_400_000);
  const score = scoreAge(days, mode);
  const status = score >= 0.7 ? "PASS" : score >= 0.35 ? "WARNING" : "FAIL";
  const freshnessLabel = days <= 1 ? "fresh today" : days <= 3 ? "very fresh" : days <= 7 ? "fresh this week" : days <= 30 ? "fresh this month" : days <= 90 ? "recent" : days <= 365 ? "aging" : days <= 730 ? "stale" : "very stale";
  const reason = status === "PASS"
    ? `Content is ${freshnessLabel} (${days}d, ${modeLabel[mode]}) — appropriate for its content type`
    : status === "WARNING"
      ? `Content is ${freshnessLabel} (${days}d) — ${mode === "news" ? "news content should be updated frequently" : "consider refreshing it"}`
      : `Content is ${freshnessLabel} (${days}d) — too old for AI engines to prioritize`;

  return build("content-freshness", "Content freshness", "contentQuality", status, reason, {
    normalizedScore: score, contentMode: mode, contentModeLabel: modeLabel[mode], ageInDays: days, freshnessLabel,
    bestSignalSource: best.source, bestSignalDate: best.date.toISOString(),
    signals: signals.map((s) => ({ source: s.source, rawValue: s.raw, parsedDate: s.date?.toISOString() ?? null, ageInDays: s.date ? Math.floor((Date.now() - s.date.getTime()) / 86_400_000) : null })),
  });
}

const OG_FIELDS: { property: string; label: string; weight: number }[] = [
  { property: "og:title", label: "Title", weight: 0.25 },
  { property: "og:description", label: "Description", weight: 0.25 },
  { property: "og:image", label: "Image", weight: 0.2 },
  { property: "og:type", label: "Type", weight: 0.15 },
  { property: "og:url", label: "URL", weight: 0.1 },
  { property: "twitter:card", label: "Twitter card", weight: 0.05 },
];

function extractMeta(html: string, property: string): string | null {
  const esc = property.replace(":", "\\:");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${esc}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${esc}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${esc}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

export function openGraphCheck(ctx: CheckCtx): GeoCheckResult {
  const html = ctx.base?.body ?? "";
  if (!html) {
    return build("open-graph", "Open Graph metadata", "contentQuality", "FAIL", "No HTML available to check Open Graph metadata", { normalizedScore: 0, fields: {} });
  }
  const fields: Record<string, string | null> = {};
  let score = 0;
  const present: string[] = [];
  const missing: string[] = [];
  for (const f of OG_FIELDS) {
    const value = extractMeta(html, f.property);
    fields[f.property] = value;
    if (value) {
      score += f.weight;
      present.push(f.label);
    } else {
      missing.push(f.label);
    }
  }
  score = Number(Math.min(1, score).toFixed(2));
  const status = score >= 0.75 ? "PASS" : score >= 0.4 ? "WARNING" : "FAIL";
  const reason = status === "PASS"
    ? `Open Graph metadata is complete (${present.join(", ")})`
    : status === "WARNING"
      ? `Open Graph is partially complete — missing: ${missing.join(", ")}`
      : "Open Graph metadata is largely missing — AI citation quality will suffer";
  return build("open-graph", "Open Graph metadata", "contentQuality", status, reason, {
    normalizedScore: score, present, missing, fields,
  }, status === "FAIL" || status === "WARNING" ? "Add og:title, og:description, og:image, og:type, og:url and twitter:card to your page head." : undefined);
}
