> Authoritative authored copy for GEO & AI Crawl Checker. The strings code renders live in
> `meta.ts` beside this file — they are synced here by hand (ADR 0002).
>
> instant tool · slug `geo-audit`

# GEO & AI Crawl Checker

> Can AI engines find, read and cite your pages? 14 checks across 7 categories: schema, E-E-A-T, bot access, llms.txt and more.

## Features
- Checks schema.org, E-E-A-T, robots, canonical and llms.txt
- Simulates 7 AI crawlers against your page
- Scored in seconds with fixes you can use

## Hero

**H1:** Can AI engines find, parse and cite your site?

Paste any URL. We check the signals AI engines and answer engines look for: structured data, E-E-A-T, bot access, crawl signals and content quality. Deterministic checks, scored in about 10 seconds, right on this page.

## What it does

GEO & AI Crawl Checker runs 14 deterministic checks across 7 categories to answer one question: can AI engines find, understand and cite your page? It reads your robots.txt and simulates seven AI crawlers, parses your JSON-LD schema and E-E-A-T signals, checks canonical tags, sitemaps, llms.txt, Open Graph, content freshness and more, then samples other pages on your site for site-wide health. Two browser-level checks (JavaScript rendering and Core Web Vitals) are reported separately because they need a real browser, and they never count against your score.

## How it works
1. **Paste a URL.** A bare domain or a full page URL both work. No signup and nothing is stored.
2. **We run 14 deterministic checks.** Fetchability, bot access, crawl signals, schema, E-E-A-T, content quality and a site-wide sample. No paid APIs, no AI guesses.
3. **You get a score and real fixes.** Every finding shows why it matters and what to change, with evidence you can verify yourself.

## What you get
1. **A GEO score with evidence.** One number per page and per category, each backed by the raw responses and records we read.
2. **Fixes ranked by impact.** Actionable findings first: add JSON-LD, allow AI crawlers, publish a sitemap, add canonical and Open Graph tags.
3. **Honest unknowns.** Browser-only checks are labeled as not assessed instead of guessed, and never count against you.

## FAQ
### Is this an SEO audit?

It is a GEO (generative engine optimization) audit: it checks whether AI engines and answer engines can find your page, understand its structure, and cite it as a source. Traditional SEO signals that matter to AI engines are included, but this is not a keyword or ranking tool.
### Why does it say JavaScript rendering was not assessed?

That check needs to execute your page in a real browser to compare raw HTML with what actually renders, and Core Web Vitals need real page loads. This free check runs without a browser, so those two are reported as not assessed and excluded from your score instead of guessed.
### Why does the score change if I test again?

It usually should not change for the same page, because every check is deterministic. Scores differ when a page serves different content to different crawlers, which the tool will flag, or when you fix a finding between runs.
### What does it mean when an AI crawler appears blocked?

The tool fetches your page with each crawler's real user agent. If the response is a 401, 403 or a challenge page, that crawler is effectively blocked even when robots.txt allows it. That often comes from a bot-management layer, not from robots.txt.

**Meta description:** Free GEO checker: can AI engines find, parse and cite your pages? 14 deterministic checks across schema, E-E-A-T, bot access, llms.txt and more. Results on the page.
