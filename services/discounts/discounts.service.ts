import { createHash, randomUUID } from "crypto";
import { serverEnv } from "@/lib/config/env";
import { getStore, newId } from "@/lib/data/store";
import {
  canUseProductionData,
  discountToRow,
  getSettingsFromData,
  getSupabaseAdminOrThrow,
  getTenant,
  insertActivity,
  listDiscountCodesFromData
} from "@/lib/data/supabase-repository";
import { recordAuditLog } from "@/services/audit/audit.service";
import { getShopifyInstallation } from "@/services/shopify/shopify-installation.service";
import { RealShopifyService } from "@/services/shopify/real-shopify.service";
import type { DiscountCodeRecord, DiscountCodeStatus } from "@/types/domain";

type DiscountIssueReason = "issued" | "existing_active" | "already_claimed" | "disabled";

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
  claim_fingerprint?: string | null;
  claim_ip_hash?: string | null;
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
    claimFingerprint: row.claim_fingerprint ?? undefined,
    claimIpHash: row.claim_ip_hash ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function isDuplicateClaimError(error: { code?: string; message?: string; details?: string }) {
  const text = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return error.code === "23505" && (
    text.includes("claim_fingerprint") ||
    text.includes("claim_ip_hash") ||
    text.includes("one_claim_fingerprint")
  );
}

function blocksFutureClaim(discount: DiscountCodeRecord) {
  return discount.status !== "cancelled";
}

export function getDiscountForSubscriber(subscriberId: string) {
  return getStore().discountCodes.find(
    (discount) => discount.subscriberId === subscriberId && discount.status === "issued"
  );
}

export async function getDiscountUrl(code: string) {
  const settings = await getSettingsFromData();
  const baseUrl = serverEnv.shopifyPublicStoreUrl || settings.brand.storeUrl;
  const redirectTarget = encodeURIComponent(settings.optInDiscount.applyDiscountRedirectUrl || baseUrl);
  return `${baseUrl.replace(/\/$/, "")}/discount/${encodeURIComponent(code)}?redirect=${redirectTarget}`;
}

export async function issueOptInDiscount(
  subscriberId: string,
  claim?: { claimFingerprint?: string; claimIpHash?: string }
): Promise<{ discount: DiscountCodeRecord | null; reason: DiscountIssueReason }> {
  const discounts = canUseProductionData() ? await listDiscountCodesFromData() : getStore().discountCodes;
  const existing = discounts.find(
    (discount) => discount.subscriberId === subscriberId && discount.status === "issued"
  );
  if (existing) return { discount: existing, reason: "existing_active" };

  const existingClaim = claim?.claimFingerprint
    ? discounts.find((discount) => discount.claimFingerprint === claim.claimFingerprint && blocksFutureClaim(discount))
    : undefined;
  if (existingClaim) {
    return {
      discount: existingClaim.subscriberId === subscriberId && existingClaim.status === "issued" ? existingClaim : null,
      reason: "already_claimed"
    };
  }

  const existingIpClaim = claim?.claimIpHash
    ? discounts.find((discount) => discount.claimIpHash === claim.claimIpHash && blocksFutureClaim(discount))
    : undefined;
  if (existingIpClaim) {
    return {
      discount: existingIpClaim.subscriberId === subscriberId && existingIpClaim.status === "issued" ? existingIpClaim : null,
      reason: "already_claimed"
    };
  }

  const tenant = await getTenant();
  const settings = (await getSettingsFromData()).optInDiscount;
  if (!settings.enabled) return { discount: null, reason: "disabled" };

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
    tenantId: tenant.id,
    subscriberId,
    shopifyDiscountId,
    code,
    discountPercent: settings.discountPercent,
    status: "issued",
    usageLimit: 1,
    expiresAt,
    claimFingerprint: claim?.claimFingerprint,
    claimIpHash: claim?.claimIpHash,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const { error } = await supabase.from("np_discount_codes").upsert(discountToRow(discount), { onConflict: "tenant_id,code" });
    if (error) {
      if (claim?.claimFingerprint && isDuplicateClaimError(error)) {
        const { data: existingClaimRow, error: loadError } = await supabase
          .from("np_discount_codes")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("claim_fingerprint", claim.claimFingerprint)
          .maybeSingle();

        if (loadError) throw new Error(`Load existing discount claim failed: ${loadError.message}`);
        if (existingClaimRow) {
          const existingClaim = fromRow(existingClaimRow);
          return {
            discount: existingClaim.status === "issued" ? existingClaim : null,
            reason: "already_claimed"
          };
        }
      }

      if (claim?.claimIpHash && isDuplicateClaimError(error)) {
        const { data: existingIpClaimRow, error: loadError } = await supabase
          .from("np_discount_codes")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("claim_ip_hash", claim.claimIpHash)
          .neq("status", "cancelled")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (loadError) throw new Error(`Load existing discount claim failed: ${loadError.message}`);
        if (existingIpClaimRow) {
          const existingClaim = fromRow(existingIpClaimRow);
          return {
            discount: existingClaim.subscriberId === subscriberId && existingClaim.status === "issued" ? existingClaim : null,
            reason: "already_claimed"
          };
        }
      }

      throw new Error(`Save discount failed: ${error.message}`);
    }
    await insertActivity(supabase, {
      id: randomUUID(),
      tenantId: tenant.id,
      subscriberId,
      activityType: "Discount issued",
      message: `${settings.discountPercent}% opt-in code issued`,
      metadata: { code },
      createdAt: now.toISOString()
    });
  } else {
    const store = getStore();
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
  }

  recordAuditLog({
    action: "discount issued",
    actorEmail: "system@notifypilot",
    entityType: "discount",
    entityId: discount.id,
    metadata: { subscriberId, code }
  });

  return { discount, reason: "issued" };
}

export async function markDiscountUsed(code: string, usedOrderId: string) {
  const store = getStore();
  const normalizedCode = code.trim().toUpperCase();
  const supabase = canUseProductionData() ? getSupabaseAdminOrThrow() : null;
  if (supabase) {
    const tenant = await getTenant();
    const { data } = await supabase
      .from("np_discount_codes")
      .select("*")
      .eq("tenant_id", tenant.id)
      .ilike("code", normalizedCode)
      .maybeSingle();
    if (!data) return null;
    const target = fromRow(data);
    const now = new Date().toISOString();
    target.status = "used";
    target.usedAt = now;
    target.usedOrderId = usedOrderId;
    target.updatedAt = now;

    const { error } = await supabase
      .from("np_discount_codes")
      .update({
        status: "used",
        used_at: now,
        used_order_id: usedOrderId,
        updated_at: now
      })
      .eq("tenant_id", tenant.id)
      .eq("code", target.code);
    if (error) throw new Error(`Mark discount used failed: ${error.message}`);
    await insertActivity(supabase, {
      id: randomUUID(),
      tenantId: tenant.id,
      subscriberId: target.subscriberId,
      activityType: "Discount used",
      message: "Opt-in discount used at checkout",
      metadata: { code: target.code, usedOrderId },
      createdAt: now
    });
    return target;
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
  return target;
}
