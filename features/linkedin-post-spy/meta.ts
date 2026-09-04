/**
 * Code-required strings for LinkedIn Post Spy (see copy.md in this folder for the
 * authoritative authored copy — meta.ts and copy.md are synced by hand).
 */

import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  "slug": "linkedin-post-spy",
  "addedAt": "2026-08-26",
  "sortOrder": 11,
  "name": "LinkedIn Post Spy",
  "tagline": "See what a competitor is posting on LinkedIn and how their content strategy holds together.",
  "features": [
    "5 most recent posts pulled in real time",
    "Works with personal profiles and company pages",
    "AI-generated content strategy summary"
  ],
  "heroH1": "Decode a competitor’s LinkedIn content strategy",
  "heroSubhead": "Paste a founder’s profile or company page URL. We pull their 5 most recent posts and run an AI analysis on what their content strategy actually looks like.",
  "whatItDoes": "LinkedIn Post Spy pulls the 5 most recent LinkedIn posts from any personal profile or company page you point it at. Then it runs an AI analysis that maps out the patterns: what topics they lean on, how they structure posts, what formats they favor, and what kind of engagement they’re generating. You get a strategy read, not just a list of posts.",
  "howItWorks": [
    {
      "title": "Paste a LinkedIn profile or company page URL.",
      "body": "Works with personal profiles (founders, execs) and company pages."
    },
    {
      "title": "We pull their 5 most recent posts.",
      "body": "Content, format, and engagement data, captured live."
    },
    {
      "title": "You get the posts plus an AI strategy breakdown.",
      "body": "The analysis covers themes, posting patterns, and what’s working for them."
    }
  ],
  "whatYouGet": [
    {
      "title": "Their 5 most recent LinkedIn posts.",
      "body": "Full content, not summaries. See exactly what they published and how it performed."
    },
    {
      "title": "Personal profiles and company pages supported.",
      "body": "Spy on a founder’s thought leadership or a competitor’s official company feed."
    },
    {
      "title": "AI content strategy analysis.",
      "body": "A written summary covering recurring themes, post formats, engagement patterns, and what their content approach reveals about their positioning."
    }
  ],
  "faq": [
    {
      "q": "How does this tool access someone’s posts?",
      "a": "It pulls publicly visible LinkedIn posts from the profile or company page you provide. Only posts that are set to public visibility are accessed."
    },
    {
      "q": "Why only 5 posts?",
      "a": "Five recent posts give you a meaningful pattern without overwhelming the analysis. It’s enough for the AI to identify recurring themes and strategy signals."
    },
    {
      "q": "Do I need to follow or be connected to the person?",
      "a": "No. As long as their posts are set to public visibility, the tool can access them. No login, no connection required on your end."
    },
    {
      "q": "Is scraping LinkedIn posts legal?",
      "a": "This tool accesses publicly visible post data. LinkedIn’s public content has been the subject of legal rulings confirming that publicly available data can be accessed (see hiQ Labs v. LinkedIn, 2022). That said, how you use the insights you gather is your responsibility. We recommend using this for competitive research and strategy planning, not for reproducing someone’s content."
    }
  ],
  "metaDescription": "Pull a competitor’s 5 most recent LinkedIn posts and get an AI read on their content strategy. Free, results emailed to you.",
  "family": "email",
  "gate": {
    "inputLabel": "Competitor's LinkedIn URL",
    "inputPlaceholder": "linkedin.com/in/founder or linkedin.com/company/acme"
  }
};
