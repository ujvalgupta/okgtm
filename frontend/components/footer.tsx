"use client";

import { LinkedinLogo, PaperPlaneTilt } from "@phosphor-icons/react";

const CTA_HREF = "https://linkedin.com/in/ujvalgupta";

const exploreLinks = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Free tools", href: "/free-tools" },
  { label: "Blog", href: "/blog" },
] as const;

export function Footer() {
  return (
    <footer className="bg-surface-soft py-20" role="contentinfo">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid gap-12 text-center md:grid-cols-2 lg:grid-cols-4">
          {/* Stay Connected */}
          <div>
            <h2 className="font-display text-[28px] font-medium leading-[1.1] tracking-[-0.5px] text-ink">
              Stay Connected
            </h2>
            <p className="mx-auto mt-4 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
              GTM systems that run your funnel, not your patience. Get the latest
              from the OkGTM Labs in your inbox.
            </p>
            <form
              className="relative mx-auto mt-6 max-w-[320px]"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Newsletter signup"
            >
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                placeholder="Enter your email"
                className="h-11 w-full rounded-[12px] border border-hairline bg-canvas pr-12 pl-4 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary transition-transform hover:scale-105 hover:bg-primary-active"
              >
                <PaperPlaneTilt size={16} weight="bold" />
              </button>
            </form>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-base font-semibold text-ink">Explore</h3>
            <nav className="mt-4 space-y-2.5 text-sm" aria-label="Footer explore links">
              {exploreLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-muted-foreground transition-colors hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Get in touch */}
          <div>
            <h3 className="text-base font-semibold text-ink">Get in touch</h3>
            <nav className="mt-4 space-y-2.5 text-sm" aria-label="Footer contact links">
              <a
                href={CTA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted-foreground transition-colors hover:text-ink"
              >
                Let&apos;s talk
              </a>
              <a
                href={CTA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted-foreground transition-colors hover:text-ink"
              >
                LinkedIn profile
              </a>
            </nav>
          </div>

          {/* Follow us */}
          <div>
            <h3 className="text-base font-semibold text-ink">Follow us</h3>
            <div className="mt-4 flex justify-center gap-3">
              <a
                href={CTA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                title="Connect on LinkedIn"
                aria-label="Connect on LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-canvas text-ink transition-colors hover:bg-surface-card"
              >
                <LinkedinLogo size={18} weight="fill" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-hairline pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 OkGTM Labs. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            GTM OS for modern revenue teams.
          </p>
        </div>
      </div>
    </footer>
  );
}
