# NotifyPilot Go-Live for sn2studios.co — Design Spec

**Date:** 2026-06-16
**Status:** Awaiting user review

## Goal

Make NotifyPilot work for real on **sn2studios.co**: a new shopper sees a "Get 10% off" prompt, subscribes to web push (Android + desktop now; iOS via Add-to-Home-Screen), receives a real Shopify discount code that works at checkout, appears as a real subscriber in the dashboard, and can be sent live campaigns.

## Locked decisions

1. **Data backend:** reuse the existing shared Supabase (`oiqkjworpdigxtsnygik`), but **namespace all NotifyPilot tables with `np_`** to eliminate the `app_settings` collision and prevent future ones.
2. **Discount:** connect Shopify Admin (custom-app Admin API token) → real unique 10% codes per subscriber.
3. **iOS:** launch Android + desktop now; show an "Add to Home Screen for alerts" hint on iOS.

## Brand boundary (unchanged)

- **GrindCTRL** = platform skin (dashboard chrome). Already shipped.
- **sn2studios** = the tenant store. Storefront widget + notification payload represent the *store*, not the platform.

## Architecture / data flow

```
Shopper on sn2studios.co
  → widget popup "Get 10% off" → grant Notification permission
  → PushManager.subscribe(VAPID)
  → POST https://notify.grindctrl.cloud/api/push/subscribe
      → registerSubscriber()  → np_push_subscribers
      → issueOptInDiscount()  → Shopify Admin creates unique 10% code → np_discount_codes
  → widget shows code (copy / apply at checkout)
Dashboard (connected_mode) reads np_* tables from Supabase
Campaign send → n8n webhook → web-push to subscriber endpoints → np_push_events
Shopify order webhook → markDiscountUsed() → np_discount_codes
```

## Component changes

### 1. Namespacing (`np_` prefix) — the core safety change
Rename these 13 tables in **both** migrations and **all** code references:

`tenants, admin_users, push_subscribers, push_campaigns, push_campaign_recipients, push_events, push_clicks, app_settings, integration_status, audit_logs, shopify_installations, discount_codes, subscriber_activity` → each prefixed `np_`.

- **Migrations:** edit `supabase/migrations/20260613190000_init_notifypilot.sql` and `20260615123000_phase1_shopify_discounts.sql` — rename all `create table`, `alter table`, indexes, RLS policies, FK references, and the `public.app_settings` ALTER (→ `np_app_settings`). All are `create table if not exists`, so applying to the shared DB only creates the new `np_*` tables; it touches nothing existing.
- **Code:** update every `.from("<table>")` in `lib/data/supabase-repository.ts`, `services/**`, and any route to the `np_` name. (~15 call sites; no company tables among them.)
- **Verify:** `grep` shows zero un-prefixed NotifyPilot `.from()` remain; clean build.

### 2. Apply schema to Supabase
Apply the two (now `np_`-prefixed) migrations to `oiqkjworpdigxtsnygik` via Supabase MCP `apply_migration`. Confirm 13 `np_*` tables created with RLS, **and that no existing company table was altered** (especially `app_settings` untouched, still 6 rows).

### 3. Seed the tenant row
Insert one `np_tenants` row for sn2studios (slug, store name "SN2 Studios" / current value, storeUrl `https://sn2studios.co`) + `np_app_settings` defaults (opt-in discount: enabled, 10%, prefix, expiry) + `np_integration_status`. Reuse `supabase/seed.sql` adapted to `np_` and to sn2studios values.

### 4. Connect Shopify Admin
- **User action:** in sn2studios Shopify admin → Develop apps → create custom app → Admin API scopes `write_discounts, read_products, read_orders` → install → copy Admin API access token.
- Store it: either (a) `SHOPIFY_ADMIN_ACCESS_TOKEN` in the VPS `.env` (I provide the command; user pastes the secret on the box, not in chat), or (b) a row in `np_shopify_installations`. Env is simpler for a single store.
- **Verify:** `issueOptInDiscount()` for a test subscriber creates a real code visible in Shopify admin → Discounts.

### 5. Flip to connected_mode
Set `NOTIFYPILOT_INTEGRATION_MODE=connected_mode` in VPS `.env`, recreate container. `canUseProductionData()` / `canUseRealPush()` now true. Dashboard shows real (initially empty) data; `/api/system/status` green.

### 6. Install storefront widget on sn2studios.co
- Configure Shopify **app proxy** so `/apps/notifypilot?asset=service-worker` serves the service worker from the store origin (required: SW must be same-origin as the store for push).
- Add the client snippet to the live theme (`theme.liquid` before `</body>`):
  ```html
  <script>window.NotifyPilotPushConfig={storeUrl:"https://sn2studios.co",vapidPublicKey:"<NEXT_PUBLIC_VAPID_PUBLIC_KEY>",apiBaseUrl:"https://notify.grindctrl.cloud"};</script>
  <script src="https://notify.grindctrl.cloud/shopify-push-client.js" defer></script>
  ```
- **User action:** theme access (or grant me access / paste snippet via app embed).
- **Verify:** on a fresh sn2studios.co visit (Android/desktop) the popup shows, permission → subscribe → real code; subscriber appears in dashboard; code applies at checkout.

### 7. iOS Add-to-Home-Screen path
- In `shopify-push-client.js`: detect iOS Safari (not standalone) → instead of the subscribe button, show "Add this site to your Home Screen to unlock alerts + 10% off" with brief instructions.
- Ensure a web app manifest is present so A2HS works. After A2HS + reopen, the normal subscribe flow runs.

### 8. Live send test
Keep `OWNER_TEST_MODE=true` for first send. Owner test → self device (Android/desktop) → confirm delivery + click tracking (`np_push_events`/`np_push_clicks`). Then a real campaign to the subscriber list.

### 9. Widget brand polish
`shopify-push-client.js` inline styles are still violet. Re-skin to a clean neutral that fits sn2studios (the storefront, not the GrindCTRL dashboard). Keep accessible contrast, mobile-safe.

## What the user must provide (cannot be done by me)
- Shopify custom-app **Admin API token** (added to VPS `.env` by the user).
- Shopify **theme access** to add the widget snippet (or accept an app-embed approach).

## Verification & safety
- Supabase: `apply_migration` only creates `np_*`; **never** alters company tables. Confirm `app_settings` row count unchanged before/after.
- Every prod redeploy: clean-tree build verify first (stash unrelated changes), as done for the rebrand.
- First sends gated by `OWNER_TEST_MODE`.
- Rollback: schema is additive (`np_*` only) — drop the `np_*` tables to fully reverse; revert `connected_mode` env to return to seeded mode instantly.

## Out of scope (for now)
- Full native iOS PWA subscribe flow (only the A2HS hint).
- Multi-store / multi-tenant beyond sn2studios.
- Abandoned-cart recovery automation.
