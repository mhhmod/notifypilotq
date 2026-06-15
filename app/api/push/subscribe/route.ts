import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerSubscriber } from "@/services/subscribers/subscribers.service";
import { issueOptInDiscount, getDiscountUrl } from "@/services/discounts/discounts.service";
import { getTenant } from "@/lib/data/supabase-repository";
import { serverEnv } from "@/lib/config/env";

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
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });

  const tenant = await getTenant();
  const expectedStoreUrl = (serverEnv.shopifyPublicStoreUrl || tenant.storeUrl).replace(/\/$/, "");
  const submittedStoreUrl = parsed.data.storeUrl?.replace(/\/$/, "");
  if (submittedStoreUrl && submittedStoreUrl !== expectedStoreUrl) {
    return NextResponse.json({ error: "Store context not recognized." }, { status: 400 });
  }

  const subscriber = await registerSubscriber(parsed.data);
  const discount = await issueOptInDiscount(subscriber.id);
  const discountUrl = discount ? await getDiscountUrl(discount.code) : undefined;
  return NextResponse.json({
    ok: true,
    subscriberId: subscriber.id,
    discountCode: discount?.code,
    discountPercent: discount?.discountPercent,
    expiresAt: discount?.expiresAt,
    discountUrl
  });
}
