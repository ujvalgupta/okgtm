/**
 * Code-required strings for Cold Email Auditor (see copy.md in this folder for the
 * authoritative authored copy — meta.ts and copy.md are synced by hand).
 */

import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  "slug": "email-audit",
  "addedAt": "2026-09-03",
  "sortOrder": 3,
  "name": "Cold Email Auditor",
  "tagline": "Check your domain's email infrastructure before you send. MX, SPF, DKIM, DMARC and MTA-STS, scored in seconds.",
  "features": [
    "Live DNS audit of MX, SPF, DKIM, DMARC, MTA-STS and more",
    "One weighted score with raw evidence on every finding",
    "Runs instantly on the page. No email capture needed"
  ],
  "heroH1": "Audit your cold email setup before you hit send",
  "heroSubhead": "Paste your domain. We check the public DNS and HTTPS records that decide whether mail servers will trust your sending domain. Results in seconds, right on this page.",
  "whatItDoes": "Cold Email Auditor reads the public records that control whether mail servers trust your domain: MX routing, SPF policy and its recursive include chain, DKIM keys across common selectors, your DMARC policy and reporting, MTA-STS over HTTPS, TLS-RPT, DNSSEC, and reverse DNS. Every finding is backed by the exact records we read, and the whole thing runs in under ten seconds.",
  "howItWorks": [
    {
      "title": "Type your domain.",
      "body": "A bare domain or a full URL both work. No signup, no email address, no catch."
    },
    {
      "title": "We run live DNS and HTTPS checks.",
      "body": "MX, SPF and its include chain, DKIM selectors, DMARC, MTA-STS, TLS-RPT, DNSSEC and reverse DNS. No paid APIs and no AI anywhere in the stack."
    },
    {
      "title": "You get a scored report with receipts.",
      "body": "A single weighted score, a list of what to fix first, and exact DNS records you can paste at your provider."
    }
  ],
  "whatYouGet": [
    {
      "title": "A score with receipts.",
      "body": "One number plus the raw DNS records behind it. Expand any finding to see exactly what we read."
    },
    {
      "title": "Fixes you can paste.",
      "body": "Actionable findings include the exact record type, hostname and value to add at your DNS provider."
    },
    {
      "title": "Honest unknowns.",
      "body": "If DNS refuses to answer, we say so instead of guessing, and we never count uncertainty against your score."
    }
  ],
  "faq": [
    {
      "q": "Does a good score mean my emails will land in the inbox?",
      "a": "No. This tool audits the published infrastructure that lets mail servers verify who you are. Actual placement depends on sender reputation, content, volume and engagement, which no DNS scan can see. Treat this as an infrastructure check, not a placement guarantee."
    },
    {
      "q": "Why does it say no DKIM selector was found?",
      "a": "DKIM selectors are chosen by your sending platform and are not guessable from outside. We probe the most common selectors and report what we find. We never claim DKIM is missing. Ask your email platform which selector it publishes."
    },
    {
      "q": "Is the SPF fix safe to copy paste?",
      "a": "Only after you review it. Our SPF guidance lists every include and IP in your current record and warns you to preserve existing senders. Removing a service you still use breaks authentication for that sender."
    },
    {
      "q": "Is this really free with no paid APIs?",
      "a": "Yes. The engine uses only public DNS lookups and a free public DNS-over-HTTPS resolver for DNSSEC records. No commercial DNS, enrichment or AI APIs are involved, and the audit works with AI fully disabled."
    }
  ],
  "metaDescription": "Free DNS-based audit of your domain's email infrastructure: SPF, DKIM, DMARC, MTA-STS, DNSSEC and more. No signup, results on the page in seconds.",
  "family": "instant"
};
