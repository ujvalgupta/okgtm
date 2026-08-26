import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3001/", { waitUntil: "networkidle" });
await p.waitForTimeout(500);
const r = await p.evaluate(() => {
  const h2 = document.getElementById("problem-heading");
  const cs = getComputedStyle(h2);
  const lh = parseFloat(cs.lineHeight);
  const rects = Array.from(h2.getClientRects()).filter(r => r.width > 0);
  return {
    lines: Math.round(h2.getBoundingClientRect().height / lh),
    lineCount: rects.length,
    lineWidths: rects.map(r => Math.round(r.width)),
    fontSize: cs.fontSize,
    wrap: cs.textWrap,
  };
});
console.log(JSON.stringify(r, null, 2));
await b.close();
