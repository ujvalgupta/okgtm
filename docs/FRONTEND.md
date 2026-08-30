# OkGTM Frontend - Code Documentation

## Stack

- **Framework:** Next.js 16 (App Router, React 19, RSC by default)
- **Styling:** Tailwind CSS v4 + `@tailwindcss/postcss`
- **Components:** shadcn/ui (base-nova style, Base UI primitives)
- **Icons:** `@phosphor-icons/react` (single icon library, no lucide)
- **Fonts:** Cabinet Grotesk (display, self-hosted via `next/font/local`) + Inter (body, via `next/font/google`)

## Project Structure

```
app/
  fonts/
    CabinetGrotesk-Medium.woff2  — display font (500 weight, Fontshare FFL license)
  globals.css                    — design tokens (OkGTM + shadcn bridge), base resets, motion layer, tool spinner (light-only, no dark mode)
  layout.tsx                     — root layout with fonts, metadata, Navbar + Footer
  page.tsx                       — home page (7 sections: hero, problem, features, how-it-works, why-us, faq, cta-band)
  free-tools/
    page.tsx                     — free tools listing (hero, 10-card grid, cta-band)
    [slug]/
      page.tsx                   — individual tool pages (hero, embedded tool form, what-it-does, how-it-works, what-you-get, faq, cta-band)
      tool-form.tsx              — client component mapping slug → form component (PostSpyForm, AdSpyForm, LinkedInLeadsForm, LinkedInEngagementForm)

components/
  navbar.tsx                     — sticky cream nav, 64px, hamburger < 768px (client component)
  footer.tsx                     — cream surface-soft footer, product-led tagline (server component)
  scroll-reveal.tsx              — IntersectionObserver scroll-reveal wrapper (client component)
  PostSpyForm.tsx                — LinkedIn Post Spy tool form (client component, OkGTM styled)
  AdSpyForm.tsx                  — LinkedIn Ad Spy tool form (client component, OkGTM styled)
  LinkedInLeadsForm.tsx          — LinkedIn Leads tool form with configurable props (client component, OkGTM styled)
  LinkedInEngagementForm.tsx     — LinkedIn Engagement tool form with configurable props (client component, OkGTM styled)
  ui/
    accordion.tsx                — shadcn accordion, customized with Phosphor icons

lib/
  utils.ts                       — cn() utility (clsx + tailwind-merge)
  free-tools.ts                  — single source of truth for 6 live tools data (liveUrl field retained but unused by pages)

docs/
  DESIGN.md                      — design system source of truth
  SKILL.md                       — anti-slop frontend rules
  FRONTEND.md                    — this file
```

## Theme

