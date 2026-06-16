import { getStore } from "@/lib/data/store";
import {
  canUseProductionData,
  getSettingsFromData,
  getSupabaseAdminOrThrow,
  settingsToRow
} from "@/lib/data/supabase-repository";
import type { AppSettings } from "@/types/domain";
import { recordAuditLog } from "@/services/audit/audit.service";

const fallbackStoreName = "SN2 Studios";
const fallbackStoreUrl = "https://sn2studios.co";

function productionStoreName(value: string | undefined) {
  const name = value?.trim() ?? "";
  return name || fallbackStoreName;
}

function productionStoreUrl(value: string | undefined) {
  const url = value?.trim() ?? "";
  return url || fallbackStoreUrl;
}

function normalizeSettings(settings: AppSettings): AppSettings {
  const storeName = productionStoreName(settings.brand.storeName);
  const storeUrl = productionStoreUrl(settings.brand.storeUrl);
  const defaultClickUrl = settings.brand.defaultClickUrl?.trim() || storeUrl;

  return {
    ...settings,
    brand: {
      ...settings.brand,
      storeName,
      storeUrl,
      defaultClickUrl
    },
    storeIntegration: {
      ...settings.storeIntegration,
      storeName: productionStoreName(settings.storeIntegration.storeName),
      storeUrl: productionStoreUrl(settings.storeIntegration.storeUrl)
    },
    optInDiscount: {
      ...settings.optInDiscount,
      applyDiscountRedirectUrl: settings.optInDiscount.applyDiscountRedirectUrl?.trim() || defaultClickUrl
    }
  };
}

export async function getSettings() {
  return normalizeSettings(await getSettingsFromData());
}

export async function updateSettings(input: Partial<AppSettings>, actorEmail: string) {
  const current = await getSettings();
  const settings: AppSettings = {
    ...current,
    ...input,
    brand: {
      ...current.brand,
      ...input.brand
    },
    push: {
      ...current.push,
      ...input.push
    },
    storeIntegration: {
      ...current.storeIntegration,
      ...input.storeIntegration
    },
    n8n: {
      ...current.n8n,
      ...input.n8n
    },
    safety: {
      ...current.safety,
      ...input.safety
    },
    optInDiscount: {
      ...current.optInDiscount,
      ...input.optInDiscount
    }
  };

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const { error } = await supabase.from("np_app_settings").upsert(settingsToRow(settings), { onConflict: "tenant_id" });
    if (error) throw new Error(`Settings update failed: ${error.message}`);
    await supabase
      .from("np_integration_status")
      .update({
        live_sending_status: settings.safety.liveSendingEnabled ? "Enabled" : "Disabled",
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", settings.tenantId);
  } else {
    const store = getStore();
    store.appSettings = settings;
    store.integrationStatus.liveSending = settings.safety.liveSendingEnabled ? "Enabled" : "Disabled";
  }

  recordAuditLog({
    action: "settings update",
    actorEmail,
    entityType: "settings"
  });

  return settings;
}
