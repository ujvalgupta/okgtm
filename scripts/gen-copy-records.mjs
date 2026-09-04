// One-off generator (restructure step 5-6): emits content/home/data.ts and
// per-tool/content copy.md records. Run: node scripts/gen-copy-records.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const readMeta = (slug) => {
  const src = readFileSync(`features/${slug}/meta.ts`, "utf8");
  const body = src.slice(src.indexOf("export const meta: ToolMeta = ") + "export const meta: ToolMeta = ".length);
  return JSON.parse(body.replace(/;\s*$/, ""));
};

const md = (s) => s.replace(/\u2019/g, "'").replace(/\u201c|\u201d/g, '"').replace(/\u2014/g, "—");

const tools = [
  "linkedin-ad-spy", "linkedin-post-spy", "steal-competitor-leads", "find-lost-leads",
  "competitor-engagement-spy", "lead-journey-finder", "email-audit", "geo-audit",
  "email-predict", "llms-txt",
];

for (const slug of tools) {
  const t = readMeta(slug);
  const sections = [
    `# ${t.name}`,
    "",
    `> ${t.tagline}`,
    "",
    "## Features",
    ...t.features.map((f) => `- ${md(f)}`),
    "",
    "## Hero",
    "",
    `**H1:** ${md(t.heroH1)}`,
    "",
    md(t.heroSubhead),
    "",
    "## What it does",
    "",
    md(t.whatItDoes),
    "",
    "## How it works",
    ...t.howItWorks.map((s, i) => `${i + 1}. **${md(s.title)}** ${md(s.body)}`),
    "",
    "## What you get",
    ...t.whatYouGet.map((s, i) => `${i + 1}. **${md(s.title)}** ${md(s.body)}`),
    "",
    "## FAQ",
    ...t.faq.map((f) => `### ${md(f.q)}\n\n${md(f.a)}`),
    "",
    `**Meta description:** ${md(t.metaDescription)}`,
    "",
  ].join("\n");
  const out = `> Authoritative authored copy for ${t.name}. The strings code renders live in\n> \`meta.ts\` beside this file — they are synced here by hand (ADR 0002).\n>\n> ${t.family} tool · slug \`${slug}\`\n\n${sections}`;
  writeFileSync(`features/${slug}/copy.md`, out);
  console.log(`wrote features/${slug}/copy.md`);
}

// content/home/data.ts + copy record from app/page.tsx arrays
const page = readFileSync("app/page.tsx", "utf8");
const grab = (name) => {
  const start = page.indexOf(`const ${name} = [`);
  const from = page.slice(start + `const ${name} = [`.length);
  // find matching closing "] as const;" — arrays contain no "] as const" inside strings... they do not
  const end = from.indexOf("] as const;");
  return JSON.parse(`[${from.slice(0, end)}]`);
};
const features = grab("features");
const steps = grab("steps");
const faqs = grab("faqs");

const dataTs = `/**\n * Home page content data (extracted from app/page.tsx, restructure step 5).\n * The human-authored record of this content lives in ./copy.md (ADR 0002 —\n * meta/copy hand-off).\n */\n\nexport const features = ${JSON.stringify(features, null, 2)} as const;\n\nexport const steps = ${JSON.stringify(steps, null, 2)} as const;\n\nexport const faqs = ${JSON.stringify(faqs, null, 2)} as const;\n`;
writeFileSync("content/home/data.ts", dataTs);
console.log("wrote content/home/data.ts");

const homeMd = [
  "> Authoritative authored copy for the OkGTM home page. Strings code renders",
  "> live in `content/home/data.ts` — synced here by hand (ADR 0002).",
  "",
  "# OkGTM home",
  "",
  "## Feature cards (GTM OS capabilities)",
  ...features.map((f) => `- **${f.title}** — ${md(f.subtitle)} ${md(f.body)}`),
  "",
  "## How it works",
  ...steps.map((s, i) => `${i + 1}. **${md(s.title)}** ${md(s.body)}`),
  "",
  "## FAQ",
  ...faqs.map((f) => `### ${md(f.q)}\n\n${md(f.a)}`),
  "",
].join("\n");
writeFileSync("content/home/copy.md", homeMd);
console.log("wrote content/home/copy.md");
