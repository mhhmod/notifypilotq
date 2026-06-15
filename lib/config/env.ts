import type { IntegrationMode } from "@/types/domain";

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://notify.grindctrl.cloud",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY,
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
};

export const serverEnv = {
  supabaseSecretKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  authSessionSecret: process.env.AUTH_SESSION_SECRET ?? "local-notifypilot-session-secret-change-before-deploy",
  adminEmail: process.env.ADMIN_EMAIL ?? "owner@notify.grindctrl.cloud",
  adminPassword:
    process.env.ADMIN_PASSWORD ??
    (process.env.NODE_ENV === "production" ? "" : "notifypilot-admin"),
  internalApiKey: process.env.INTERNAL_API_KEY ?? "",
  integrationMode: (process.env.NOTIFYPILOT_INTEGRATION_MODE ?? "seeded_mode") as IntegrationMode,
  ownerTestMode: (process.env.OWNER_TEST_MODE ?? "true") === "true",
  liveSendingEnabled: (process.env.LIVE_SENDING_ENABLED ?? "false") === "true",
  maxSendsPerHour: Number(process.env.MAX_SENDS_PER_HOUR ?? 500),
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidSubject: process.env.VAPID_SUBJECT ?? "mailto:admin@grindctrl.cloud",
  shopifyClientId: process.env.SHOPIFY_CLIENT_ID,
  shopifyClientSecret: process.env.SHOPIFY_CLIENT_SECRET,
  shopifyAppScopes:
    process.env.SHOPIFY_APP_SCOPES ??
    "read_discounts,write_discounts,read_orders,read_products,write_app_proxy",
  shopifyShopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
  shopifyPublicStoreUrl: process.env.SHOPIFY_PUBLIC_STORE_URL,
  shopifyRedirectUri:
    process.env.SHOPIFY_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "https://notify.grindctrl.cloud"}/api/shopify/oauth/callback`,
  shopifyAppProxyPath: process.env.SHOPIFY_APP_PROXY_PATH ?? "/apps/notifypilot",
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION ?? "2026-04",
  shopifyAdminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  shopifyWebhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
  n8nBaseUrl: process.env.N8N_BASE_URL ?? "https://n8n.grindctrl.cloud",
  n8nCampaignSenderWebhookPath:
    process.env.N8N_CAMPAIGN_SENDER_WEBHOOK_PATH ?? "/webhook/notifypilot-campaign-send"
};

export function isSupabaseConfigured() {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey);
}

export function isSupabaseAdminConfigured() {
  return Boolean(publicEnv.supabaseUrl && serverEnv.supabaseSecretKey);
}

export function isConnectedMode() {
  return serverEnv.integrationMode === "connected_mode";
}

export function canUseRealPush() {
  return Boolean(
    isConnectedMode() &&
      serverEnv.liveSendingEnabled &&
      publicEnv.vapidPublicKey &&
      serverEnv.vapidPrivateKey
  );
}

