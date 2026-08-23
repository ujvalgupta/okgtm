import { HeroProductPreview } from "@/components/hero-product-preview";
import {
  LeadCapturePreview,
  EnrichmentPreview,
  OutboundPreview,
  FollowUpPreview,
  HandoffPreview,
  ReportingPreview,
} from "@/components/feature-card-preview";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/* ── Shared CTA destination ── */
const CTA_MAILTO =
  "mailto:contactujval@gmail.com?subject=Let%27s%20talk%20-%20OkGTM%20Labs";

/* ════════════════════════════════════════════════════════════
   Feature card data (verbatim from copy.md §3)
   Colors per copy.md design hints, no repeated color in a row.
   ════════════════════════════════════════════════════════════ */
const features = [
  {
    title: "Capture Leads the Moment They Arrive",
    body: "Website forms, inbound chat, LinkedIn, imports. Every lead hits one system instantly, no matter where it came from. No more checking five inboxes.",
    bgClass: "bg-brand-peach",
    textClass: "text-ink-on-pastel",
    colSpan: "",
    Preview: LeadCapturePreview,
  },
  {
    title: "Enrich and Score Leads Automatically",
    body: "Pull firmographic and contact data from platforms like Apollo and LinkedIn. Score every lead using custom intent signals so your team focuses on the ones most likely to close.",
    italic:
      "Most clients start here. It's where manual hours disappear fastest.",
    bgClass: "bg-brand-teal",
    textClass: "text-on-dark",
    colSpan: "md:col-span-2",
    Preview: EnrichmentPreview,
  },
  {
    title: "Run Multi-Channel Outbound on Autopilot",
    body: "Trigger email and LinkedIn sequences based on lead score and behavior. Warm-up routines, custom timing, and personalized messaging built in from day one.",
    bgClass: "bg-brand-pink",
    textClass: "text-ink-on-pastel",
    colSpan: "",
    Preview: OutboundPreview,
  },
  {
    title: "Follow Up Based on What Leads Actually Do",
    body: "Every follow-up is tied to real intent signals, not arbitrary timers. When a lead engages, your system responds. When they go quiet, it adapts.",
    bgClass: "bg-brand-lavender",
    textClass: "text-ink-on-pastel",
    colSpan: "",
    Preview: FollowUpPreview,
  },
  {
    title: "Hand Off to Sales with Full Context",
    body: 'Leads arrive in your CRM with enrichment data, sequence history, and activity log attached. Works with HubSpot, Salesforce, Clay, and AI-native CRMs. No more "what do we know about this lead?" conversations.',
    bgClass: "bg-brand-ochre",
    textClass: "text-ink-on-pastel",
    colSpan: "",
    Preview: HandoffPreview,
  },
  {
    title: "See What's Working and What Isn't",
    body: "Connect activity to outcomes across every stage of your funnel. Track what drives revenue and cut what doesn't.",
    bgClass: "bg-surface-card",
    textClass: "text-ink",
    colSpan: "md:col-span-2 lg:col-span-3",
    Preview: ReportingPreview,
  },
] as const;

/* ════════════════════════════════════════════════════════════
   How-it-works steps (verbatim from copy.md §4)
   ════════════════════════════════════════════════════════════ */
const steps = [
  {
    num: 1,
    title: "Talk to Us",
    body: "Book a call. Tell us where your funnel leaks and which stages eat the most of your team's time.",
  },
  {
    num: 2,
    title: "We Build It",
    body: "Our engineers design custom automations for your stack. Not templates you configure yourself. Systems built for how your team actually sells.",
  },
  {
    num: 3,
    title: "Live in Under 23 Hours",
    body: 'Your first automation MVP runs within 23 hours of closing the deal. Not "onboarding." Not an "implementation timeline." Running.',
  },
  {
    num: 4,
    title: "Scale From There",
    body: "Add more funnel stages, adjust triggers, expand channels. Month-to-month, cancel anytime.",
  },
] as const;

/* ════════════════════════════════════════════════════════════
   FAQ items (verbatim from copy.md §6)
   ════════════════════════════════════════════════════════════ */
const faqs = [
  {
    q: "What exactly is OkGTM Labs?",
    a: "Part agency, part engineering team. We build custom GTM automations and manage them for you. Think of us as the technical co-founder your go-to-market is missing.",
  },
  {
    q: "How fast will I see something working?",
    a: 'Your first automation MVP runs within 23 hours of closing the deal. Not a proposal, not a roadmap. A working system.',
  },
  {
    q: "What if it doesn't deliver?",
    a: "We don't want your money if we're not getting you results. If the automations aren't working, we'll tell you before you tell us. We pick clients carefully because we only take on work we believe will drive real outcomes.",
  },
  {
    q: "What's the commitment?",
    a: "Month-to-month. Cancel anytime. No annual lock-in.",
  },
  {
    q: "Which tools do you work with?",
    a: "All the major GTM platforms: HubSpot, Salesforce, Clay, Apollo, LinkedIn, Instantly, Outreach, and more. We work with your existing stack or recommend the right one. If a tool doesn't exist for what you need, we build it.",
  },
] as const;

