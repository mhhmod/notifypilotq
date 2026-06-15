# GrindCTRL Identity Migration — NotifyPilot

**Goal:** Re-skin the NotifyPilot dashboard in GrindCTRL's "Pearl Premium" identity. Structured token swap + faithful logo + per-surface verification. No chromatic accent, no random edits.

**Decisions (locked):**
1. **Full monochrome** — primary action = ink, no chromatic accent. Active nav via tonal fill + weight.
2. **GrindCTRL mark + "GrindCTRL" wordmark** in sidebar/login. NotifyPilot name drops from chrome and page titles.
3. **Scope:** identity layer + per-surface polish (every dashboard surface verified under the new skin).

## Brand boundary (three entities — do not conflate)

| Entity | Role | Where it lives | Changes? |
|---|---|---|---|
| **GrindCTRL** | The white-label *platform* (`notify.grindctrl.cloud`) | App chrome: sidebar logo, login, page title, theme/skin | **Yes — this is the rebrand** |
| **SN2Studios** | The *tenant store* being managed (`sn2studios.co`, "Your store") | Content: store-readiness, settings, subscriber data, **notification preview** (push is sent *as the store*) | **No — protected** |
| **NotifyPilot** | Product name | Was in chrome | Dropped from chrome |

**Protected (tenant) — Phase 4 must NOT repaint to GrindCTRL:**
- `notification-preview.tsx` — "Your store" label + `sn2studios.co` URL = the shopper-facing push as SN2Studios. Stays. Its accent tint represents the *store's* brand, not the platform; keep neutral/ink, do not force GrindCTRL identity onto the simulated notification.
- Any `store.appSettings.brand.*` / `store.tenant.*` driven copy (store name, category, readiness blocks) — dynamic tenant data, untouched.

