/**
 * Code-required strings for Find Lost Leads (see copy.md in this folder for the
 * authoritative authored copy — meta.ts and copy.md are synced by hand).
 */

import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  "slug": "find-lost-leads",
  "addedAt": "2026-08-26",
  "sortOrder": 13,
  "name": "Find Lost Leads",
  "tagline": "Resurface people who commented on your LinkedIn posts and never heard back from you.",
  "features": [
    "Pulls your 5 most recent posts automatically",
    "Flags 1 unanswered commenter per post",
    "Direct profile links for quick follow-up"
  ],
  "heroH1": "Recover leads hiding in your own LinkedIn posts",
  "heroSubhead": "Paste your LinkedIn profile or company page. We find everyone who commented on your recent posts and never got a reply. These are people who raised their hand, and you missed them.",
  "whatItDoes": "Find Lost Leads scans your own last 5 LinkedIn posts and surfaces the commenters who never got a response. Every unanswered comment is a missed opportunity: someone engaged with your content, signaled interest, and heard nothing back. This tool helps you close that loop quickly.",
  "howItWorks": [
    {
      "title": "Paste your own LinkedIn profile or company page URL.",
      "body": "This one’s about your content, not a competitor’s."
    },
    {
      "title": "We scan your 5 most recent posts for unanswered comments.",
      "body": "The tool flags one commenter per post who didn’t get a reply."
    },
    {
      "title": "You get direct links to the people you missed.",
      "body": "Each result is a profile link, ready for a late but genuine follow-up."
    }
  ],
  "whatYouGet": [
    {
      "title": "A list of people who engaged with you and got no response.",
      "body": "These are your warmest leads. They already know who you are."
    },
    {
      "title": "1 unanswered commenter per post, across 5 posts.",
      "body": "Up to 5 people who showed real interest."
    },
    {
      "title": "Direct LinkedIn profile links.",
      "body": "Reply to their comment, send a connection request, or start a DM. The context is already there."
    }
  ],
  "faq": [
    {
      "q": "How does the tool know if someone got a reply?",
      "a": "It checks whether a response was posted to the commenter’s comment thread. If no reply exists from the post author, the commenter is flagged as unanswered."
    },
    {
      "q": "Can this miss some comments?",
      "a": "The tool looks at your 5 most recent posts and surfaces 1 commenter per post. If a post has dozens of comments, it picks one. It won’t catch every unanswered comment across your entire history."
    },
    {
      "q": "Does it work for company pages too?",
      "a": "Yes. Paste a company page URL and it scans the company’s recent posts the same way it handles personal profiles."
    },
    {
      "q": "Am I violating anyone’s privacy by using this?",
      "a": "No. You’re looking at comments people left on your own public posts. The data is already on your own LinkedIn page. This tool just organizes what’s already there so nothing falls through the cracks."
    }
  ],
  "metaDescription": "Resurface everyone who commented on your LinkedIn posts and never got a reply. Free, takes one minute.",
  "family": "email",
  "gate": {
    "inputLabel": "Your LinkedIn URL",
    "inputPlaceholder": "linkedin.com/in/you or linkedin.com/company/yours"
  }
};
