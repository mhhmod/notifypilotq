import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStore, newId } from "@/lib/data/store";
import type { ShopifyInstallation } from "@/types/domain";

function normalizeShopDomain(shopDomain: string) {
  return shopDomain.trim().toLowerCase();
}

function fromRow(row: {
  id: string;
  tenant_id: string;
  shop_domain: string;
  access_token: string;
  scopes: string;
  installed_at: string;
  updated_at: string;
}): ShopifyInstallation {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    shopDomain: row.shop_domain,
    accessToken: row.access_token,
    scopes: row.scopes,
    installedAt: row.installed_at,
    updatedAt: row.updated_at
  };
}

export async function getShopifyInstallation(shopDomain?: string) {
  const store = getStore();
  const normalized = shopDomain ? normalizeShopDomain(shopDomain) : undefined;
  const memoryMatch = normalized
    ? store.shopifyInstallations.find((installation) => installation.shopDomain === normalized)
    : store.shopifyInstallations[0];
  if (memoryMatch) return memoryMatch;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  let query = supabase.from("shopify_installations").select("*").eq("tenant_id", store.tenant.id);
  if (normalized) query = query.eq("shop_domain", normalized);
  const { data, error } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data) return null;

  const installation = fromRow(data);
  store.shopifyInstallations.unshift(installation);
  return installation;
}

export async function saveShopifyInstallation(input: {
  shopDomain: string;
  accessToken: string;
  scopes: string;
}) {
  const store = getStore();
  const now = new Date().toISOString();
  const shopDomain = normalizeShopDomain(input.shopDomain);
  const existing = store.shopifyInstallations.find((installation) => installation.shopDomain === shopDomain);
  const installation: ShopifyInstallation = {
    id: existing?.id ?? newId("shopify_install"),
    tenantId: store.tenant.id,
    shopDomain,
    accessToken: input.accessToken,
    scopes: input.scopes,
    installedAt: existing?.installedAt ?? now,
    updatedAt: now
  };

  if (existing) {
    Object.assign(existing, installation);
  } else {
    store.shopifyInstallations.unshift(installation);
  }

  const supabase = createSupabaseAdminClient();
  if (supabase) {
    await supabase.from("shopify_installations").upsert(
      {
        id: installation.id,
        tenant_id: installation.tenantId,
        shop_domain: installation.shopDomain,
        access_token: installation.accessToken,
        scopes: installation.scopes,
        installed_at: installation.installedAt,
        updated_at: installation.updatedAt
      },
      { onConflict: "tenant_id,shop_domain" }
    );
  }

  return installation;
}
