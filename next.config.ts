import type { NextConfig } from "next";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

// Content-Security-Policy — pragmatic for a statically-rendered marketing
// site. `script-src 'unsafe-inline'` is required without nonce plumbing;
// frame-ancestors 'none' + X-Frame-Options block clickjacking regardless.
// connect-src allows the Convex deployment + the mailto/LinkedIn/WhatsApp/X
// external links are navigations (form-action 'self' + default-src cover).
// Dev-only: React devtools + Turbopack source maps need eval(); production
// builds never use it, so 'unsafe-eval' is added only under `next dev`.
const DEV_SCRIPT_SRC = `'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""}`;
const CSP = [
  "default-src 'self'",
  `script-src ${DEV_SCRIPT_SRC}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${CONVEX_URL} wss://${CONVEX_URL.replace('https://', '')} https://*.convex.cloud wss://*.convex.cloud`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://wa.me https://linkedin.com https://x.com",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // HSTS is only honored over HTTPS (Vercel terminates TLS in prod).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  // Next 16 uses Turbopack for both dev and production builds by default.
  // Dev-only: let the site be checked from other hosts (Tailscale IP used
  // during local QA) — has no effect on production builds.
  allowedDevOrigins: ["100.94.34.56", "178.105.222.197"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
    ];
  },
  // Old /free-tools URLs keep working (bookmarks, shared links).
  async redirects() {
    return [
      { source: "/free-tools/:path*", destination: "/tools/:path*", permanent: true },
      { source: "/free-tools", destination: "/tools", permanent: true },
    ];
  },
};

export default nextConfig;
