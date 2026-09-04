/**
 * Code-required strings for llms.txt Validator (see copy.md in this folder for the
 * authoritative authored copy — meta.ts and copy.md are synced by hand).
 */

import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  "slug": "llms-txt",
  "addedAt": "2026-09-03",
  "sortOrder": 0,
  "name": "llms.txt Validator",
  "tagline": "Paste a site and we check its llms.txt: structure, curated sections, and every linked URL.",
  "features": [
    "Validates the file structure against the llms.txt format",
    "Flags the common link-dump mistake",
    "Tests each linked URL and lists the broken ones"
  ],
  "heroH1": "Check if your llms.txt is built right",
  "heroSubhead": "Paste any site. We fetch its llms.txt, check the structure against the format (title, summary, curated sections, described links), flag files that are really sitemap dumps, and test whether the URLs inside actually resolve. Plain results, no opinions.",
  "whatItDoes": "llms.txt Validator fetches a site's llms.txt (falling back to llms-full.txt or ai.txt) and checks it against the format: one H1 title, a one-line blockquote summary, named H2 sections, and markdown links with short descriptions. It flags files that are really unsorted link dumps instead of curated lists, then resolves the file's own-site links and reports which ones are broken. It only reports what it finds.",
  "howItWorks": [
    {
      "title": "Paste a URL.",
      "body": "A bare domain or a full page URL both work. No signup and nothing is stored."
    },
    {
      "title": "We validate the file.",
      "body": "Title, summary line, sections, and link descriptions are each checked against the llms.txt format."
    },
    {
      "title": "We test the links inside it.",
      "body": "Each linked URL is fetched and broken links are listed, up to 24 links per check."
    }
  ],
  "whatYouGet": [
    {
      "title": "A structure report.",
      "body": "Every format rule is a separate pass or fail line with the exact detail behind it."
    },
    {
      "title": "A live link test.",
      "body": "The file's own-site links are fetched and broken ones are shown with the response status."
    },
    {
      "title": "The raw file.",
      "body": "The validated content is shown in full so you can compare the findings to the source."
    }
  ],
  "faq": [
    {
      "q": "What is llms.txt?",
      "a": "It is a plain text file a site can publish at /llms.txt that lists its most useful pages with short descriptions, organized in sections. It follows a simple markdown format documented at llmstxt.org."
    },
    {
      "q": "What makes a file valid?",
      "a": "The format expects one H1 title, a one-line summary in a blockquote, a set of H2 sections, and markdown links with descriptions inside those sections. Files that only dump hundreds of unsorted links do not follow the format."
    },
    {
      "q": "Which URLs does the link test check?",
      "a": "The file's own-site links first, up to 24 links total, then external links up to the same budget. Broken responses are listed with the status code or the fetch error."
    },
    {
      "q": "Does it look at ai.txt or llms-full.txt?",
      "a": "It checks llms.txt first, then llms-full.txt and ai.txt as fallbacks if the main file is not present, and it reports which file it validated."
    }
  ],
  "metaDescription": "Free llms.txt validator: structure checks against the format, link-dump detection, and live URL resolution for every linked page. Results on the page.",
  "family": "instant"
};
