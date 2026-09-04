/**
 * Code-required strings for Lead Journey Finder (see copy.md in this folder for the
 * authoritative authored copy — meta.ts and copy.md are synced by hand).
 */

import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  "slug": "lead-journey-finder",
  "addedAt": "2026-08-26",
  "sortOrder": 15,
  "name": "Lead Journey Finder",
  "tagline": "See what your lead actually engages with on LinkedIn, so you can start a conversation that matters.",
  "features": [
    "Up to 5 recent comments pulled from their activity",
    "Filters out self-engagement for a clean signal",
    "Direct links to the posts and authors they care about"
  ],
  "heroH1": "Map what your lead cares about before reaching out",
  "heroSubhead": "Paste a lead’s LinkedIn profile. We show you the last 5 posts they commented on, so you can understand what they’re engaged with and open with something relevant.",
  "whatItDoes": "Before you send a cold message, know what your lead is already thinking about. Lead Journey Finder pulls a lead’s recent LinkedIn commenting activity and shows you the posts they engaged with. You’ll see what topics hold their attention, which voices they trust, and what problems they’re actively working on. That’s the difference between a generic opener and one that earns a reply.",
  "howItWorks": [
    {
      "title": "Paste your lead’s LinkedIn profile URL.",
      "body": "Any personal profile works."
    },
    {
      "title": "We pull the last 5 posts they commented on (excluding their own).",
      "body": "Only engagement on other people’s content is captured."
    },
    {
      "title": "You see what they’re paying attention to.",
      "body": "Each result links to the post and its author, giving you the context you need for a relevant first message."
    }
  ],
  "whatYouGet": [
    {
      "title": "Real insight into what your lead cares about right now.",
      "body": "Not their job title or company bio. What they’re actually spending time reading and responding to."
    },
    {
      "title": "Up to 5 recent comments, filtered for signal.",
      "body": "Self-engagement is excluded so you only see where their attention genuinely goes."
    },
    {
      "title": "Direct links to the posts and authors.",
      "body": "Reference a specific post in your outreach. Mention someone they follow. Build an intro that feels natural."
    }
  ],
  "faq": [
    {
      "q": "How does the tool find their commenting activity?",
      "a": "It reads the publicly visible activity section of a LinkedIn profile, which shows posts a person has recently commented on. Only public activity is accessible."
    },
    {
      "q": "What if my lead hasn’t commented on anything recently?",
      "a": "The tool will return an empty result. Not everyone comments actively on LinkedIn. In that case, try a different research angle."
    },
    {
      "q": "Do I need to be connected to the lead?",
      "a": "No. As long as their activity is set to public (which is LinkedIn’s default), the tool works without any connection."
    },
    {
      "q": "Is it appropriate to use someone’s LinkedIn activity in outreach?",
      "a": "Referencing someone’s publicly shared interests is common in professional sales. It shows you did your homework. Just be genuine about it. Don’t pretend you stumbled onto their comment by accident. Be direct: “I saw you commented on [topic] and thought this might be relevant.”"
    }
  ],
  "metaDescription": "See the last 5 posts your lead commented on. Build a warmer intro before you ever reach out. Free.",
  "family": "email",
  "gate": {
    "inputLabel": "Lead's LinkedIn profile URL",
    "inputPlaceholder": "linkedin.com/in/your-lead"
  }
};
