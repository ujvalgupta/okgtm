# OkGTM Frontend - Code Documentation

## Stack

- **Framework:** Next.js 15 (App Router, React 19, RSC by default)
- **Styling:** Tailwind CSS v4 + `@tailwindcss/postcss`
- **Components:** shadcn/ui (base-nova style, Base UI primitives)
- **Icons:** `@phosphor-icons/react` (single icon library, no lucide)
- **Fonts:** Cabinet Grotesk (display, self-hosted via `next/font/local`) + Inter (body, via `next/font/google`)

## Project Structure

```
app/
  fonts/
    CabinetGrotesk-Medium.woff2  — display font (500 weight, Fontshare FFL license)
  globals.css                    — design tokens (OkGTM + shadcn bridge), dark mode, base resets
  layout.tsx                     — root layout with fonts, metadata, Navbar + Footer
  page.tsx                       — home page (all 8 sections)

components/
  navbar.tsx                     — sticky cream nav, 64px, hamburger < 768px (client component)
  footer.tsx                     — cream surface-soft footer, founder-led (server component)
  feature-card-preview.tsx       — 6 mini product-UI fragments for feature cards (server component)
  hero-product-preview.tsx       — funnel automation preview for hero right column (server component)
  ui/
    accordion.tsx                — shadcn accordion, customized with Phosphor icons
    button.tsx                   — shadcn button (from init, available for future use)
    sheet.tsx                    — shadcn sheet, customized with Phosphor icons

lib/
  utils.ts                       — cn() utility (clsx + tailwind-merge)

docs/
  DESIGN.md                      — design system source of truth
  SKILL.md                       — anti-slop frontend rules
  FRONTEND.md                    — this file
```

## Design Token System

All design tokens live in `app/globals.css`.

### Token Architecture

Tokens are split into two categories:

1. **Static tokens** (`@theme {}`) - Brand colors that never change with theme (e.g., `brand-pink`, `brand-teal`, `ink-on-pastel`).
2. **Dynamic tokens** (`@theme inline {}`) - Colors that switch between light/dark mode via CSS custom properties on `:root` and `@media (prefers-color-scheme: dark)`.

### Color Usage Guide

| Purpose              | Token                    | Tailwind class         |
|----------------------|--------------------------|------------------------|
| Page background      | `--okgtm-canvas`         | `bg-canvas`            |
| Soft section bg      | `--okgtm-surface-soft`   | `bg-surface-soft`      |
| Card background      | `--okgtm-surface-card`   | `bg-surface-card`      |
| Headline text        | `--okgtm-ink`            | `text-ink`             |
| Body text            | `--okgtm-body`           | `text-body`            |
| Muted text           | `--muted-foreground`     | `text-muted-foreground`|
| Very faint text      | `--okgtm-muted-soft`     | `text-muted-soft`      |
| Primary buttons      | `--primary`              | `bg-primary`           |
| Button text          | `--okgtm-on-primary`     | `text-on-primary`      |
| Borders              | `--okgtm-hairline`       | `border-hairline`      |
| Feature card (static)| `--color-brand-*`        | `bg-brand-pink`, etc.  |
| Text on pastel cards | `--color-ink-on-pastel`  | `text-ink-on-pastel`   |
| Text on dark cards   | `--okgtm-on-dark`        | `text-on-dark`         |

### Dark Mode

Dark mode activates automatically via `prefers-color-scheme: dark`. No manual toggle exists yet.

- Surface colors shift to warm dark teal-black family (`#0a1a1a` base)
- Brand card colors (pink, teal, lavender, etc.) stay unchanged
- `ink-on-pastel` stays dark (`#1a1a1a`) since pastel cards keep their bright backgrounds
- Primary buttons invert (dark text on cream button in dark mode)


### Feature Card Text Contrast

Only `brand-teal` (#1a3a3a) is dark enough for white text (`text-on-dark`, 12.3:1 contrast).
All other brand-color cards (pink, peach, lavender, ochre) use `text-ink-on-pastel` (#1a1a1a)
for WCAG AA compliance. Contrast ratios against `ink-on-pastel`:

| Card color     | Hex       | Ratio vs `ink-on-pastel` | Passes AA? |
|----------------|-----------|--------------------------|------------|
| brand-pink     | #ff4d8b   | 5.54:1                   | ✅          |
| brand-peach    | #ffb084   | 7.9:1+                   | ✅          |
| brand-lavender | #b8a4ed   | 5.5:1+                   | ✅          |
| brand-ochre    | #e8b94a   | 6.3:1+                   | ✅          |
| brand-teal     | #1a3a3a   | — (use `text-on-dark`)   | ✅ (12.3:1) |
### Border Radius

Uses DESIGN.md radius tokens. For feature cards: `rounded-[24px]`. For buttons/inputs: `rounded-[12px]`. For content cards: `rounded-[16px]`.

## Fonts

- **Cabinet Grotesk** (500 weight, -2.5px tracking at display sizes) - used via `font-display` utility class on all display headlines (h1, h2)
- **Inter** - used via `font-sans` for body text, nav, buttons, UI elements. Applied to `<body>` by default.

Font files are self-hosted and loaded via `next/font` for optimal performance (no external CDN requests, automatic `font-display: swap`).

## Adding New Pages

1. Create `app/<page>/page.tsx`
2. Export a `metadata` object for the page title/description
3. The root `layout.tsx` wraps every page with `<Navbar />` and `<Footer />`
4. Use OkGTM token classes (`bg-canvas`, `text-ink`, `bg-surface-soft`, etc.)
5. Use `font-display` class on display headlines
6. Follow DESIGN.md section spacing: `py-24` (96px) between major sections
7. All copy must come from the corresponding `artifacts/<page>/copy.md`

## Component Conventions

- **Server Components by default.** Only add `"use client"` when the component needs interactivity (state, event handlers).
- **Reusable components** in `components/`. Page-specific sections go inline in the page file.
- **Icons** from `@phosphor-icons/react` only. No hand-rolled SVGs.
- **shadcn/ui components** in `components/ui/`. Customized to use Phosphor icons and OkGTM styling. Install new ones with: `pnpm dlx shadcn@latest add <component>`
- **Buttons** styled inline with OkGTM tokens rather than using shadcn Button component (to match DESIGN.md exactly).

## CTA Wiring

All "Let's talk" CTAs point to `mailto:contactujval@gmail.com?subject=Let%27s%20talk%20-%20OkGTM%20Labs`. This is a temporary destination until a call-booking feature is built.

## Build & Lint

```bash
pnpm run build     # Next.js production build
pnpm run lint      # ESLint (flat config)
pnpm run dev       # Dev server
pnpm run typecheck # TypeScript check (no emit)
```
