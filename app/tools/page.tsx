import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";
import { liveTools } from "@/lib/free-tools";
import type { FreeTool } from "@/lib/free-tools";

/* ── Meta (verbatim from copy.md) ── */
export const metadata: Metadata = {
  title: "Free GTM Tools | OkGTM",
  description:
    "Free GTM tools: spy on competitor LinkedIn ads and posts, recover warm leads, and audit your cold email infrastructure before you send. No catch.",
};

/* ── CTA destination ── */
const WHATSAPP_HREF =
  "https://wa.me/918081100105?text=Hi%20Ujval%2C%20I%27d%20like%20to%20talk%20about%20automating%20my%20GTM.";

/* ════════════════════════════════════════════════════════════
   Live Tool Card
   ════════════════════════════════════════════════════════════ */
function LiveToolCard({ tool, index }: { tool: FreeTool; index: number }) {
  return (
    <ScrollReveal delay={index * 60} className="flex flex-col">
      {/* Whole card is the link to the tool page */}
      <Link
        href={`/tools/${tool.slug}`}
        className="flex h-full flex-col rounded-[24px] bg-surface-card p-8 transition-colors hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
      >
        {/* Name */}
        <h3 className="text-lg font-semibold leading-tight text-ink">
          {tool.name}
        </h3>

        {/* Tagline */}
        <p className="mt-2 text-pretty text-sm leading-relaxed text-body">
          {tool.tagline}
        </p>

        {/* Feature bullets */}
        <ul className="mt-4 flex-1 space-y-2">
          {tool.features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2 text-sm leading-relaxed text-body"
            >
              <span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
              <span className="text-pretty">{f}</span>
            </li>
          ))}
        </ul>
      </Link>
    </ScrollReveal>
  );
}

/* ════════════════════════════════════════════════════════════
   Page
   ════════════════════════════════════════════════════════════ */
export default function FreeToolsPage() {
  return (
    <>
      {/* ═══════════════ HERO ═══════════════ */}
      <section
        className="bg-canvas pb-20 pt-16 md:pb-24 md:pt-28"
        aria-labelledby="free-tools-heading"
      >
        <div className="mx-auto w-full max-w-[1280px] px-6">
          <div className="mx-auto max-w-[1100px] text-center">
            {/* Eyebrow */}
            <p
              className="hero-enter text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground"
              style={{ "--hero-delay": "0ms" } as React.CSSProperties}
            >
              FREE GTM TOOLS
            </p>

            {/* Headline — sized to stay on ONE centered line at desktop widths */}
            <h1
              id="free-tools-heading"
              className="hero-enter mt-5 font-display text-[34px] font-medium leading-[1.1] tracking-[-0.5px] text-ink md:text-[44px] md:tracking-[-1px] lg:text-[54px] lg:tracking-[-2px]"
              style={{ "--hero-delay": "80ms" } as React.CSSProperties}
            >
              Free tools to build your GTM motion
            </h1>
          </div>
        </div>
      </section>

      {/* ═══════════════ TOOLS GRID — newest first ═══════════════ */}
      <section className="bg-surface-soft py-24" aria-label="Free tools">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {liveTools.map((tool, i) => (
              <LiveToolCard key={tool.slug} tool={tool} index={i} />
            ))}
          </div>

        </div>
      </section>

      {/* ═══════════════ CTA BAND ═══════════════ */}
      <section className="bg-canvas py-24" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-[1280px] px-6">
          <ScrollReveal className="rounded-[24px] bg-surface-soft px-8 py-16 text-center md:px-20 md:py-20">
            <h2
              id="cta-heading"
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
