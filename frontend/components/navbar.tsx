"use client";

import { useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react";

const CTA_MAILTO =
  "mailto:contactujval@gmail.com?subject=Let%27s%20talk%20-%20OkGTM%20Labs";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Why us", href: "#why-us" },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 h-16 border-b border-hairline bg-canvas"
      role="banner"
    >
      <nav
        className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6"
        aria-label="Main navigation"
      >
        {/* Logo / wordmark */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-ink"
          aria-label="OkGTM Labs home"
        >
          OkGTM Labs
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex" role="list">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <a
          href={CTA_MAILTO}
          className="hidden h-11 items-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active md:inline-flex"
        >
          Let&apos;s talk
        </a>

        {/* Mobile hamburger */}
        <button
          className="inline-flex items-center justify-center rounded-[12px] p-2 text-ink md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-hairline bg-canvas px-6 pb-6 pt-4 md:hidden">
          <ul className="flex flex-col gap-4" role="list">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="block text-sm font-medium text-muted-foreground hover:text-ink"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={CTA_MAILTO}
            className="mt-4 block w-full rounded-[12px] bg-primary px-5 py-3 text-center text-sm font-semibold text-on-primary"
            onClick={() => setMobileOpen(false)}
          >
            Let&apos;s talk
          </a>
        </div>
      )}
    </header>
  );
}
