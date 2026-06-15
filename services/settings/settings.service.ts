import { getStore } from "@/lib/data/store";
import type { AppSettings } from "@/types/domain";
import { recordAuditLog } from "@/services/audit/audit.service";

export function getSettings() {
  return getStore().appSettings;
}

export function updateSettings(input: Partial<AppSettings>, actorEmail: string) {
  const store = getStore();
  store.appSettings = {
    ...store.appSettings,
    ...input,
    brand: {
      ...store.appSettings.brand,
      ...input.brand
    },
    push: {
      ...store.appSettings.push,
      ...input.push
    },
    storeIntegration: {
      ...store.appSettings.storeIntegration,
      ...input.storeIntegration
    },
    n8n: {
      ...store.appSettings.n8n,
      ...input.n8n
    },
    safety: {
      ...store.appSettings.safety,
      ...input.safety
    },
    optInDiscount: {
      ...store.appSettings.optInDiscount,
      ...input.optInDiscount
    }
  };

  store.integrationStatus.liveSending = store.appSettings.safety.liveSendingEnabled ? "Enabled" : "Disabled";

  recordAuditLog({
    action: "settings update",
    actorEmail,
    entityType: "settings"
  });

  return store.appSettings;
}
