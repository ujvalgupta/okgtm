> Authoritative authored copy for llms.txt Validator. The strings code renders live in
> `meta.ts` beside this file — they are synced here by hand (ADR 0002).
>
> instant tool · slug `llms-txt`

# llms.txt Validator

> Paste a site and we check its llms.txt: structure, curated sections, and every linked URL.

## Features
- Validates the file structure against the llms.txt format
- Flags the common link-dump mistake
- Tests each linked URL and lists the broken ones

## Hero

**H1:** Check if your llms.txt is built right

Paste any site. We fetch its llms.txt, check the structure against the format (title, summary, curated sections, described links), flag files that are really sitemap dumps, and test whether the URLs inside actually resolve. Plain results, no opinions.

## What it does

llms.txt Validator fetches a site's llms.txt (falling back to llms-full.txt or ai.txt) and checks it against the format: one H1 title, a one-line blockquote summary, named H2 sections, and markdown links with short descriptions. It flags files that are really unsorted link dumps instead of curated lists, then resolves the file's own-site links and reports which ones are broken. It only reports what it finds.

## How it works
1. **Paste a URL.** A bare domain or a full page URL both work. No signup and nothing is stored.
2. **We validate the file.** Title, summary line, sections, and link descriptions are each checked against the llms.txt format.
3. **We test the links inside it.** Each linked URL is fetched and broken links are listed, up to 24 links per check.

## What you get
1. **A structure report.** Every format rule is a separate pass or fail line with the exact detail behind it.
2. **A live link test.** The file's own-site links are fetched and broken ones are shown with the response status.
3. **The raw file.** The validated content is shown in full so you can compare the findings to the source.

## FAQ
### What is llms.txt?

It is a plain text file a site can publish at /llms.txt that lists its most useful pages with short descriptions, organized in sections. It follows a simple markdown format documented at llmstxt.org.
### What makes a file valid?

The format expects one H1 title, a one-line summary in a blockquote, a set of H2 sections, and markdown links with descriptions inside those sections. Files that only dump hundreds of unsorted links do not follow the format.
### Which URLs does the link test check?

The file's own-site links first, up to 24 links total, then external links up to the same budget. Broken responses are listed with the status code or the fetch error.
### Does it look at ai.txt or llms-full.txt?

It checks llms.txt first, then llms-full.txt and ai.txt as fallbacks if the main file is not present, and it reports which file it validated.

**Meta description:** Free llms.txt validator: structure checks against the format, link-dump detection, and live URL resolution for every linked page. Results on the page.
