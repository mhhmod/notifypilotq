# Product

## Register

product

## Users

NotifyPilot is used by e-commerce store operators, owners, and marketing admins who need to collect browser push subscribers and send offer, launch, restock, announcement, and recovery campaigns without exposing technical push infrastructure. The primary workspace is the GrindCTRL dashboard at https://notify.grindctrl.cloud.

Users are in an operational workflow: checking campaign performance, confirming subscriber readiness, preparing a notification, sending a safe test, and deciding whether a campaign can be scheduled or sent. They need the product to feel trustworthy, active, and production-ready even while Shopify connection setup is still in progress.

## Product Purpose

NotifyPilot is a white-label SaaS dashboard for web push marketing. It exists to help e-commerce stores collect browser subscribers and send push campaigns for discounts, launches, restocks, announcements, and future abandoned-cart recovery.

Success means the dashboard works as a real MVP now with Supabase-backed tenant data, conservative send safety, protected dashboard routes, complete campaign flows, Shopify OAuth, storefront script, service worker, n8n sender, and a safe path to live push delivery.

## Brand Personality

NotifyPilot should feel precise, premium, and operational. The tone is direct and calm: it shows store readiness, campaign performance, and send risk clearly without exposing internal implementation details.

The interface should sit closer to trusted product tools like Stripe, Linear, and Shopify Admin than to a marketing landing page. It should feel like software a store owner would trust during a real campaign window.

## Anti-references

Do not use the retired internal brand token in product UI, seed data, page titles, labels, documentation screenshots, or visible copy.

Do not show visible wording that implies the product is temporary, synthetic, unfinished, or dependent on private collaborator access.

Do not expose raw push subscription internals such as endpoint, p256dh, auth key, browser subscription JSON, private tokens, service role keys, VAPID private keys, Shopify Admin tokens, or internal API keys in the client-facing dashboard.

Avoid childish colors, decorative SaaS clutter, raw technical JSON, landing-page theatrics, and layouts that only work left-to-right.

## Design Principles

1. Make setup state sound operational. Use labels like Store Setup, Setup in Progress, Limited Mode, Store Connection Required, Storefront Script Pending Installation, Shopify Connection Required, Admin API Not Connected, Webhooks Not Configured, Push Channel Ready, and Campaign Engine Ready.
2. Keep live-send risk visible. Live Sending is disabled by default, Owner Test Mode is enabled by default, and dangerous actions require explicit confirmation.
3. Show business-facing evidence. Tables, logs, and status blocks should explain campaign and subscriber outcomes without leaking secrets or implementation internals.
4. Design for repeated work. Overview, subscribers, campaigns, creation, details, settings, and status views should be dense enough for daily operation but calm enough for quick decisions.
5. Preserve integration paths. The dashboard should run from production data while keeping connected Shopify, real push delivery, webhooks, and n8n orchestration explicit and safe.

## Accessibility & Inclusion

Target WCAG AA contrast and keyboard-operable controls. Support responsive desktop, tablet, and mobile layouts without horizontal overflow. Treat English and Arabic as future requirements: use logical spacing, avoid left/right-only assumptions, allow text expansion, and avoid mirroring charts, media, or brand marks unless explicitly intended.



