import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ConvexProviderWrapper } from "@/components/convex-provider";

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
  title: "OkGTM | The GTM OS for B2B Teams",
  description:
    "OkGTM builds and runs your entire go-to-market system. Lead capture, enrichment, outbound, follow-ups, handoff, and reporting. Month-to-month.",
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
        <ConvexProviderWrapper>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ConvexProviderWrapper>
      </body>
    </html>
  );
}
