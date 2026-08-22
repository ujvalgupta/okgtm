#!/usr/bin/env node
/**
 * fetch-page.mjs — Playwright page capture helper for the reference subagent.
 *
 * Usage:
 *   node fetch-page.mjs <url> <output-dir>
 *
 * Writes into <output-dir>:
 *   screenshot.png   full-page screenshot (viewport 1440x900)
 *   page.html        rendered DOM after network idle
 *   page.txt         visible text (document.body.innerText)
 *
 * Handles JS-rendered/SPA sites that plain fetch cannot. No API keys needed.
 * Installed locally in this directory (own package.json + node_modules) so it
 * never interferes with the Next.js app at frontend/.
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

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
});

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
} catch (err) {
  // Some sites never reach networkidle; fall back to domcontentloaded
  console.warn(`networkidle failed (${err.message.split("\n")[0]}); retrying with domcontentloaded`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
}

await page.screenshot({ path: path.join(outdir, "screenshot.png"), fullPage: true });

const html = await page.content();
fs.writeFileSync(path.join(outdir, "page.html"), html);

const text = await page.evaluate(() => document.body?.innerText ?? "");
fs.writeFileSync(path.join(outdir, "page.txt"), text);

await browser.close();

console.log(`Captured ${url}`);
console.log(`  screenshot.png (${fs.statSync(path.join(outdir, "screenshot.png")).size} bytes)`);
console.log(`  page.html (${html.length} bytes)`);
console.log(`  page.txt (${text.length} chars)`);