/* ════════════════════════════════════════════════════════════
   Page component
   ════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section
        className="flex min-h-[100dvh] items-center bg-canvas pt-16"
        aria-labelledby="hero-heading"
      >
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 px-6 md:grid-cols-12 md:gap-12 lg:gap-16">
          {/* Copy: 7 of 12 columns */}
          <div className="md:col-span-8">
            <p className="text-xs font-semibold uppercase tracking-[0.125em] text-muted-foreground">
              FOR B2B COMPANIES
            </p>

            <h1
              id="hero-heading"
              className="mt-4 font-display text-4xl font-medium leading-[1] tracking-[-0.04em] text-ink md:text-[48px] xl:text-[56px]"
            >
              We Build Your Revenue Engine. Live in Under 23 Hours.
            </h1>

            <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-body md:text-lg">
              Custom GTM automations across your full funnel. From lead capture
              to revenue, built and managed for you.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={CTA_MAILTO}
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

          {/* Product preview: 5 of 12 columns */}
          <div className="md:col-span-4">
            <HeroProductPreview />
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. PROBLEM ═══════════════ */}
      <section
        className="bg-surface-soft py-24"
        aria-labelledby="problem-heading"
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="max-w-[720px]">
            <h2
              id="problem-heading"
              className="font-display text-3xl font-medium leading-tight tracking-[-0.025em] text-ink md:text-[40px] md:leading-[1.1]"
            >
              Your GTM Is Held Together with Tabs and Hope
            </h2>

            <div className="mt-6 space-y-5 text-base leading-relaxed text-body">
              <p>
                You&apos;re running five tools that don&apos;t talk to each
                other. Leads slip between your form builder, enrichment
                provider, sequencer, and CRM. Every handoff is manual.
              </p>
              <p>
                Or you hired an agency that handed you a strategy deck and
                vanished into a blackbox. You can&apos;t see what&apos;s
                running, what&apos;s working, or what changed.
              </p>
              <p>
                Revenue is leaking. Not because your product is wrong, but
                because your go-to-market system doesn&apos;t exist yet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 3. FEATURE CARDS ═══════════════ */}
      <section
        id="features"
        className="bg-canvas py-24"
        aria-label="What we automate"
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className={`${f.bgClass} ${f.textClass} ${f.colSpan} rounded-[24px] p-8`}
              >
                <h3 className="text-lg font-semibold leading-tight">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed opacity-90">
                  {f.body}
                </p>
                {"italic" in f && f.italic && (
                  <p className="mt-3 text-sm leading-relaxed italic opacity-75">
                    {f.italic}
                  </p>
                )}
                <f.Preview />
              </div>
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
          <h2
            id="hiw-heading"
            className="mb-12 max-w-[640px] font-display text-3xl font-medium leading-tight tracking-[-0.025em] text-ink md:text-[40px] md:leading-[1.1]"
          >
            Four Steps. First One Is a Conversation.
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-[16px] bg-canvas p-8"
              >
                <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-[12px] bg-surface-card text-sm font-semibold text-ink">
                  {step.num}
                </span>
                <h3 className="text-lg font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-body">
                  {step.body}
                </p>
              </div>
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
          <h2
            id="why-heading"
            className="mb-12 max-w-[640px] font-display text-3xl font-medium leading-tight tracking-[-0.025em] text-ink md:text-[40px] md:leading-[1.1]"
          >
            Not Another Agency. Not Another Tool.
          </h2>

          {/* Comparison cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* vs Agencies */}
            <div className="rounded-[16px] bg-surface-soft p-8">
              <h3 className="text-base font-semibold text-ink">
                vs. Traditional Agencies
              </h3>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-body">
                <p>
                  They hand you a strategy deck and disappear. You pay monthly,
                  get a status call, and never see what&apos;s actually running.
                </p>
                <p>
                  We build in front of you. No blackbox, no mystery, no junior
                  team running your account in the background.
                </p>
              </div>
            </div>

            {/* vs Point Tools */}
            <div className="rounded-[16px] bg-surface-soft p-8">
              <h3 className="text-base font-semibold text-ink">
                vs. Point Tools
              </h3>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-body">
                <p>
                  Apollo, Clay, HubSpot, Instantly, Outreach. Good tools. But
                  they&apos;re just dots.
                </p>
                <p>
                  None of them connect to each other on their own. OkGTM Labs
                  connects those dots in the right order, turning isolated tools
                  into one system that runs your full funnel.
                </p>
              </div>
            </div>
          </div>

          {/* Founder section */}
          <div className="mt-6 rounded-[16px] bg-brand-teal p-8 text-on-dark">
            <h3 className="text-base font-semibold">The OkGTM Difference</h3>
            <p className="mt-4 max-w-[65ch] text-sm leading-relaxed opacity-90">
              We&apos;re a small, technical team led by founder Ujval Gupta. We
              bend tech to drive revenue. If a tool doesn&apos;t do what we
              need, we build around it or build our own.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. FAQ ═══════════════ */}
      <section
        className="bg-surface-soft py-24"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-[800px] px-6">
          <h2
            id="faq-heading"
            className="mb-10 font-display text-3xl font-medium leading-tight tracking-[-0.025em] text-ink md:text-[40px] md:leading-[1.1]"
          >
            Questions We Actually Get
          </h2>

          <Accordion>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>
                  <p>{faq.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══════════════ 7. CTA BAND ═══════════════ */}
      <section className="bg-canvas py-24" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="rounded-[24px] bg-surface-soft px-8 py-16 text-center md:px-20 md:py-20">
            <h2
              id="cta-heading"
              className="font-display text-3xl font-medium leading-tight tracking-[-0.025em] text-ink md:text-[40px] md:leading-[1.1]"
            >
              Stop Duct-Taping Your Funnel
            </h2>
            <p className="mx-auto mt-5 max-w-[56ch] text-base leading-relaxed text-body">
              Most teams start with lead enrichment and scoring. Book a call
              with Ujval and find out where your funnel is leaking and what to
              automate first.
            </p>
            <div className="mt-8">
              <a
                href={CTA_MAILTO}
                className="inline-flex h-11 items-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active active:scale-[0.98]"
              >
                Let&apos;s talk
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
