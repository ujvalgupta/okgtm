#!/usr/bin/env node
/**
 * fetch-page.mjs — page capture helper (v4, text-first)
 *
 * Usage:
 *   node fetch-page.mjs <url> <outdir> [--screenshot] [--html] [--browser]
 *
 * Outputs into <outdir>:
 *   page.txt        visible text (always written)
 *   page.html       full markup: raw HTTP response in direct mode, rendered DOM
 *                   in browser mode (only with --html)
 *   screenshot.png  full-page screenshot (only with --browser and --screenshot)
 *
 * ---------------------------------------------------------------------------
 * Capture strategy (v4, 2026-08-23):
 *
 * TEXT-FIRST (default, no browser): plain HTTP fetch the URL, strip
 * <script>/<style>/<noscript>/<svg>/<head> blocks and tags, decode entities,
 * write page.txt. Cheap (no Chromium, ~1s) and works for most marketing sites.
 * Screenshots and full HTML are NOT produced unless explicitly requested —
 * the reference agent analyzes text only.
 *
 * BROWSER FALLBACK (only when direct text is too sparse): some sites are
 * JS-rendered SPAs, Cloudflare-challenged, or return empty/near-empty markup to
 * plain fetch. In that case launch Playwright, load the page, scroll to force
 * lazy reveals, kill animations, force-reveal opacity:0 elements, then write
 * page.txt (page.html / screenshot.png only when the matching flags are set).
 *
 * Flags:
 *   --screenshot   also write screenshot.png (full-page; browser mode only)
 *   --html         also write page.html (raw response in direct mode,
 *                  rendered DOM in browser mode)
 *   --browser      force browser mode even if direct text looks sufficient
 * ---------------------------------------------------------------------------
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const FLAG_RE = /^--/;
const flags = args.filter((a) => FLAG_RE.test(a));
const positional = args.filter((a) => !FLAG_RE.test(a));

const [url, outdir] = positional;
const WANT_SCREENSHOT = flags.includes("--screenshot");
const WANT_HTML = flags.includes("--html");
const FORCE_BROWSER = flags.includes("--browser");

if (!url || !outdir) {
  console.error("Usage: node fetch-page.mjs <url> <outdir> [--screenshot] [--html] [--browser]");
  process.exit(1);
}

fs.mkdirSync(outdir, { recursive: true });

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const log = (msg) => console.log(`[fetch-page] ${msg}`);

/* ────────────────────────────────────────────────────────────────
   Direct text extraction (no browser)
   ──────────────────────────────────────────────────────────────── */

const BLOCK_TAG_RE =
  /<(script|style|noscript|svg|head|template|iframe|canvas)[\s\S]*?<\/\1\s*>/gi;
const LINE_BREAK_RE =
  /<\/(p|div|li|ul|ol|h1|h2|h3|h4|h5|h6|tr|section|header|footer|article|aside|blockquote|table|br)\s*>/gi;
const TAG_RE = /<[^>]+>/g;
const ENTITY_RE = /&(amp|lt|gt|quot|#39|#x27|apos|nbsp|hellip|mdash|ndash);/gi;
const WHITESPACE_RE = /[ \t]+/g;
const NEWLINE_RE = /\n{3,}/g;

function decodeEntities(s) {
  return s.replace(ENTITY_RE, (m) => {
    switch (m) {
      case "&amp;":
        return "&";
      case "&lt;":
        return "<";
      case "&gt;":
        return ">";
      case "&quot;":
        return '"';
      case "&#39;":
      case "&#x27;":
      case "&apos;":
        return "'";
      case "&nbsp;":
        return " ";
      case "&hellip;":
        return "...";
      case "&mdash;":
        return "-";
      case "&ndash;":
        return "-";
      default:
        return m;
    }
  });
}

/** Strip markup to visible text. Returns { text, chars } where chars = non-whitespace count. */
function htmlToText(html) {
  let s = html
    .replace(BLOCK_TAG_RE, "\n")
    .replace(LINE_BREAK_RE, "\n")
    .replace(TAG_RE, "")
    .replace(ENTITY_RE, (m) => decodeEntities(m));
  // entity decode pass again for double-encoded pages
  s = decodeEntities(s);
  s = s.replace(WHITESPACE_RE, " ").replace(NEWLINE_RE, "\n\n");
  const lines = s
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const text = lines.join("\n");
  const chars = text.replace(/\s/g, "").length;
  return { text, chars };
}

/** Heuristic: is this extracted text enough to analyze, or should we spin up a browser? */
function isSufficient(text, chars) {
  if (chars < 300) return false;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 25) return false;
  // Cloudflare "Just a moment..." interstitial yields tiny text → insufficient
  if (/just a moment|checking your browser|enable javascript/i.test(text) && chars < 2000) {
    return false;
  }
  return true;
}

