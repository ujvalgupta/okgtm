> Authoritative authored copy for Email Predictor. The strings code renders live in
> `meta.ts` beside this file — they are synced here by hand (ADR 0002).
>
> instant tool · slug `email-predict`

# Email Predictor

> Guess anyone's work email from their name and company domain. Up to 10 patterns, ranked by how common they are.

## Features
- Name + domain in, up to 10 likely emails out
- Patterns ranked by real-world frequency
- One-click copy for each address

## Hero

**H1:** Find anyone's work email from their name alone

Type a person's full name and their company's domain. We generate the email patterns companies actually use, like first.last@domain and flast@domain, ranked by how common each one is. Up to 10 guesses per person, each copyable in one click.

## What it does

Email Predictor takes a person's full name and company domain and builds the email addresses that person most likely uses, following the standard patterns companies pick when they set up mail: First.Last, first initial plus last name, First name only, and the rest of the common variations. Results are ranked by how frequently each pattern appears in real corporate directories, with the most likely candidate first. It also checks the company domain's MX records so you know whether the domain can receive mail at all before you try anything.

## How it works
1. **Enter the name and domain.** A full name like Jane Smith and a domain like acme.com. No account, nothing stored.
2. **We build the likely patterns.** First.Last, flast, firstlast, f.last and the rest, up to 10, ordered by how commonly each is used in the wild.
3. **We check the domain's mail setup.** MX records tell you if the domain can receive email at all, so you are not chasing guesses at a dead domain.

## What you get
1. **Up to 10 candidate addresses.** The full set of patterns companies actually use, not just the two obvious ones.
2. **Honest ranking, not false certainty.** Candidates are ordered by industry frequency. The tool never claims a guess is the verified address.
3. **Deliverability context.** A live MX check tells you whether the domain can receive mail before you invest in a send.

## FAQ
### Is the first result the person's real email?

No. These are educated guesses based on the patterns companies most commonly use. The first one is simply the pattern that shows up most often across companies. You still need to confirm the address, for example with a bounce test or by asking, before you rely on it.
### Which patterns does it check?

The ten most common industry patterns: First.Last, First name, first initial + last name, no-separator combinations, initial + last, Last.First, underscore variants, and more. If the name has a middle initial, middle-initial patterns are added in.
### Why does it check the domain's MX records?

A domain without MX records cannot receive email, so every guess would bounce. The check tells you up front whether the domain is even worth trying, and it is the only server-side step, run on the domain alone. Your person's name never leaves your browser.
### Is it okay to use this for outreach?

Guessing an address and then confirming it before sending is common in professional sales. What is not okay is sending to unverified guesses at scale or to people who never opted in. Use the tool to research a person you legitimately want to reach, and respect replies that ask you to stop.

**Meta description:** Free email predictor: guess a work email from a full name and company domain. Up to 10 industry-standard patterns ranked by frequency, with a live MX check. Nothing stored.
