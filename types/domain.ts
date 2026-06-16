export type IntegrationMode = "seeded_mode" | "connected_mode";

export type UserRole = "admin" | "viewer";

export type SubscriberStatus = "Active" | "Inactive";

export type CampaignStatus =
  | "Draft"
  | "Tested"
  | "Queued"
  | "Scheduled"
  | "Sending"
  | "Sent"
  | "Failed"
  | "Cancelled";

export type AudienceType = "Selected test subscribers" | "All active subscribers";

export type SendMode = "Save as draft" | "Send now" | "Schedule for later";

export type RecipientStatus = "Pending" | "Queued" | "Sent" | "Failed" | "Skipped";

export interface Tenant {
  id: string;
  tenantSlug: string;
  brandName: string;
  storeUrl: string;
  dashboardDomain: string;
  storeCategory: string;
  internalIntegrationMode: IntegrationMode;
}

export interface AdminUser {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface PushSubscriber {
  id: string;
  tenantId: string;
  displayName: string;
  browser: string;
  device: string;
  country: string;
  status: SubscriberStatus;
  subscribedAt: string;
  lastSeenAt: string;
  endpointHash: string;
  isOwnerAllowed: boolean;
  subscription?: PushSubscriptionPayload;
}

export type DiscountCodeStatus = "issued" | "used" | "expired" | "cancelled";

export interface DiscountCodeRecord {
  id: string;
  tenantId: string;
  subscriberId: string;
  shopifyDiscountId: string;
  code: string;
  discountPercent: number;
  status: DiscountCodeStatus;
  usageLimit: number;
  expiresAt: string;
  usedAt?: string;
  usedOrderId?: string;
  claimFingerprint?: string;
  claimIpHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriberActivity {
  id: string;
  tenantId: string;
  subscriberId?: string;
  activityType: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ShopifyInstallation {
  id: string;
  tenantId: string;
  shopDomain: string;
  accessToken: string;
  scopes: string;
  installedAt: string;
  updatedAt: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
}

export interface PushCampaign {
  id: string;
  tenantId: string;
  name: string;
  notificationTitle: string;
  notificationBody: string;
  clickUrl: string;
  imageUrl?: string;
  iconUrl?: string;
  audience: AudienceType;
  status: CampaignStatus;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  clickCount: number;
  clickRate: number;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  subscriberId: string;
  status: RecipientStatus;
  sentAt?: string;
  clicked: boolean;
  error?: string;
}

export interface PushEvent {
  id: string;
  tenantId: string;
  campaignId?: string;
  subscriberId?: string;
  eventType: string;
  message: string;
  createdAt: string;
}

export interface PushClick {
  id: string;
  tenantId: string;
  campaignId: string;
  subscriberId?: string;
  clickUrl: string;
  clickedAt: string;
}

export interface BrandSettings {
  storeName: string;
  storeUrl: string;
  defaultNotificationIcon: string;
  defaultClickUrl: string;
  timezone: string;
}

export interface PushSettings {
  vapidPublicKey: string;
  vapidPrivateKeyMasked: string;
  vapidSubject: string;
  serviceWorkerStatus: string;
  subscriberCollectionStatus: string;
}

export interface StoreIntegrationSettings {
  storeName: string;
  storeUrl: string;
  platform: string;
  connectionStatus: string;
  storefrontScript: string;
  webhooks: string;
  adminApi: string;
  discountCreationStatus?: string;
  ordersWebhookStatus?: string;
  pushChannelStatus?: string;
}

export interface N8nSettings {
  baseUrl: string;
  campaignSenderWebhookStatus: string;
  lastWorkflowRun: string;
}

export interface SafetySettings {
  ownerTestMode: boolean;
  liveSendingEnabled: boolean;
  maxSendsPerHour: number;
  requireSendConfirmation: boolean;
  allowedTestSubscribers: string[];
}

export interface OptInDiscountSettings {
  enabled: boolean;
  discountPercent: number;
  codePrefix: string;
  expiryHours: number;
  popupTitle: string;
  popupBody: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  successTitle: string;
  successBody: string;
  applyDiscountRedirectUrl: string;
  popupDelaySeconds: number;
  reShowAfterDismissHours: number;
}

export interface AppSettings {
  tenantId: string;
  brand: BrandSettings;
  push: PushSettings;
  storeIntegration: StoreIntegrationSettings;
  n8n: N8nSettings;
  safety: SafetySettings;
  optInDiscount: OptInDiscountSettings;
}

export interface IntegrationStatus {
  tenantId: string;
  database: string;
  campaignEngine: string;
  pushChannel: string;
  subscriberCollection: string;
  storefrontScript: string;
  shopifyConnection: string;
  liveSending: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  action: string;
  actorEmail: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardMetrics {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
  newThisWeek: number;
  newToday: number;
  optInConversionRate: number;
  discountCodesIssued: number;
  campaignsSent: number;
  totalClicks: number;
  averageClickRate: number;
  lastCampaignStatus: CampaignStatus;
}

export interface CampaignInput {
  name: string;
  notificationTitle: string;
  notificationBody: string;
  clickUrl: string;
  imageUrl?: string;
  iconUrl?: string;
  audience: AudienceType;
  sendMode: SendMode;
  scheduledAt?: string;
}
