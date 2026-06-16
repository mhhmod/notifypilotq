import { absoluteUrl } from "@/lib/utils";
import type {
  ShopifyConnectionResult,
  ShopifyDiscountCode,
  ShopifyInstallInstructions,
  ShopifyService,
  ShopifyShopInfo,
  ShopifyWebhookRegistration
} from "@/services/shopify/shopify.types";

export class MockShopifyService implements ShopifyService {
  async getShopInfo(): Promise<ShopifyShopInfo> {
    return {
      name: "SN2 Studios",
      domain: "sn2studios.co",
      platform: "Shopify",
      connectionStatus: "Setup Required"
    };
  }

  async verifyConnection(): Promise<ShopifyConnectionResult> {
    return {
      ok: false,
      status: "Setup Required",
      message: "Shopify Connection Required"
    };
  }

  async registerWebhooks(): Promise<ShopifyWebhookRegistration[]> {
    return [
      {
        topic: "orders/create",
        callbackUrl: absoluteUrl("/api/shopify/webhooks/orders-create"),
        status: "Not Configured"
      }
    ];
  }

  async getThemeInstallInstructions(): Promise<ShopifyInstallInstructions> {
    return {
      scriptUrl: absoluteUrl("/shopify-push-client.js"),
      serviceWorkerUrl: absoluteUrl("/push-service-worker.js"),
      steps: [
        "Get Shopify collaborator access",
        "Create custom app / access token",
        "Enable Admin API scopes",
        "Add webhook endpoints",
        "Install storefront script",
        "Add service worker",
        "Test subscriber collection",
        "Test campaign click URL",
        "Enable connected mode"
      ]
    };
  }

  async createDiscountCode(input: ShopifyDiscountCode): Promise<ShopifyDiscountCode> {
    return input;
  }

  async verifyWebhookHmac(): Promise<boolean> {
    return false;
  }
}



