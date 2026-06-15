import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/config/env";
import { getStore } from "@/lib/data/store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/services/audit/audit.service";
import { RealShopifyService } from "@/services/shopify/real-shopify.service";
import { saveShopifyInstallation } from "@/services/shopify/shopify-installation.service";
import {
  exchangeShopifyCodeForToken,
  isValidShopDomain,
  normalizeShopDomain,
  STATE_COOKIE,
  verifyShopifyQueryHmac,
  verifySignedOauthState
} from "@/services/shopify/shopify-oauth.service";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const shopParam = params.get("shop");
  const code = params.get("code");
  const state = params.get("state");
  if (!shopParam || !code) {
    return NextResponse.json({ error: "Missing Shopify OAuth parameters." }, { status: 400 });
  }

  const shop = normalizeShopDomain(shopParam);
  if (!isValidShopDomain(shop) || !verifyShopifyQueryHmac(params)) {
    return NextResponse.json({ error: "Shopify OAuth callback could not be verified." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(STATE_COOKIE)?.value;
  const configuredShop = serverEnv.shopifyShopDomain
    ? normalizeShopDomain(serverEnv.shopifyShopDomain)
    : "";
  const verifiedState = state ? verifySignedOauthState(stateCookie, state) : false;
  const trustedConfiguredShopInstall = configuredShop === shop;
  if (!verifiedState && !trustedConfiguredShopInstall) {
    return NextResponse.json({ error: "Shopify OAuth state could not be verified." }, { status: 401 });
  }

  const tokenResult = await exchangeShopifyCodeForToken(shop, code);
  const installation = await saveShopifyInstallation({
    shopDomain: shop,
    accessToken: tokenResult.access_token,
    scopes: tokenResult.scope
  });

  const store = getStore();
  const service = new RealShopifyService(installation.accessToken, installation.shopDomain);
  const webhooks = await service.registerWebhooks();
  const ordersWebhook = webhooks.find((webhook) => webhook.topic === "orders/create");
  store.appSettings.storeIntegration.connectionStatus = "Connected";
  store.appSettings.storeIntegration.adminApi = "Connected";
  store.appSettings.storeIntegration.discountCreationStatus = "Ready";
  store.appSettings.storeIntegration.webhooks = ordersWebhook?.status ?? "Ready";
  store.appSettings.storeIntegration.ordersWebhookStatus = ordersWebhook?.status ?? "Ready";
  store.integrationStatus.shopifyConnection = "Connected";

  const supabase = createSupabaseAdminClient();
  if (supabase) {
    await supabase
      .from("integration_status")
      .update({
        shopify_connection_status: "Connected",
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", store.tenant.id);
  }

  recordAuditLog({
    action: "store connection installed",
    actorEmail: "system@notifypilot",
    entityType: "integration",
    metadata: {
      shopDomain: shop,
      scopes: tokenResult.scope,
      ordersWebhookStatus: ordersWebhook?.status ?? "Ready"
    }
  });

  cookieStore.delete(STATE_COOKIE);
  return NextResponse.redirect(new URL("/dashboard/settings?shopify=connected", request.nextUrl.origin));
}
