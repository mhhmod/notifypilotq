import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/config/env";
import { getStore } from "@/lib/data/store";
import type {
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

type SupabaseAdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

type TenantRow = {
  id: string;
  tenant_slug: string;
  brand_name: string;
  store_url: string;
  dashboard_domain: string;
  store_category: string;
  internal_integration_mode: Tenant["internalIntegrationMode"];
};

type SubscriberRow = {
  id: string;
  tenant_id: string;
  display_name: string;
  browser: string;
  device: string;
  country: string;
  status: PushSubscriber["status"];
  subscribed_at: string;
  last_seen_at: string;
  endpoint_hash: string;
  is_owner_allowed: boolean;
  subscription_payload?: PushSubscriber["subscription"] | null;
};

type CampaignRow = {
  id: string;
  tenant_id: string;
  name: string;
  notification_title: string;
  notification_body: string;
  click_url: string;
  image_url?: string | null;
  icon_url?: string | null;
  audience: PushCampaign["audience"];
  status: PushCampaign["status"];
  created_at: string;
  scheduled_at?: string | null;
  sent_at?: string | null;
  total_recipients?: number | null;
  sent_count?: number | null;
  failed_count?: number | null;
  click_count?: number | null;
  click_rate?: number | null;
};

type RecipientRow = {
  id: string;
  campaign_id: string;
  subscriber_id: string;
  status: CampaignRecipient["status"];
  sent_at?: string | null;
  clicked: boolean;
  error?: string | null;
};

type EventRow = {
  id: string;
  tenant_id: string;
  campaign_id?: string | null;
  subscriber_id?: string | null;
  event_type: string;
  message: string;
  created_at: string;
};

type ClickRow = {
  id: string;
  tenant_id: string;
  campaign_id: string;
  subscriber_id?: string | null;
  click_url: string;
  clicked_at: string;
};

type DiscountRow = {
  id: string;
  tenant_id: string;
  subscriber_id: string;
  shopify_discount_id: string;
  code: string;
  discount_percent: number;
  status: DiscountCodeRecord["status"];
  usage_limit: number;
  expires_at: string;
  used_at?: string | null;
  used_order_id?: string | null;
  created_at: string;
  updated_at: string;
};

type SettingsRow = {
  tenant_id: string;
  brand_settings?: AppSettings["brand"] | null;
  push_settings?: AppSettings["push"] | null;
  n8n_settings?: AppSettings["n8n"] | null;
  safety_settings?: AppSettings["safety"] | null;
  store_integration_settings?: AppSettings["storeIntegration"] | null;
  opt_in_discount_settings?: AppSettings["optInDiscount"] | null;
};

type IntegrationStatusRow = {
  tenant_id: string;
  database_status: string;
  campaign_engine_status: string;
  push_channel_status: string;
  subscriber_collection_status: string;
  storefront_script_status: string;
  shopify_connection_status: string;
  live_sending_status: string;
};

export function canUseProductionData() {
  return isSupabaseAdminConfigured();
}

export function getSupabaseAdminOrThrow() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function requireData<T>(data: T | null, message: string): T {
  if (!data) throw new Error(message);
  return data;
}

function assertNoError(error: { message: string } | null, action: string) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

function tenantFromRow(row: TenantRow): Tenant {
  return {
    id: row.id,
    tenantSlug: row.tenant_slug,
    brandName: row.brand_name,
    storeUrl: row.store_url,
    dashboardDomain: row.dashboard_domain,
    storeCategory: row.store_category,
    internalIntegrationMode: row.internal_integration_mode
  };
}

function subscriberFromRow(row: SubscriberRow): PushSubscriber {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    displayName: row.display_name,
    browser: row.browser,
    device: row.device,
    country: row.country,
    status: row.status,
    subscribedAt: row.subscribed_at,
    lastSeenAt: row.last_seen_at,
    endpointHash: row.endpoint_hash,
    isOwnerAllowed: Boolean(row.is_owner_allowed),
    subscription: row.subscription_payload ?? undefined
  };
}

