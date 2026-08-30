"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Lightweight scroll-reveal wrapper using IntersectionObserver.
 * Adds the `data-visible` attribute when the element enters the viewport,
 * which triggers CSS transitions defined in globals.css.
 *
 * Motion justification: hierarchy — draws attention to content as user
 * scrolls, reinforcing the page's narrative sequence.
 *
 * Reduced-motion: the CSS transition is gated behind
 * `prefers-reduced-motion: no-preference`. When reduced motion is preferred,
 * elements render in their final visible state immediately (no transition).
 */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms (applied as a CSS custom property) */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion: skip observer, show immediately
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      el.setAttribute("data-visible", "");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-visible", "");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${className}`}
      style={delay > 0 ? { "--reveal-delay": `${delay}ms` } as React.CSSProperties : undefined}
    >
      {children}
    </div>
  );
}
