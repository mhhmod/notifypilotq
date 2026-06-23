---
name: GrindCTRL
description: Web push campaigns for e-commerce stores
colors:
  light-background: "oklch(0.988 0.003 84.6)"
  light-foreground: "oklch(0.214 0.004 84.6)"
  light-card: "oklch(0.976 0.004 91.4)"
  light-accent: "oklch(0.214 0.004 84.6)"
  dark-background: "oklch(0.144 0.002 106.7)"
  dark-foreground: "oklch(0.976 0.004 91.4)"
  dark-card: "oklch(0.196 0.003 67.7)"
  dark-accent: "oklch(0.976 0.004 91.4)"
  brand-mark: "oklch(0.214 0.004 84.6)"
  brand-mark-foreground: "oklch(0.988 0.003 84.6)"
  success: "oklch(0.523 0.135 144.2)"
  warning: "oklch(0.712 0.179 53.5)"
  danger: "oklch(0.501 0.178 28.7)"
typography:
  headline:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.18
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
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

# Design System: GrindCTRL

## 1. Overview

**Creative North Star: "The After-Hours Launch Desk" — in GrindCTRL Pearl Premium.**

GrindCTRL is the white-label web push platform. The dashboard is an operational control surface for store owners preparing and reviewing web push campaigns. It should feel composed, premium, and trustworthy: the UI is quiet enough for daily use but explicit enough when send safety or store setup state matters.

The identity is **monochrome warm-neutral**: ink on warm pearl in light mode, cream on deep warm-black in dark mode. There is no chromatic brand accent — the primary action is ink itself. Color appears only for semantic state (success / warning / danger). The connected tenant store keeps its own brand inside content surfaces such as the notification preview; the platform skin never overrides tenant brand.

**Key Characteristics:**
- Calm operational density
- Monochrome Pearl Premium light + Deep warm-black dark modes
- Abstract GrindCTRL vortex brand mark (currentColor, no tile)
- Strong send-safety affordances
- Business-facing status language
- Responsive table and form layouts
- RTL-aware spacing and alignment

## 2. Colors

Monochrome warm-neutral. Light mode is warm pearl + ink; dark mode is deep warm-black + cream. Color is functional only: primary action and selection use ink; semantic state uses success/warning/danger. No chromatic accent.

### Primary
- **Ink** (`oklch(0.214 0.004 84.6)` light / `oklch(0.976 0.004 91.4)` dark): Primary actions, active navigation, focus rings, and selected controls. In dark mode the primary surface inverts to cream.
- **Brand Mark** (ink light / cream dark via `currentColor`): The vortex mark inherits surface text color — ink on light, cream on the dark sidebar.

### Neutral
- **Pearl Canvas** (`oklch(0.988 0.003 84.6)`): Light-mode app background.
- **Surface** (`oklch(0.976 0.004 91.4)`): Light-mode cards, panels, form surfaces, and tables.
- **Deep Warm-Black** (`oklch(0.144 0.002 106.7)`): Dark-mode app background.
- **Dark Surface** (`oklch(0.196 0.003 67.7)`): Dark-mode cards and tables.
- **Ink Text** (`oklch(0.214 0.004 84.6)` light / `oklch(0.976 0.004 91.4)` dark): Main text.
- **Ink-Dim Muted** (`oklch(0.412 0.011 67.5)` light / `oklch(0.727 0.007 67.7)` dark): Secondary text. Note: ink-muted (`L 0.62`) fails AA on pearl — it is reserved for disabled/decorative only, never body text.

### Semantic
- **Ready Green** (`oklch(0.62 0.15 152)`): Successful delivery, connected state, and ready status.
- **Setup Amber** (`oklch(0.74 0.15 72)`): Pending setup and limited operation.
- **Failure Red** (`oklch(0.62 0.19 27)`): Failed sends, destructive confirmations, and blocked operations.

### Named Rules
**The Status Language Rule.** Color supports status labels; it never replaces precise wording like Setup Required, Pending Installation, Ready, Disabled, or Not Connected.

**The Monochrome Rule.** The platform skin carries no chromatic accent — primary action and selection are ink. Color appears only for semantic status and for tenant brand inside content (e.g. the notification preview).

## 3. Typography

**Display Font:** Manrope (variable, weights 500–800)  
**Body Font:** Inter (variable, weights 400–700)  
**Arabic Font:** IBM Plex Sans Arabic (i18n fallback)  
**Mono Font:** SF Mono / IBM Plex Mono fallback for endpoints and codes

**Character:** Premium and trustworthy. Manrope carries headings and the wordmark; Inter carries body, labels, and data. Hierarchy comes from weight and spacing discipline, not oversized display text.

### Hierarchy
- **Headline** (Manrope 800, `1.75rem`, 1.18): Page titles and major flow headers.
- **Title** (Manrope 700, `1rem`, 1.35): Card titles, table section labels, and settings group headers.
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
- **Shape:** Soft-radius rectangle (10px / `rounded-md`).
- **Primary:** Ink background with cream text (inverts to cream-on-ink in dark mode), compact padding, and visible focus ring.
- **Hover / Focus:** Slight tonal darkening and clear focus outline. Never rely on color alone for destructive actions.
- **Secondary / Ghost:** Neutral border or transparent surface, consistent height with primary buttons.

### Chips
- **Style:** Small rounded status badges with tinted backgrounds and readable text.
- **State:** Draft, Tested, Queued, Scheduled, Sending, Sent, Failed, Cancelled, Ready, Disabled, Setup Required, Pending Installation, Not Connected.

### Cards / Containers
- **Corner Style:** Soft premium radius (14px / `rounded-lg` for cards, 16px for panels).
- **Background:** Clean Surface over Cool Worksurface.
- **Shadow Strategy:** Card Lift on dashboard cards and table containers; flat for nested information rows.
- **Border:** One subtle full border. No side-stripe accents.
- **Internal Padding:** 16px on compact mobile surfaces, 20px to 24px on desktop cards.

### Inputs / Fields
- **Style:** Surface-tinted, full border, 10px radius, compact vertical rhythm.
- **Focus:** Ink outline with enough contrast.
- **Error / Disabled:** Error text and border for validation; muted background for disabled fields.

### Navigation
- **Style:** Dark sidebar, compact icon plus text items, active state indicated with accent-tinted background and readable text.
- **Mobile:** Collapse into a drawer or stacked top control; no horizontal overflow.

### Notification Preview
- **Style:** A realistic push notification card with configured store brand context, title, body, URL cue, and optional image/icon space.
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


