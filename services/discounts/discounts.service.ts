import { createHash, randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/config/env";
import { getStore, newId } from "@/lib/data/store";
import { recordAuditLog } from "@/services/audit/audit.service";
import { getShopifyInstallation } from "@/services/shopify/shopify-installation.service";
import { RealShopifyService } from "@/services/shopify/real-shopify.service";
import type { DiscountCodeRecord, DiscountCodeStatus } from "@/types/domain";

function makeCode(prefix: string, subscriberId: string) {
  const digest = createHash("sha256").update(`${subscriberId}:${Date.now()}`).digest("hex").slice(0, 8).toUpperCase();
  return `${prefix}-${digest}`;
}

function fromRow(row: {
  id: string;
  tenant_id: string;
  subscriber_id: string;
  shopify_discount_id: string;
  code: string;
  discount_percent: number;
  status: DiscountCodeStatus;
  usage_limit: number;
  expires_at: string;
  used_at?: string | null;
  used_order_id?: string | null;
  created_at: string;
  updated_at: string;
}): DiscountCodeRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    subscriberId: row.subscriber_id,
    shopifyDiscountId: row.shopify_discount_id,
    code: row.code,
    discountPercent: row.discount_percent,
    status: row.status,
    usageLimit: row.usage_limit,
    expiresAt: row.expires_at,
    usedAt: row.used_at ?? undefined,
    usedOrderId: row.used_order_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toRow(discount: DiscountCodeRecord) {
  return {
    id: discount.id,
    tenant_id: discount.tenantId,
    subscriber_id: discount.subscriberId,
    shopify_discount_id: discount.shopifyDiscountId,
    code: discount.code,
    discount_percent: discount.discountPercent,
    status: discount.status,
    usage_limit: discount.usageLimit,
    expires_at: discount.expiresAt,
    used_at: discount.usedAt ?? null,
    used_order_id: discount.usedOrderId ?? null,
    created_at: discount.createdAt,
    updated_at: discount.updatedAt
  };
}

export function getDiscountForSubscriber(subscriberId: string) {
  return getStore().discountCodes.find(
    (discount) => discount.subscriberId === subscriberId && discount.status === "issued"
  );
}

export function getDiscountUrl(code: string) {
  const settings = getStore().appSettings;
  const baseUrl = serverEnv.shopifyPublicStoreUrl || settings.brand.storeUrl;
  const redirectTarget = encodeURIComponent(settings.optInDiscount.applyDiscountRedirectUrl || baseUrl);
  return `${baseUrl.replace(/\/$/, "")}/discount/${encodeURIComponent(code)}?redirect=${redirectTarget}`;
}

export async function issueOptInDiscount(subscriberId: string) {
  const store = getStore();
  const existing = getDiscountForSubscriber(subscriberId);
  if (existing) return existing;

  const settings = store.appSettings.optInDiscount;
  if (!settings.enabled) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + settings.expiryHours * 60 * 60 * 1000).toISOString();
  const code = makeCode(settings.codePrefix, subscriberId);
  let shopifyDiscountId = `local_${code}`;

  const installation = await getShopifyInstallation();
  const canCreateInShopify = Boolean(installation?.accessToken || serverEnv.shopifyAdminAccessToken);
  if (canCreateInShopify) {
    const service = new RealShopifyService(installation?.accessToken, installation?.shopDomain);
    const created = await service.createDiscountCode({
      code,
      discountPercent: settings.discountPercent,
      startsAt: now.toISOString(),
      endsAt: expiresAt,
      usageLimit: 1,
      appliesOncePerCustomer: true
    });
    shopifyDiscountId = created.shopifyDiscountId ?? shopifyDiscountId;
  } else if (serverEnv.integrationMode === "connected_mode") {
    throw new Error("Shopify Connection Required");
  }

  const discount: DiscountCodeRecord = {
    id: randomUUID(),
    tenantId: store.tenant.id,
    subscriberId,
    shopifyDiscountId,
    code,
    discountPercent: settings.discountPercent,
    status: "issued",
    usageLimit: 1,
    expiresAt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  store.discountCodes.unshift(discount);
  store.subscriberActivity.unshift({
    id: newId("act"),
    tenantId: store.tenant.id,
    subscriberId,
    activityType: "Discount issued",
    message: `${settings.discountPercent}% opt-in code issued`,
    metadata: { code },
    createdAt: now.toISOString()
  });

  const supabase = createSupabaseAdminClient();
  if (supabase) {
    await supabase.from("discount_codes").upsert(toRow(discount), { onConflict: "tenant_id,code" });
    await supabase.from("subscriber_activity").insert({
      id: randomUUID(),
      tenant_id: store.tenant.id,
      subscriber_id: subscriberId,
      activity_type: "Discount issued",
      message: `${settings.discountPercent}% opt-in code issued`,
      metadata: { code },
      created_at: now.toISOString()
    });
  }

  recordAuditLog({
    action: "discount issued",
    actorEmail: "system@notifypilot",
    entityType: "discount",
    entityId: discount.id,
    metadata: { subscriberId, code }
  });

  return discount;
}

export async function markDiscountUsed(code: string, usedOrderId: string) {
  const store = getStore();
  const normalizedCode = code.trim().toUpperCase();
  const discount = store.discountCodes.find((item) => item.code.toUpperCase() === normalizedCode);

  const supabase = createSupabaseAdminClient();
  if (!discount && supabase) {
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("tenant_id", store.tenant.id)
      .ilike("code", normalizedCode)
      .maybeSingle();
    if (data) store.discountCodes.unshift(fromRow(data));
  }

  const target = store.discountCodes.find((item) => item.code.toUpperCase() === normalizedCode);
  if (!target) return null;

  const now = new Date().toISOString();
  target.status = "used";
  target.usedAt = now;
  target.usedOrderId = usedOrderId;
  target.updatedAt = now;

  store.subscriberActivity.unshift({
    id: newId("act"),
    tenantId: store.tenant.id,
    subscriberId: target.subscriberId,
    activityType: "Discount used",
    message: "Opt-in discount used at checkout",
    metadata: { code: target.code, usedOrderId },
    createdAt: now
  });

  if (supabase) {
    await supabase
      .from("discount_codes")
      .update({
        status: "used",
        used_at: now,
        used_order_id: usedOrderId,
        updated_at: now
      })
      .eq("tenant_id", store.tenant.id)
      .eq("code", target.code);
    await supabase.from("subscriber_activity").insert({
      id: randomUUID(),
      tenant_id: store.tenant.id,
      subscriber_id: target.subscriberId,
      activity_type: "Discount used",
      message: "Opt-in discount used at checkout",
      metadata: { code: target.code, usedOrderId },
      created_at: now
    });
  }

  return target;
}
