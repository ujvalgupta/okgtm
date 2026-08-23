---
version: alpha
name: okgtm-design-system
description: A warm-cream brand system for OkGTM, the GTM-automation platform. Anchors on cream canvas with near-black primary CTAs, custom display type, and saturated single-color feature cards — hot pink, deep teal, lavender, peach, ochre — that punctuate long-scroll pages. Brand voltage comes from clay-style 3D illustrations (mountains, characters, mascots) used as full-bleed hero artifacts and the bright multi-color card surfaces showing product UI fragments.

colors:
  primary: "#0a0a0a"
  primary-active: "#1f1f1f"
  primary-disabled: "#e5e5e5"
  ink: "#0a0a0a"
  body: "#3a3a3a"
  body-strong: "#1a1a1a"
  muted: "#6a6a6a"
  muted-soft: "#9a9a9a"
  hairline: "#e5e5e5"
  hairline-soft: "#f0f0f0"
  canvas: "#fffaf0"
  surface-soft: "#faf5e8"
  surface-card: "#f5f0e0"
  surface-strong: "#ebe6d6"
  surface-dark: "#0a1a1a"
  surface-dark-elevated: "#1a2a2a"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  on-dark-soft: "#a0a0a0"
  brand-pink: "#ff4d8b"
  brand-teal: "#1a3a3a"
  brand-lavender: "#b8a4ed"
  brand-peach: "#ffb084"
  brand-ochre: "#e8b94a"
  brand-mint: "#a4d4c5"
  brand-coral: "#ff6b5a"
  success: "#22c55e"
  warning: "#f59e0b"
  error: "#ef4444"

