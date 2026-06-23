# GrindCTRL Identity — Phases 3–5 (logo, wordmark, per-surface, icons)

**Date:** 2026-06-23
**Status:** Approved (delta on the locked `GRINDCTRL-REBRAND-PLAN.md`)
**Scope:** Identity layer only. No DB schema, `.env`, migration, auth, or push-logic changes.

## Context

NotifyPilot is being re-skinned in GrindCTRL's "Pearl Premium" identity. Phases 1–2 of
`GRINDCTRL-REBRAND-PLAN.md` are already shipped:

- **Phase 1 (tokens):** `app/globals.css` carries the GrindCTRL OKLCH tokens, radius, and ease.
  `tailwind.config.ts` has the GrindCTRL radius scale + card shadow.
- **Phase 2 (fonts):** `app/layout.tsx` loads Manrope (`--font-display`) + Inter (`--font-body`).

Remaining: **Phase 3 (logo & wordmark)**, **Phase 4 (per-surface polish + raw `oklch()` cleanup)**,
**Phase 5 (icons + docs + verification)**. The placeholder "SN2 / SN2 Studios" still lives in
`brand-logo.tsx` and `layout.tsx`; the sidebar renders the connected store name as its "logo".

## Backend (confirmed, do not change)

The live backend is the **supabase-2** MCP project (`oiqkjworpdigxtsnygik.supabase.co`):
`np_*` tables, 248 subscribers, 15 campaigns, real production data; migrations match the local
`supabase/migrations`. The `supabase` and `supabase-grindctrl2` MCP projects are unrelated and
**must not be touched**. For any DB inspection in this work, use **supabase-2 only**, read/verify only.

## Logo source of truth

`.grindctrl-logos/` (and the user-supplied `~/Desktop/grindctrl-booking/`):
- `logo.svg` — `fill="currentColor"`, `viewBox="490 310 600 400"` (the adaptive mark)
- `logo-light.svg` — ink `#2a2826`
- `logo-dark.svg` — cream `#f0ede9`

## Locked decisions (this phase)

1. **Sidebar = co-brand.** GrindCTRL mark + "GrindCTRL" wordmark, connected store name as subtitle.
   Top header keeps store name + category as tenant context.
2. **Login hero = mark + wordmark + tagline** over the aurora panel; a small mark sits above
   "Sign in" so mobile (hero hidden `< lg`) still carries the brand.
3. **App icons = cream-on-ink tile.** Cream vortex mark on a near-black ink rounded square;
   rasterized 180/512 from SVG via Playwright; plus an SVG favicon.
4. **Identity only.** supabase-2 read/verify only; tenant `notification-preview` brand protected.

## Design

### Mark component (new, single source)
`components/brand/grindctrl-mark.tsx`: renders the vortex paths from `logo.svg`,
`fill="currentColor"`, `viewBox="490 310 600 400"`, `aria-hidden`, accepts `size`/`className`.
Color follows the current text token (cream on the ink sidebar, ink on the light login card).
Copy the three SVGs into `public/brand/` for any `<img>`/OG use.

### `brand-logo.tsx` rewrite (removes "SN2")
- `sidebar` (co-brand): cream mark in a quiet ink tile + "GrindCTRL" wordmark (`font-display`) +
  `storeName` subtitle (`sidebar-foreground/60`).
- `login`: larger cream mark + wordmark + tagline, centered.
- `compact`: mark only.
- Default `title` → "GrindCTRL".

### `dashboard-shell.tsx`
Sidebar + mobile drawer → `<BrandLogo variant="sidebar" subtitle={storeName} />`.
Header unchanged (store name/category stay). Remap the raw `oklch()` literals to semantic tokens.

### Login (`app/login/page.tsx`, `components/auth/login-form.tsx`)
Hero panel: cream mark + "GrindCTRL" wordmark + tagline over the aurora. Small mark above
"Sign in". Rename `.np-login-aurora` → `.gc-login-aurora` (page + `globals.css`).

### `layout.tsx` + icons
- Metadata `title.default`/`title.template`/`description` → GrindCTRL.
- Add `app/icon.svg` (auto-favicon, cream-on-ink mark).
- Replace `public/sn2-ios-icon-{180,512}.png` → `public/grindctrl-icon-{180,512}.png`
  (cream-on-ink) and update the references in `public/push-service-worker.js` and
  `public/shopify-push-client.js`.
- `notifypilot-theme` localStorage key: **keep** (renaming flickers the theme once); cosmetic only.

### Per-surface sweep (Phase 4)
Walk auth, shell, overview (`page.tsx`, `metric-card`, `recent-activity`), subscribers,
campaigns (list, `[id]`, `new`, `create-campaign-wizard`), settings, and UI primitives
(`button`, `badge`, `field`). Fix raw `oklch()` literals; verify default/hover/focus/active/
disabled/loading/empty/error states and AA contrast.
**Protected:** `components/campaigns/notification-preview.tsx` represents the tenant store brand —
do **not** repaint to GrindCTRL.

### Docs (Phase 5)
`DESIGN.md`, `PRODUCT.md`, `README.md`, and the `globals.css` header comment: replace
SN2/NotifyPilot chrome naming with GrindCTRL (keep the "Pearl Premium" palette name).

## Verification

- `npm run build` compiles clean.
- Playwright screenshots: login + every dashboard surface, light + dark, at 360 / 768 / 1024 / 1440.
- No horizontal overflow; AA contrast on body/muted/badges/buttons/focus rings; mark crisp at all sizes.
- Sidebar focus-ring visibility on the dark surface (use cream/`color-mix` ring, per the master plan).

## Out of scope / protected

DB schema, `.env`, migrations, other supabase projects, the tenant notification payload brand,
and all auth/push functional logic.
