/**
 * Code-required strings for GEO & AI Crawl Checker (see copy.md in this folder for the
 * authoritative authored copy — meta.ts and copy.md are synced by hand).
 */

import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  "slug": "geo-audit",
  "addedAt": "2026-09-03",
  "sortOrder": 2,
  "name": "GEO & AI Crawl Checker",
  "tagline": "Can AI engines find, read and cite your pages? 14 checks across 7 categories: schema, E-E-A-T, bot access, llms.txt and more.",
  "features": [
    "Checks schema.org, E-E-A-T, robots, canonical and llms.txt",
    "Simulates 7 AI crawlers against your page",
    "Scored in seconds with fixes you can use"
  ],
  "heroH1": "Can AI engines find, parse and cite your site?",
  "heroSubhead": "Paste any URL. We check the signals AI engines and answer engines look for: structured data, E-E-A-T, bot access, crawl signals and content quality. Deterministic checks, scored in about 10 seconds, right on this page.",
  "whatItDoes": "GEO & AI Crawl Checker runs 14 deterministic checks across 7 categories to answer one question: can AI engines find, understand and cite your page? It reads your robots.txt and simulates seven AI crawlers, parses your JSON-LD schema and E-E-A-T signals, checks canonical tags, sitemaps, llms.txt, Open Graph, content freshness and more, then samples other pages on your site for site-wide health. Two browser-level checks (JavaScript rendering and Core Web Vitals) are reported separately because they need a real browser, and they never count against your score.",
  "howItWorks": [
    {
      "title": "Paste a URL.",
      "body": "A bare domain or a full page URL both work. No signup and nothing is stored."
    },
    {
      "title": "We run 14 deterministic checks.",
      "body": "Fetchability, bot access, crawl signals, schema, E-E-A-T, content quality and a site-wide sample. No paid APIs, no AI guesses."
    },
    {
      "title": "You get a score and real fixes.",
      "body": "Every finding shows why it matters and what to change, with evidence you can verify yourself."
    }
  ],
  "whatYouGet": [
    {
      "title": "A GEO score with evidence.",
      "body": "One number per page and per category, each backed by the raw responses and records we read."
    },
    {
      "title": "Fixes ranked by impact.",
      "body": "Actionable findings first: add JSON-LD, allow AI crawlers, publish a sitemap, add canonical and Open Graph tags."
    },
    {
      "title": "Honest unknowns.",
      "body": "Browser-only checks are labeled as not assessed instead of guessed, and never count against you."
    }
  ],
  "faq": [
    {
      "q": "Is this an SEO audit?",
      "a": "It is a GEO (generative engine optimization) audit: it checks whether AI engines and answer engines can find your page, understand its structure, and cite it as a source. Traditional SEO signals that matter to AI engines are included, but this is not a keyword or ranking tool."
    },
    {
      "q": "Why does it say JavaScript rendering was not assessed?",
      "a": "That check needs to execute your page in a real browser to compare raw HTML with what actually renders, and Core Web Vitals need real page loads. This free check runs without a browser, so those two are reported as not assessed and excluded from your score instead of guessed."
    },
    {
      "q": "Why does the score change if I test again?",
      "a": "It usually should not change for the same page, because every check is deterministic. Scores differ when a page serves different content to different crawlers, which the tool will flag, or when you fix a finding between runs."
    },
    {
      "q": "What does it mean when an AI crawler appears blocked?",
      "a": "The tool fetches your page with each crawler's real user agent. If the response is a 401, 403 or a challenge page, that crawler is effectively blocked even when robots.txt allows it. That often comes from a bot-management layer, not from robots.txt."
    }
  ],
  "metaDescription": "Free GEO checker: can AI engines find, parse and cite your pages? 14 deterministic checks across schema, E-E-A-T, bot access, llms.txt and more. Results on the page.",
  "family": "instant"
};
