/**
 * Home page content data (extracted from app/page.tsx, restructure step 5).
 * The human-authored record of this content lives in ./copy.md (ADR 0002 —
 * meta/copy hand-off).
 */

export const features = [
  {
    "title": "Capture",
    "subtitle": "Leads routed the moment they arrive.",
    "body": "Website forms, inbound chat, LinkedIn, signups, imports. Every lead enters a single system and gets routed instantly to the right workflow. No CSV exports. No manual entry.",
    "bgClass": "bg-brand-peach",
    "textClass": "text-ink",
    "colSpan": "",
    "featured": false,
    "standoutLine": ""
  },
  {
    "title": "Enrich + Score",
    "subtitle": "Know who’s worth your time before you spend it.",
    "body": "Every lead is enriched with firmographic and contact data from platforms like Apollo and LinkedIn, then scored using intent signals. Your team stops guessing which leads matter and starts working the ones that do.",
    "bgClass": "bg-brand-teal",
    "textClass": "text-on-dark",
    "colSpan": "lg:col-span-2",
    "featured": true,
    "standoutLine": "This is where most teams start. It’s also where the biggest time savings hide."
  },
  {
    "title": "Outbound",
    "subtitle": "Sequences that start with context, not cold lists.",
    "body": "Email and LinkedIn sequences triggered by fit score, behavior signals, and funnel stage. Domain warm-up built in. Every message lands with relevance because it’s backed by enrichment and scoring data, not a static spreadsheet.",
    "bgClass": "bg-brand-pink",
    "textClass": "text-ink",
    "colSpan": "lg:col-span-2",
    "featured": false,
    "standoutLine": ""
  },
  {
    "title": "Follow-ups",
    "subtitle": "Timed to intent, not to someone’s memory.",
    "body": "Follow-up sequences tied to lead activity and intent signals. When a lead engages, the system responds. When they go quiet, it re-engages on a schedule your team defines. No leads forgotten in a dead pipeline.",
    "bgClass": "bg-brand-lavender",
    "textClass": "text-ink",
    "colSpan": "",
    "featured": false,
    "standoutLine": ""
  },
  {
    "title": "Handoff",
    "subtitle": "Sales gets context, not just a name.",
    "body": "When a lead is ready, it moves into your CRM with full history attached: enrichment data, sequence activity, engagement signals. Works with HubSpot, Salesforce, Clay, and AI-native CRMs. Your sales team picks up where the system left off.",
    "bgClass": "bg-brand-ochre",
    "textClass": "text-ink",
    "colSpan": "",
    "featured": false,
    "standoutLine": ""
  },
  {
    "title": "Reporting",
    "subtitle": "See what’s working. Fix what isn’t.",
    "body": "Track performance across every stage of your funnel from one view. Understand where leads convert, where they stall, and which automations drive pipeline forward.",
    "bgClass": "bg-surface-card",
    "textClass": "text-ink",
    "colSpan": "lg:col-span-2",
    "featured": false,
    "standoutLine": ""
  }
] as const;

export const steps = [
  {
    "title": "Book a call",
    "body": "Tell us where your funnel breaks down and which stages cost the most time. We’ll scope what to build first."
  },
  {
    "title": "We design and build your automations",
    "body": "Custom workflows designed for your tools, your data, and your sales process. Not a template. Not a generic playbook. Built for how your team actually works."
  },
  {
    "title": "We run it with you",
    "body": "Automations run on your servers or ours. You get a full walkthrough of every workflow, plus ongoing support. You understand what’s running and why."
  },
  {
    "title": "Stay as long as it works",
    "body": "Month-to-month. No annual lock-in. Cancel anytime. If it’s working, we keep building. If it’s not, we fix it or you walk."
  }
] as const;

export const faqs = [
  {
    "q": "What is OkGTM?",
    "a": "OkGTM is a hybrid GTM service. We design, build, and manage go-to-market automations for B2B companies. Think of us as the team that connects your existing tools into one system that runs your funnel end-to-end: from lead capture through enrichment, outbound, follow-ups, sales handoff, and reporting."
  },
  {
    "q": "How fast can you get our automations running?",
    "a": "It depends on the complexity of your stack and your funnel. We scope the timeline on our first call so you know exactly what to expect before any work begins. We won’t give you a number we can’t back up."
  },
  {
    "q": "What if the automations don’t deliver results?",
    "a": "We don’t want your money if we’re not generating value. If the system isn’t working, we’ll adjust until it does. And because the engagement is month-to-month, you’re never stuck paying for something that isn’t performing."
  },
  {
    "q": "Is there a long-term commitment?",
    "a": "No. Month-to-month. Cancel anytime. No annual contracts, no setup fees that lock you in. The work earns its place every month or you walk."
  },
  {
    "q": "Which tools and platforms do you work with?",
    "a": "All major GTM platforms. HubSpot, Salesforce, Clay, Apollo, LinkedIn, Instantly, Smartlead, and more. If your team uses it for go-to-market, we can build automations around it. We’re not locked to one stack."
  }
] as const;
