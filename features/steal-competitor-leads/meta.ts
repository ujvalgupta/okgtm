/**
 * Code-required strings for Steal Competitor Leads (see copy.md in this folder for the
 * authoritative authored copy — meta.ts and copy.md are synced by hand).
 */

import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  "slug": "steal-competitor-leads",
  "addedAt": "2026-08-26",
  "sortOrder": 12,
  "name": "Steal Competitor Leads",
  "tagline": "Find the people already commenting on a competitor’s posts. They’re warm. They just don’t know you yet.",
  "features": [
    "Scans their 5 most recent LinkedIn posts",
    "Surfaces 1 engaged commenter per post",
    "Direct profile links so you can reach out today"
  ],
  "heroH1": "Find warm leads from your competitor’s audience",
  "heroSubhead": "Paste a competitor’s LinkedIn profile or company page. We surface the people commenting on their recent posts. These are leads already engaged with your market, just not with you yet.",
  "whatItDoes": "This tool scans a competitor’s last 5 LinkedIn posts and identifies people who commented on them. These commenters have already shown interest in your market by engaging with a competitor’s content. You get direct links to their profiles so you can start a conversation. It’s one of the fastest ways to find people who are already warmed up to what you sell.",
  "howItWorks": [
    {
      "title": "Paste a competitor’s LinkedIn profile or company page URL.",
      "body": "Their founder’s personal page works just as well as the company page."
    },
    {
      "title": "We scan their 5 most recent posts for commenters.",
      "body": "The tool pulls one engaged commenter per post."
    },
    {
      "title": "You get profile links to people who are already interested.",
      "body": "Each result links directly to the commenter’s LinkedIn profile, ready for outreach."
    }
  ],
  "whatYouGet": [
    {
      "title": "Leads from your competitor’s audience.",
      "body": "People who are already spending time and attention on content in your space."
    },
    {
      "title": "1 commenter surfaced per post, across 5 posts.",
      "body": "Up to 5 real people, each one actively engaged with your competitor’s content."
    },
    {
      "title": "Direct LinkedIn profile links.",
      "body": "Click through and start a conversation. No extra lookup needed."
    }
  ],
  "faq": [
    {
      "q": "How does the tool find these leads?",
      "a": "It reads the public comments on a competitor’s most recent LinkedIn posts. When someone comments on a public post, that activity is visible. The tool collects and organizes those commenters for you."
    },
    {
      "q": "Why only 1 commenter per post?",
      "a": "The tool surfaces one commenter per post to keep results focused and high-quality. Across 5 posts, that gives you up to 5 distinct leads, each from a different conversation."
    },
    {
      "q": "Do I need to be connected to the competitor?",
      "a": "No. The tool works with publicly visible LinkedIn posts and comments. You don’t need any connection to the competitor or their commenters."
    },
    {
      "q": "Can I use this data for outreach?",
      "a": "The data comes from publicly visible LinkedIn activity. Using it to inform your outreach is standard practice in B2B sales. That said, how you contact these people (cold DM, connection request, email via a separate tool) and what you say is your responsibility. Be relevant, not spammy."
    }
  ],
  "metaDescription": "Surface people already engaging with your competitor’s LinkedIn posts. Warmed-up leads, handed to you. Free.",
  "family": "email",
  "gate": {
    "inputLabel": "Competitor's LinkedIn URL",
    "inputPlaceholder": "linkedin.com/in/founder or linkedin.com/company/acme"
  }
};
