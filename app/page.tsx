import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/scroll-reveal";
import { AmbientVideo } from "@/components/ambient-video";
import { features, steps, faqs } from "@/content/home/data";

/* ── Shared CTA destination ── */
const WHATSAPP_HREF =
  "https://wa.me/918081100105?text=Hi%20Ujval%2C%20I%27d%20like%20to%20talk%20about%20automating%20my%20GTM.";

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
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
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
              Lots of tools. Broken&nbsp;systems.
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
          <ScrollReveal className="mx-auto mt-6 max-w-[800px] rounded-[24px] bg-brand-teal p-8 text-on-dark md:p-12">
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
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
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
