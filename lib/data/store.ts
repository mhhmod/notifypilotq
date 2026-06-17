import {
  adminUsers,
  appSettings,
  auditLogs,
  campaignRecipients,
  campaigns,
  discountCodes,
  integrationStatus,
  pushClicks,
  pushEvents,
  subscriberActivity,
  subscriberGroupMemberships,
  subscriberGroups,
  subscribers,
  tenant
} from "@/lib/data/seed";
import type {
  AdminUser,
  AppSettings,
  AuditLog,
  CampaignRecipient,
  IntegrationStatus,
  PushCampaign,
  PushClick,
  PushEvent,
  SubscriberGroup,
  SubscriberGroupMembership,
  PushSubscriber,
  DiscountCodeRecord,
  SubscriberActivity,
  ShopifyInstallation,
  Tenant
} from "@/types/domain";

interface StoreState {
  tenant: Tenant;
  adminUsers: AdminUser[];
  subscribers: PushSubscriber[];
  campaigns: PushCampaign[];
  campaignRecipients: CampaignRecipient[];
  pushEvents: PushEvent[];
  pushClicks: PushClick[];
  discountCodes: DiscountCodeRecord[];
  subscriberActivity: SubscriberActivity[];
  subscriberGroups: SubscriberGroup[];
  subscriberGroupMemberships: SubscriberGroupMembership[];
  shopifyInstallations: ShopifyInstallation[];
  appSettings: AppSettings;
  integrationStatus: IntegrationStatus;
  auditLogs: AuditLog[];
}

const globalForStore = globalThis as typeof globalThis & {
  __notifypilotStore?: StoreState;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function getStore() {
  if (!globalForStore.__notifypilotStore) {
    globalForStore.__notifypilotStore = {
      tenant: clone(tenant),
      adminUsers: clone(adminUsers),
      subscribers: clone(subscribers),
      campaigns: clone(campaigns),
      campaignRecipients: clone(campaignRecipients),
      pushEvents: clone(pushEvents),
      pushClicks: clone(pushClicks),
      discountCodes: clone(discountCodes),
      subscriberActivity: clone(subscriberActivity),
      subscriberGroups: clone(subscriberGroups),
      subscriberGroupMemberships: clone(subscriberGroupMemberships),
      shopifyInstallations: [],
      appSettings: clone(appSettings),
      integrationStatus: clone(integrationStatus),
      auditLogs: clone(auditLogs)
    };
  }

  return globalForStore.__notifypilotStore;
}

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
