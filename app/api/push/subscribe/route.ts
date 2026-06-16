import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerSubscriber } from "@/services/subscribers/subscribers.service";
import { issueOptInDiscount, getDiscountUrl } from "@/services/discounts/discounts.service";
import { getTenant } from "@/lib/data/supabase-repository";
import { serverEnv } from "@/lib/config/env";

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

  const subscriber = await registerSubscriber(parsed.data);
  const discount = await issueOptInDiscount(subscriber.id);
  const discountUrl = discount ? await getDiscountUrl(discount.code) : undefined;
  return NextResponse.json(
    {
      ok: true,
      subscriberId: subscriber.id,
      discountCode: discount?.code,
      discountPercent: discount?.discountPercent,
      expiresAt: discount?.expiresAt,
      discountUrl
    },
    { headers: cors }
  );
}