async function tryDirectFetch() {
  log(`direct fetch: ${url}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      log(`direct fetch HTTP ${res.status} ${res.statusText} — falling back to browser`);
      return null;
    }
    const ctype = res.headers.get("content-type") || "";
    const raw = await res.text();
    if (!ctype.includes("html") && !raw.trimStart().startsWith("<")) {
      log(`response is not HTML (${ctype || "unknown"}) — falling back to browser`);
      return null;
    }
    const { text, chars } = htmlToText(raw);
    if (!isSufficient(text, chars)) {
      log(`direct text too sparse (${chars} chars) — falling back to browser`);
      return null;
    }
    fs.writeFileSync(path.join(outdir, "page.txt"), text);
    log(`  page.txt (${chars} chars)`);
    if (WANT_HTML) {
      fs.writeFileSync(path.join(outdir, "page.html"), raw);
      log(`  page.html (${raw.length} bytes, raw response)`);
    }
    return { mode: "direct", chars };
  } catch (err) {
    log(`direct fetch failed (${err.message.split("\n")[0]}) — falling back to browser`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ────────────────────────────────────────────────────────────────
   Browser capture (Playwright fallback / --browser)
   ──────────────────────────────────────────────────────────────── */

const VIEWPORT = { width: 1440, height: 900 };
const STEP_FRACTION = 0.9; // scroll 90% of viewport per step (overlap so observers fire)
const STEP_PAUSE_MS = 150; // settle per scroll step
const SETTLE_MS = 1200; // final settle after force-reveal
const MAX_STEPS = 90; // hard cap (~120k px) against infinite scroll
const GOTO_TIMEOUT = 45000;

async function runBrowser() {
  log(`browser capture: ${url}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: VIEWPORT,
    userAgent: UA,
  });

  try {
    // 1. Load the page
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: GOTO_TIMEOUT });
      log("networkidle reached on first load");
    } catch (err) {
      log(`networkidle failed (${err.message.split("\n")[0]}); falling back to 'load'`);
      await page.goto(url, { waitUntil: "load", timeout: GOTO_TIMEOUT });
    }

    // 2. Kill smooth-scroll so window.scrollTo is deterministic
    await page.addStyleTag({
      content: "html, body { scroll-behavior: auto !important; }",
    });

    // 3. Webfonts — avoid capturing fallback-font flash and layout shift
    await page
      .evaluate(() => document.fonts?.ready)
      .catch(() => log("document.fonts.ready unavailable — continuing"));

    // 4. Scroll pass: down to the bottom, then back up to the top
    const scrollHeight = await page.evaluate(() =>
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0
      )
    );
    log(`page scrollHeight = ${scrollHeight}px`);

    const stepPx = VIEWPORT.height * STEP_FRACTION;
    const steps = Math.min(MAX_STEPS, Math.ceil(scrollHeight / stepPx) + 1);
    log(`scroll pass: ${steps} steps of ${Math.round(stepPx)}px`);

    const scrollTo = (y) =>
      page.evaluate((target) => window.scrollTo(0, target), y);

    for (let i = 1; i <= steps; i++) {
      await scrollTo(Math.min(i * stepPx, scrollHeight));
      await page.waitForTimeout(STEP_PAUSE_MS);
    }
    for (let i = steps - 1; i >= 0; i--) {
      await scrollTo(i * stepPx);
      await page.waitForTimeout(STEP_PAUSE_MS);
    }
    await scrollTo(0);
    await page.waitForTimeout(300);

    // 5. Force-reveal: kill animations, reveal anything still fully transparent
    await page.addStyleTag({
      content:
        "*, *::before, *::after { animation: none !important; transition: none !important; }",
    });
    const forced = await page.evaluate(() => {
      let n = 0;
      document.querySelectorAll("*").forEach((el) => {
        if (parseFloat(getComputedStyle(el).opacity) === 0) {
          el.style.opacity = "1";
          n++;
        }
      });
      return n;
    });
    log(`force-reveal: set opacity 1 on ${forced} fully-transparent element(s)`);

    // 6. Settle then capture
    await page.waitForTimeout(SETTLE_MS);

    const text = await page.evaluate(() => document.body?.innerText ?? "");
    fs.writeFileSync(path.join(outdir, "page.txt"), text);
    const chars = text.replace(/\s/g, "").length;
    log(`  page.txt (${chars} chars, rendered DOM text)`);

    if (WANT_HTML) {
      const html = await page.content();
      fs.writeFileSync(path.join(outdir, "page.html"), html);
      log(`  page.html (${html.length} bytes, rendered DOM)`);
    }

    if (WANT_SCREENSHOT) {
      await page.screenshot({ path: path.join(outdir, "screenshot.png"), fullPage: true });
      const sz = fs.statSync(path.join(outdir, "screenshot.png")).size;
      log(`  screenshot.png (${sz} bytes)`);
    }

    return { mode: "browser", chars };
  } finally {
    await browser.close();
  }
}

/* ────────────────────────────────────────────────────────────────
   Main
   ──────────────────────────────────────────────────────────────── */

let result;
if (!FORCE_BROWSER) {
  result = await tryDirectFetch();
}
if (!result) {
  result = await runBrowser();
}

log(
  `captured ${url} — mode=${result.mode}, text=${result.chars} chars, ` +
    `html=${WANT_HTML ? "yes" : "no"}, screenshot=${WANT_SCREENSHOT ? "yes" : "no"}`
);
