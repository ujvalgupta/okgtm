/**
 * Code-required strings for LinkedIn Ad Spy (see copy.md in this folder for the
 * authoritative authored copy — meta.ts and copy.md are synced by hand).
 */

import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  "slug": "linkedin-ad-spy",
  "addedAt": "2026-08-26",
  "sortOrder": 10,
  "name": "LinkedIn Ad Spy",
  "tagline": "Pull every ad a competitor is running on LinkedIn and get an AI read on their strategy.",
  "features": [
    "Live pull from the LinkedIn Ad Library",
    "Up to 10 active ads surfaced per search",
    "AI-generated breakdown of their ad strategy"
  ],
  "heroH1": "See every LinkedIn ad your competitor is running",
  "heroSubhead": "Paste a company's LinkedIn page URL. We pull their active ads from the LinkedIn Ad Library and give you an AI breakdown of what their ad strategy looks like.",
  "whatItDoes": "LinkedIn Ad Spy searches the LinkedIn Ad Library for a competitor’s active campaigns and pulls up to 10 live ads in a single search. On top of the raw ads, you get an AI-generated summary that breaks down their messaging angles, creative patterns, and likely targeting approach. The whole thing takes about a minute.",
  "howItWorks": [
    {
      "title": "Paste the company’s LinkedIn page URL.",
      "body": "A company page like linkedin.com/company/acme. We look up its active ads in the LinkedIn Ad Library."
    },
    {
      "title": "We search the LinkedIn Ad Library.",
      "body": "The tool pulls every active ad associated with that company, up to 10 results."
    },
    {
      "title": "You get the ads and a strategy breakdown.",
      "body": "Each ad is displayed alongside an AI-generated summary that maps out the patterns across their campaigns."
    }
  ],
  "whatYouGet": [
    {
      "title": "Live ad creative and copy.",
      "body": "See exactly what your competitor is putting in front of their audience right now, not last quarter."
    },
    {
      "title": "Up to 10 ads per search.",
      "body": "Enough to see patterns in messaging, format choices, and offer types without noise."
    },
    {
      "title": "AI strategy summary.",
      "body": "A written breakdown covering their messaging themes, creative approach, and what it tells you about who they’re targeting."
    }
  ],
  "faq": [
    {
      "q": "How does this tool pull the ads?",
      "a": "It searches the LinkedIn Ad Library, which is LinkedIn’s public transparency feature for active advertisements. Any ad currently running on LinkedIn is visible there. We pull the data and organize it for you."
    },
    {
      "q": "Why is there a cap of 10 ads?",
      "a": "Ten ads is the maximum the tool surfaces per search. For most companies, that covers their active campaign set. If a company is running more than 10 concurrent ads, the tool returns the first 10 results from the Ad Library."
    },
    {
      "q": "Do I need a LinkedIn account or connection to use this?",
      "a": "No. The LinkedIn Ad Library is publicly accessible. You don’t need to be logged in, connected, or have any relationship with the company you’re searching."
    },
    {
      "q": "Is it okay to look at competitor ads this way?",
      "a": "The LinkedIn Ad Library is a public transparency feature. Viewing ads listed there is no different from seeing them in your feed. How you use what you learn (for your own ad strategy, positioning research, pitch prep) is up to you."
    }
  ],
  "metaDescription": "See every LinkedIn ad your competitor is running right now, plus an AI strategy breakdown. Free, no account needed.",
  "family": "email",
  "gate": {
    "inputLabel": "Competitor's company LinkedIn URL",
    "inputPlaceholder": "linkedin.com/company/acme"
  }
};
