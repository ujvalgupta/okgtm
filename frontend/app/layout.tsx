import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

/* ── Fonts ── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cabinetGrotesk = localFont({
  src: "./fonts/CabinetGrotesk-Medium.woff2",
  variable: "--font-cabinet",
  display: "swap",
  weight: "500",
});

/* ── Metadata (verbatim from copy.md) ── */
export const metadata: Metadata = {
  title: "OkGTM Labs | Revenue Engine, Live in Under 23 Hours",
  description:
    "OkGTM Labs builds custom GTM automations across your full funnel. First MVP running in under 23 hours. Let's talk.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cabinetGrotesk.variable}`}
    >
      <body className="font-sans">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