export function subscriberToRow(subscriber: PushSubscriber) {
  return {
    id: subscriber.id,
    tenant_id: subscriber.tenantId,
    display_name: subscriber.displayName,
    browser: subscriber.browser,
    device: subscriber.device,
    country: subscriber.country,
    status: subscriber.status,
    subscribed_at: subscriber.subscribedAt,
    last_seen_at: subscriber.lastSeenAt,
    endpoint_hash: subscriber.endpointHash,
    is_owner_allowed: subscriber.isOwnerAllowed,
    subscription_payload: subscriber.subscription ?? null
  };
}

function campaignFromRow(row: CampaignRow): PushCampaign {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    notificationTitle: row.notification_title,
    notificationBody: row.notification_body,
    clickUrl: row.click_url,
    imageUrl: row.image_url ?? undefined,
    iconUrl: row.icon_url ?? undefined,
    audience: row.audience,
    status: row.status,
    createdAt: row.created_at,
    scheduledAt: row.scheduled_at ?? undefined,
    sentAt: row.sent_at ?? undefined,
    totalRecipients: Number(row.total_recipients ?? 0),
    sentCount: Number(row.sent_count ?? 0),
    failedCount: Number(row.failed_count ?? 0),
    clickCount: Number(row.click_count ?? 0),
    clickRate: Number(row.click_rate ?? 0)
  };
}

export function campaignToRow(campaign: PushCampaign) {
  return {
    id: campaign.id,
    tenant_id: campaign.tenantId,
    name: campaign.name,
    notification_title: campaign.notificationTitle,
    notification_body: campaign.notificationBody,
    click_url: campaign.clickUrl,
    image_url: campaign.imageUrl ?? null,
    icon_url: campaign.iconUrl ?? null,
    audience: campaign.audience,
    status: campaign.status,
    scheduled_at: campaign.scheduledAt ?? null,
    sent_at: campaign.sentAt ?? null,
    total_recipients: campaign.totalRecipients,
    sent_count: campaign.sentCount,
    failed_count: campaign.failedCount,
    click_count: campaign.clickCount,
    click_rate: campaign.clickRate,
    created_at: campaign.createdAt,
    updated_at: new Date().toISOString()
  };
}

function recipientFromRow(row: RecipientRow): CampaignRecipient {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    subscriberId: row.subscriber_id,
    status: row.status,
    sentAt: row.sent_at ?? undefined,
    clicked: Boolean(row.clicked),
    error: row.error ?? undefined
  };
}

export function recipientToRow(recipient: CampaignRecipient, tenantId: string) {
  return {
    id: recipient.id,
    tenant_id: tenantId,
    campaign_id: recipient.campaignId,
    subscriber_id: recipient.subscriberId,
    status: recipient.status,
    sent_at: recipient.sentAt ?? null,
    clicked: recipient.clicked,
    error: recipient.error ?? null
  };
}

function eventFromRow(row: EventRow): PushEvent {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    campaignId: row.campaign_id ?? undefined,
    subscriberId: row.subscriber_id ?? undefined,
    eventType: row.event_type,
    message: row.message,
    createdAt: row.created_at
  };
}

export function eventToRow(event: PushEvent) {
  return {
    id: event.id,
    tenant_id: event.tenantId,
    campaign_id: event.campaignId ?? null,
    subscriber_id: event.subscriberId ?? null,
    event_type: event.eventType,
    message: event.message,
    created_at: event.createdAt
  };
}

function clickFromRow(row: ClickRow): PushClick {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    campaignId: row.campaign_id,
    subscriberId: row.subscriber_id ?? undefined,
    clickUrl: row.click_url,
    clickedAt: row.clicked_at
  };
}

export function clickToRow(click: PushClick) {
  return {
    id: click.id,
    tenant_id: click.tenantId,
    campaign_id: click.campaignId,
    subscriber_id: click.subscriberId ?? null,
    click_url: click.clickUrl,
    clicked_at: click.clickedAt
  };
}

