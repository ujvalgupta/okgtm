import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:3001";
const OUT = process.argv[3] || "/tmp/ux-shots";
import fs from "fs";
fs.mkdirSync(OUT, { recursive: true });

const consoleErrors = [];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function steppedMove(page, from, to, steps = 20, delay = 15) {
  for (let i = 1; i <= steps; i++) {
    const x = from.x + (to.x - from.x) * (i / steps);
    const y = from.y + (to.y - from.y) * (i / steps);
    await page.mouse.move(x, y);
    await sleep(delay);
  }
}

(async () => {
  const browser = await chromium.launch();
  const results = {};

  // ---- Desktop pass ----
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`[desktop] ${msg.text()}`);
    });
    page.on("pageerror", (err) => consoleErrors.push(`[desktop-pageerror] ${err.message}`));

    await page.goto(BASE, { waitUntil: "networkidle" });
    await sleep(500);

    // Scroll down through page with realistic wheel deltas + pauses
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 300 + Math.random() * 200);
      await sleep(180 + Math.random() * 120);
    }
    await page.screenshot({ path: `${OUT}/desktop-after-scroll.png`, fullPage: false });

    // Scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await sleep(300);

    // Hover Resources dropdown with stepped movement
    const trigger = await page.locator("button:has-text('Resources')");
    const box = await trigger.boundingBox();
    const start = { x: 50, y: 50 };
    const triggerCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await steppedMove(page, start, triggerCenter, 25, 15);
    await sleep(300);
    let panelVisible = await page.locator("[role='menu']").isVisible().catch(() => false);
    results.dropdownOpensOnHover = panelVisible;

    // Move down through the gap into the panel (stepped)
    const panelBox = await page.locator("[role='menu']").boundingBox();
    if (panelBox) {
      const panelTop = { x: panelBox.x + panelBox.width / 2, y: panelBox.y + 10 };
      await steppedMove(page, triggerCenter, panelTop, 15, 20);
      await sleep(200);
      panelVisible = await page.locator("[role='menu']").isVisible().catch(() => false);
      results.dropdownStaysOpenDuringTraverse = panelVisible;

      // Hover an item then click
      const item = page.locator("[role='menuitem']").first();
      const itemBox = await item.boundingBox();
      await steppedMove(page, panelTop, { x: itemBox.x + itemBox.width/2, y: itemBox.y + itemBox.height/2 }, 10, 15);
      await sleep(400);
      await page.screenshot({ path: `${OUT}/desktop-dropdown-open.png` });
      const href = await item.getAttribute("href");
      await item.click();
      await sleep(500);
      results.dropdownClickHref = href;
      results.dropdownClickNavigated = page.url().includes(href);
    }

    // back to home
    await page.goto(BASE, { waitUntil: "networkidle" });
    await sleep(300);

    // Escape closes
    const trigger2 = await page.locator("button:has-text('Resources')");
    const box2 = await trigger2.boundingBox();
    await steppedMove(page, { x: 50, y: 50 }, { x: box2.x + box2.width/2, y: box2.y + box2.height/2 }, 20, 15);
    await sleep(300);
    let visBeforeEsc = await page.locator("[role='menu']").isVisible().catch(() => false);
    await page.keyboard.press("Escape");
    await sleep(200);
    let visAfterEsc = await page.locator("[role='menu']").isVisible().catch(() => false);
    results.escapeClosesDropdown = visBeforeEsc && !visAfterEsc;

    // Outside click closes — move away first, then back in to force a fresh hover
    await steppedMove(page, { x: box2.x + box2.width/2, y: box2.y + box2.height/2 }, { x: 50, y: 400 }, 10, 15);
    await sleep(200);
    await steppedMove(page, { x: 50, y: 400 }, { x: box2.x + box2.width/2, y: box2.y + box2.height/2 }, 20, 15);
    await sleep(300);
    visBeforeEsc = await page.locator("[role='menu']").isVisible().catch(() => false);
    await steppedMove(page, { x: box2.x + box2.width/2, y: box2.y + box2.height/2 }, { x: 700, y: 700 }, 15, 15);
    await page.mouse.click(700, 700);
    await sleep(300);
    visAfterEsc = await page.locator("[role='menu']").isVisible().catch(() => false);
    results.outsideClickCloses = visBeforeEsc && !visAfterEsc;

    // FAQ accordion open/close
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const faqTrigger = page.locator("text=What is OkGTM?").first();
    await faqTrigger.scrollIntoViewIfNeeded();
    await sleep(300);
    const faqBox = await faqTrigger.boundingBox();
    await steppedMove(page, { x: 50, y: 50 }, { x: faqBox.x + faqBox.width/2, y: faqBox.y + faqBox.height/2 }, 15, 15);
    await sleep(300);
    await page.mouse.click(faqBox.x + faqBox.width/2, faqBox.y + faqBox.height/2);
    await sleep(400);
    const answerVisible1 = await page.locator("text=hybrid GTM service").isVisible().catch(() => false);
    await page.screenshot({ path: `${OUT}/desktop-faq-open.png` });
    await page.mouse.click(faqBox.x + faqBox.width/2, faqBox.y + faqBox.height/2);
    await sleep(400);
    const answerVisible2 = await page.locator("text=hybrid GTM service").isVisible().catch(() => false);
    results.faqOpens = answerVisible1;
    results.faqCloses = !answerVisible2;

    // Newsletter form submit - should not reload
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await sleep(300);
    const emailInput = page.locator("#footer-email");
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.click();
    await emailInput.type("test@example.com", { delay: 40 });
    const urlBefore = page.url();
    let navigated = false;
    page.once("framenavigated", () => { navigated = true; });
    await page.locator("button[aria-label='Subscribe']").click();
    await sleep(500);
    results.newsletterNoReload = !navigated && page.url() === urlBefore;

    await page.close();
  }

  // ---- Mobile pass ----
  {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`[mobile] ${msg.text()}`);
    });
    page.on("pageerror", (err) => consoleErrors.push(`[mobile-pageerror] ${err.message}`));

    await page.goto(BASE, { waitUntil: "networkidle" });
    await sleep(400);

    // realistic touch scroll (simulate via wheel since touch emulation needs hasTouch)
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 250 + Math.random() * 150);
      await sleep(150 + Math.random() * 100);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await sleep(300);

    // Hamburger opens panel
    const hamburger = page.locator("button[aria-label='Open menu']");
    await hamburger.click();
    await sleep(400);
    await page.screenshot({ path: `${OUT}/mobile-menu-open.png` });
    const mobilePanelVisible = await page.locator("header").locator("text=Free tools").first().isVisible().catch(() => false);
    results.mobileHamburgerOpens = mobilePanelVisible;

    // Tap "Free tools" navigates
    const freeTools = page.locator("a:has-text('Free tools')").first();
    await freeTools.click();
    await sleep(500);
    results.mobileFreeToolsNavigated = page.url().includes("/free-tools");

    await page.goto(BASE, { waitUntil: "networkidle" });
    await sleep(300);
    // hamburger toggles closed
    const hamburger2 = page.locator("button[aria-label='Open menu']");
    await hamburger2.click();
    await sleep(300);
    const closeBtn = page.locator("button[aria-label='Close menu']");
    const closeVisible = await closeBtn.isVisible().catch(() => false);
    await closeBtn.click();
    await sleep(300);
    const panelGoneVisible = await page.locator("header").locator("text=Free tools").first().isVisible().catch(() => false);
    results.mobileHamburgerToggleCloses = closeVisible && !panelGoneVisible;

    await page.close();
  }

  results.consoleErrors = consoleErrors;
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