**Source of truth:** `mhhmod/grindctrl_booking` → `src/tokens.css` (Pearl Premium light + Deep dark), `src/fonts.css`, logo SVGs (`logo.svg` currentColor, `logo-light.svg` #2a2826, `logo-dark.svg` #f0ede9).

**Strategy:** Keep the existing `oklch(var(--x) / <alpha>)` plumbing. Only the **values** of the CSS vars in `globals.css` change → every semantic consumer (`bg-card`, `text-foreground`, `accent`, …) re-skins for free. Tailwind config untouched. Alpha support preserved.

---

## Token map (current var → GrindCTRL, OKLCH `L C H`)

| Var | Light (new) | Dark (new) | GrindCTRL source |
|---|---|---|---|
| `--background` | `0.988 0.003 84.6` | `0.144 0.002 106.7` | canvas |
| `--foreground` | `0.214 0.004 84.6` | `0.976 0.004 91.4` | ink |
| `--card` | `0.976 0.004 91.4` | `0.196 0.003 67.7` | surf-low / surf-container |
| `--muted` | `0.923 0.006 75.4` | `0.256 0.004 84.6` | surf-high / surf-highest |
| `--muted-foreground` | `0.412 0.011 67.5` | `0.727 0.007 67.7` | **ink-dim** (AA), not ink-muted |
| `--border` | `0.896 0.006 75.4` | `0.378 0.009 67.6` | surf-highest / outline |
| `--sidebar` | `0.214 0.004 84.6` | `0.115 0.000 0` | ink / canvas-deep |
| `--sidebar-muted` | `0.516 0.008 67.6` | `0.622 0.009 73.7` | secondary / ink-muted |
| `--accent` | `0.214 0.004 84.6` | `0.976 0.004 91.4` | primary (ink) |
| `--accent-foreground` | `0.988 0.003 84.6` | `0.144 0.002 106.7` | on-primary |
| `--brand-mark` | `0.214 0.004 84.6` | `0.976 0.004 91.4` | ink / cream |
| `--brand-mark-foreground` | `0.988 0.003 84.6` | `0.144 0.002 106.7` | cream / ink |
| `--success` | `0.523 0.135 144.2` | `0.718 0.142 144.9` | success |
| `--warning` | `0.712 0.179 53.5` | `0.797 0.164 69.6` | warning |
| `--danger` | `0.501 0.178 28.7` | `0.664 0.123 24.0` | error |

**Contrast guardrails (verify in Phase 4):**
- Body/secondary text uses `--muted-foreground` = ink-dim → AA pass on all surfaces.
- ink-muted (`0.62`) reserved for disabled/decorative only — never body text.
- Mono focus ring: on light content surfaces use `--accent` (ink); on the dark sidebar a bare ink ring is invisible → use `--brand-mark-foreground` (cream) or a `color-mix` ring there.

---

## Radius & motion

- GrindCTRL is more generous than current 6–8px. Adopt with product restraint:
  - buttons/controls `0.625rem` (10px), inputs `0.625rem`, cards `0.875rem` (14px), panels/drawers `1rem` (16px), pill `999px`.
- Ease: adopt `cubic-bezier(0.16, 1, 0.3, 1)` for transitions; durations 150–250ms (product register). Keep `prefers-reduced-motion` fallbacks.

## Typography

- Add **Manrope** (display: headlines, wordmark, metric numerals) + **Inter** (body, labels, data) via `next/font/google`, expose `--font-display` / `--font-body`.
- Body → Inter; `h1–h3`, `.headline`, wordmark → Manrope. IBM Plex Sans Arabic kept as Arabic fallback for future i18n. Mono fallback for endpoints/codes.

---

## Phases

### Phase 1 — Identity tokens (core)
- `app/globals.css`: rewrite `:root` + `[data-theme="dark"]` var values per the map above. Swap the body radial-gradient accent tint (violet → ink, very low alpha). Add radius + ease vars if centralizing.
- `tailwind.config.ts`: update `boxShadow.card` to GrindCTRL card shadow (`0 8px 32px rgba(0,0,0,.03), 0 1px 2px rgba(0,0,0,.02)` light-tuned). No color changes (plumbing stays).
- **Verify:** `npm run build` compiles; dev boots; spot-check overview light+dark.

### Phase 2 — Fonts
- `app/layout.tsx`: load Manrope + Inter, set font vars on `<html>`.
- `globals.css`: `body` font → `var(--font-body)`; heading rule → `var(--font-display)`.
- Update `DESIGN.md` typography block (system stack → Manrope/Inter).

### Phase 3 — Logo & wordmark
- New `GrindCtrlMark` (vortex paths from `logo.svg`, `currentColor`, `viewBox="490 310 600 400"`, `aria-hidden`).
- `components/brand/brand-logo.tsx`: replace placeholder SVG with the mark; drop the dark tile (bare mark, GrindCTRL style) or keep a quiet tile — go bare on the dark sidebar where cream mark sits on ink. Wordmark text → **"GrindCTRL"** (Manrope), subtitle retained.
- `app/layout.tsx` metadata + `requireUser`/title surfaces → "GrindCTRL".

### Phase 4 — Per-surface polish + remap hardcoded oklch
Walk each surface, fix raw `oklch()` literals (3 files), verify states (default/hover/focus/active/disabled/loading/empty/error), spacing, and AA. Surfaces:
- **Auth** — `components/auth/login-form.tsx`
- **Shell/nav** — `components/layout/dashboard-shell.tsx` (8 oklch literals), `theme-toggle`
- **Overview** — `app/dashboard/page.tsx`, `metric-card`, `recent-activity`
- **Subscribers** — `app/dashboard/subscribers/page.tsx`
- **Campaigns** — list, `[id]`, `new`, `create-campaign-wizard`, `notification-preview` (2 literals)
- **Settings** — `settings-actions`
- **UI primitives** — `button`, `badge`, `field` (standardize mono states)

### Phase 5 — Docs + verification
- Update `DESIGN.md` (colors, typography, named rules) + `PRODUCT.md` brand personality to GrindCTRL. Retire violet/"Runway Violet" naming.
- **Verify:** build clean; Playwright screenshots at 360 / 768 / 1024 / 1440, light + dark; no horizontal overflow; AA contrast confirmed on body, muted, badges, buttons, focus rings; logo crisp at all sizes.

---

## Risk / rollback
- Single-commit-per-phase; token change is reversible (git revert of `globals.css`).
- Blast radius low: 16 var defs + 3 literal files; everything else inherits.
- Watch: focus-ring visibility on dark sidebar; muted-text AA; logo viewBox scaling inside fixed tiles.
