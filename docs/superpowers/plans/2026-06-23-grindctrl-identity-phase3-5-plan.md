# Plan — GrindCTRL Identity, Phases 3–5

**Spec:** `docs/superpowers/specs/2026-06-23-grindctrl-identity-phase3-5-design.md`
**Master plan:** `GRINDCTRL-REBRAND-PLAN.md` (Phases 1–2 already shipped)
**Scope:** Identity only. No DB schema/`.env`/migration/auth/push-logic changes. supabase-2 read/verify only.
**Execution:** Phases run consecutively; each is self-contained. Single commit per phase. Token change is revertible.

---

## Phase 0 — Discovery (DONE — allowed facts)

**Logo source of truth** (`.grindctrl-logos/`, identical to `~/Desktop/grindctrl-booking/`):
- `logo.svg` — `fill="currentColor"`, `viewBox="490 310 600 400"`, 13 `<path>` elements (the vortex mark). **This is the only file to copy paths from.**
- `logo-light.svg` (#2a2826 ink) / `logo-dark.svg` (#f0ede9 cream) — color-baked variants for `<img>`/OG use only.
- **Anti-pattern:** never alter the `viewBox` `490 310 600 400` — the paths are absolutely positioned; any other viewBox crops/offsets the mark.

**Already-correct infra (do NOT re-do):**
- `app/globals.css` — GrindCTRL OKLCH tokens, radius, `--ease-out`. ✅
- `tailwind.config.ts` — radius scale + card shadow. ✅
- `app/layout.tsx` — Manrope (`--font-display`) + Inter (`--font-body`) loaded. ✅

**Raw `oklch()` literals remaining** (grep `app,components`):
- `app/globals.css:115-116` — login aurora glow (decorative cream). **Keep.**
- `components/ui/button.tsx:13` — `text-[oklch(0.985_0.006_27)]` danger text. **Remap → `text-accent-foreground`** (only literal worth fixing).
- `dashboard-shell` has **no** raw literals (already clean).

**`SN2` references — two buckets:**
- **Platform chrome → rebrand:** `app/layout.tsx:22-23` (metadata), `components/brand/brand-logo.tsx:7,41`, `app/globals.css:5` (comment).
- **Tenant / storefront / functional → PROTECTED, do NOT touch:** `lib/data/seed.ts` (demo tenant store "SN2 Studios"), `public/shopify-push-client.js` (customer-facing install copy), `app/api/subscribers/send-test/route.ts:33` (tenant store-name fallback), `components/campaigns/create-campaign-wizard.tsx:57` (tenant click-url fallback), `lib/config/env.ts:14-15,22` (admin/vapid env defaults — changing breaks login), `public/sn2-ios-icon-*.png` + `push-service-worker.js:13,15` + `app/api/shopify/proxy/route.ts:68` (**default notification payload icon = tenant boundary**).

**Icon decision:** platform PWA/favicon icons are NEW files (`app/icon.svg`, `app/apple-icon`); the tenant notification fallback icon stays `sn2-ios-icon-512.png` (do not repurpose to GrindCTRL — payload boundary).

**Protected file (no edits):** `components/campaigns/notification-preview.tsx` (tenant store brand).

**Brand mark allowed colors via tokens:** cream on ink = `text-sidebar-foreground` / `text-brand-mark-foreground`; ink on light = `text-foreground` / `text-brand-mark`. No new tokens.

---

## Phase 1 — Mark component + platform icon assets

**Implement:**
1. `components/brand/grindctrl-mark.tsx` (new) — a `<svg>` with `viewBox="490 310 600 400"`, `fill="currentColor"`, `role="img"` + `aria-hidden` toggle, `width/height` from a `size` prop (default 28), `className` passthrough. **Copy the 13 `<path d=…>` verbatim from `.grindctrl-logos/logo.svg`.** Do not retype path data.
2. Copy `logo.svg`, `logo-light.svg`, `logo-dark.svg` → `public/brand/`.
3. `app/icon.svg` (new, Next.js auto-favicon) — cream mark on ink rounded tile: a `<rect>` `fill` ink `#1a1916` rounded, mark `fill` cream `#f0ede9`, same `viewBox` framing (wrap the mark, padded ~12%).

**Verification:**
- `npm run build` compiles.
- `grep -r "viewBox=\"490 310 600 400\"" components/brand/grindctrl-mark.tsx` → 1 hit.
- Dev server: favicon shows the cream-on-ink mark.

**Anti-pattern guard:** do not hand-redraw the mark; do not change the viewBox; do not add color props (color comes from `currentColor`/text token).

---

## Phase 2 — `brand-logo.tsx` rewrite (removes "SN2")

**Implement:** replace the "SN2" tile + "SN2 Studios" text with `<GrindCtrlMark>` + "GrindCTRL" wordmark. Keep the existing `variant` API (`sidebar | login | compact`) and `cn()` styling idiom.
- Default `title = "GrindCTRL"`.
- `sidebar` (co-brand): cream mark in a quiet ink tile (`bg-sidebar-foreground/8 border-sidebar-foreground/12`, `text-sidebar-foreground`) + "GrindCTRL" wordmark (`font-display`, `text-sidebar-foreground`) + `subtitle` (store name) `text-sidebar-foreground/60`.
- `login`: larger mark (`text-foreground`, on the dark hero it'll be passed cream via parent text color) + wordmark + tagline, centered (`flex-col`).
- `compact`: mark only.

**Verification:**
- `grep -ri "SN2" components/brand/brand-logo.tsx` → 0 hits.
- Renders in sidebar without layout shift; subtitle truncates (`truncate`/`max-w`) on long store names.

**Anti-pattern guard:** keep the component a pure presentational component; no data fetching; reuse tokens, no hardcoded hex (except the icon tile asset in Phase 1).

---

## Phase 3 — `dashboard-shell.tsx` sidebar + drawer

**Implement:** change line 57 `<BrandLogo title={storeName} subtitle={storeName} />` → `<BrandLogo variant="sidebar" subtitle={storeName} />` (title defaults to "GrindCTRL"). Same for the mobile drawer `SidebarContent`. Header (`storeName` / `storeCategory`, lines 124-127) stays as tenant context.

**Verification:**
- Sidebar shows: GrindCTRL mark + "GrindCTRL" + store-name subtitle. Header still shows store name + category.
- Mobile drawer (`< lg`) matches. Active-nav, focus ring, sign-out unaffected.
- Focus-ring on dark sidebar visible (cream/`color-mix`, per master plan guardrail).

---

## Phase 4 — Login page + form

**Implement:**
1. `app/login/page.tsx` — inside the hero `<section>` (currently just `.np-login-aurora`), add a centered `<BrandLogo variant="login" subtitle="<tagline>" />` with `text-sidebar-foreground` so the mark renders cream. Rename `.np-login-aurora` → `.gc-login-aurora` here and in `globals.css` (class + `@keyframes np-login-drift` → `gc-login-drift`).
2. `components/auth/login-form.tsx` — add a small `<GrindCtrlMark>` (or `<BrandLogo variant="compact">`) above the "Sign in" heading so mobile (hero hidden `< lg`) carries the brand. Form logic untouched.

**Tagline:** `"Web push campaigns"` (confirm at execution; placeholder-safe).

**Verification:** login at `< lg` shows mark above "Sign in"; at `≥ lg` shows full hero lock-up. No overflow at 360. Aurora animates (and stops under `prefers-reduced-motion`).

---

## Phase 5 — `layout.tsx` metadata + comment

**Implement:**
- `app/layout.tsx:21-25` — `title.default` `"GrindCTRL"`, `title.template` `"%s | GrindCTRL"`, `description` GrindCTRL platform copy.
- `app/globals.css:5` comment `SN2 Studios` → `GrindCTRL`.
- **Keep** the `notifypilot-theme` localStorage key (renaming flickers theme once) — cosmetic only, leave functional.
- **Do NOT** touch `public/sn2-ios-icon-*.png`, `push-service-worker.js`, or `app/api/shopify/proxy/route.ts` (tenant notification payload).

**Verification:** browser tab title = "GrindCTRL"; `grep -ri "SN2" app/layout.tsx app/globals.css` → 0 hits.

---

## Phase 6 — Per-surface sweep + literal cleanup

**Implement:**
- `components/ui/button.tsx:13` — `text-[oklch(0.985_0.006_27)]` → `text-accent-foreground`.
- Walk each surface and verify (no transforms unless a raw literal/SN2 chrome string appears): auth, shell, overview (`page.tsx`, `metric-card`, `recent-activity`), subscribers, campaigns (list, `[id]`, `new`, `create-campaign-wizard`), settings (`settings-actions`), UI primitives (`button`, `badge`, `field`), `theme-toggle`.
- **PROTECTED — skip:** `components/campaigns/notification-preview.tsx`.

**Verification:**
- `grep -rn "oklch(0" app components` → only `globals.css` aurora remains.
- States checked per surface: default/hover/focus/active/disabled/loading/empty/error. AA on body/muted/badges/buttons/focus rings.

---

## Phase 7 — Docs rename (chrome only)

**Implement:** in `DESIGN.md`, `PRODUCT.md`, `README.md` replace **platform chrome** naming SN2/NotifyPilot → GrindCTRL. Keep the "Pearl Premium" palette name. **Leave tenant/storefront examples and seed data references as-is.**

**Verification:** `grep -rni "sn2 studios\|notifypilot" DESIGN.md PRODUCT.md README.md` → only intentional historical/tenant mentions remain (note any kept).

---

## Phase 8 — Final verification

1. `npm run build` clean (no TS/lint errors).
2. Rasterize platform icons cream-on-ink from `app/icon.svg` via Playwright → `app/apple-icon.png` (180) and `app/icon.png` (512) if PWA manifest installability is wanted; optionally add `app/manifest.ts`.
3. Playwright screenshots: **login** + **overview** + **subscribers** + **campaigns list** + **campaign detail** + **new campaign** + **settings**, each **light + dark** at **360 / 768 / 1024 / 1440**.
4. Confirm: no horizontal overflow; AA contrast; mark crisp at all sizes; sidebar focus ring visible on dark; co-brand subtitle truncates gracefully.
5. supabase-2: `list_tables` / `get_advisors` read-only sanity check — confirm **zero** schema drift introduced (expect identical to start).

**Done when:** every surface from login → inner carries the GrindCTRL mark + wordmark with correct positioning, build is green, screenshots pass, and no protected tenant/DB surface changed.

---

## Global anti-patterns (all phases)

- ❌ Rebrand tenant data: `lib/data/seed.ts`, `shopify-push-client.js` install copy, notification payload/fallback icon, `notification-preview.tsx`, env admin/vapid defaults.
- ❌ Touch supabase schema/`.env`/migrations or the `supabase` / `supabase-grindctrl2` projects.
- ❌ Invent tokens or hardcode hex (except the icon-tile asset).
- ❌ Change the logo `viewBox` (`490 310 600 400`).
- ❌ Skip per-phase `npm run build`.