typography:
  display-xl:
    fontFamily: "Cabinet Grotesk, Inter, sans-serif"
    fontSize: 72px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -2.5px
  display-lg:
    fontFamily: "Cabinet Grotesk, Inter, sans-serif"
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -2px
  display-md:
    fontFamily: "Cabinet Grotesk, Inter, sans-serif"
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -1px
  display-sm:
    fontFamily: "Cabinet Grotesk, Inter, sans-serif"
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.5px
  title-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.3px
  title-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "Inter, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 1.5px
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{okgtm.colors.primary}"
    textColor: "{okgtm.colors.on-primary}"
    typography: "{okgtm.typography.button}"
    rounded: "{okgtm.rounded.md}"
    padding: 12px 20px
    height: 44px
  button-primary-active:
    backgroundColor: "{okgtm.colors.primary-active}"
    textColor: "{okgtm.colors.on-primary}"
    rounded: "{okgtm.rounded.md}"
  button-primary-disabled:
    backgroundColor: "{okgtm.colors.primary-disabled}"
    textColor: "{okgtm.colors.muted}"
    rounded: "{okgtm.rounded.md}"
  button-secondary:
    backgroundColor: "{okgtm.colors.canvas}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.button}"
    rounded: "{okgtm.rounded.md}"
    padding: 12px 20px
    height: 44px
  button-on-color:
    backgroundColor: "{okgtm.colors.canvas}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.button}"
    rounded: "{okgtm.rounded.md}"
    padding: 12px 20px
    height: 44px
  button-text-link:
    backgroundColor: transparent
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.button}"
  text-link:
    backgroundColor: transparent
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.body-md}"
  top-nav:
    backgroundColor: "{okgtm.colors.canvas}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.nav-link}"
    height: 64px
  hero-band:
    backgroundColor: "{okgtm.colors.canvas}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.display-xl}"
    padding: 96px
  hero-illustration-card:
    backgroundColor: "{okgtm.colors.surface-soft}"
    textColor: "{okgtm.colors.ink}"
    rounded: "{okgtm.rounded.xl}"
  feature-card-pink:
    backgroundColor: "{okgtm.colors.brand-pink}"
    textColor: "{okgtm.colors.on-primary}"
    typography: "{okgtm.typography.title-md}"
    rounded: "{okgtm.rounded.xl}"
    padding: 32px
  feature-card-teal:
    backgroundColor: "{okgtm.colors.brand-teal}"
    textColor: "{okgtm.colors.on-dark}"
    typography: "{okgtm.typography.title-md}"
    rounded: "{okgtm.rounded.xl}"
    padding: 32px
  feature-card-lavender:
    backgroundColor: "{okgtm.colors.brand-lavender}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.title-md}"
    rounded: "{okgtm.rounded.xl}"
    padding: 32px
  feature-card-peach:
    backgroundColor: "{okgtm.colors.brand-peach}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.title-md}"
    rounded: "{okgtm.rounded.xl}"
    padding: 32px
  feature-card-ochre:
    backgroundColor: "{okgtm.colors.brand-ochre}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.title-md}"
    rounded: "{okgtm.rounded.xl}"
    padding: 32px
  feature-card-cream:
    backgroundColor: "{okgtm.colors.surface-card}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.title-md}"
    rounded: "{okgtm.rounded.xl}"
    padding: 32px
  product-mockup-card:
    backgroundColor: "{okgtm.colors.canvas}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.title-md}"
    rounded: "{okgtm.rounded.lg}"
    padding: 24px
  testimonial-card:
    backgroundColor: "{okgtm.colors.surface-card}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.body-md}"
    rounded: "{okgtm.rounded.lg}"
    padding: 24px
  pricing-tier-card:
    backgroundColor: "{okgtm.colors.canvas}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.title-lg}"
    rounded: "{okgtm.rounded.lg}"
    padding: 32px
  pricing-tier-card-featured:
    backgroundColor: "{okgtm.colors.brand-teal}"
    textColor: "{okgtm.colors.on-dark}"
    typography: "{okgtm.typography.title-lg}"
    rounded: "{okgtm.rounded.lg}"
    padding: 32px
  text-input:
    backgroundColor: "{okgtm.colors.canvas}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.body-md}"
    rounded: "{okgtm.rounded.md}"
    padding: 12px 16px
    height: 44px
  text-input-focused:
    backgroundColor: "{okgtm.colors.canvas}"
    textColor: "{okgtm.colors.ink}"
    rounded: "{okgtm.rounded.md}"
  category-tab:
    backgroundColor: transparent
    textColor: "{okgtm.colors.muted}"
    typography: "{okgtm.typography.nav-link}"
    rounded: "{okgtm.rounded.pill}"
    padding: 8px 16px
  category-tab-active:
    backgroundColor: "{okgtm.colors.surface-card}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.nav-link}"
    rounded: "{okgtm.rounded.pill}"
  badge-pill:
    backgroundColor: "{okgtm.colors.surface-card}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.caption}"
    rounded: "{okgtm.rounded.pill}"
    padding: 4px 12px
  expert-card:
    backgroundColor: "{okgtm.colors.canvas}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.title-md}"
    rounded: "{okgtm.rounded.lg}"
    padding: 24px
  cta-band-illustrated:
    backgroundColor: "{okgtm.colors.surface-soft}"
    textColor: "{okgtm.colors.ink}"
    typography: "{okgtm.typography.display-md}"
    rounded: "{okgtm.rounded.xl}"
    padding: 80px
  footer:
    backgroundColor: "{okgtm.colors.surface-soft}"
    textColor: "{okgtm.colors.body}"
    typography: "{okgtm.typography.body-sm}"
    padding: 80px
---

## Overview

