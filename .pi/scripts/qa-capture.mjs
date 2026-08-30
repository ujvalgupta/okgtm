#!/usr/bin/env node
/**
 * qa-capture.mjs — visual QA capture helper for the OkGTM pipeline.
 *
 * Implements the code-qa visual capture protocol (see frontend/.pi/agents/code-qa.md):
 *   (a) FULL-PAGE captures at each breakpoint — LAYOUT pass only
 *   (b) PER-SECTION 1:1 captures — every <section> plus <header>/<footer>,
 *       scrolled into view first (fires scroll-reveal), clipped to its own
 *       bounds at deviceScaleFactor 1 — DETAIL/legibility pass
 *
 * Usage:
 *   node qa-capture.mjs <url> <outdir> [--breakpoints 375,768,1440] [--no-full]
 *
 * Outputs per breakpoint W:
 *   <outdir>/full-<W>.png               full-page screenshot (layout)
 *   <outdir>/sec-<NN>-<slug>-<W>.png    per-element capture (header, each section, footer)
 *   <outdir>/manifest.json              capture manifest (files + element list)
 *
 * The vision model judges legibility/composition from the sec-* captures
 * (1:1, not downscaled), and layout/rhythm from the full-* captures.
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const flags = args.filter((a) => a.startsWith("--"));

const [url, outdir] = positional;

function flagValue(name, fallback) {
  const i = flags.indexOf(name);
  if (i === -1 || !flags[i + 1]) return fallback;
  return flags[i + 1];
}

const BREAKPOINTS = (flagValue("--breakpoints", "375,768,1440") || "375,768,1440")
  .split(",")
  .map((n) => parseInt(n, 10))
  .filter((n) => Number.isFinite(n) && n > 0);
const WANT_FULL = !flags.includes("--no-full");
const GOTO_TIMEOUT = 45000;
const SETTLE_MS = 400;

if (!url || !outdir) {
  console.error("Usage: node qa-capture.mjs <url> <outdir> [--breakpoints 375,768,1440] [--no-full]");
  process.exit(1);
}

fs.mkdirSync(outdir, { recursive: true });

const log = (msg) => console.log(`[qa-capture] ${msg}`);

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "section";
}

const browser = await chromium.launch({ headless: true });
const manifest = { url, capturedAt: new Date().toISOString(), breakpoints: BREAKPOINTS, files: [] };

try {
  for (const width of BREAKPOINTS) {
    const height = width <= 500 ? 812 : width <= 900 ? 1024 : 900;
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });

    log(`loading ${url} @ ${width}px`);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: GOTO_TIMEOUT });
    } catch {
      await page.goto(url, { waitUntil: "load", timeout: GOTO_TIMEOUT });
    }
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await page.waitForTimeout(300);

    // Scroll to the bottom and back so IntersectionObserver reveals fire,
    // then return to top for a settled full-page capture.
    const scrollHeight = await page.evaluate(() =>
      Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0)
    );
    const steps = Math.max(1, Math.ceil(scrollHeight / height) + 1);
    for (let i = 1; i <= steps; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.min(i * height * 0.9, scrollHeight));
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(SETTLE_MS);

    // (a) Full-page capture — LAYOUT pass
    if (WANT_FULL) {
      const fullPath = path.join(outdir, `full-${width}.png`);
      await page.screenshot({ path: fullPath, fullPage: true });
      manifest.files.push({ kind: "full", width, file: fullPath });
      log(`  full-${width}.png`);
    }

    // (b) Per-element 1:1 captures — DETAIL pass (header, sections, footer)
    const elements = await page.evaluate(() => {
      const targets = Array.from(
        document.querySelectorAll("header[role='banner'], section, footer")
      );
      return targets.map((el, i) => {
        const id = el.id || "";
        const heading = el.querySelector("h1, h2, h3")?.textContent?.trim() || "";
        return {
          index: i,
          tag: el.tagName.toLowerCase(),
          id,
          heading,
          rect: (() => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
          })(),
        };
      });
    });

    for (const el of elements) {
      const slugBase = el.id || el.heading || `${el.tag}-${el.index}`;
      const slug = el.tag === "header" ? "nav" : slugify(slugBase);
      const file = path.join(outdir, `sec-${String(el.index).padStart(2, "0")}-${slug}-${width}.png`);

      // Scroll the element into view so its content is settled/rendered, then
      // capture its exact bounds in page coordinates (clip works on full page,
      // so the sticky header never overlaps the capture).
      await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 40)), el.rect.y);
      await page.waitForTimeout(250);

      // Re-measure after scrolling (layout may shift from reveal transitions)
      const rect = await page.evaluate((idx) => {
        const els = document.querySelectorAll("header[role='banner'], section, footer");
        const el = els[idx];
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
      }, el.index);

      if (rect.width < 4 || rect.height < 4) {
        log(`  SKIP ${file} (zero-size element)`);
        continue;
      }

      await page.screenshot({
        path: file,
        fullPage: true,
        clip: {
          x: Math.max(0, Math.round(rect.x)),
          y: Math.max(0, Math.round(rect.y)),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      });
      manifest.files.push({ kind: "section", width, index: el.index, tag: el.tag, id: el.id, heading: el.heading, file });
      log(`  ${path.basename(file)} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
    }

    await page.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outdir, "manifest.json"), JSON.stringify(manifest, null, 2));
log(`done — ${manifest.files.length} files, manifest at ${path.join(outdir, "manifest.json")}`);
