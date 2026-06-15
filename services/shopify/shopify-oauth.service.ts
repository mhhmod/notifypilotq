import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { serverEnv } from "@/lib/config/env";

const STATE_COOKIE = "notifypilot_shopify_oauth_state";

export { STATE_COOKIE };

export function normalizeShopDomain(shop: string) {
  return shop.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function isValidShopDomain(shop: string) {
  const normalized = normalizeShopDomain(shop);
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized);
}

export function generateOauthState() {
  return randomBytes(24).toString("base64url");
}

export function signOauthState(state: string) {
  const signature = createHmac("sha256", serverEnv.authSessionSecret)
    .update(state)
    .digest("base64url");
  return `${state}.${signature}`;
}

export function verifySignedOauthState(value: string | undefined, expectedState: string | null) {
  if (!value || !expectedState) return false;
  const [state, signature] = value.split(".");
  if (!state || !signature || state !== expectedState) return false;

  const expected = signOauthState(state).split(".")[1];
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyShopifyQueryHmac(params: URLSearchParams) {
  if (!serverEnv.shopifyClientSecret) return false;
  const hmac = params.get("hmac");
  if (!hmac) return false;

  const message = Array.from(params.entries())
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const digest = createHmac("sha256", serverEnv.shopifyClientSecret).update(message).digest("hex");
  const left = Buffer.from(hmac, "utf8");
  const right = Buffer.from(digest, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function buildShopifyInstallUrl(shop: string, state: string) {
  if (!serverEnv.shopifyClientId) {
    throw new Error("Shopify client ID is required.");
  }

  const normalizedShop = normalizeShopDomain(shop);
  const params = new URLSearchParams({
    client_id: serverEnv.shopifyClientId,
    scope: serverEnv.shopifyAppScopes,
    redirect_uri: serverEnv.shopifyRedirectUri,
    state
  });
  return `https://${normalizedShop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeShopifyCodeForToken(shop: string, code: string) {
  if (!serverEnv.shopifyClientId || !serverEnv.shopifyClientSecret) {
    throw new Error("Shopify OAuth credentials are required.");
  }

  const response = await fetch(`https://${normalizeShopDomain(shop)}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: serverEnv.shopifyClientId,
      client_secret: serverEnv.shopifyClientSecret,
      code
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Shopify OAuth exchange failed with ${response.status}.`);
  }

  return response.json() as Promise<{
    access_token: string;
    scope: string;
  }>;
}
