import { isConnectedMode } from "@/lib/config/env";
import { MockShopifyService } from "@/services/shopify/mock-shopify.service";
import { RealShopifyService } from "@/services/shopify/real-shopify.service";
import { getShopifyInstallation } from "@/services/shopify/shopify-installation.service";
import type { ShopifyService } from "@/services/shopify/shopify.types";

export async function getShopifyService(): Promise<ShopifyService> {
  const installation = await getShopifyInstallation();
  if (installation) {
    return new RealShopifyService(installation.accessToken, installation.shopDomain);
  }

  return isConnectedMode() ? new RealShopifyService() : new MockShopifyService();
}
