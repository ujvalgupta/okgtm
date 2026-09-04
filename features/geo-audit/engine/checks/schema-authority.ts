/**
 * Structured-data + authority category: JSON-LD schema quality, E-E-A-T signals.
 * Ported from geo-stuff.
 */

import type { GeoCheckResult } from "../types";
import type { CheckCtx } from "./ctx";

function build(id: string, title: string, categoryKey: string, status: "PASS" | "WARNING" | "FAIL", reason: string, metadata: Record<string, unknown>, recommendation?: string): GeoCheckResult {
  const score = metadata["normalizedScore"];
  return { id, title, categoryKey, status, reason, recommendation, metadata, available: true, normalizedScore: typeof score === "number" ? score : status === "PASS" ? 1 : status === "WARNING" ? 0.5 : 0 };
}

const RECOGNIZED_TYPES = new Set([
  "Article", "NewsArticle", "BlogPosting", "TechArticle", "ScholarlyArticle", "Product", "ProductGroup",
  "FAQPage", "HowTo", "Organization", "LocalBusiness", "Corporation", "Person", "Recipe", "Event",
  "Course", "CourseInstance", "SoftwareApplication", "WebApplication", "MobileApplication", "WebPage",
  "WebSite", "AboutPage", "ContactPage", "BreadcrumbList", "Review", "AggregateRating", "VideoObject",
  "ImageObject", "JobPosting", "MedicalCondition", "Drug", "Book",
]);

const REQUIRED_FIELDS: Record<string, string[]> = {
  Article: ["headline"], NewsArticle: ["headline"], BlogPosting: ["headline"], TechArticle: ["headline"],
  Product: ["name"], FAQPage: ["mainEntity"], HowTo: ["name", "step"], Organization: ["name"],
  LocalBusiness: ["name"], Person: ["name"], Recipe: ["name", "recipeIngredient"], Event: ["name", "startDate"],
  Course: ["name"], SoftwareApplication: ["name"], WebSite: ["name"], JobPosting: ["title", "hiringOrganization"],
  Book: ["name", "author"], Review: ["itemReviewed"],
};

export function extractJsonLdItems(html: string): unknown[] {
  const results: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch {
      results.push({ _parseError: true });
    }
  }
  return results;
}

function schemaType(item: unknown): string | null {
  if (typeof item !== "object" || item === null) return null;
  const t = (item as Record<string, unknown>)["@type"];
  if (typeof t === "string") return t;
  if (Array.isArray(t) && typeof t[0] === "string") return t[0];
  return null;
}

function hasValidContext(item: unknown): boolean {
  if (typeof item !== "object" || item === null) return false;
  const c = (item as Record<string, unknown>)["@context"];
  return typeof c === "string" && c.includes("schema.org");
}

