"use client";

import { LinkedinLogo, WhatsappLogo, XLogo } from "@phosphor-icons/react";

import { NewsletterForm } from "@/components/newsletter-form";

const LINKEDIN_HREF = "https://linkedin.com/in/ujvalgupta";
const X_HREF = "https://x.com/justujval";
const WHATSAPP_HREF =
  "https://wa.me/918081100105?text=Hi%20Ujval%2C%20I%27d%20like%20to%20talk%20about%20automating%20my%20GTM.";

const exploreLinks = [
  { label: "Home", href: "/" },
  { label: "Free tools", href: "/free-tools" },
] as const;

const contactLinks = [
  { label: "LinkedIn", href: LINKEDIN_HREF },
  { label: "X", href: X_HREF },
  { label: "WhatsApp", href: WHATSAPP_HREF },
  { label: "Email", href: "mailto:ujval@okgtm.com" },
] as const;

const socials = [
  {
    label: "Connect on LinkedIn",
    href: LINKEDIN_HREF,
    icon: <LinkedinLogo size={18} weight="fill" />,
  },
  {
    label: "Follow on X",
    href: X_HREF,
    icon: <XLogo size={18} weight="fill" />,
  },
  {
    label: "Chat on WhatsApp",
    href: WHATSAPP_HREF,
    icon: <WhatsappLogo size={18} weight="fill" />,
  },
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
              from OkGTM in your inbox.
            </p>
            <NewsletterForm />
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
              {contactLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-muted-foreground transition-colors hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Follow us */}
          <div>
            <h3 className="text-base font-semibold text-ink">Follow us</h3>
            <div className="mt-4 flex justify-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-canvas text-ink transition-colors hover:bg-surface-card"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-hairline pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 OkGTM. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            GTM OS for modern revenue teams.
          </p>
        </div>
      </div>
    </footer>
  );
}
