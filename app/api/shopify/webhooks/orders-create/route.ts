import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getStore, newId } from "@/lib/data/store";
import { canUseProductionData, getSupabaseAdminOrThrow, getTenant, insertEvent } from "@/lib/data/supabase-repository";
import { recordAuditLog } from "@/services/audit/audit.service";
import { markDiscountUsed } from "@/services/discounts/discounts.service";
import { RealShopifyService } from "@/services/shopify/real-shopify.service";

interface ShopifyOrderWebhook {
  id?: number | string;
  admin_graphql_api_id?: string;
  discount_codes?: { code?: string }[];
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const service = new RealShopifyService();
  const verified = await service.verifyWebhookHmac(rawBody, hmac);
  if (!verified) {
    return NextResponse.json({ error: "Webhook could not be verified." }, { status: 401 });
  }

  const order = JSON.parse(rawBody) as ShopifyOrderWebhook;
  const orderId = String(order.admin_graphql_api_id ?? order.id ?? "");
  const codes = (order.discount_codes ?? [])
    .map((discount) => discount.code)
    .filter((code): code is string => Boolean(code));

  const matched = [];
  for (const code of codes) {
    const discount = await markDiscountUsed(code, orderId);
    if (discount) matched.push(discount.code);
  }

  const tenant = await getTenant();
  const event = {
    id: canUseProductionData() ? randomUUID() : newId("evt"),
    tenantId: tenant.id,
    eventType: "Shopify webhook received",
    message: matched.length > 0 ? "Order discount usage recorded" : "Order webhook processed",
    createdAt: new Date().toISOString()
  };
  if (canUseProductionData()) await insertEvent(getSupabaseAdminOrThrow(), event);
  else getStore().pushEvents.unshift(event);

  recordAuditLog({
    action: "Shopify webhook received",
    actorEmail: "system@notifypilot",
    entityType: "shopify_order",
    entityId: orderId,
    metadata: { matchedDiscountCodes: matched }
  });

  return NextResponse.json({ ok: true, matchedDiscountCodes: matched.length });
}
