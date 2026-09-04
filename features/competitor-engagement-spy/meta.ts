/**
 * Code-required strings for Competitor Engagement Spy (see copy.md in this folder for the
 * authoritative authored copy — meta.ts and copy.md are synced by hand).
 */

import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  "slug": "competitor-engagement-spy",
  "addedAt": "2026-08-26",
  "sortOrder": 14,
  "name": "Competitor Engagement Spy",
  "tagline": "See whose posts your competitor is commenting on. That’s who they’re warming up before the pitch.",
  "features": [
    "Up to 5 recent comments tracked (excludes their own posts)",
    "Reveals who they’re building relationships with",
    "Direct links to each post author’s profile"
  ],
  "heroH1": "See who your competitor is warming up",
  "heroSubhead": "Paste a competitor’s LinkedIn profile. We show you the last 5 posts they’ve commented on (not their own), so you can see exactly whose attention they’re trying to earn.",
  "whatItDoes": "Smart sellers and founders warm up prospects on LinkedIn by commenting on their posts before ever sending a pitch. Competitor Engagement Spy reveals that playbook. Drop in a competitor’s profile and see the 5 most recent posts they’ve engaged with, filtered to exclude their own content. You’ll know who they’re building relationships with and can decide whether to get there first.",
  "howItWorks": [
    {
      "title": "Paste a competitor’s LinkedIn profile URL.",
      "body": "The tool reads their recent commenting activity."
    },
    {
      "title": "We pull the last 5 posts they commented on (excluding their own).",
      "body": "Only engagement on other people’s content is tracked."
    },
    {
      "title": "You get links to the post authors they’re targeting.",
      "body": "Each result shows who your competitor is actively trying to build a relationship with."
    }
  ],
  "whatYouGet": [
    {
      "title": "A window into their outbound strategy.",
      "body": "See which accounts and people your competitor is investing their attention in before the sales conversation starts."
    },
    {
      "title": "Up to 5 posts they’ve recently engaged with.",
      "body": "Filtered to exclude self-promotion, so you only see genuine outreach signals."
    },
    {
      "title": "Direct links to each post author’s profile.",
      "body": "If your competitor is warming someone up, you now know about it."
    }
  ],
  "faq": [
    {
      "q": "How does the tool track their comments?",
      "a": "It reads the publicly visible commenting activity on a LinkedIn profile. When someone comments on a public post, that comment is visible on their activity feed. The tool collects those and filters out any comments on their own content."
    },
    {
      "q": "Why exclude comments on their own posts?",
      "a": "Comments on their own posts are just community management. The valuable signal is where they’re spending time on other people’s content, which usually indicates sales prospecting or relationship building."
    },
    {
      "q": "Does the competitor get notified?",
      "a": "No. This tool reads publicly visible LinkedIn activity. There’s no interaction with the competitor’s profile that would trigger a notification."
    },
    {
      "q": "Is monitoring a competitor’s LinkedIn activity appropriate?",
      "a": "Their commenting activity is publicly visible by default. Reviewing it is standard competitive intelligence, similar to reading their blog or watching their webinars. You’re not accessing anything private."
    }
  ],
  "metaDescription": "See exactly whose posts your competitor is commenting on. Know who they’re warming up. Free tool.",
  "family": "email",
  "gate": {
    "inputLabel": "Competitor's LinkedIn profile URL",
    "inputPlaceholder": "linkedin.com/in/competitor"
  }
};