function discountFromRow(row: DiscountRow): DiscountCodeRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    subscriberId: row.subscriber_id,
    shopifyDiscountId: row.shopify_discount_id,
    code: row.code,
    discountPercent: Number(row.discount_percent),
    status: row.status,
    usageLimit: Number(row.usage_limit),
    expiresAt: row.expires_at,
    usedAt: row.used_at ?? undefined,
    usedOrderId: row.used_order_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function discountToRow(discount: DiscountCodeRecord) {
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

export function activityToRow(activity: SubscriberActivity) {
  return {
    id: activity.id,
    tenant_id: activity.tenantId,
    subscriber_id: activity.subscriberId ?? null,
    activity_type: activity.activityType,
    message: activity.message,
    metadata: activity.metadata ?? {},
    created_at: activity.createdAt
  };
}

export function auditToRow(log: AuditLog) {
  return {
    id: log.id,
    tenant_id: log.tenantId,
    actor_email: log.actorEmail,
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId ?? null,
    metadata: log.metadata ?? {},
    created_at: log.createdAt
  };
}

function settingsFromRow(row: SettingsRow): AppSettings {
  return {
    tenantId: row.tenant_id,
    brand: row.brand_settings ?? ({} as AppSettings["brand"]),
    push: row.push_settings ?? ({} as AppSettings["push"]),
    n8n: row.n8n_settings ?? ({} as AppSettings["n8n"]),
    safety: row.safety_settings ?? ({} as AppSettings["safety"]),
    storeIntegration: row.store_integration_settings ?? ({} as AppSettings["storeIntegration"]),
    optInDiscount: row.opt_in_discount_settings ?? ({} as AppSettings["optInDiscount"])
  };
}

export function settingsToRow(settings: AppSettings) {
  return {
    tenant_id: settings.tenantId,
    brand_settings: settings.brand,
    push_settings: settings.push,
    n8n_settings: settings.n8n,
    safety_settings: settings.safety,
    store_integration_settings: settings.storeIntegration,
    opt_in_discount_settings: settings.optInDiscount,
    updated_at: new Date().toISOString()
  };
}

function integrationStatusFromRow(row: IntegrationStatusRow): IntegrationStatus {
  return {
    tenantId: row.tenant_id,
    database: row.database_status,
    campaignEngine: row.campaign_engine_status,
    pushChannel: row.push_channel_status,
    subscriberCollection: row.subscriber_collection_status,
    storefrontScript: row.storefront_script_status,
    shopifyConnection: row.shopify_connection_status,
    liveSending: row.live_sending_status
  };
}

export async function getTenant() {
  if (!canUseProductionData()) return getStore().tenant;
  const supabase = getSupabaseAdminOrThrow();
  const { data, error } = await supabase.from("np_tenants").select("*").order("created_at").limit(1).maybeSingle();
  assertNoError(error, "Load tenant failed");
  return tenantFromRow(requireData(data, "No tenant is configured."));
}

export async function listSubscribersFromData() {
  if (!canUseProductionData()) return [...getStore().subscribers].sort((a, b) => Date.parse(b.subscribedAt) - Date.parse(a.subscribedAt));
  const supabase = getSupabaseAdminOrThrow();
  const tenant = await getTenant();
  const { data, error } = await supabase
    .from("np_push_subscribers")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("subscribed_at", { ascending: false });
  assertNoError(error, "Load subscribers failed");
  return (data ?? []).map(subscriberFromRow);
}

export async function listDiscountCodesFromData() {
  if (!canUseProductionData()) return [...getStore().discountCodes];
  const supabase = getSupabaseAdminOrThrow();
  const tenant = await getTenant();
  const { data, error } = await supabase
    .from("np_discount_codes")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });
  assertNoError(error, "Load discounts failed");
  return (data ?? []).map(discountFromRow);
}

export async function listCampaignsFromData() {
  if (!canUseProductionData()) return [...getStore().campaigns].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const supabase = getSupabaseAdminOrThrow();
  const tenant = await getTenant();
  const { data, error } = await supabase
    .from("np_push_campaigns")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });
  assertNoError(error, "Load campaigns failed");
  return (data ?? []).map(campaignFromRow);
}