**Light/cream only.** OkGTM does not use dark mode. DESIGN.md explicitly defines a cream canvas (#fffaf0) system with no dark theme. The `globals.css` contains only light-theme tokens.

## Design Token System

All design tokens live in `app/globals.css`.

### Token Architecture

1. **Static tokens** (`@theme {}`) - Brand colors that never change (e.g., `brand-pink`, `brand-teal`).
2. **Inline tokens** (`@theme inline {}`) - Surface, text, and shadcn bridge tokens set directly to their light-only values.

### Color Usage Guide

| Purpose              | Token                    | Tailwind class         |
|----------------------|--------------------------|------------------------|
| Page background      | `--color-canvas`         | `bg-canvas`            |
| Soft section bg      | `--color-surface-soft`   | `bg-surface-soft`      |
| Card background      | `--color-surface-card`   | `bg-surface-card`      |
| Headline text        | `--color-ink`            | `text-ink`             |
| Body text            | `--color-body`           | `text-body`            |
| Muted text           | `--muted-foreground`     | `text-muted-foreground`|
| Very faint text      | `--color-muted-soft`     | `text-muted-soft`      |
| Primary buttons      | `--primary`              | `bg-primary`           |
| Button text          | `--color-on-primary`     | `text-on-primary`      |
| Borders              | `--color-hairline`       | `border-hairline`      |
| Feature card (brand) | `--color-brand-*`        | `bg-brand-pink`, etc.  |
| Text on dark cards   | `--color-on-dark`        | `text-on-dark`         |
| Success status       | `--color-success`        | `text-success`         |
| Error status         | `--color-error`          | `text-error`           |

### Feature Card Color Cycling (per copy.md v2)

Cards cycle through 6 colors per copy.md: peach -> teal -> pink -> lavender -> ochre -> cream. Never repeat the same color twice in a row.

| Card color     | Hex       | Text color   | Text class       |
|----------------|-----------|--------------|------------------|
| brand-peach    | #ffb084   | dark         | `text-ink`       |
| brand-teal     | #1a3a3a   | white        | `text-on-dark`   |
| brand-pink     | #ff4d8b   | white        | `text-on-primary`|
| brand-lavender | #b8a4ed   | dark         | `text-ink`       |
| brand-ochre    | #e8b94a   | dark         | `text-ink`       |
| surface-card   | #f5f0e0   | dark         | `text-ink`       |

### Border Radius

| Token         | Value  | Use                                |
|---------------|--------|------------------------------------|
| rounded-[6px] | 6px    | Small badges                       |
| rounded-[8px] | 8px    | Small buttons                      |
| rounded-[12px]| 12px   | CTA buttons, text inputs           |
| rounded-[16px]| 16px   | Content cards, step cards, result cards |
| rounded-[24px]| 24px   | Feature cards, CTA band, form wrapper |
| rounded-pill  | 9999px | Category tabs, badge pills, tags   |

## Home Page Sections (/)

Copy source: `artifacts/home/copy.md` (v2: product-led voice, "GTM OS" category, no timeframes).

1. **Hero** (typographic, single column) - Left-aligned typographic hero within max-w-[720px]. Eyebrow "GTM OS FOR B2B COMPANIES", display-xl headline, product-led subhead, dual CTAs. No illustration or product preview. Generous whitespace on the right.
2. **Problem Framing** - Left-aligned prose on surface-soft. Section label "THE PROBLEM", display-lg headline "Five tools. Zero orchestration.", three paragraphs.
3. **Feature Cards x6** (feature-card-peach/teal/pink/lavender/ochre/cream) - Grid with Enrich+Score as featured (teal, md:col-span-2). Each card is a pure color surface with Title, Subtitle, Body typography only. No product-UI preview fragments. Card structure: title + subtitle + standout line (featured only) + body.
4. **How It Works** - Section label "HOW IT WORKS", 4 numbered step cards in 4-col grid at desktop. id="how-it-works" for hero anchor. No timeframes.
5. **Why Us** - Section label "WHY OKGTM". Two side-by-side comparison cards (vs Tools, vs Agencies) + full-width teal risk-reversal card below.
6. **FAQ** - Section label "FREQUENTLY ASKED QUESTIONS", 5 accordion items on surface-soft.
7. **CTA Band** (cta-band-illustrated) - Centered headline + microcopy + CTA on surface-soft rounded card.

## Free Tools Listing Page (/free-tools)

Copy source: `artifacts/free-tools/copy.md`.

1. **Hero** - Centered typographic hero. Eyebrow "FREE TOOLS", display headline, subhead, friction-killer microcopy. No CTA buttons in hero (the grid below IS the action).
2. **Tools Grid** - 6 live tool cards (surface-card bg, rounded-xl, icon + tag + name + tagline + bullet features + "Try it" CTA linking to /free-tools/[slug]).
3. **CTA Band** - "Want something custom-built instead?" with "Let's talk" → LinkedIn.

## Free Tool Individual Pages (/free-tools/[slug])

Copy source: `artifacts/free-tools/copy.md` (per-tool sections). Data source: `lib/free-tools.ts`.

6 statically generated pages (generateStaticParams). Unknown slugs → notFound().

### Page Structure

1. **Hero** - Eyebrow "FREE TOOL", H1 (task-oriented promise), subhead, secondary "All free tools" back link.
2. **Embedded Tool Form** (`id="try-it"`) - The real working LinkedIn tool rendered inline in a surface-soft card wrapper. Maps slug → form component via `tool-form.tsx`. No external redirects.
3. **What it does** - Left-aligned prose on surface-soft, 2-3 sentences.
4. **How it works** - 3 step cards on canvas (no numbered badges per SKILL.md rule), step title IS the label.
5. **What you get** - 3 expanded feature cards on surface-soft.
6. **FAQ** - 4 Q&As in accordion on canvas, reusing `components/ui/accordion.tsx`.
7. **CTA Band** - Same as listing page.

### Tool → Form Component Mapping

| Slug                       | Form Component            | Notes |
|----------------------------|---------------------------|-------|
| linkedin-post-spy          | PostSpyForm               | Profile URL input |
| linkedin-ad-spy            | AdSpyForm                 | Company name input |
| steal-competitor-leads     | LinkedInLeadsForm         | Props: competitor-facing labels |
| find-lost-leads            | LinkedInLeadsForm         | Props: self-facing labels |
| competitor-engagement-spy  | LinkedInEngagementForm    | Props: competitor-facing labels |
| lead-journey-finder        | LinkedInEngagementForm    | Props: lead-facing labels |

### Tool Form Design System

All tool forms use OkGTM design tokens:
- **Inputs:** h-11, rounded-[12px], border-hairline, bg-canvas, focus:ring-2 focus:ring-ink/20, label above input
- **Buttons:** Primary: bg-primary text-on-primary h-11 rounded-[12px], full-width in forms. Secondary: border-hairline bg-canvas text-ink for "View post/profile" links.
- **Loading state:** `.tool-spinner` CSS class (border spinner, 750ms, gated behind prefers-reduced-motion)
- **Results:** Cards with rounded-[16px] border-hairline bg-canvas p-6. Tags as rounded-pill bg-surface-card pills. Count badge in success color.
- **Error text:** text-error. Eyebrow text: uppercase tracking-[1.5px] text-muted-foreground.

## Motion Layer

Motion is implemented via CSS animations + IntersectionObserver (no framer-motion dependency):

- **Hero entrance:** `.hero-enter` class with staggered `--hero-delay` custom properties. Fade + rise animation on page load.
- **Scroll reveal:** `<ScrollReveal>` wrapper component adds `data-visible` attribute via IntersectionObserver, triggering CSS opacity + transform transitions.
- **Tool spinner:** `.tool-spinner` class for loading states in tool forms. Border-spinner at 750ms, gated behind prefers-reduced-motion.
- **Reduced motion:** All motion gated behind `prefers-reduced-motion: no-preference`. Reduced-motion users see final state immediately with no animation.
- **GPU-friendly:** Only `transform` and `opacity` are animated.

## Fonts

- **Cabinet Grotesk** (500 weight) - used via `font-display` class on all display headlines (h1, h2, h3 section titles)
- **Inter** - used via `font-sans` for body text, nav, buttons, UI. Applied to `<body>` by default.

Font files are self-hosted and loaded via `next/font` for optimal performance.

## Metadata

- **Home:** Title "OkGTM | The GTM OS for B2B Teams" (58 chars), Description "OkGTM builds and runs your entire go-to-market system..." (148 chars)
- **Free Tools Listing:** Title "Free LinkedIn Intelligence Tools | OkGTM", Description "Six free LinkedIn tools to spy on competitor ads..."
- **Free Tool Pages:** Title pattern "{Tool Name} - Free LinkedIn Tool | OkGTM", Description per tool from copy.md

## CTA Wiring

All "Let's talk" CTAs point to `https://linkedin.com/in/ujvalgupta`. One primary CTA label ("Let's talk") used consistently across nav, hero, CTA band, and footer. Secondary CTA "See how it works" anchors to #how-it-works on home page.

Free tools "Try it" CTAs on listing cards link to internal `/free-tools/[slug]` pages. Tool pages embed the working form inline — no external redirects.

## Adding New Pages

1. Create `app/<page>/page.tsx`
2. Export a `metadata` object for the page title/description
3. The root `layout.tsx` wraps every page with `<Navbar />` and `<Footer />`
4. Use OkGTM token classes (`bg-canvas`, `text-ink`, `bg-surface-soft`, etc.)
5. Use `font-display` class on display headlines
6. Follow DESIGN.md section spacing: `py-24` (96px) between major sections
7. All copy must come from the corresponding `artifacts/<page>/copy.md`
8. Wrap below-fold sections in `<ScrollReveal>` for entrance animation
9. Apply `hero-enter` staggered classes to hero elements

## Component Conventions

- **Server Components by default.** Only add `"use client"` when the component needs interactivity.
- **Reusable components** in `components/`. Page-specific sections go inline in the page file.
- **Icons** from `@phosphor-icons/react` only.
- **shadcn/ui components** in `components/ui/`. Install new ones with: `pnpm dlx shadcn@latest add <component>`
- **Buttons** styled inline with OkGTM tokens rather than using shadcn Button component.

## Build & Lint

```bash
pnpm run build     # Next.js production build
pnpm run lint      # ESLint (flat config)
pnpm run typecheck # TypeScript check (no emit)
pnpm run dev       # Dev server
```