export function structuredDataCheck(ctx: CheckCtx): GeoCheckResult {
  const html = ctx.base?.body ?? "";
  if (!html) {
    return build("structured-data", "Structured data (JSON-LD)", "structuredData", "FAIL", "No HTML available to check structured data", { normalizedScore: 0, schemasFound: [] });
  }

  const items = extractJsonLdItems(html);
  if (items.length === 0) {
    return build("structured-data", "Structured data (JSON-LD)", "structuredData", "FAIL", "No JSON-LD structured data found — AI engines cannot determine what this content is", {
      normalizedScore: 0, schemasFound: [],
    }, "Add JSON-LD schema markup (Article, FAQPage, Organization, Product...) so AI engines can classify and cite your content.");
  }

  const parseErrors = items.filter((i) => typeof i === "object" && i !== null && "_parseError" in (i as Record<string, unknown>));
  if (parseErrors.length === items.length) {
    return build("structured-data", "Structured data (JSON-LD)", "structuredData", "FAIL", "JSON-LD blocks found, but every one contains invalid JSON", {
      normalizedScore: 0.05, schemasFound: [], parseErrors: parseErrors.length,
    }, "Fix the malformed JSON-LD blocks on this page — broken schema provides no signal.");
  }

  const validItems = items.filter((i) => !(typeof i === "object" && i !== null && "_parseError" in (i as Record<string, unknown>)));
  const schemaTypes = validItems.map(schemaType).filter((t): t is string => t !== null);
  const recognized = schemaTypes.filter((t) => RECOGNIZED_TYPES.has(t));
  const hasContext = validItems.some(hasValidContext);

  const missingFields: string[] = [];
  const fieldChecks: { type: string; missing: string[] }[] = [];
  for (const item of validItems) {
    const t = schemaType(item);
    if (!t || !RECOGNIZED_TYPES.has(t)) continue;
    const obj = item as Record<string, unknown>;
    const required = REQUIRED_FIELDS[t] ?? [];
    const missing = required.filter((f) => !obj[f]);
    if (missing.length) missingFields.push(...missing.map((x) => `${t}.${x}`));
    fieldChecks.push({ type: t, missing });
  }

  // Title ↔ schema headline/name partial match
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch?.[1]?.trim().toLowerCase() ?? "";
  let titleMismatch = false;
  if (pageTitle && validItems.length > 0) {
    const hasMatch = validItems.some((item) => {
      const obj = item as Record<string, unknown>;
      const st = typeof obj["headline"] === "string" ? obj["headline"].toLowerCase() : typeof obj["name"] === "string" ? obj["name"].toLowerCase() : null;
      return st ? pageTitle.includes(st.substring(0, 20)) || st.includes(pageTitle.substring(0, 20)) : false;
    });
    titleMismatch = !hasMatch;
  }

  let score: number;
  if (recognized.length === 0) {
    score = 0.25;
  } else if (missingFields.length > 0) {
    score = 0.55;
  } else if (titleMismatch) {
    score = 0.65;
  } else {
    score = recognized.length >= 2 ? 1 : 0.88;
    if (!hasContext) score = Math.max(0, score - 0.1);
  }
  if (parseErrors.length > 0) score = Math.max(0, score - 0.15);
  score = Number(Math.min(1, Math.max(0, score)).toFixed(2));

  const status = score >= 0.75 ? "PASS" : score >= 0.4 ? "WARNING" : "FAIL";
  const reason =
    recognized.length === 0
      ? `JSON-LD found but none of the schema types are recognized (${schemaTypes.join(", ") || "none declared"})`
      : missingFields.length > 0
        ? `Schema found (${recognized.join(", ")}) but key fields are missing: ${missingFields.join(", ")}`
        : titleMismatch
          ? `Schema found (${recognized.join(", ")}) but the schema name/headline may not match the page title`
          : `Valid structured data found: ${recognized.join(", ")}`;

  return build("structured-data", "Structured data (JSON-LD)", "structuredData", status, reason, {
    normalizedScore: score,
    totalBlocks: items.length,
    parseErrors: parseErrors.length,
    schemaTypes,
    recognizedTypes: recognized,
    hasValidContext: hasContext,
    fieldChecks,
    missingFields,
    titleMismatch,
  });
}

const AUTHORITATIVE = [".gov", ".edu", ".ac.uk", ".ac.au", "wikipedia.org", "reuters.com", "apnews.com", "pubmed.ncbi.nlm.nih.gov", "scholar.google.com", "nature.com", "sciencedirect.com", "ncbi.nlm.nih.gov", "who.int", "cdc.gov", "nih.gov"];
const SOCIAL = ["linkedin.com", "twitter.com", "x.com", "github.com", "facebook.com", "instagram.com", "youtube.com", "orcid.org", "researchgate.net"];

function deepFind(obj: unknown, key: string): unknown {
  if (typeof obj !== "object" || obj === null) return undefined;
  const rec = obj as Record<string, unknown>;
  if (key in rec) return rec[key];
  for (const v of Object.values(rec)) {
    const r = deepFind(v, key);
    if (r !== undefined) return r;
  }
  return undefined;
}

