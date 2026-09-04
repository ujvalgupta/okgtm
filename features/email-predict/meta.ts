/**
 * Code-required strings for Email Predictor (see copy.md in this folder for the
 * authoritative authored copy — meta.ts and copy.md are synced by hand).
 */

import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  "slug": "email-predict",
  "addedAt": "2026-09-03",
  "sortOrder": 1,
  "name": "Email Predictor",
  "tagline": "Guess anyone's work email from their name and company domain. Up to 10 patterns, ranked by how common they are.",
  "features": [
    "Name + domain in, up to 10 likely emails out",
    "Patterns ranked by real-world frequency",
    "One-click copy for each address"
  ],
  "heroH1": "Find anyone's work email from their name alone",
  "heroSubhead": "Type a person's full name and their company's domain. We generate the email patterns companies actually use, like first.last@domain and flast@domain, ranked by how common each one is. Up to 10 guesses per person, each copyable in one click.",
  "whatItDoes": "Email Predictor takes a person's full name and company domain and builds the email addresses that person most likely uses, following the standard patterns companies pick when they set up mail: First.Last, first initial plus last name, First name only, and the rest of the common variations. Results are ranked by how frequently each pattern appears in real corporate directories, with the most likely candidate first. It also checks the company domain's MX records so you know whether the domain can receive mail at all before you try anything.",
  "howItWorks": [
    {
      "title": "Enter the name and domain.",
      "body": "A full name like Jane Smith and a domain like acme.com. No account, nothing stored."
    },
    {
      "title": "We build the likely patterns.",
      "body": "First.Last, flast, firstlast, f.last and the rest, up to 10, ordered by how commonly each is used in the wild."
    },
    {
      "title": "We check the domain's mail setup.",
      "body": "MX records tell you if the domain can receive email at all, so you are not chasing guesses at a dead domain."
    }
  ],
  "whatYouGet": [
    {
      "title": "Up to 10 candidate addresses.",
      "body": "The full set of patterns companies actually use, not just the two obvious ones."
    },
    {
      "title": "Honest ranking, not false certainty.",
      "body": "Candidates are ordered by industry frequency. The tool never claims a guess is the verified address."
    },
    {
      "title": "Deliverability context.",
      "body": "A live MX check tells you whether the domain can receive mail before you invest in a send."
    }
  ],
  "faq": [
    {
      "q": "Is the first result the person's real email?",
      "a": "No. These are educated guesses based on the patterns companies most commonly use. The first one is simply the pattern that shows up most often across companies. You still need to confirm the address, for example with a bounce test or by asking, before you rely on it."
    },
    {
      "q": "Which patterns does it check?",
      "a": "The ten most common industry patterns: First.Last, First name, first initial + last name, no-separator combinations, initial + last, Last.First, underscore variants, and more. If the name has a middle initial, middle-initial patterns are added in."
    },
    {
      "q": "Why does it check the domain's MX records?",
      "a": "A domain without MX records cannot receive email, so every guess would bounce. The check tells you up front whether the domain is even worth trying, and it is the only server-side step, run on the domain alone. Your person's name never leaves your browser."
    },
    {
      "q": "Is it okay to use this for outreach?",
      "a": "Guessing an address and then confirming it before sending is common in professional sales. What is not okay is sending to unverified guesses at scale or to people who never opted in. Use the tool to research a person you legitimately want to reach, and respect replies that ask you to stop."
    }
  ],
  "metaDescription": "Free email predictor: guess a work email from a full name and company domain. Up to 10 industry-standard patterns ranked by frequency, with a live MX check. Nothing stored.",
  "family": "instant"
};
