# GrindCTRL

Web push campaigns for e-commerce stores. The production dashboard deploys to `https://notify.grindctrl.cloud`.

## Product Overview

GrindCTRL collects browser push subscribers, issues opt-in discount codes, and manages notification campaigns for offers, launches, restocks, and announcements. The dashboard includes auth, overview metrics, subscribers, campaigns, a four-step create wizard, campaign details and logs, settings, store integration status, public push assets, a Shopify connector layer, and an inactive n8n sender workflow.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Default local fallback login is controlled by `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. Configure Supabase Auth credentials when ready.

## Environment Variables

Use `.env.example` as the source list. Keep these server-only:

- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PRIVATE_KEY`
- `SHOPIFY_CLIENT_SECRET`
- Saved Shopify Admin access tokens
- `SHOPIFY_WEBHOOK_SECRET`
- `INTERNAL_API_KEY`
- `AUTH_SESSION_SECRET`

Only `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` may be browser-visible for the Phase 1 storefront script.

## Supabase Migration Setup

Project ref: `oiqkjworpdigxtsnygik`.

Apply:

```bash
supabase link --project-ref oiqkjworpdigxtsnygik
supabase db push
supabase db seed
```

If the Supabase CLI is not installed, apply all SQL files in `supabase/migrations/` in filename order, then run `supabase/seed.sql`.

## Seed Data Setup

The seed creates:

- GrindCTRL tenant
- admin user record
- 25 realistic push subscribers
- 5 realistic campaigns
- campaign recipients, click records, events, settings, integration status, and audit logs
- opt-in discount codes and subscriber activity records

## Deployment to VPS

```bash
cp .env.example .env
docker compose up -d --build
curl http://127.0.0.1:3000/api/health
```

Set production secrets before enabling public access.

## Shopify OAuth Install

Deploy these routes before opening the Shopify app install URL:

- `/api/shopify/oauth/start`
- `/api/shopify/oauth/callback`
- `/api/shopify/proxy`
- `/api/shopify/webhooks/orders-create`
- `/api/health`

After deployment, set `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_REDIRECT_URI`, `SHOPIFY_PUBLIC_STORE_URL`, and `SHOPIFY_APP_PROXY_PATH`. Then open:

```text
https://notify.grindctrl.cloud/api/shopify/oauth/start
```

The callback stores the offline Admin API access token server-side and registers the `orders/create` webhook.

## DNS Setup

Create an `A` record:

- Host: `notify`
- Domain: `grindctrl.cloud`
- Value: VPS public IPv4

Then point the reverse proxy to `127.0.0.1:3000`.

## Reverse Proxy and SSL

Nginx example:

```nginx
server {
  server_name notify.grindctrl.cloud;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

SSL checklist:

- Install Certbot
- Issue certificate for `notify.grindctrl.cloud`
- Force HTTPS
- Confirm `/api/health` responds over HTTPS
- Confirm service worker is served from the same HTTPS origin

## n8n Workflow Import

Import `n8n/notifypilot-campaign-sender.json`.

Rules:

- Workflow imports inactive.
- Scheduled trigger is disabled.
- Request body is dry-run by default.
- Replace `CONFIGURE_INTERNAL_API_KEY_BEFORE_ACTIVATION` inside the inactive HTTP node before activation.
- Do not activate until live-send safety has been reviewed.

## Store Integration Checklist

See `docs/store-integration-checklist.md`.

## Safety Checklist Before Live Sending

- `LIVE_SENDING_ENABLED=false` until verified.
- `OWNER_TEST_MODE=true` until verified.
- `INTERNAL_API_KEY` is strong and private.
- VAPID public/private keys are configured.
- Shopify client secret, saved Admin API token, and webhook secret are server-only.
- Storefront script and service worker are installed on the storefront origin.
- Opt-in discount creation works after Shopify OAuth install.
- Send Test works for selected test subscribers.
- Type `SEND` confirmation is required for Send Live.
- Confirm max sends per hour.



