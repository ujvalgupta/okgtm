import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/scroll-reveal";
import { AmbientVideo } from "@/components/ambient-video";

/* ── Shared CTA destination ── */
const CTA_HREF = "https://linkedin.com/in/ujvalgupta";

/* ════════════════════════════════════════════════════════════
   Feature card data (verbatim from copy.md §3)
   Color cycling per DESIGN.md: peach → teal → pink → lavender → ochre → cream
   ════════════════════════════════════════════════════════════ */
const features = [
  {
    title: "Capture",
    subtitle: "Leads routed the moment they arrive.",
    body: "Website forms, inbound chat, LinkedIn, signups, imports. Every lead enters a single system and gets routed instantly to the right workflow. No CSV exports. No manual entry.",
    bgClass: "bg-brand-peach",
    textClass: "text-ink",
    colSpan: "",
    featured: false,
    standoutLine: "",
  },
  {
    title: "Enrich + Score",
    subtitle: "Know who\u2019s worth your time before you spend it.",
    body: "Every lead is enriched with firmographic and contact data from platforms like Apollo and LinkedIn, then scored using intent signals. Your team stops guessing which leads matter and starts working the ones that do.",
    bgClass: "bg-brand-teal",
    textClass: "text-on-dark",
    colSpan: "lg:col-span-2",
    featured: true,
    standoutLine:
      "This is where most teams start. It\u2019s also where the biggest time savings hide.",
  },
  {
    title: "Outbound",
    subtitle:
      "Sequences that start with context, not cold lists.",
    body: "Email and LinkedIn sequences triggered by fit score, behavior signals, and funnel stage. Domain warm-up built in. Every message lands with relevance because it\u2019s backed by enrichment and scoring data, not a static spreadsheet.",
    bgClass: "bg-brand-pink",
    textClass: "text-ink",
    colSpan: "lg:col-span-2",
    featured: false,
    standoutLine: "",
  },
  {
    title: "Follow-ups",
    subtitle: "Timed to intent, not to someone\u2019s memory.",
    body: "Follow-up sequences tied to lead activity and intent signals. When a lead engages, the system responds. When they go quiet, it re-engages on a schedule your team defines. No leads forgotten in a dead pipeline.",
    bgClass: "bg-brand-lavender",
    textClass: "text-ink",
    colSpan: "",
    featured: false,
    standoutLine: "",
  },
  {
    title: "Handoff",
    subtitle: "Sales gets context, not just a name.",
    body: "When a lead is ready, it moves into your CRM with full history attached: enrichment data, sequence activity, engagement signals. Works with HubSpot, Salesforce, Clay, and AI-native CRMs. Your sales team picks up where the system left off.",
    bgClass: "bg-brand-ochre",
    textClass: "text-ink",
    colSpan: "lg:col-span-2",
    featured: false,
    standoutLine: "",
  },
  {
    title: "Reporting",
    subtitle: "See what\u2019s working. Fix what isn\u2019t.",
    body: "Track performance across every stage of your funnel from one view. Understand where leads convert, where they stall, and which automations drive pipeline forward.",
    bgClass: "bg-surface-card",
    textClass: "text-ink",
    colSpan: "",
    featured: false,
    standoutLine: "",
  },
] as const;

/* ════════════════════════════════════════════════════════════
   How-it-works steps (verbatim from copy.md §4)
   ════════════════════════════════════════════════════════════ */
const steps = [
  {
    title: "Book a call",
    body: "Tell us where your funnel breaks down and which stages cost the most time. We\u2019ll scope what to build first.",
  },
  {
    title: "We design and build your automations",
    body: "Custom workflows designed for your tools, your data, and your sales process. Not a template. Not a generic playbook. Built for how your team actually works.",
  },
  {
    title: "We run it with you",
    body: "Automations run on your servers or ours. You get a full walkthrough of every workflow, plus ongoing support. You understand what\u2019s running and why.",
  },
  {
    title: "Stay as long as it works",
    body: "Month-to-month. No annual lock-in. Cancel anytime. If it\u2019s working, we keep building. If it\u2019s not, we fix it or you walk.",
  },
] as const;

/* ════════════════════════════════════════════════════════════
   FAQ items (verbatim from copy.md §6)
   ════════════════════════════════════════════════════════════ */
const faqs = [
  {
    q: "What is OkGTM Labs?",
    a: "OkGTM Labs is a hybrid GTM service. We design, build, and manage go-to-market automations for B2B companies. Think of us as the team that connects your existing tools into one system that runs your funnel end-to-end: from lead capture through enrichment, outbound, follow-ups, sales handoff, and reporting.",
  },
  {
    q: "How fast can you get our automations running?",
    a: "It depends on the complexity of your stack and your funnel. We scope the timeline on our first call so you know exactly what to expect before any work begins. We won\u2019t give you a number we can\u2019t back up.",
  },
  {
    q: "What if the automations don\u2019t deliver results?",
    a: "We don\u2019t want your money if we\u2019re not generating value. If the system isn\u2019t working, we\u2019ll adjust until it does. And because the engagement is month-to-month, you\u2019re never stuck paying for something that isn\u2019t performing.",
  },
  {
    q: "Is there a long-term commitment?",
    a: "No. Month-to-month. Cancel anytime. No annual contracts, no setup fees that lock you in. The work earns its place every month or you walk.",
  },
  {
    q: "Which tools and platforms do you work with?",
    a: "All major GTM platforms. HubSpot, Salesforce, Clay, Apollo, LinkedIn, Instantly, Smartlead, and more. If your team uses it for go-to-market, we can build automations around it. We\u2019re not locked to one stack.",
  },
] as const;

