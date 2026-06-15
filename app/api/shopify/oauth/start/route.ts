import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/config/env";
import {
  buildShopifyInstallUrl,
  generateOauthState,
  isValidShopDomain,
  normalizeShopDomain,
  signOauthState,
  STATE_COOKIE,
  verifyShopifyQueryHmac
} from "@/services/shopify/shopify-oauth.service";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const requestedShop = params.get("shop") ?? serverEnv.shopifyShopDomain;
  if (!requestedShop) {
    return NextResponse.json({ error: "Shopify shop domain is required." }, { status: 400 });
  }

  const shop = normalizeShopDomain(requestedShop);
  if (!isValidShopDomain(shop)) {
    return NextResponse.json({ error: "Invalid Shopify shop domain." }, { status: 400 });
  }

  if (params.get("hmac") && !verifyShopifyQueryHmac(params)) {
    return NextResponse.json({ error: "Shopify request could not be verified." }, { status: 401 });
  }

  const state = generateOauthState();
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, signOauthState(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/shopify/oauth",
    maxAge: 10 * 60
  });

  return NextResponse.redirect(buildShopifyInstallUrl(shop, state));
}