function extractAllHrefs(html: string): string[] {
  const out: string[] = [];
  const re = /href=["']([^"'#\s]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

export function eeatSignalsCheck(ctx: CheckCtx): GeoCheckResult {
  const html = ctx.base?.body ?? "";
  const links = extractAllHrefs(html);
  const schemas = extractJsonLdItems(html).filter((i) => typeof i === "object" && i !== null) as Record<string, unknown>[];
  const jsonLdObjects = schemas; // JSON-LD objects in document order

  const sameAsLinks: string[] = [];
  const jsonLdStrs = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of jsonLdStrs) {
    try {
      const obj = JSON.parse(block.replace(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/i, "").replace(/<\/script>/gi, ""));
      const items = Array.isArray(obj) ? obj : [obj];
      for (const item of items) {
        const s = deepFind(item, "sameAs");
        if (typeof s === "string") sameAsLinks.push(s);
        else if (Array.isArray(s)) sameAsLinks.push(...s.filter((x): x is string => typeof x === "string"));
      }
    } catch {
      /* skip */
    }
  }

  const isPerson = (s: Record<string, unknown>) => ["Person"].includes(String(s["@type"]));
  const hasPerson = jsonLdObjects.some(isPerson);
  const hasOrgSchema = jsonLdObjects.some((s) => ["Organization", "LocalBusiness", "Corporation"].includes(String(s["@type"])));
  const hasAuthor = jsonLdObjects.some((s) => deepFind(s, "author") != null);
  const authorNamed = jsonLdObjects.some((s) => {
    const a = deepFind(s, "author");
    return a != null && (typeof a === "object" && (a as Record<string, unknown>)["name"] ? true : typeof a === "string" && a.length > 0);
  });
  const socialProfiles = sameAsLinks.some((l) => SOCIAL.some((d) => l.includes(d)));
  const orgNamed = jsonLdObjects.some((s) => isOrg(s) && typeof s["name"] === "string" && s["name"].length > 0);
  const orgLogo = jsonLdObjects.some((s) => deepFind(s, "logo") != null);
  const orgContact = jsonLdObjects.some((s) => deepFind(s, "contactPoint") != null || deepFind(s, "email") != null);
  const hasPublisher = jsonLdObjects.some((s) => deepFind(s, "publisher") != null);
  const hasAbout = hasInternalPageLink(links, "/about", "/about-us", "/team", "/who-we-are");
  const hasContact = hasInternalPageLink(links, "/contact", "/contact-us", "/get-in-touch");
  const authLinks = links.filter((l) => AUTHORITATIVE.some((d) => l.toLowerCase().includes(d))).length;
  const hasByline = /(<[^>]+(class|itemprop)=["'][^"']*(author|byline|writer)[^"']*["'][^>]*>)/i.test(html);

  const signals: { signal: string; found: boolean; weight: number }[] = [
    { signal: "Author in schema", found: hasAuthor, weight: 12 },
    { signal: "Author name present", found: authorNamed, weight: 10 },
    { signal: "Author social profiles (sameAs)", found: socialProfiles, weight: 10 },
    { signal: "HTML byline / author markup", found: hasByline, weight: 6 },
    { signal: "Organization schema", found: hasOrgSchema || orgNamed, weight: 10 },
    { signal: "Organization logo", found: orgLogo, weight: 6 },
    { signal: "Organization contact info", found: orgContact, weight: 8 },
    { signal: "Publisher declared in schema", found: hasPublisher, weight: 8 },
    { signal: "About / Team page linked", found: hasAbout, weight: 10 },
    { signal: "Contact page linked", found: hasContact, weight: 8 },
    { signal: "Authoritative external citations", found: authLinks >= 1, weight: 12 },
    { signal: "Person schema (author bio)", found: hasPerson, weight: 0 },
  ];

  const totalWeight = signals.reduce((a, s) => a + s.weight, 0);
  const earned = signals.filter((s) => s.found).reduce((a, s) => a + s.weight, 0);
  const score = Number((earned / totalWeight).toFixed(2));
  const foundSignals = signals.filter((s) => s.found).map((s) => s.signal);
  const missingSignals = signals.filter((s) => !s.found && s.weight > 0).map((s) => s.signal);
  const status = score >= 0.65 ? "PASS" : score >= 0.35 ? "WARNING" : "FAIL";

  return build("eeat-signals", "E-E-A-T signals", "structuredData", status,
    status === "PASS"
      ? `Strong E-E-A-T signals: ${foundSignals.slice(0, 3).join(", ")}${foundSignals.length > 3 ? ` +${foundSignals.length - 3} more` : ""}`
      : status === "WARNING"
        ? `Partial E-E-A-T — missing: ${missingSignals.slice(0, 3).join(", ")}${missingSignals.length > 3 ? ` +${missingSignals.length - 3} more` : ""}`
        : "Weak E-E-A-T — AI engines cannot verify the authorship or authority of this content",
    {
      normalizedScore: score,
      foundCount: foundSignals.length,
      totalSignals: signals.length,
      foundSignals,
      missingSignals,
      authoritativeLinkCount: authLinks,
      hasSocialProfiles: socialProfiles,
    },
    status === "FAIL" || status === "WARNING"
      ? "Add author bylines, Organization/Person schema with sameAs social links, an About page, and links to authoritative sources so AI engines can verify who wrote this and why it is trustworthy."
      : undefined
  );
}

function isOrg(s: Record<string, unknown>): boolean {
  return ["Organization", "LocalBusiness", "Corporation"].includes(String(s["@type"]));
}

function hasInternalPageLink(links: string[], ...prefixes: string[]): boolean {
  return links.some((l) => {
    try {
      const u = new URL(l, "https://placeholder.invalid");
      const p = u.pathname.toLowerCase();
      return prefixes.some((pf) => p === pf || p.startsWith(pf + "/"));
    } catch {
      return false;
    }
  });
}
