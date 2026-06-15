import { serverEnv } from "@/lib/config/env";
import type {
  AdminUser,
  AppSettings,
  AuditLog,
  CampaignRecipient,
  DiscountCodeRecord,
  IntegrationStatus,
  PushCampaign,
  PushClick,
  PushEvent,
  PushSubscriber,
  SubscriberActivity,
  Tenant
} from "@/types/domain";

export const tenant: Tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  tenantSlug: "store",
  brandName: "GrindCTRL",
  storeUrl: "https://grindctrl.cloud",
  dashboardDomain: "notify.grindctrl.cloud",
  storeCategory: "Premium fashion and lifestyle e-commerce",
  internalIntegrationMode: serverEnv.integrationMode
};

export const adminUsers: AdminUser[] = [
  {
    id: "admin_store_owner",
    tenantId: tenant.id,
    email: "owner@notify.grindctrl.cloud",
    role: "admin",
    displayName: "Store Admin"
  }
];

function subscriberUuid(seedId: string) {
  const sequence = Number(seedId.replace("sub_", "")) - 1000;
  return `30000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

export const subscribers: PushSubscriber[] = [
  ["sub_1001", "Visitor WEB-1001", "Chrome", "Android", "Egypt", "Active", "2026-06-02T09:20:00.000Z", "2026-06-13T08:10:00.000Z", true],
  ["sub_1002", "Visitor WEB-1002", "Safari", "iPhone", "United Arab Emirates", "Active", "2026-06-03T12:45:00.000Z", "2026-06-12T20:18:00.000Z", true],
  ["sub_1003", "Visitor WEB-1003", "Edge", "Windows", "Egypt", "Active", "2026-06-04T15:12:00.000Z", "2026-06-13T11:24:00.000Z", true],
  ["sub_1004", "Visitor WEB-1004", "Chrome", "macOS", "Saudi Arabia", "Active", "2026-05-28T18:30:00.000Z", "2026-06-11T16:42:00.000Z", false],
  ["sub_1005", "Visitor WEB-1005", "Firefox", "Desktop", "Egypt", "Active", "2026-05-30T10:01:00.000Z", "2026-06-13T07:58:00.000Z", false],
  ["sub_1006", "Visitor WEB-1006", "Chrome", "Android", "Kuwait", "Active", "2026-06-05T14:50:00.000Z", "2026-06-12T13:07:00.000Z", false],
  ["sub_1007", "Visitor WEB-1007", "Safari", "iPhone", "Qatar", "Inactive", "2026-05-19T17:12:00.000Z", "2026-06-04T09:40:00.000Z", false],
  ["sub_1008", "Visitor WEB-1008", "Chrome", "Android", "Egypt", "Active", "2026-06-07T11:38:00.000Z", "2026-06-13T09:33:00.000Z", false],
  ["sub_1009", "Visitor WEB-1009", "Safari", "macOS", "United Arab Emirates", "Active", "2026-06-01T19:15:00.000Z", "2026-06-10T18:05:00.000Z", false],
  ["sub_1010", "Visitor WEB-1010", "Edge", "Windows", "Saudi Arabia", "Active", "2026-05-31T08:42:00.000Z", "2026-06-13T06:55:00.000Z", false],
  ["sub_1011", "Visitor WEB-1011", "Chrome", "Android", "Jordan", "Active", "2026-06-08T12:20:00.000Z", "2026-06-13T10:12:00.000Z", false],
  ["sub_1012", "Visitor WEB-1012", "Firefox", "Desktop", "Egypt", "Inactive", "2026-05-21T11:00:00.000Z", "2026-06-02T14:22:00.000Z", false],
  ["sub_1013", "Visitor WEB-1013", "Chrome", "Windows", "Egypt", "Active", "2026-06-09T09:24:00.000Z", "2026-06-13T08:44:00.000Z", false],
  ["sub_1014", "Visitor WEB-1014", "Safari", "iPhone", "Saudi Arabia", "Active", "2026-06-09T17:09:00.000Z", "2026-06-12T21:31:00.000Z", false],
  ["sub_1015", "Visitor WEB-1015", "Chrome", "Android", "United Arab Emirates", "Active", "2026-06-10T07:50:00.000Z", "2026-06-13T09:01:00.000Z", false],
  ["sub_1016", "Visitor WEB-1016", "Edge", "Windows", "Egypt", "Active", "2026-06-10T10:35:00.000Z", "2026-06-13T11:11:00.000Z", false],
  ["sub_1017", "Visitor WEB-1017", "Chrome", "macOS", "Kuwait", "Active", "2026-06-10T13:05:00.000Z", "2026-06-12T15:46:00.000Z", false],
  ["sub_1018", "Visitor WEB-1018", "Safari", "iPad", "Qatar", "Active", "2026-06-11T18:28:00.000Z", "2026-06-13T07:37:00.000Z", false],
  ["sub_1019", "Visitor WEB-1019", "Chrome", "Android", "Egypt", "Active", "2026-06-11T20:17:00.000Z", "2026-06-13T06:49:00.000Z", false],
  ["sub_1020", "Visitor WEB-1020", "Firefox", "Desktop", "Saudi Arabia", "Inactive", "2026-05-24T16:42:00.000Z", "2026-06-01T12:02:00.000Z", false],
  ["sub_1021", "Visitor WEB-1021", "Chrome", "Android", "Egypt", "Active", "2026-06-12T07:18:00.000Z", "2026-06-13T10:39:00.000Z", false],
  ["sub_1022", "Visitor WEB-1022", "Safari", "iPhone", "United Arab Emirates", "Active", "2026-06-12T15:33:00.000Z", "2026-06-13T09:29:00.000Z", false],
  ["sub_1023", "Visitor WEB-1023", "Edge", "Windows", "Egypt", "Active", "2026-06-12T19:22:00.000Z", "2026-06-13T11:03:00.000Z", false],
  ["sub_1024", "Visitor WEB-1024", "Chrome", "Android", "Jordan", "Active", "2026-06-13T06:40:00.000Z", "2026-06-13T10:03:00.000Z", false],
  ["sub_1025", "Visitor WEB-1025", "Safari", "iPhone", "Egypt", "Active", "2026-06-13T08:14:00.000Z", "2026-06-13T11:19:00.000Z", false]
].map(([id, displayName, browser, device, country, status, subscribedAt, lastSeenAt, isOwnerAllowed]) => ({
  id: subscriberUuid(String(id)),
  tenantId: tenant.id,
  displayName: String(displayName),
  browser: String(browser),
  device: String(device),
  country: String(country),
  status: status as PushSubscriber["status"],
  subscribedAt: String(subscribedAt),
  lastSeenAt: String(lastSeenAt),
  endpointHash: `endpoint_${String(id).slice(-4)}`,
  isOwnerAllowed: Boolean(isOwnerAllowed)
}));

export const campaigns: PushCampaign[] = [
  {
    id: "cmp_winter_drop",
    tenantId: tenant.id,
    name: "Winter Drop Early Access",
    notificationTitle: "Winter Drop is live",
    notificationBody: "Explore the latest pieces before they sell out.",
    clickUrl: "https://grindctrl.cloud/collections/new-arrivals",
    imageUrl: "https://grindctrl.cloud/cdn/shop/files/drop-preview.jpg",
    iconUrl: "https://grindctrl.cloud/cdn/shop/files/store-icon.png",
    audience: "All active subscribers",
    status: "Sent",
    createdAt: "2026-06-12T07:30:00.000Z",
    sentAt: "2026-06-12T08:00:00.000Z",
    totalRecipients: 21,
    sentCount: 20,
    failedCount: 1,
    clickCount: 8,
    clickRate: 40
  },
  {
    id: "cmp_private_weekend",
    tenantId: tenant.id,
    name: "Private Weekend Offer",
    notificationTitle: "Private weekend offer",
    notificationBody: "Enjoy limited savings on selected essentials through Sunday.",
    clickUrl: "https://grindctrl.cloud/collections/weekend-edit",
    audience: "All active subscribers",
    status: "Sent",
    createdAt: "2026-06-07T10:15:00.000Z",
    sentAt: "2026-06-07T11:00:00.000Z",
    totalRecipients: 18,
    sentCount: 18,
    failedCount: 0,
    clickCount: 6,
    clickRate: 33.3
  },
  {
    id: "cmp_back_in_stock",
    tenantId: tenant.id,
    name: "Back in Stock Alert",
    notificationTitle: "Back in stock",
    notificationBody: "The bestselling tailored vest is available again in limited quantities.",
    clickUrl: "https://grindctrl.cloud/products/tailored-vest",
    audience: "All active subscribers",
    status: "Sent",
    createdAt: "2026-06-03T15:20:00.000Z",
    sentAt: "2026-06-03T15:45:00.000Z",
    totalRecipients: 15,
    sentCount: 14,
    failedCount: 1,
    clickCount: 5,
    clickRate: 35.7
  },
  {
    id: "cmp_new_collection",
    tenantId: tenant.id,
    name: "New Collection Launch",
    notificationTitle: "The new collection arrives tonight",
    notificationBody: "Preview sculpted layers, soft tailoring, and everyday statement pieces.",
    clickUrl: "https://grindctrl.cloud/collections/collection-preview",
    audience: "All active subscribers",
    status: "Scheduled",
    createdAt: "2026-06-13T06:00:00.000Z",
    scheduledAt: "2026-06-14T18:00:00.000Z",
    totalRecipients: 22,
    sentCount: 0,
    failedCount: 0,
    clickCount: 0,
    clickRate: 0
  },
  {
    id: "cmp_last_chance",
    tenantId: tenant.id,
    name: "Last Chance Sale",
    notificationTitle: "Last chance to shop the edit",
    notificationBody: "Final sizes are moving quickly. Complete your picks today.",
    clickUrl: "https://grindctrl.cloud/collections/sale",
    audience: "Selected test subscribers",
    status: "Draft",
    createdAt: "2026-06-13T09:45:00.000Z",
    totalRecipients: 3,
    sentCount: 0,
    failedCount: 0,
    clickCount: 0,
    clickRate: 0
  }
];

function makeRecipients(campaign: PushCampaign, subscriberIds: string[]): CampaignRecipient[] {
  return subscriberIds.map((subscriberId, index) => {
    const failed = campaign.failedCount > 0 && index === subscriberIds.length - 1 && campaign.status === "Sent";
    const clicked = campaign.status === "Sent" && index < campaign.clickCount;
    return {
      id: `rec_${campaign.id}_${subscriberId}`,
      campaignId: campaign.id,
      subscriberId,
      status: failed ? "Failed" : campaign.status === "Scheduled" ? "Queued" : campaign.status === "Draft" ? "Pending" : "Sent",
      sentAt: campaign.sentAt && !failed ? campaign.sentAt : undefined,
      clicked,
      error: failed ? "Delivery endpoint inactive" : undefined
    };
  });
}

export const campaignRecipients: CampaignRecipient[] = [
  ...makeRecipients(campaigns[0], subscribers.filter((subscriber) => subscriber.status === "Active").slice(0, 21).map((subscriber) => subscriber.id)),
  ...makeRecipients(campaigns[1], subscribers.filter((subscriber) => subscriber.status === "Active").slice(0, 18).map((subscriber) => subscriber.id)),
  ...makeRecipients(campaigns[2], subscribers.filter((subscriber) => subscriber.status === "Active").slice(0, 15).map((subscriber) => subscriber.id)),
  ...makeRecipients(campaigns[3], subscribers.filter((subscriber) => subscriber.status === "Active").slice(0, 22).map((subscriber) => subscriber.id)),
  ...makeRecipients(campaigns[4], subscribers.filter((subscriber) => subscriber.isOwnerAllowed).map((subscriber) => subscriber.id))
];

export const pushEvents: PushEvent[] = [
  {
    id: "evt_winter_created",
    tenantId: tenant.id,
    campaignId: "cmp_winter_drop",
    eventType: "Created",
    message: "Campaign created",
    createdAt: "2026-06-12T07:30:00.000Z"
  },
  {
    id: "evt_winter_requested",
    tenantId: tenant.id,
    campaignId: "cmp_winter_drop",
    eventType: "Live send requested",
    message: "Live send requested by owner",
    createdAt: "2026-06-12T07:58:00.000Z"
  },
  {
    id: "evt_winter_queued",
    tenantId: tenant.id,
    campaignId: "cmp_winter_drop",
    eventType: "Campaign queued",
    message: "Campaign queued for active subscribers",
    createdAt: "2026-06-12T07:59:00.000Z"
  },
  {
    id: "evt_winter_complete",
    tenantId: tenant.id,
    campaignId: "cmp_winter_drop",
    eventType: "Send completed",
    message: "Delivery completed with one inactive endpoint",
    createdAt: "2026-06-12T08:02:00.000Z"
  },
  {
    id: "evt_weekend_complete",
    tenantId: tenant.id,
    campaignId: "cmp_private_weekend",
    eventType: "Send completed",
    message: "Delivery completed",
    createdAt: "2026-06-07T11:02:00.000Z"
  },
  {
    id: "evt_backstock_complete",
    tenantId: tenant.id,
    campaignId: "cmp_back_in_stock",
    eventType: "Send completed",
    message: "Delivery completed with one inactive endpoint",
    createdAt: "2026-06-03T15:48:00.000Z"
  },
  {
    id: "evt_collection_created",
    tenantId: tenant.id,
    campaignId: "cmp_new_collection",
    eventType: "Created",
    message: "Campaign created",
    createdAt: "2026-06-13T06:00:00.000Z"
  },
  {
    id: "evt_collection_scheduled",
    tenantId: tenant.id,
    campaignId: "cmp_new_collection",
    eventType: "Campaign queued",
    message: "Campaign scheduled for June 14, 2026",
    createdAt: "2026-06-13T06:07:00.000Z"
  },
  {
    id: "evt_last_saved",
    tenantId: tenant.id,
    campaignId: "cmp_last_chance",
    eventType: "Saved draft",
    message: "Draft saved",
    createdAt: "2026-06-13T09:45:00.000Z"
  }
];

export const pushClicks: PushClick[] = campaigns
  .filter((campaign) => campaign.clickCount > 0)
  .flatMap((campaign) =>
    campaignRecipients
      .filter((recipient) => recipient.campaignId === campaign.id && recipient.clicked)
      .slice(0, campaign.clickCount)
      .map((recipient, index) => ({
        id: `clk_${campaign.id}_${index}`,
        tenantId: tenant.id,
        campaignId: campaign.id,
        subscriberId: recipient.subscriberId,
        clickUrl: campaign.clickUrl,
        clickedAt: campaign.sentAt ?? campaign.createdAt
      }))
  );

export const discountCodes: DiscountCodeRecord[] = [
  {
    id: "disc_push10_1001",
    tenantId: tenant.id,
    subscriberId: subscriberUuid("sub_1001"),
    shopifyDiscountId: "local_PUSH10-WEB1001",
    code: "PUSH10-WEB1001",
    discountPercent: 10,
    status: "issued",
    usageLimit: 1,
    expiresAt: "2026-06-15T09:20:00.000Z",
    createdAt: "2026-06-13T09:20:00.000Z",
    updatedAt: "2026-06-13T09:20:00.000Z"
  },
  {
    id: "disc_push10_1002",
    tenantId: tenant.id,
    subscriberId: subscriberUuid("sub_1002"),
    shopifyDiscountId: "local_PUSH10-WEB1002",
    code: "PUSH10-WEB1002",
    discountPercent: 10,
    status: "used",
    usageLimit: 1,
    expiresAt: "2026-06-14T12:45:00.000Z",
    usedAt: "2026-06-13T16:18:00.000Z",
    usedOrderId: "gid://shopify/Order/1002001",
    createdAt: "2026-06-12T12:45:00.000Z",
    updatedAt: "2026-06-13T16:18:00.000Z"
  },
  {
    id: "disc_push10_1003",
    tenantId: tenant.id,
    subscriberId: subscriberUuid("sub_1003"),
    shopifyDiscountId: "local_PUSH10-WEB1003",
    code: "PUSH10-WEB1003",
    discountPercent: 10,
    status: "issued",
    usageLimit: 1,
    expiresAt: "2026-06-15T15:12:00.000Z",
    createdAt: "2026-06-13T15:12:00.000Z",
    updatedAt: "2026-06-13T15:12:00.000Z"
  },
  {
    id: "disc_push10_1004",
    tenantId: tenant.id,
    subscriberId: subscriberUuid("sub_1004"),
    shopifyDiscountId: "local_PUSH10-WEB1004",
    code: "PUSH10-WEB1004",
    discountPercent: 10,
    status: "expired",
    usageLimit: 1,
    expiresAt: "2026-06-02T18:30:00.000Z",
    createdAt: "2026-05-31T18:30:00.000Z",
    updatedAt: "2026-06-02T18:30:00.000Z"
  }
];

export const subscriberActivity: SubscriberActivity[] = [
  {
    id: "act_discount_issued_1001",
    tenantId: tenant.id,
    subscriberId: subscriberUuid("sub_1001"),
    activityType: "Discount issued",
    message: "10% opt-in code issued",
    metadata: { code: "PUSH10-WEB1001" },
    createdAt: "2026-06-13T09:20:00.000Z"
  },
  {
    id: "act_discount_used_1002",
    tenantId: tenant.id,
    subscriberId: subscriberUuid("sub_1002"),
    activityType: "Discount used",
    message: "Opt-in discount used at checkout",
    metadata: { code: "PUSH10-WEB1002" },
    createdAt: "2026-06-13T16:18:00.000Z"
  },
  {
    id: "act_discount_issued_1003",
    tenantId: tenant.id,
    subscriberId: subscriberUuid("sub_1003"),
    activityType: "Discount issued",
    message: "10% opt-in code issued",
    metadata: { code: "PUSH10-WEB1003" },
    createdAt: "2026-06-13T15:12:00.000Z"
  }
];

export const appSettings: AppSettings = {
  tenantId: tenant.id,
  brand: {
    storeName: "GrindCTRL",
    storeUrl: "https://grindctrl.cloud",
    defaultNotificationIcon: "https://grindctrl.cloud/cdn/shop/files/store-icon.png",
    defaultClickUrl: "https://grindctrl.cloud/collections/new-arrivals",
    timezone: "Africa/Cairo"
  },
  push: {
    vapidPublicKey: "Configured after deployment",
    vapidPrivateKeyMasked: "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
    vapidSubject: serverEnv.vapidSubject,
    serviceWorkerStatus: "Ready",
    subscriberCollectionStatus: "Ready"
  },
  storeIntegration: {
    storeName: "GrindCTRL",
    storeUrl: "https://grindctrl.cloud",
    platform: "Shopify",
    connectionStatus: "Setup Required",
    storefrontScript: "Pending Installation",
    webhooks: "Not Configured",
    adminApi: "Not Connected",
    discountCreationStatus: "Shopify Connection Required",
    ordersWebhookStatus: "Not Configured",
    pushChannelStatus: "Ready"
  },
  n8n: {
    baseUrl: serverEnv.n8nBaseUrl,
    campaignSenderWebhookStatus: "Ready",
    lastWorkflowRun: "Not started"
  },
  safety: {
    ownerTestMode: serverEnv.ownerTestMode,
    liveSendingEnabled: serverEnv.liveSendingEnabled,
    maxSendsPerHour: serverEnv.maxSendsPerHour,
    requireSendConfirmation: true,
    allowedTestSubscribers: subscribers
      .filter((subscriber) => subscriber.isOwnerAllowed)
      .map((subscriber) => subscriber.displayName)
  },
  optInDiscount: {
    enabled: true,
    discountPercent: 10,
    codePrefix: "PUSH10",
    expiryHours: 48,
    popupTitle: "Get 10% off your order",
    popupBody:
      "Allow notifications to receive your discount code, private drops, restock alerts, and limited-time offers.",
    primaryButtonText: "Unlock 10% Off",
    secondaryButtonText: "Maybe later",
    successTitle: "Your 10% discount is unlocked",
    successBody: "Use this code at checkout:",
    applyDiscountRedirectUrl: "https://grindctrl.cloud/collections/new-arrivals",
    popupDelaySeconds: 2,
    reShowAfterDismissHours: 72
  }
};

export const integrationStatus: IntegrationStatus = {
  tenantId: tenant.id,
  database: "Connected",
  campaignEngine: "Ready",
  pushChannel: "Ready",
  subscriberCollection: "Ready",
  storefrontScript: "Pending Installation",
  shopifyConnection: "Setup Required",
  liveSending: appSettings.safety.liveSendingEnabled ? "Enabled" : "Disabled"
};

export const auditLogs: AuditLog[] = [
  {
    id: "audit_campaign_create_1",
    tenantId: tenant.id,
    action: "campaign create",
    actorEmail: "owner@notify.grindctrl.cloud",
    entityType: "campaign",
    entityId: "cmp_winter_drop",
    createdAt: "2026-06-12T07:30:00.000Z"
  },
  {
    id: "audit_send_live_1",
    tenantId: tenant.id,
    action: "send live",
    actorEmail: "owner@notify.grindctrl.cloud",
    entityType: "campaign",
    entityId: "cmp_winter_drop",
    createdAt: "2026-06-12T07:58:00.000Z"
  },
  {
    id: "audit_settings_update_1",
    tenantId: tenant.id,
    action: "settings update",
    actorEmail: "owner@notify.grindctrl.cloud",
    entityType: "settings",
    createdAt: "2026-06-11T10:18:00.000Z"
  },
  {
    id: "audit_store_test_1",
    tenantId: tenant.id,
    action: "store connection test",
    actorEmail: "owner@notify.grindctrl.cloud",
    entityType: "integration",
    createdAt: "2026-06-10T13:42:00.000Z"
  }
];



