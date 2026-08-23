#!/usr/bin/env node
/**
 * fetch-page.mjs — Playwright page capture helper for the reference subagent.
 *
 * Usage:
 *   node fetch-page.mjs <url> <output-dir>
 *
 * Writes into <output-dir>:
 *   screenshot.png   full-page screenshot (viewport 1440x900)
 *   page.html        rendered DOM after capture
 *   page.txt         visible text (document.body.innerText)
 *
 * ---------------------------------------------------------------------------
 * Capture strategy (v3, 2026-08-23):
 *
 * Modern marketing pages (especially animated ones) reveal content lazily:
 * scroll-triggered IntersectionObserver reveals, `content-visibility: auto`,
 * and `loading="lazy"` images render only as the content enters the viewport.
 * Verified on workflows.io: a fullPage screenshot right after networkidle
 * captures those sections as empty/blank bands, and a scroll pass alone is NOT
 * enough — several sections (customer logo grid, feature-card titles, diagram
 * panels) stay at `opacity: 0` even at scrollY=0 because their reveal is
 * animation-bound and never completes at that position. Computed opacity stays
 * 0, and setting inline `opacity: 1` alone loses to running CSS animations.
 *
 * The script therefore:
 *   1. goto (networkidle, fallback to `load`)
 *   2. disable smooth-scroll (deterministic programmatic scrolling)
 *   3. wait for webfonts
 *   4. scroll to the bottom and back to the top in viewport-height steps with
 *      settle pauses (fires scroll-triggered reveals + lazy image loads)
 *   5. FORCE-REVEAL: kill all CSS animations/transitions, then set opacity 1
 *      on every element still fully transparent — recovers the animation-bound
 *      sections that never reveal at scrollY=0. Known trade-off: elements
 *      driven by running animations freeze at their current state (e.g. a
 *      scroll-scrubbed diagram may render low-contrast). For a reference
 *      capture, content completeness beats animation fidelity.
 *   6. settle, then capture full-page screenshot + DOM + visible text
 * ---------------------------------------------------------------------------
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const [url, outdir] = process.argv.slice(2);

if (!url || !outdir) {
  console.error("Usage: node fetch-page.mjs <url> <output-dir>");
  process.exit(1);
}

fs.mkdirSync(outdir, { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };
const STEP_FRACTION = 0.9; // scroll 90% of viewport per step (overlap so observers fire)
const STEP_PAUSE_MS = 150; // settle per scroll step
const SETTLE_MS = 1200; // final settle after force-reveal
const MAX_STEPS = 90; // hard cap (~120k px) against infinite scroll
const GOTO_TIMEOUT = 45000;

const log = (msg) => console.log(`[fetch-page] ${msg}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: VIEWPORT,
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
});

try {
  // 1. Load the page
  log(`loading ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: GOTO_TIMEOUT });
    log("networkidle reached on first load");
  } catch (err) {
    // Sites with polling/websockets never reach networkidle — fall back to 'load'
    log(`networkidle failed (${err.message.split("\n")[0]}); falling back to 'load'`);
    await page.goto(url, { waitUntil: "load", timeout: GOTO_TIMEOUT });
  }

  // 2. Kill smooth-scroll so window.scrollTo is deterministic (some sites set
  //    `scroll-behavior: smooth` on <html>, which would animate every step)
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

  // 5. Force-reveal: kill animations/transitions, then reveal anything still
  //    fully transparent (animation-bound reveals never complete at scrollY=0;
  //    inline opacity alone loses to running animations, so kill them first)
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

  await page.screenshot({ path: path.join(outdir, "screenshot.png"), fullPage: true });
  const html = await page.content();
  fs.writeFileSync(path.join(outdir, "page.html"), html);
  const text = await page.evaluate(() => document.body?.innerText ?? "");
  fs.writeFileSync(path.join(outdir, "page.txt"), text);

  log(`captured ${url}`);
  log(`  screenshot.png (${fs.statSync(path.join(outdir, "screenshot.png")).size} bytes)`);
  log(`  page.html (${html.length} bytes)`);
  log(`  page.txt (${text.length} chars)`);
} finally {
  await browser.close();
}
