# NotifyPilot Deployment

Target URL: `https://notify.grindctrl.cloud`

## Build

```bash
npm install
npm run build
```

## Docker

```bash
cp .env.example .env
docker compose up -d --build
docker compose logs -f notifypilot
```

Health check:

```bash
curl https://notify.grindctrl.cloud/api/health
```

## Nginx

Proxy traffic to `127.0.0.1:3000`. Preserve `Host`, `X-Forwarded-Proto`, and `X-Forwarded-For` headers.

## SSL

Use Let’s Encrypt for `notify.grindctrl.cloud`. Browser push requires HTTPS for the dashboard, storefront script API calls, and the service worker scope.

## Rollout

1. Deploy with `LIVE_SENDING_ENABLED=false`.
2. Confirm login.
3. Confirm dashboard metrics.
4. Confirm `/shopify-push-client.js` and `/push-service-worker.js` are reachable.
5. Import the inactive n8n workflow.
6. Run Send Test with selected test subscribers.
7. Enable connected mode only after Shopify credentials, webhooks, and storefront installation are complete.
