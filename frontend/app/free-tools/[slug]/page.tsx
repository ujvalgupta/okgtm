import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/scroll-reveal";
import { liveTools, getToolBySlug } from "@/lib/free-tools";
import ToolForm from "./tool-form";

/* ── Static params for the 6 live tools ── */
export function generateStaticParams() {
  return liveTools.map((t) => ({ slug: t.slug }));
}

/* ── Dynamic metadata per copy.md pattern ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return {
    title: `${tool.name} - Free LinkedIn Tool | OkGTM Labs`,
    description: tool.metaDescription,
  };
}

/* ── CTA destination ── */
const WHATSAPP_HREF =
  "https://wa.me/918081100105?text=Hi%20Ujval%2C%20I%27d%20like%20to%20talk%20about%20automating%20my%20GTM.";

/* ════════════════════════════════════════════════════════════
   Page
   ════════════════════════════════════════════════════════════ */
export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  return (
    <>
      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section
        className="bg-canvas pb-12 pt-16 md:pt-24"
        aria-labelledby="tool-heading"
      >
        <div className="mx-auto w-full max-w-[1280px] px-6">
          <div className="mx-auto max-w-[640px] text-center">
            {/* Eyebrow */}
            <p
              className="hero-enter text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground"
              style={{ "--hero-delay": "0ms" } as React.CSSProperties}
            >
              FREE TOOL
            </p>

            {/* H1 */}
            <h1
              id="tool-heading"
              className="hero-enter mt-5 text-balance font-display text-[32px] font-medium leading-[1.05] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px] lg:text-[52px] lg:tracking-[-2px]"
              style={{ "--hero-delay": "80ms" } as React.CSSProperties}
            >
              {tool.heroH1}
            </h1>

            {/* Subhead */}
            <p
              className="hero-enter mx-auto mt-6 max-w-[480px] text-pretty text-base leading-relaxed text-body md:text-lg"
              style={{ "--hero-delay": "160ms" } as React.CSSProperties}
            >
              {tool.heroSubhead}
            </p>

            {/* Back link */}
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. EMBEDDED TOOL FORM ═══════════════ */}
      <section
        id="try-it"
        className="bg-canvas pb-24"
        aria-label={`Try ${tool.name}`}
      >
        <div className="mx-auto w-full max-w-[520px] px-6">
          <ScrollReveal>
            <div className="rounded-[24px] bg-surface-soft p-6 md:p-8">
              <ToolForm slug={slug} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ 3. WHAT IT DOES ═══════════════ */}
      <section
        className="bg-surface-soft py-24"
        aria-labelledby="what-it-does-heading"
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <ScrollReveal className="mx-auto max-w-[760px] text-center">
            <h2
              id="what-it-does-heading"
              className="text-balance font-display text-[28px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px]"
            >
              What it does?
            </h2>
            <p className="mt-6 text-pretty text-base leading-relaxed text-body">
              {tool.whatItDoes}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ 4. HOW IT WORKS ═══════════════ */}
      <section
        className="bg-canvas py-24"
        aria-labelledby="how-it-works-heading"
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <ScrollReveal className="text-center">
            <h2
              id="how-it-works-heading"
              className="font-display text-[28px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px]"
            >
              How it works?
            </h2>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {tool.howItWorks.map((step, i) => (
              <ScrollReveal
                key={i}
                delay={i * 80}
                className="rounded-[16px] bg-surface-soft p-8"
              >
                <h3 className="text-base font-semibold leading-snug text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-body">
                  {step.body}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 5. WHAT YOU GET ═══════════════ */}
      <section
        className="bg-surface-soft py-24"
        aria-labelledby="what-you-get-heading"
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <ScrollReveal className="text-center">
            <h2
              id="what-you-get-heading"
              className="font-display text-[28px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px]"
            >
              What you get?
            </h2>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {tool.whatYouGet.map((item, i) => (
              <ScrollReveal
                key={i}
                delay={i * 80}
                className="rounded-[16px] bg-canvas p-8"
              >
                <h3 className="text-base font-semibold leading-snug text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-body">
                  {item.body}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. FAQ ═══════════════ */}
      <section
        className="bg-canvas py-24"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-[800px] px-6">
          <ScrollReveal>
            <h2
              id="faq-heading"
              className="mb-10 font-display text-[28px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px]"
            >
              Frequently asked questions
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <Accordion>
              {tool.faq.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-pretty">{item.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ 7. CTA BAND ═══════════════ */}
      <section className="bg-surface-soft py-24" aria-labelledby="tool-cta-heading">
        <div className="mx-auto max-w-[1280px] px-6">
          <ScrollReveal className="rounded-[24px] bg-canvas px-8 py-16 text-center md:px-20 md:py-20">
            <h2
              id="tool-cta-heading"
              className="font-display text-[28px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[40px] md:tracking-[-1px]"
            >
              Want something custom-built instead?
            </h2>
            <p className="mx-auto mt-5 max-w-[480px] text-pretty text-base leading-relaxed text-body">
              Skip the tools. Tell us what you need automated.
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
