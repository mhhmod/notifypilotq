---
name: NotifyPilot
description: Web push campaigns for e-commerce stores
colors:
  light-background: "oklch(0.978 0.007 84)"
  light-foreground: "oklch(0.205 0.017 260)"
  light-card: "oklch(0.996 0.006 92)"
  light-accent: "oklch(0.53 0.16 276)"
  dark-background: "oklch(0.165 0.018 260)"
  dark-foreground: "oklch(0.925 0.008 86)"
  dark-card: "oklch(0.205 0.02 260)"
  dark-accent: "oklch(0.72 0.145 286)"
  brand-mark: "oklch(0.2 0.026 260)"
  brand-mark-foreground: "oklch(0.9 0.045 88)"
  success: "oklch(0.58 0.14 153)"
  warning: "oklch(0.71 0.15 76)"
  danger: "oklch(0.6 0.18 25)"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "0"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "0"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0"
rounded:
  sm: "6px"
  md: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "20px"
---

# Design System: NotifyPilot

## 1. Overview

**Creative North Star: "The After-Hours Launch Desk"**

NotifyPilot is an operational control surface for store owners preparing and reviewing web push campaigns. It should feel composed, premium, and trustworthy: the UI is quiet enough for daily use but explicit enough when send safety or store setup state matters.

The system supports two real operating moods for a streetwear and fashion commerce brand: a warm editorial light mode for daytime review, and a charcoal night mode for late drop monitoring under city-light ambience. Both modes stay product-grade: no nightclub neon, no decorative grit, and no fashion-page theatrics inside operational flows.

**Key Characteristics:**
- Calm operational density
- Streetwear-aware light and dark modes
- Elegant apparel-style brand mark
- Strong send-safety affordances
- Business-facing status language
- Responsive table and form layouts
- RTL-aware spacing and alignment

## 2. Colors

The palette is restrained but more fashion-aware than a default SaaS dashboard. Light mode uses warm paper neutrals and ink. Dark mode uses deep charcoal with a soft shop-window glow. Color is functional: navigation, primary action, focus, and semantic state.

### Primary
- **Runway Violet** (`oklch(0.53 0.16 276)` light, `oklch(0.72 0.145 286)` dark): Primary actions, active navigation, focus rings, and selected controls.
- **Aurela Mark Ink** (`oklch(0.2 0.026 260)`): Logo tile in light mode.
- **Aurela Mark Thread** (`oklch(0.9 0.045 88)`): Logo linework and dark-mode mark surface.

### Neutral
- **Atelier Paper** (`oklch(0.978 0.007 84)`): Light-mode app background.
- **Fitting Room Surface** (`oklch(0.996 0.006 92)`): Light-mode cards, panels, form surfaces, and tables.
- **Midnight Asphalt** (`oklch(0.165 0.018 260)`): Dark-mode app background.
- **Black Denim Surface** (`oklch(0.205 0.02 260)`): Dark-mode cards and tables.
- **Ink** (`oklch(0.205 0.017 260)` light, `oklch(0.925 0.008 86)` dark): Main text.
- **Operational Muted** (`oklch(0.46 0.021 256)` light, `oklch(0.72 0.018 86)` dark): Secondary text.

### Semantic
- **Ready Green** (`oklch(0.62 0.15 152)`): Successful delivery, connected state, and ready status.
- **Setup Amber** (`oklch(0.74 0.15 72)`): Pending setup and limited operation.
- **Failure Red** (`oklch(0.62 0.19 27)`): Failed sends, destructive confirmations, and blocked operations.

### Named Rules
**The Status Language Rule.** Color supports status labels; it never replaces precise wording like Setup Required, Pending Installation, Ready, Disabled, or Not Connected.

**The Streetwear Restraint Rule.** Apparel energy can live in palette, logo, and small moments. Tables, settings, and send controls stay calm and familiar.

## 3. Typography

**Display Font:** System UI stack  
**Body Font:** System UI stack  
**Label/Mono Font:** System UI stack