/* ════════════════════════════════════════════════════════════
   Page component
   ════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      {/* ═══════════════ 1. HERO (typographic, single column) ═══════════════ */}
      <section
        className="bg-canvas pb-24 pt-16 md:pt-24"
        aria-labelledby="hero-heading"
      >
        <div className="mx-auto w-full max-w-[1280px] px-6">
          <div className="mx-auto max-w-[720px] text-center">
            {/* Eyebrow */}
            <p
              className="hero-enter text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground"
              style={{ "--hero-delay": "0ms" } as React.CSSProperties}
            >
              GTM OS FOR B2B COMPANIES
            </p>

            {/* Headline (display-xl) */}
            <h1
              id="hero-heading"
              className="hero-enter mt-5 font-display text-[36px] font-medium leading-[1] tracking-[-1px] text-ink md:text-[34px] md:tracking-[-1px] lg:text-[40px] lg:tracking-[-1.5px] xl:text-[52px] xl:tracking-[-2px]"
              style={{ "--hero-delay": "80ms" } as React.CSSProperties}
            >
              Your entire go-to-market funnel, built and managed for you.
            </h1>

            {/* Subtext (body-md) */}
            <p
              className="hero-enter mx-auto mt-6 max-w-[52ch] text-pretty text-base leading-relaxed text-body md:text-lg"
              style={{ "--hero-delay": "160ms" } as React.CSSProperties}
            >
              We design, build, and run GTM automations across every stage of
              your funnel so your team closes more deals.
            </p>

            {/* CTAs */}
            <div
              className="hero-enter mt-8 flex flex-wrap items-center justify-center gap-4"
              style={{ "--hero-delay": "240ms" } as React.CSSProperties}
            >
              <a
                href={CTA_HREF}
                className="inline-flex h-11 items-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98]"
              >
                Let&apos;s talk
              </a>
              <a
                href="#how-it-works"
                className="inline-flex h-11 items-center rounded-[12px] border border-hairline bg-canvas px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-soft"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. PROBLEM FRAMING ═══════════════ */}
      <section
        className="bg-surface-soft py-24"
        aria-labelledby="problem-heading"
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal className="max-w-[640px]">
            <p className="text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground">
              THE PROBLEM
            </p>
            <h2
              id="problem-heading"
              className="mt-4 text-balance font-display text-[28px] font-medium leading-[1.05] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px] lg:text-[56px] lg:tracking-[-2px]"
            >
              Lots of tools. Zero&nbsp;orchestration.
            </h2>

            <div className="mt-8 space-y-5 text-base leading-relaxed text-body">
              {/* One alignment + one max-width for every paragraph (design rule):
                  left-aligned block, all paragraphs max-w-[480px], so line breaks
                  are a predictable function of that width. Right side of the
                  section is reserved for a future visual. */}
              <p className="max-w-[480px] text-pretty">
                Your CRM holds stale records. Your enrichment tool runs in a
                separate tab. Outbound sequences fire without context from
                inbound signals. Follow-ups slip because no one owns them.
              </p>
              <p className="max-w-[480px] text-pretty">
                The result: leads fall through the cracks between tools that
                were never designed to talk to each other.
              </p>
              <p className="max-w-[480px] text-pretty">
                Most teams try to fix this by adding another tool. That makes it
                worse. What&apos;s missing isn&apos;t another point solution.
                It&apos;s the layer that connects them all.
              </p>
            </div>
          </ScrollReveal>

            {/* Right: clay-style problem visual */}
            <ScrollReveal delay={120}>
              <div className="overflow-hidden rounded-[24px] border border-hairline bg-canvas">
                <AmbientVideo
                  src="/videos/problem-clay-worker.mp4"
                  className="aspect-video w-full object-cover"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ 3. FEATURE CARDS ×6 ═══════════════ */}
      <section className="bg-canvas py-24" aria-labelledby="features-heading">
        <div className="mx-auto max-w-[1280px] px-6">
          <ScrollReveal className="mx-auto max-w-[640px] text-center">
            <p className="text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground">
              WHAT WE BUILD FOR YOU
            </p>
            <h2
              id="features-heading"
              className="mt-4 text-balance font-display text-[28px] font-medium leading-[1.05] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px] lg:text-[56px] lg:tracking-[-2px]"
            >
              Every stage of your funnel. One connected system.
            </h2>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <ScrollReveal
                key={f.title}
                delay={i * 60}
                className={`${f.bgClass} ${f.textClass} ${f.colSpan} flex flex-col rounded-[24px] p-8`}
              >
                <h3 className="text-lg font-semibold leading-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-pretty text-sm font-medium leading-snug opacity-85">
                  {f.subtitle}
                </p>
                {f.standoutLine && (
                  <p className="mt-3 text-pretty text-sm italic leading-relaxed opacity-80">
                    {f.standoutLine}
                  </p>
                )}
                <p className="mt-3 flex-1 text-balance text-sm leading-relaxed opacity-90">
                  {f.body}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. HOW IT WORKS ═══════════════ */}
      <section
        id="how-it-works"
        className="bg-surface-soft py-24"
        aria-labelledby="hiw-heading"
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <ScrollReveal className="mx-auto max-w-[640px] text-center">
            <p className="text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground">
              HOW IT WORKS
            </p>
            <h2
              id="hiw-heading"
              className="mt-4 mb-12 mx-auto max-w-[640px] text-balance font-display text-[28px] font-medium leading-[1.05] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px] lg:text-[56px] lg:tracking-[-2px]"
            >
              Four steps. Built around your stack.
            </h2>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <ScrollReveal
                key={step.title}
                delay={i * 80}
                className="rounded-[16px] bg-canvas p-8"
              >
                <h3 className="text-base font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-body">
                  {step.body}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 5. WHY US ═══════════════ */}
      <section
        id="why-us"
        className="bg-canvas py-24"
        aria-labelledby="why-heading"
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <ScrollReveal className="mx-auto max-w-[640px] text-center">
            <p className="text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground">
              WHY OKGTM
            </p>
            <h2
              id="why-heading"
              className="mt-4 text-balance font-display text-[28px] font-medium leading-[1.05] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px] lg:text-[56px] lg:tracking-[-2px]"
            >
              Not another tool. Not a typical agency.
            </h2>
          </ScrollReveal>

          {/* Blocks A + B: side-by-side comparison cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Block A: vs. Point Tools */}
            <ScrollReveal className="rounded-[16px] bg-surface-soft p-8">
              <h3 className="font-display text-[24px] font-medium leading-[1.15] tracking-[-0.3px] text-ink">
                More than individual tools
              </h3>
              <p className="mt-5 text-pretty text-sm leading-relaxed text-body">
                Clay, Apollo, Instantly, HubSpot. They&apos;re excellent at what
                they do. But they don&apos;t talk to each other out of the box.
                OkGTM builds the orchestration layer that connects them into one
                system: capture to enrichment to outbound to handoff, with data
                flowing between every stage.
              </p>
            </ScrollReveal>

            {/* Block B: vs. Agencies */}
            <ScrollReveal
              delay={80}
              className="rounded-[16px] bg-surface-soft p-8"
            >
              <h3 className="font-display text-[24px] font-medium leading-[1.15] tracking-[-0.3px] text-ink">
                Done for you. Owned by you.
              </h3>
              <p className="mt-5 text-pretty text-sm leading-relaxed text-body">
                We build and run your automations like an agency would. The
                difference: everything runs on your infrastructure if you want
                it to, and you get full visibility into every workflow. When the
                engagement ends, you keep what we built.
              </p>
            </ScrollReveal>
          </div>

          {/* Block C: Risk Reversal — featured teal card for emphasis */}
          <ScrollReveal className="mt-6 rounded-[24px] bg-brand-teal p-8 text-on-dark md:p-12">
            <h3 className="font-display text-[24px] font-medium leading-[1.15] tracking-[-0.3px] md:text-[34px] md:tracking-[-1px]">
              We don&apos;t want your money if we don&apos;t get you results.
            </h3>
            <p className="mt-5 max-w-[65ch] text-pretty text-sm leading-relaxed opacity-90">
              That&apos;s not a tagline. It&apos;s how we operate. If the
              automations we build aren&apos;t generating measurable value for
              your team, we&apos;ll make it right. Month-to-month commitment
              means you&apos;re never locked in. The work has to earn its place
              every month.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ 6. FAQ ═══════════════ */}
      <section
        className="bg-surface-soft py-24"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-[800px] px-6">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground">
              FREQUENTLY ASKED QUESTIONS
            </p>
            <h2
              id="faq-heading"
              className="mt-4 mb-10 font-display text-[28px] font-medium leading-[1.05] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px] lg:text-[56px] lg:tracking-[-2px]"
            >
              Questions we hear on every call.
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <Accordion>
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-pretty">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ 7. CTA BAND (cta-band-illustrated) ═══════════════ */}
      <section className="bg-canvas py-24" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-[1280px] px-6">
          <ScrollReveal className="rounded-[24px] bg-surface-soft px-8 py-16 text-center md:px-20 md:py-20">
            <h2
              id="cta-heading"
              className="font-display text-[28px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px]"
            >
              Start with what costs your team the most time.
            </h2>
            <p className="mx-auto mt-5 max-w-[56ch] text-pretty text-base leading-relaxed text-body">
              Most teams begin with lead enrichment and scoring. 30 minutes. No
              pitch deck. Just a clear look at where your funnel leaks.
            </p>
            <div className="mt-8">
              <a
                href={CTA_HREF}
                className="inline-flex h-11 items-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98]"
              >
                Let&apos;s talk
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
