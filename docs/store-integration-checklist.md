# Store Integration Checklist

- Get Shopify collaborator access
- Create custom app / access token
- Enable Admin API scopes
- Add webhook endpoints
- Install storefront script
- Add service worker
- Test subscriber collection
- Test campaign click URL
- Enable connected mode

## Prepared Files

- `public/shopify-push-client.js`
- `public/push-service-worker.js`
- `services/shopify/shopify.service.ts`
- `services/shopify/shopify.service.ts`
- `services/shopify/real-shopify.service.ts`
- `services/shopify/shopify.types.ts`

## Dashboard Status Wording

Use setup-state wording in the dashboard:

- Setup Required
- Storefront Script Pending Installation
- Webhooks Not Configured
- Admin API Not Connected
- Push Channel Ready
- Campaign Engine Ready
