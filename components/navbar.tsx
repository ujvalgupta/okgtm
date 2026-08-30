"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { CaretDown, List, Wrench, X } from "@phosphor-icons/react";

const WHATSAPP_HREF =
  "https://wa.me/918081100105?text=Hi%20Ujval%2C%20I%27d%20like%20to%20talk%20about%20automating%20my%20GTM.";

type NavLink = {
  title: string;
  description?: string;
  href: string;
  icon?: ReactNode;
};

/* ── Resources dropdown items ── */
const resourceLinks: readonly NavLink[] = [
  {
    title: "Free tools",
    description: "Useful GTM tools, free to use",
    href: "/free-tools",
    icon: <Wrench size={20} weight="duotone" />,
  },
];

/* ── Reusable dropdown (hover + click open, mouseleave/Escape/outside close) ── */
function NavDropdown({
  label,
  links,
  open,
  setOpen,
  align = "left",
}: {
  label: string;
  links: readonly NavLink[];
  open: boolean;
  setOpen: (v: boolean) => void;
  align?: "left" | "center";
}) {
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-1.5 rounded-[12px] px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-soft hover:text-ink"
      >
        {label}
        <CaretDown
          size={14}
          weight="bold"
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        /* Bridge wrapper: pt-2 keeps the trigger→panel path hoverable (no dead gap) */
        <div
          className={`absolute top-full z-50 pt-2 ${
            align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
          }`}
        >
          <div
            role="menu"
            aria-label={label}
            className="w-72 rounded-[16px] border border-hairline bg-canvas p-2 shadow-[0_16px_40px_-12px_rgba(10,10,10,0.18)]"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                role="menuitem"
                className="flex items-start gap-3 rounded-[12px] p-3 transition-colors hover:bg-surface-soft focus-visible:bg-surface-soft"
              >
                {link.icon && (
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-card text-ink">
                    {link.icon}
                  </span>
                )}
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {link.title}
                  </span>
                  {link.description && (
                    <span className="block text-pretty text-xs leading-snug text-muted-foreground">
                      {link.description}
                    </span>
                  )}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Close dropdowns + mobile panel on outside click or Escape.
     A single header ref guards BOTH desktop dropdowns and the mobile panel,
     so tapping a link inside them never gets unmounted before navigation. */
  useEffect(() => {
    if (!resourcesOpen && !mobileOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
        setMobileOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setResourcesOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [resourcesOpen, mobileOpen]);

  /* Clear the close timer on unmount */
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-hairline bg-canvas"
      role="banner"
    >
      <nav
        className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6"
        aria-label="Main navigation"
      >
        {/* Logo / wordmark */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-ink"
          aria-label="OkGTM home"
        >
          OkGTM
        </Link>

        {/* Desktop dropdowns (middle) */}
        <div className="hidden items-center gap-1 md:flex">
          <NavDropdown
            label="Resources"
            links={resourceLinks}
            open={resourcesOpen}
            setOpen={setResourcesOpen}
            align="center"
          />
          <a
            href="https://labs.okgtm.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-[12px] border border-hairline px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-soft hover:text-ink"
          >
            Labs
          </a>
        </div>

        {/* Desktop CTA */}
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-11 items-center rounded-[12px] bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active md:inline-flex"
        >
          Let&apos;s talk
        </a>

        {/* Mobile: CTA + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-[12px] bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active"
          >
            Let&apos;s talk
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-hairline text-ink transition-colors hover:bg-surface-soft"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile panel: Labs + Resources */}
      {mobileOpen && (
        <div className="border-t border-hairline bg-canvas px-6 pb-6 pt-4 md:hidden">
          <a
            href="https://labs.okgtm.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="flex h-11 items-center justify-center rounded-[12px] border border-hairline text-sm font-semibold text-ink transition-colors hover:bg-surface-soft"
          >
            Labs
          </a>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[1.5px] text-muted-foreground">
            Resources
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            {resourceLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-start gap-3 rounded-[12px] p-3 transition-colors hover:bg-surface-soft"
              >
                {link.icon && (
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-card text-ink">
                    {link.icon}
                  </span>
                )}
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {link.title}
                  </span>
                  {link.description && (
                    <span className="block text-pretty text-xs leading-snug text-muted-foreground">
                      {link.description}
                    </span>
                  )}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