export async function getCampaignBundleFromData(campaignId: string) {
  if (!canUseProductionData()) {
    const store = getStore();
    const campaign = store.campaigns.find((item) => item.id === campaignId);
    if (!campaign) return null;
    return {
      campaign,
      recipients: store.campaignRecipients.filter((recipient) => recipient.campaignId === campaignId),
      events: store.pushEvents.filter((event) => event.campaignId === campaignId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
      subscribers: store.subscribers
    };
  }

  const supabase = getSupabaseAdminOrThrow();
  const tenant = await getTenant();
  const [campaignResult, recipientsResult, eventsResult, subscribersResult] = await Promise.all([
    supabase.from("np_push_campaigns").select("*").eq("tenant_id", tenant.id).eq("id", campaignId).maybeSingle(),
    supabase.from("np_push_campaign_recipients").select("*").eq("tenant_id", tenant.id).eq("campaign_id", campaignId),
    supabase.from("np_push_events").select("*").eq("tenant_id", tenant.id).eq("campaign_id", campaignId).order("created_at", { ascending: false }),
    supabase.from("np_push_subscribers").select("*").eq("tenant_id", tenant.id)
  ]);

  assertNoError(campaignResult.error, "Load campaign failed");
  assertNoError(recipientsResult.error, "Load recipients failed");
  assertNoError(eventsResult.error, "Load campaign events failed");
  assertNoError(subscribersResult.error, "Load campaign subscribers failed");
  if (!campaignResult.data) return null;

  return {
    campaign: campaignFromRow(campaignResult.data),
    recipients: (recipientsResult.data ?? []).map(recipientFromRow),
    events: (eventsResult.data ?? []).map(eventFromRow),
    subscribers: (subscribersResult.data ?? []).map(subscriberFromRow)
  };
}

export async function getSettingsFromData() {
  if (!canUseProductionData()) return getStore().appSettings;
  const supabase = getSupabaseAdminOrThrow();
  const tenant = await getTenant();
  const { data, error } = await supabase.from("np_app_settings").select("*").eq("tenant_id", tenant.id).maybeSingle();
  assertNoError(error, "Load settings failed");
  return settingsFromRow(requireData(data, "Application settings are not configured."));
}

export async function getIntegrationStatusFromData() {
  if (!canUseProductionData()) return getStore().integrationStatus;
  const supabase = getSupabaseAdminOrThrow();
  const tenant = await getTenant();
  const { data, error } = await supabase.from("np_integration_status").select("*").eq("tenant_id", tenant.id).maybeSingle();
  assertNoError(error, "Load integration status failed");
  return integrationStatusFromRow(requireData(data, "Integration status is not configured."));
}

export async function listEventsFromData(limit = 20) {
  if (!canUseProductionData()) return getStore().pushEvents.slice(0, limit);
  const supabase = getSupabaseAdminOrThrow();
  const tenant = await getTenant();
  const { data, error } = await supabase
    .from("np_push_events")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  assertNoError(error, "Load events failed");
  return (data ?? []).map(eventFromRow);
}

export async function listClicksFromData() {
  if (!canUseProductionData()) return [...getStore().pushClicks];
  const supabase = getSupabaseAdminOrThrow();
  const tenant = await getTenant();
  const { data, error } = await supabase.from("np_push_clicks").select("*").eq("tenant_id", tenant.id);
  assertNoError(error, "Load clicks failed");
  return (data ?? []).map(clickFromRow);
}

export async function insertEvent(supabase: SupabaseAdminClient, event: PushEvent) {
  const { error } = await supabase.from("np_push_events").insert(eventToRow(event));
  assertNoError(error, "Insert event failed");
}

export async function insertActivity(supabase: SupabaseAdminClient, activity: SubscriberActivity) {
  const { error } = await supabase.from("np_subscriber_activity").insert(activityToRow(activity));
  assertNoError(error, "Insert subscriber activity failed");
}

export async function insertAuditLog(supabase: SupabaseAdminClient, log: AuditLog) {
  const { error } = await supabase.from("np_audit_logs").insert(auditToRow(log));
  assertNoError(error, "Insert audit log failed");
}
