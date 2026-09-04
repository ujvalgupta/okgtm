> Authoritative authored copy for Cold Email Auditor. The strings code renders live in
> `meta.ts` beside this file — they are synced here by hand (ADR 0002).
>
> instant tool · slug `email-audit`

# Cold Email Auditor

> Check your domain's email infrastructure before you send. MX, SPF, DKIM, DMARC and MTA-STS, scored in seconds.

## Features
- Live DNS audit of MX, SPF, DKIM, DMARC, MTA-STS and more
- One weighted score with raw evidence on every finding
- Runs instantly on the page. No email capture needed

## Hero

**H1:** Audit your cold email setup before you hit send

Paste your domain. We check the public DNS and HTTPS records that decide whether mail servers will trust your sending domain. Results in seconds, right on this page.

## What it does

Cold Email Auditor reads the public records that control whether mail servers trust your domain: MX routing, SPF policy and its recursive include chain, DKIM keys across common selectors, your DMARC policy and reporting, MTA-STS over HTTPS, TLS-RPT, DNSSEC, and reverse DNS. Every finding is backed by the exact records we read, and the whole thing runs in under ten seconds.

## How it works
1. **Type your domain.** A bare domain or a full URL both work. No signup, no email address, no catch.
2. **We run live DNS and HTTPS checks.** MX, SPF and its include chain, DKIM selectors, DMARC, MTA-STS, TLS-RPT, DNSSEC and reverse DNS. No paid APIs and no AI anywhere in the stack.
3. **You get a scored report with receipts.** A single weighted score, a list of what to fix first, and exact DNS records you can paste at your provider.

## What you get
1. **A score with receipts.** One number plus the raw DNS records behind it. Expand any finding to see exactly what we read.
2. **Fixes you can paste.** Actionable findings include the exact record type, hostname and value to add at your DNS provider.
3. **Honest unknowns.** If DNS refuses to answer, we say so instead of guessing, and we never count uncertainty against your score.

## FAQ
### Does a good score mean my emails will land in the inbox?

No. This tool audits the published infrastructure that lets mail servers verify who you are. Actual placement depends on sender reputation, content, volume and engagement, which no DNS scan can see. Treat this as an infrastructure check, not a placement guarantee.
### Why does it say no DKIM selector was found?

DKIM selectors are chosen by your sending platform and are not guessable from outside. We probe the most common selectors and report what we find. We never claim DKIM is missing. Ask your email platform which selector it publishes.
### Is the SPF fix safe to copy paste?

Only after you review it. Our SPF guidance lists every include and IP in your current record and warns you to preserve existing senders. Removing a service you still use breaks authentication for that sender.
### Is this really free with no paid APIs?

Yes. The engine uses only public DNS lookups and a free public DNS-over-HTTPS resolver for DNSSEC records. No commercial DNS, enrichment or AI APIs are involved, and the audit works with AI fully disabled.

**Meta description:** Free DNS-based audit of your domain's email infrastructure: SPF, DKIM, DMARC, MTA-STS, DNSSEC and more. No signup, results on the page in seconds.
