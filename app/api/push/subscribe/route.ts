import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerSubscriber } from "@/services/subscribers/subscribers.service";
import { issueOptInDiscount, getDiscountUrl } from "@/services/discounts/discounts.service";
import { getTenant } from "@/lib/data/supabase-repository";
import { serverEnv } from "@/lib/config/env";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIpHash, getDiscountClaimFingerprint, getEmailClaimFingerprint } from "@/lib/security/request-fingerprint";

function allowedOrigins() {
  const origins = new Set<string>();
  if (serverEnv.shopifyPublicStoreUrl) origins.add(serverEnv.shopifyPublicStoreUrl.replace(/\/$/, ""));
  if (serverEnv.shopifyShopDomain) {
    origins.add(`https://${serverEnv.shopifyShopDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "")}`);
  }
  return origins;
}

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = allowedOrigins();
  const allowOrigin = allowed.has(origin)
    ? origin
    : (serverEnv.shopifyPublicStoreUrl ?? "").replace(/\/$/, "");
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

const schema = z.object({
  tenantSlug: z.string().optional(),
  storeUrl: z.string().optional(),
  displayName: z.string().max(120).optional(),
  customerEmail: z.string().max(160).optional(),
  browser: z.string().optional(),
  device: z.string().optional(),
  country: z.string().optional(),
  subscription: z.object({
    endpoint: z.string().url(),
    expirationTime: z.number().nullable().optional(),
    keys: z
      .object({
        p256dh: z.string().optional(),
        auth: z.string().optional()
      })
      .optional()
  })
});

function headerCountry(request: NextRequest) {
  return (
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("x-country-code") ||
    ""
  ).trim();
}

export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400, headers: cors });
  }

  const tenant = await getTenant();
  const expectedStoreUrl = (serverEnv.shopifyPublicStoreUrl || tenant.storeUrl).replace(/\/$/, "");
  const submittedStoreUrl = parsed.data.storeUrl?.replace(/\/$/, "");
  if (submittedStoreUrl && submittedStoreUrl !== expectedStoreUrl) {
    return NextResponse.json({ error: "Store context not recognized." }, { status: 400, headers: cors });
  }

  const ipHash = getClientIpHash(request);
  // Logged-in customers carry an email (explicit customerEmail field, with a
  // legacy fallback to an "@"-shaped displayName). Dedupe the opt-in discount on
  // that email so deleting/reinstalling the PWA — on any device or network —
  // can't mint a second code for the same person. The email key is stable across
  // reinstalls; anonymous shoppers fall back to the device+network fingerprint,
  // which still blocks the common same-device reinstall.
  const emailCandidate = parsed.data.customerEmail?.trim() || parsed.data.displayName?.trim() || "";
  const submittedEmail = emailCandidate.includes("@") ? emailCandidate.toLowerCase() : "";
  const claimFingerprint = submittedEmail
    ? getEmailClaimFingerprint(expectedStoreUrl, submittedEmail)
    : getDiscountClaimFingerprint(request, expectedStoreUrl);
  const ipLimit = checkRateLimit(`push-subscribe-ip:${ipHash}`, 12, 60 * 60 * 1000);
  const claimLimit = checkRateLimit(`push-subscribe-claim:${claimFingerprint}`, 4, 60 * 60 * 1000);
  const dailyIpLimit = checkRateLimit(`push-subscribe-ip-day:${ipHash}`, 6, 24 * 60 * 60 * 1000);
  if (!ipLimit.allowed || !claimLimit.allowed || !dailyIpLimit.allowed) {
    return NextResponse.json(
      { error: "Discount claim limit reached. Please try again later." },
      { status: 429, headers: cors }
    );
  }

  const subscriber = await registerSubscriber({
    ...parsed.data,
    country: parsed.data.country?.trim() || headerCountry(request) || undefined
  });
  const result = await issueOptInDiscount(subscriber.id, { claimFingerprint, claimIpHash: ipHash });
  const discountUrl = result.discount ? await getDiscountUrl(result.discount.code) : undefined;
  return NextResponse.json(
    {
      ok: true,
      subscriberId: subscriber.id,
      discountCode: result.discount?.code,
      discountPercent: result.discount?.discountPercent,
      expiresAt: result.discount?.expiresAt,
      discountUrl,
      discountAlreadyClaimed: result.reason === "already_claimed",
      discountUnavailableReason: result.reason
    },
    { headers: cors }
  );
}
