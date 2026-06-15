import { createHmac, timingSafeEqual } from "crypto";
import { absoluteUrl } from "@/lib/utils";
import { serverEnv } from "@/lib/config/env";
import type {
  ShopifyConnectionResult,
  ShopifyDiscountCode,
  ShopifyInstallInstructions,
  ShopifyService,
  ShopifyShopInfo,
  ShopifyWebhookRegistration
} from "@/services/shopify/shopify.types";

export class RealShopifyService implements ShopifyService {
  constructor(
    private readonly accessToken = serverEnv.shopifyAdminAccessToken,
    private readonly shopDomain = serverEnv.shopifyShopDomain
  ) {}

  private get apiVersion() {
    return serverEnv.shopifyApiVersion === "latest-stable"
      ? "2026-04"
      : serverEnv.shopifyApiVersion || "2026-04";
  }

  private get baseUrl() {
    if (!this.shopDomain) {
      throw new Error("Shopify shop domain is required.");
    }

    return `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.accessToken) {
      throw new Error("Shopify Admin API token is required.");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
        ...init?.headers
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Shopify request failed with ${response.status}.`);
    }

    return response.json() as Promise<T>;
  }

  private async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    return this.request<T>("/graphql.json", {
      method: "POST",
      body: JSON.stringify({ query, variables })
    });
  }

  async getShopInfo(): Promise<ShopifyShopInfo> {
    const data = await this.request<{ shop: { name: string; domain: string } }>("/shop.json");
    return {
      name: data.shop.name,
      domain: data.shop.domain,
      platform: "Shopify",
      connectionStatus: "Connected"
    };
  }

  async verifyConnection(): Promise<ShopifyConnectionResult> {
    try {
      await this.getShopInfo();
      return {
        ok: true,
        status: "Connected",
        message: "Shopify connection verified"
      };
    } catch {
      return {
        ok: false,
        status: "Setup Required",
        message: "Shopify Connection Required"
      };
    }
  }

  async registerWebhooks(): Promise<ShopifyWebhookRegistration[]> {
    const callbackUrl = absoluteUrl("/api/shopify/webhooks/orders-create");
    const mutation = `
      mutation RegisterOrdersCreateWebhook($topic: WebhookSubscriptionTopic!, $subscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $subscription) {
          webhookSubscription {
            id
            callbackUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const data = await this.graphql<{
      data?: {
        webhookSubscriptionCreate: {
          webhookSubscription?: { id: string; callbackUrl: string };
          userErrors: { message: string }[];
        };
      };
    }>(mutation, {
      topic: "ORDERS_CREATE",
      subscription: {
        callbackUrl,
        format: "JSON"
      }
    });
    const result = data.data?.webhookSubscriptionCreate;
    const alreadyRegistered = result?.userErrors.some((error) => /already/i.test(error.message));

    return [
      {
        topic: "orders/create",
        callbackUrl,
        status: result?.webhookSubscription || alreadyRegistered ? "Ready" : "Not Configured"
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
    const mutation = `
      mutation CreateOptInDiscount($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
          }
          userErrors {
            field
            code
            message
          }
        }
      }
    `;
    const data = await this.graphql<{
      data?: {
        discountCodeBasicCreate: {
          codeDiscountNode?: { id: string };
          userErrors: { message: string }[];
        };
      };
    }>(mutation, {
      basicCodeDiscount: {
        title: `NotifyPilot opt-in ${input.code}`,
        code: input.code,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        usageLimit: input.usageLimit,
        appliesOncePerCustomer: input.appliesOncePerCustomer ?? true,
        customerSelection: {
          all: true
        },
        customerGets: {
          value: {
            percentage: input.discountPercent / 100
          },
          items: {
            all: true
          }
        }
      }
    });
    const result = data.data?.discountCodeBasicCreate;
    if (!result?.codeDiscountNode) {
      throw new Error(result?.userErrors[0]?.message ?? "Shopify discount creation failed.");
    }

    return {
      ...input,
      shopifyDiscountId: result.codeDiscountNode.id
    };
  }

  async verifyWebhookHmac(rawBody: string, hmacHeader: string): Promise<boolean> {
    const secret = serverEnv.shopifyWebhookSecret || serverEnv.shopifyClientSecret;
    if (!secret || !hmacHeader) return false;

    const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
    const left = Buffer.from(hmacHeader, "base64");
    const right = Buffer.from(digest, "base64");
    return left.length === right.length && timingSafeEqual(left, right);
  }
}
