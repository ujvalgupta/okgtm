"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient looping video for section artwork.
 * - Autoplays muted+loop (standard ambient pattern)
 * - Pauses under `prefers-reduced-motion: reduce` (checked after mount,
 *   so SSR markup stays hydration-stable)
 * - `aria-hidden` + `tabIndex={-1}`: decorative motion, not interactive content
 */
export function AmbientVideo({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (v && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
    }
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      className={className}
    />
  );
}
