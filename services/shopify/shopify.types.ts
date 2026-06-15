export interface ShopifyShopInfo {
  name: string;
  domain: string;
  platform: "Shopify";
  connectionStatus: string;
}

export interface ShopifyConnectionResult {
  ok: boolean;
  status: string;
  message: string;
}

export interface ShopifyWebhookRegistration {
  topic: string;
  callbackUrl: string;
  status: string;
}

export interface ShopifyInstallInstructions {
  steps: string[];
  scriptUrl: string;
  serviceWorkerUrl: string;
}

export interface ShopifyDiscountCode {
  code: string;
  discountPercent: number;
  startsAt: string;
  endsAt?: string;
  usageLimit: number;
  appliesOncePerCustomer?: boolean;
  shopifyDiscountId?: string;
}

export interface ShopifyService {
  getShopInfo(): Promise<ShopifyShopInfo>;
  verifyConnection(): Promise<ShopifyConnectionResult>;
  registerWebhooks(): Promise<ShopifyWebhookRegistration[]>;
  getThemeInstallInstructions(): Promise<ShopifyInstallInstructions>;
  createDiscountCode(input: ShopifyDiscountCode): Promise<ShopifyDiscountCode>;
  verifyWebhookHmac(rawBody: string, hmacHeader: string): Promise<boolean>;
}