**Character:** Native, compact, and trustworthy. Type hierarchy comes from weight and spacing discipline, not oversized display text.

### Hierarchy
- **Headline** (700, `1.75rem`, 1.18): Page titles and major flow headers.
- **Title** (650, `1rem`, 1.35): Card titles, table section labels, and settings group headers.
- **Body** (400, `0.9375rem`, 1.55): Descriptions, form help, table content, and review summaries.
- **Label** (600, `0.8125rem`, 1.3): Form labels, badges, metadata, and compact controls.

### Named Rules
**The No Theater Rule.** Dashboard labels and data never use display styling. The user is here to operate a campaign, not read a sales page.

## 4. Elevation

Depth is conveyed through tonal layering and restrained shadow. Cards sit on the worksurface with a subtle border and low shadow only when it improves separation. Controls should not combine decorative borders with large soft shadows.

### Shadow Vocabulary
- **Card Lift** (`0 1px 2px oklch(0.18 0.018 255 / 0.06), 0 12px 32px oklch(0.18 0.018 255 / 0.06)`): Use on primary cards and tables only.

### Named Rules
**The Flat Operations Rule.** Most elements are flat at rest. Use shadow to clarify layered surfaces, not to decorate every panel.

## 5. Components

### Buttons
- **Shape:** Low-radius rectangle (6px).
- **Primary:** Pilot Accent background with Accent Foreground text, compact padding, and visible focus ring.
- **Hover / Focus:** Slight tonal darkening and clear focus outline. Never rely on color alone for destructive actions.
- **Secondary / Ghost:** Neutral border or transparent surface, consistent height with primary buttons.

### Chips
- **Style:** Small rounded status badges with tinted backgrounds and readable text.
- **State:** Draft, Tested, Queued, Scheduled, Sending, Sent, Failed, Cancelled, Ready, Disabled, Setup Required, Pending Installation, Not Connected.

### Cards / Containers
- **Corner Style:** Tight premium radius (8px maximum for cards).
- **Background:** Clean Surface over Cool Worksurface.
- **Shadow Strategy:** Card Lift on dashboard cards and table containers; flat for nested information rows.
- **Border:** One subtle full border. No side-stripe accents.
- **Internal Padding:** 16px on compact mobile surfaces, 20px to 24px on desktop cards.

### Inputs / Fields
- **Style:** White-tinted surface, full border, 6px radius, compact vertical rhythm.
- **Focus:** Pilot Accent outline with enough contrast.
- **Error / Disabled:** Error text and border for validation; muted background for disabled fields.

### Navigation
- **Style:** Dark sidebar, compact icon plus text items, active state indicated with accent-tinted background and readable text.
- **Mobile:** Collapse into a drawer or stacked top control; no horizontal overflow.

### Notification Preview
- **Style:** A realistic push notification card with Aurela Studio brand context, title, body, URL cue, and optional image/icon space.
- **Behavior:** Updates live while content fields change and preserves readable wrapping at mobile widths.

## 6. Do's and Don'ts

### Do:
- **Do** use visible setup wording like Store Setup, Setup in Progress, Limited Mode, Store Connection Required, Storefront Script Pending Installation, Shopify Connection Required, Admin API Not Connected, Webhooks Not Configured, Push Channel Ready, and Campaign Engine Ready.
- **Do** keep the dashboard calm, dense, and operational.
- **Do** make send safety visible with disabled states, confirmation text, and clear recipient counts.
- **Do** keep tables horizontally safe on mobile.
- **Do** use logical spacing and alignment so Arabic and English layouts can be supported later.

### Don't:
- **Don't** use the retired internal brand token anywhere.
- **Don't** show wording that implies the product is temporary, synthetic, unfinished, or dependent on private collaborator access.
- **Don't** expose raw endpoints, p256dh, auth keys, browser subscription JSON, private secrets, or service role credentials.
- **Don't** use side-stripe borders, gradient text, glassmorphism, decorative metric templates, or oversized rounded cards.
- **Don't** build a marketing landing page as the first screen for dashboard users.
