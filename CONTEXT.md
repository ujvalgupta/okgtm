# OkGTM

OkGTM builds automation across the stages of a go-to-market funnel: the site's product surface is a set of free tools anyone can run in the browser, plus a paid agency/GEO service.

## Language

**Tool**: A standalone feature under `/tools` that a visitor runs directly and gets an analysis result from (e.g. Cold Email Auditor, LinkedIn Ad Spy). Tools are the product surface; everything else on the site markets or services them.
_Avoid_: free-tool (legacy name from the renamed `/free-tools` route), experiment, resource (dead nav labels), feature (reserved for the GTM-OS capability cards on the home page).

**Instant tool**: A tool that runs synchronously and renders its result on the page (Cold Email Auditor, GEO & AI Crawl Checker, Email Predictor, LLMs.txt Validator).
_Avoid_: result tool (dead code name `isResultTool`), on-page tool.

**Email tool**: A tool that takes a LinkedIn URL and an email address, runs asynchronously, and emails its result (LinkedIn Ad Spy, LinkedIn Post Spy, Steal Competitor Leads, Find Lost Leads, Competitor Engagement Spy, Lead Journey Finder).
_Avoid_: pipeline tool (implementation term), LinkedIn tool (they may outgrow LinkedIn).

**Result**: The output a tool produces for one run — an audit, a spy report, a prediction. What the visitor came for.
_Avoid_: report (only when it means result; "report" stays fine for marketing collateral).

**Lead**: A person captured via a form (newsletter or email-tool gate), stored in the `leads` table, deduplicated by email.

**GEO**: Generative Engine Optimization — the discipline of making a site visible to AI answer engines. Names the GEO & AI Crawl Checker tool and its score.
_Avoid_: "AI engines" / "answer engines" phrasing in code (keep for UI copy only).