OkGTM ships the most playful B2B SaaS interface in the GTM-automation category. The base atmosphere is **cream-tinted white canvas** (`{okgtm.colors.canvas}` — #fffaf0) holding dark-navy ink type and **3D-rendered clay-style illustrations** (mountains, mascot characters, peach/ochre/lavender landscapes) as the dominant brand voltage. Where most data-platform brands play it cool with grids and gradients, OkGTM leans hard into hand-crafted-looking 3D illustrations and saturated single-color feature cards.

Type voice runs **Cabinet Grotesk** (Fontshare, free for commercial use) — a warm grotesque display face used at very large sizes (72px hero) with negative letter-spacing. Body type uses Inter at standard weights. The display weight stays at 500, never bolder — the soft character of the typeface gives it warmth without needing weight.

Component voltage comes from **saturated single-color feature cards** in a 6-color palette: hot pink, deep teal, lavender, peach, ochre, and cream-card. Each card shows product UI fragments at small scale — OkGTM agent runs, sequencer flows, CRM enrichment outputs. The colored card IS the primary visual element on every long-scroll page.

**Key Characteristics:**
- Cream-tinted white canvas (`{okgtm.colors.canvas}` — #fffaf0). The warmth differentiates OkGTM from cool-gray competitor sites.
- Dark navy/black primary CTAs (`{okgtm.colors.primary}` — #0a0a0a). Buttons rounded `{okgtm.rounded.md}` (12px) — friendly modern but not pill.
- 6-color saturated feature card palette: `{okgtm.colors.brand-pink}`, `{okgtm.colors.brand-teal}`, `{okgtm.colors.brand-lavender}`, `{okgtm.colors.brand-peach}`, `{okgtm.colors.brand-ochre}`, `{okgtm.colors.surface-card}` (cream).
- 3D clay-style illustrations (mountains, characters, abstract shapes) as full-bleed hero artifacts — the brand's most-recognized visual element.
- Custom warm-grotesque Cabinet Grotesk display typeface at 500 weight with -1 to -2.5px letter-spacing on display sizes.
- Border radius is generous: `{okgtm.rounded.md}` (12px) for buttons + inputs, `{okgtm.rounded.lg}` (16px) for content cards, `{okgtm.rounded.xl}` (24px) for feature cards. The bigger radius matches the warm display type's character.
- Product UI fragments embedded inside colored cards at small scale — agent run logs, sequencer flows, enrichment results.
- Section rhythm `{okgtm.spacing.section}` (96px) between major bands.
- Footer is cream-tinted (`{okgtm.colors.surface-soft}`) — OkGTM does NOT use a dark footer. Even the closing band stays warm-light.

## Brand Lineage & Positioning

This system deliberately occupies the visual language Clay.com popularized in the GTM-automation category: warm cream canvas, near-black primary CTAs, saturated single-color feature cards, rounded display type, and clay-style 3D illustration. **This is a conscious positioning bet, not an accident.** OkGTM builds funnel automations for the same revenue teams Clay sells data orchestration to, and the brand picks the friendly, hand-crafted end of the category spectrum over the cool-gray enterprise default.

What is shared is the strategy — what is not shared is any asset. No Clay illustration, font, mascot, or copy is reused. Every token here is OkGTM's own implementation, namespaced under `okgtm.*`. ("Clay-style" is used as a lowercase craft descriptor — hand-sculpted-looking 3D — not a reference to the company.)

**The adjacency is deliberate and auditable:** pages built from this system must read as OkGTM, never as a Clay clone — no Clay-specific copy, product names, or characters. If the adjacency ever stops serving the brand, the palette and radius tokens can drift independently without rebuilding the system.

## Colors

### Brand & Accent
- **Primary** (`{okgtm.colors.primary}` — #0a0a0a): All primary CTAs, h1/h2 ink type. Near-black with slight warmth.
- **Brand Pink** (`{okgtm.colors.brand-pink}` — #ff4d8b): Hot-pink feature card surface. Sequencer / outbound feature pages.
- **Brand Teal** (`{okgtm.colors.brand-teal}` — #1a3a3a): Deep teal-green feature card. Often the featured pricing tier.
- **Brand Lavender** (`{okgtm.colors.brand-lavender}` — #b8a4ed): Soft lavender feature card.
- **Brand Peach** (`{okgtm.colors.brand-peach}` — #ffb084): Warm peach feature card.
- **Brand Ochre** (`{okgtm.colors.brand-ochre}` — #e8b94a): Mustard / ochre feature card and illustration accents.
- **Brand Mint** (`{okgtm.colors.brand-mint}` — #a4d4c5): Mint accent on illustrations and small badges.
- **Brand Coral** (`{okgtm.colors.brand-coral}` — #ff6b5a): Coral accent for highlights.

### Surface
- **Canvas** (`{okgtm.colors.canvas}` — #fffaf0): The default page floor. Cream-tinted white.
- **Surface Soft** (`{okgtm.colors.surface-soft}` — #faf5e8): Footer and CTA-band background.
- **Surface Card** (`{okgtm.colors.surface-card}` — #f5f0e0): Cream feature cards, testimonial cards.
- **Surface Strong** (`{okgtm.colors.surface-strong}` — #ebe6d6): Stronger cream for emphasized bands.
- **Surface Dark** (`{okgtm.colors.surface-dark}` — #0a1a1a): Dark teal-tinted near-black for occasional dark cards (rare).
- **Surface Dark Elevated** (`{okgtm.colors.surface-dark-elevated}` — #1a2a2a): Elevated dark cards.
- **Hairline** (`{okgtm.colors.hairline}` — #e5e5e5): 1px borders on cards and inputs.

### Text
- **Ink** (`{okgtm.colors.ink}` — #0a0a0a): Headlines and primary text.
- **Body Strong** (`{okgtm.colors.body-strong}` — #1a1a1a): Emphasized body, lead paragraphs.
- **Body** (`{okgtm.colors.body}` — #3a3a3a): Default running-text.
- **Muted** (`{okgtm.colors.muted}` — #6a6a6a): Sub-headings, breadcrumbs, footer body.
- **Muted Soft** (`{okgtm.colors.muted-soft}` — #9a9a9a): Captions, fine-print.
- **On Primary / On Dark** (`{okgtm.colors.on-primary}` — #ffffff): Text on primary buttons + dark feature cards (teal).

### Semantic
- **Success** (`{okgtm.colors.success}` — #22c55e): Success states.
- **Warning** (`{okgtm.colors.warning}` — #f59e0b): Warning callouts.
- **Error** (`{okgtm.colors.error}` — #ef4444): Validation errors.

## Typography

### Font Family
The system runs **Cabinet Grotesk** (a warm grotesque display face, free for commercial use via Fontshare) for headlines and **Inter** for body, navigation, and UI. Cabinet Grotesk at weight 500 with negative letter-spacing handles every display headline; Inter handles the rest. The fallback stack walks `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` for both.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{okgtm.typography.display-xl}` | 72px | 500 | 1.0 | -2.5px | Homepage h1 ("Put your go-to-market on autopilot") — Cabinet Grotesk |
| `{okgtm.typography.display-lg}` | 56px | 500 | 1.05 | -2px | Section heads — Cabinet Grotesk |
| `{okgtm.typography.display-md}` | 40px | 500 | 1.1 | -1px | Sub-section heads, product names |
| `{okgtm.typography.display-sm}` | 32px | 500 | 1.15 | -0.5px | CTA-band heads, feature card titles |
| `{okgtm.typography.title-lg}` | 24px | 600 | 1.3 | -0.3px | Pricing plan names, larger feature titles |
| `{okgtm.typography.title-md}` | 18px | 600 | 1.4 | 0 | Card titles, intro paragraphs |
| `{okgtm.typography.title-sm}` | 16px | 600 | 1.4 | 0 | Small card titles, list labels |
| `{okgtm.typography.body-md}` | 16px | 400 | 1.55 | 0 | Default running-text |
| `{okgtm.typography.body-sm}` | 14px | 400 | 1.55 | 0 | Footer body, fine-print |
| `{okgtm.typography.caption}` | 13px | 500 | 1.4 | 0 | Badge labels, captions |
| `{okgtm.typography.caption-uppercase}` | 12px | 600 | 1.4 | 1.5px | Section labels, "FEATURED" badges |
| `{okgtm.typography.button}` | 14px | 600 | 1.0 | 0 | Standard button labels |
| `{okgtm.typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu items |

### Principles
Cabinet Grotesk at weight 500 + negative letter-spacing IS the brand voice. Going to weight 700 reads as bombastic; the soft, warm character of the typeface adds warmth that bolder weight would flatten.

The body-vs-display split is functional: Cabinet Grotesk for display moments (headlines), Inter for everything else (running text, UI, buttons). Mixing them is a system violation.

### Font Licensing & Delivery

**Cabinet Grotesk** is the primary display face — free for personal and commercial use under the ITF Free Font License (FFL) via Fontshare, self-hostable. Ship it with `next/font` or `@font-face` + `font-display: swap`; never hot-link CDN fonts in production. **Inter** at weight 500 with -0.05em letter-spacing is a usable approximation if Cabinet Grotesk can't be shipped. **Recoleta** at weight 500 carries similar rounded-display warmth as a paid upgrade.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{okgtm.spacing.xxs}` 4px · `{okgtm.spacing.xs}` 8px · `{okgtm.spacing.sm}` 12px · `{okgtm.spacing.md}` 16px · `{okgtm.spacing.lg}` 24px · `{okgtm.spacing.xl}` 32px · `{okgtm.spacing.xxl}` 48px · `{okgtm.spacing.section}` 96px.
- **Section padding:** `{okgtm.spacing.section}` (96px) between major editorial bands.
- **Card internal padding:** `{okgtm.spacing.xl}` (32px) for feature cards and pricing tiers; `{okgtm.spacing.lg}` (24px) for testimonial and product mockup cards.

### Grid & Container
- **Max content width:** ~1280px centered.
- **Editorial body:** Single 12-column grid; hero often uses 7/5 split (h1 left, illustration right).
- **Feature card grids:** 3-up at desktop, 2-up at tablet, 1-up at mobile.
- **Pricing grid:** 3-4 up at desktop, 1-up at mobile.

### Whitespace Philosophy
OkGTM uses generous whitespace around big rounded display headlines and saturated feature cards. The cream canvas + colored cards + 3D illustrations create a playful warmth that competing data-platform sites lack.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, top nav, hero |
| Soft hairline | 1px `{okgtm.colors.hairline}` border | Inputs, small content cards |
| Saturated card | Brand pink/teal/lavender/peach/ochre fill — no shadow | Feature cards |
| Cream card | `{okgtm.colors.surface-card}` background — no shadow | Testimonial, secondary cards |
| Subtle drop shadow | Faint shadow at low alpha | Hover-elevated states (rare) |

The system uses no heavy shadows. Depth comes from the saturated color contrast between cream canvas and bright feature cards.

### Decorative Depth
- **3D clay-style illustrations** — mountains, characters, mascots rendered in a hand-crafted 3D style. The brand's most-recognized depth element. Not a token — these are illustrated assets.
- **Mascot characters** appear as inline figures in feature cards and CTAs.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{okgtm.rounded.xs}` | 6px | Small badges, dropdown items |
| `{okgtm.rounded.sm}` | 8px | Small buttons, hairline-border accent |
| `{okgtm.rounded.md}` | 12px | Standard CTA buttons, text inputs |
| `{okgtm.rounded.lg}` | 16px | Content cards, testimonial cards, pricing tiers |
| `{okgtm.rounded.xl}` | 24px | Feature cards (the saturated brand-color cards) |
| `{okgtm.rounded.pill}` | 9999px | Category tabs, badge pills |
| `{okgtm.rounded.full}` | 9999px / 50% | Avatars, icon buttons |

## Components

### Top Navigation

**`top-nav`** — Cream nav bar pinned to top. 64px tall, `{okgtm.colors.canvas}` background. Carries the OkGTM logo + wordmark at left, primary horizontal menu (Product, Solutions, Resources, Pricing, Customers) center, right-side cluster with "Sign in" + "Try free" `{okgtm.component.button-primary}`. Menu items in `{okgtm.typography.nav-link}` (Inter 14px / 500).

### Buttons

**`button-primary`** — Background `{okgtm.colors.primary}` (near-black), text `{okgtm.colors.on-primary}` (white), type `{okgtm.typography.button}` (Inter 14px / 600), padding 12px × 20px, height 44px, rounded `{okgtm.rounded.md}` (12px).

**`button-secondary`** — Cream button with hairline outline. Background `{okgtm.colors.canvas}`, text `{okgtm.colors.ink}`, 1px hairline border.

**`button-on-color`** — White button used over saturated brand-color feature cards. Same shape as primary but inverted (white background, ink text).

**`button-text-link`** — Inline text button, no background. Used for "Sign in" and inline link CTAs.

**`text-link`** — Inline body links in `{okgtm.colors.ink}` with underline.

### Cards & Containers

**`hero-band`** — Cream-canvas hero with 7-5 grid: h1 + sub-headline + button row on the left, 3D clay-style illustration on the right. Vertical padding `{okgtm.spacing.section}` (96px).

**`hero-illustration-card`** — Right-side artifact holding 3D clay-style illustration (mountains, mascot character, abstract shapes). Background `{okgtm.colors.surface-soft}`, rounded `{okgtm.rounded.xl}` (24px). The illustration IS the artifact.

**`feature-card-pink`** / **`feature-card-teal`** / **`feature-card-lavender`** / **`feature-card-peach`** / **`feature-card-ochre`** — Saturated single-color feature cards. Background varies per variant; rounded `{okgtm.rounded.xl}` (24px); padding `{okgtm.spacing.xl}` (32px). Each card carries an h3 in `{okgtm.typography.title-md}`, a body description, and a product UI fragment or mascot illustration. Text color flips to `{okgtm.colors.on-dark}` (white) on pink and teal cards, `{okgtm.colors.ink}` (dark) on lavender/peach/ochre cards (the lighter saturations have enough contrast for dark text).

**`feature-card-cream`** — Lower-key feature card variant on `{okgtm.colors.surface-card}`. Used for less-emphasized features that don't warrant a saturated color.

**`product-mockup-card`** — Card showing actual OkGTM product UI (OkGTM agent runs, sequencer flows, CRM enrichment tables). Background `{okgtm.colors.canvas}` with hairline border, rounded `{okgtm.rounded.lg}`, padding `{okgtm.spacing.lg}` (24px).

**`testimonial-card`** — Customer quote cards. Background `{okgtm.colors.surface-card}` (cream), rounded `{okgtm.rounded.lg}`, padding `{okgtm.spacing.lg}` (24px). Top row has avatar + name + role; below sits the testimonial in `{okgtm.typography.body-md}`.

**`pricing-tier-card`** — Standard tier card. Background `{okgtm.colors.canvas}` with hairline, rounded `{okgtm.rounded.lg}`, padding `{okgtm.spacing.xl}` (32px).

**`pricing-tier-card-featured`** — The featured tier flips to `{okgtm.colors.brand-teal}` (deep teal-green). The teal surface IS the featured signal.

**`expert-card`** — Used on /experts page. Background `{okgtm.colors.canvas}` with hairline, rounded `{okgtm.rounded.lg}`, padding `{okgtm.spacing.lg}`. Carries an avatar at top, expert name, specialization, and a "Book session" link.

### Inputs & Forms

**`text-input`** — Background `{okgtm.colors.canvas}`, text `{okgtm.colors.ink}`, type `{okgtm.typography.body-md}`, rounded `{okgtm.rounded.md}` (12px), padding 12px × 16px, height 44px. 1px hairline border.

**`text-input-focused`** — Border thickens to ink for emphasis.

### Tabs / Badges

**`category-tab`** + **`category-tab-active`** — Pill-shaped tabs in sub-nav. Inactive: transparent + muted text. Active: cream-card background + ink text. Padding 8px × 16px.

**`badge-pill`** — Small cream-fill pill labels in `{okgtm.typography.caption}` (13px / 500), rounded `{okgtm.rounded.pill}`.

### CTA / Footer

**`cta-band-illustrated`** — Pre-footer "Turn every funnel stage into revenue" band. Background `{okgtm.colors.surface-soft}`, rounded `{okgtm.rounded.xl}`, padding 80px. Carries an h2 in `{okgtm.typography.display-md}`, a sub-line, and a `{okgtm.component.button-primary}` — usually paired with a 3D illustration of a mascot or scene.

**`footer`** — Cream-tinted footer (NOT dark navy unlike most SaaS sites). Background `{okgtm.colors.surface-soft}`, text `{okgtm.colors.body}`. 4-column link list. Vertical padding 80px. Often features a horizon-style 3D mountain illustration at the very bottom — OkGTM's signature footer mountain.

## Do's and Don'ts

### Do
- Anchor every page on the cream canvas (`{okgtm.colors.canvas}` — #fffaf0). The warm tint differentiates OkGTM from cool-gray data sites.
- Use 3D clay-style illustrations as hero artifacts. Hand-crafted 3D characters and mountains ARE the brand.
- Cycle saturated feature cards across the page — pink → teal → lavender → peach → ochre → cream. Repeating the same color twice in a row reads as off-rhythm.
- Use Cabinet Grotesk at weight 500 with negative letter-spacing on every display headline.
- Show product UI fragments inside saturated feature cards. The brand voltage is product-driven, not abstract.
- Use cream footer (NOT dark). OkGTM deliberately closes pages with warm cream rather than the standard dark-footer SaaS template.
- Anchor every band with `{okgtm.spacing.section}` (96px) vertical rhythm.

### Don't
- Don't use cool grays for canvas. The cream tint is non-negotiable.
- Don't use a 7th brand-color card. The 6-color palette is saturated enough.
- Don't bold display weight beyond 500. Cabinet Grotesk at 700 reads as bombastic.
- Don't repeat the same brand-color card twice in a row.
- Don't replace clay-style illustrations with flat vector art. The hand-crafted 3D character IS the brand voice.
- Don't use a dark footer. The cream footer is part of the system's warm-throughout pacing.
- Don't add hover state styling beyond what the system already encodes.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 72→36px; hero-illustration-card stacks below; feature grids 1-up; pricing 1-up |
| Tablet | 768–1024px | Top nav tightens; feature cards 2-up; pricing 2-up |
| Desktop | 1024–1440px | Full top-nav; 3-up feature cards; 3-up pricing tiers |
| Wide | > 1440px | Same as desktop with more breathing room; max content 1280px |

### Touch Targets
- `{okgtm.component.button-primary}` at minimum 44 × 44px (matches WCAG AAA).
- `{okgtm.component.text-input}` height is 44px.

### Collapsing Strategy
- Top nav collapses to hamburger at < 768px.
- Hero 7-5 grid → single-column on mobile.
- Feature card grids reduce columns rather than scaling.
- Saturated feature cards retain their colored fill at every breakpoint.
- Pricing tier cards collapse 4 → 2 → 1.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key (`{okgtm.component.feature-card-pink}`, `{okgtm.component.pricing-tier-card-featured}`).
2. Pick the right brand-color card for the feature: pink for outbound/sequencer, teal for enterprise/featured, lavender for AI-agent products, peach for general SaaS warmth, ochre for community / experts.
3. Variants of an existing component (`-active`, `-disabled`) live as separate entries.
4. Use `{token.refs}` everywhere — never inline hex.
5. Never document hover.
6. Display headlines stay Cabinet Grotesk 500 with negative letter-spacing. Body stays Inter 400.
7. The cream-throughout palette is a system contract — don't add a dark footer.

## Known Gaps

- The display face is Cabinet Grotesk (free for commercial use, ITF FFL via Fontshare) — no licensing blocker. The long-term type direction (a custom commissioned display face) is still open; any future swap must keep the 500-weight + negative-tracking display profile.
- 3D clay-style illustrations are commissioned assets, not system tokens — they're rendered per-page.
- OkGTM's mascot characters (named characters that recur across the site) are illustrated assets; their exact lineage and naming are not yet formalized in tokens.
- Animation and transition timings (3D illustration parallax on scroll, feature card entrance animations) are not in scope.
- Form validation states beyond `{okgtm.component.text-input-focused}` are not extracted.
- The actual OkGTM product surface (in-app data tables, formula editor, agent builder) shares some tokens with the marketing site but adds many product-specific components that are out of scope.
