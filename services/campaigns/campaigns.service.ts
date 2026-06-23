import { randomUUID } from "crypto";
import { getStore, newId } from "@/lib/data/store";
import {
  campaignToRow,
  canUseProductionData,
  clickToRow,
  getCampaignBundleFromData,
  getSupabaseAdminOrThrow,
  getTenant,
  insertEvent,
  listCampaignsFromData,
  listSubscriberGroupMembershipsFromData,
  listSubscribersFromData,
  recipientToRow
} from "@/lib/data/supabase-repository";
import { isValidUrl } from "@/lib/utils";
import { recordAuditLog } from "@/services/audit/audit.service";
import { sendPushToSubscriber } from "@/services/push/push.service";
import type { AudienceType, CampaignInput, CampaignRecipient, CampaignStatus, PushCampaign, PushSubscriber } from "@/types/domain";

async function audienceSubscribers(audience: AudienceType, audienceGroupId?: string) {
  const subscribers = await listSubscribersFromData();
  if (audience === "Selected test subscribers") {
    return subscribers.filter((subscriber) => subscriber.status === "Active" && subscriber.isOwnerAllowed);
  }
  if (audience === "Subscriber group") {
    if (!audienceGroupId) throw new Error("Subscriber group is required.");
    const memberships = await listSubscriberGroupMembershipsFromData();
    const subscriberIds = new Set(
      memberships.filter((membership) => membership.groupId === audienceGroupId).map((membership) => membership.subscriberId)
    );
    return subscribers.filter((subscriber) => subscriber.status === "Active" && subscriberIds.has(subscriber.id));
  }

  return subscribers.filter((subscriber) => subscriber.status === "Active");
}

export async function estimateAudience(audience: AudienceType, audienceGroupId?: string) {
  return (await audienceSubscribers(audience, audienceGroupId)).length;
}

export async function listCampaigns() {
  return listCampaignsFromData();
}

export async function getCampaign(campaignId: string) {
  return getCampaignBundleFromData(campaignId);
}

function validateCampaignInput(input: CampaignInput) {
  if (!input.name.trim()) throw new Error("Campaign name is required.");
  if (!input.notificationTitle.trim()) throw new Error("Notification title is required.");
  if (!input.notificationBody.trim()) throw new Error("Notification body is required.");
  if (!input.clickUrl.trim()) throw new Error("Click URL is required.");
  if (!isValidUrl(input.clickUrl)) throw new Error("Click URL must be a valid URL.");
  if (input.audience === "Subscriber group" && !input.audienceGroupId) {
    throw new Error("Choose a subscriber group.");
  }
}

function isAudienceConstraintError(error: { code?: string; message?: string; details?: string } | null) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return Boolean(error && (error.code === "23514" || text.includes("audience_check")));
}

export async function createCampaign(input: CampaignInput, actorEmail: string, status: CampaignStatus = "Draft") {
  validateCampaignInput(input);

  const tenant = await getTenant();
  const estimatedRecipients = await estimateAudience(input.audience, input.audienceGroupId);
  const campaign: PushCampaign = {
    id: canUseProductionData() ? randomUUID() : newId("cmp"),
    tenantId: tenant.id,
    name: input.name.trim(),
    notificationTitle: input.notificationTitle.trim(),
    notificationBody: input.notificationBody.trim(),
    clickUrl: input.clickUrl.trim(),
    imageUrl: input.imageUrl?.trim() || undefined,
    iconUrl: input.iconUrl?.trim() || undefined,
    audience: input.audience,
    audienceGroupId: input.audience === "Subscriber group" ? input.audienceGroupId : undefined,
    status,
    createdAt: new Date().toISOString(),
    scheduledAt: input.sendMode === "Schedule for later" ? input.scheduledAt : undefined,
    totalRecipients: estimatedRecipients,
    sentCount: 0,
    failedCount: 0,
    clickCount: 0,
    clickRate: 0
  };
  const event = {
    id: canUseProductionData() ? randomUUID() : newId("evt"),
    tenantId: tenant.id,
    campaignId: campaign.id,
    eventType: status === "Draft" ? "Saved draft" : "Created",
    message: status === "Draft" ? "Draft saved" : "Campaign created",
    createdAt: new Date().toISOString()
  };

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const { error } = await supabase.from("np_push_campaigns").insert(campaignToRow(campaign));
    if (isAudienceConstraintError(error)) {
      throw new Error("Campaign groups need the latest database update before sending. Apply the campaign group audience migration, then retry.");
    }
    if (error) throw new Error(`Create campaign failed: ${error.message}`);
    await insertEvent(supabase, event);
  } else {
    const store = getStore();
    store.campaigns.unshift(campaign);
    store.pushEvents.unshift(event);
  }

  recordAuditLog({
    action: "campaign create",
    actorEmail,
    entityType: "campaign",
    entityId: campaign.id
  });

  return campaign;
}

export async function duplicateCampaign(campaignId: string, actorEmail: string) {
  const source = (await getCampaign(campaignId))?.campaign;
  if (!source) throw new Error("Campaign not found.");

  return createCampaign(
    {
      name: `${source.name} Copy`,
      notificationTitle: source.notificationTitle,
      notificationBody: source.notificationBody,
      clickUrl: source.clickUrl,
      imageUrl: source.imageUrl,
      iconUrl: source.iconUrl,
      audience: source.audience,
      audienceGroupId: source.audienceGroupId,
      sendMode: "Save as draft"
    },
    actorEmail,
    "Draft"
  );
}

export async function cancelCampaign(campaignId: string, actorEmail: string) {
  const bundle = await getCampaign(campaignId);
  const campaign = bundle?.campaign;
  if (!campaign) throw new Error("Campaign not found.");
  if (campaign.status !== "Scheduled" && campaign.status !== "Queued") {
    throw new Error("Only scheduled or queued campaigns can be cancelled.");
  }

  campaign.status = "Cancelled";
  const event = {
    id: canUseProductionData() ? randomUUID() : newId("evt"),
    tenantId: campaign.tenantId,
    campaignId,
    eventType: "Cancelled",
    message: "Campaign cancelled",
    createdAt: new Date().toISOString()
  };

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const { error } = await supabase
      .from("np_push_campaigns")
      .update({ status: "Cancelled", updated_at: new Date().toISOString() })
      .eq("tenant_id", campaign.tenantId)
      .eq("id", campaignId);
    if (error) throw new Error(`Cancel campaign failed: ${error.message}`);
    await insertEvent(supabase, event);
  } else {
    const store = getStore();
    const target = store.campaigns.find((item) => item.id === campaignId);
    if (target) target.status = "Cancelled";
    store.pushEvents.unshift(event);
  }

  recordAuditLog({
    action: "campaign update",
    actorEmail,
    entityType: "campaign",
    entityId: campaignId
  });

  return campaign;
}

export async function deleteDraftCampaign(campaignId: string, actorEmail: string) {
  const bundle = await getCampaign(campaignId);
  const campaign = bundle?.campaign;
  if (!campaign) throw new Error("Campaign not found.");
  if (campaign.status !== "Draft") throw new Error("Only draft campaigns can be deleted.");

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const { error } = await supabase.from("np_push_campaigns").delete().eq("tenant_id", campaign.tenantId).eq("id", campaignId);
    if (error) throw new Error(`Delete campaign failed: ${error.message}`);
  } else {
    const store = getStore();
    store.campaigns = store.campaigns.filter((item) => item.id !== campaignId);
    store.campaignRecipients = store.campaignRecipients.filter((item) => item.campaignId !== campaignId);
  }

  recordAuditLog({
    action: "campaign update",
    actorEmail,
    entityType: "campaign",
    entityId: campaignId
  });

  return { ok: true };
}

async function ensureRecipients(campaign: PushCampaign): Promise<CampaignRecipient[]> {
  const existing = (await getCampaign(campaign.id))?.recipients ?? [];
  if (existing.length > 0) return existing;

  const recipients = (await audienceSubscribers(campaign.audience, campaign.audienceGroupId)).map((subscriber) => ({
    id: canUseProductionData() ? randomUUID() : newId("rec"),
    campaignId: campaign.id,
    subscriberId: subscriber.id,
    status: "Queued" as const,
    clicked: false
  }));

  campaign.totalRecipients = recipients.length;
  if (canUseProductionData() && recipients.length > 0) {
    const supabase = getSupabaseAdminOrThrow();
    const { error } = await supabase
      .from("np_push_campaign_recipients")
      .upsert(recipients.map((recipient) => recipientToRow(recipient, campaign.tenantId)), {
        onConflict: "campaign_id,subscriber_id"
      });
    if (error) throw new Error(`Create recipients failed: ${error.message}`);
  } else {
    const store = getStore();
    store.campaignRecipients.unshift(...recipients);
  }

  return recipients;
}

async function completeDelivery(
  campaign: PushCampaign,
  recipients: CampaignRecipient[],
  subscribers: PushSubscriber[]
) {
  const subscribersById = new Map(subscribers.map((subscriber) => [subscriber.id, subscriber]));
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    if (recipient.status === "Sent") continue;
    const subscriber = subscribersById.get(recipient.subscriberId);
    if (!subscriber) continue;

    const result = await sendPushToSubscriber(campaign, subscriber);
    recipient.status = result.ok ? "Sent" : "Failed";
    recipient.sentAt = result.ok ? new Date().toISOString() : undefined;
    recipient.error = result.ok ? undefined : result.message;
    sentCount += result.ok ? 1 : 0;
    failedCount += result.ok ? 0 : 1;
  }

  campaign.status = failedCount > 0 && sentCount === 0 ? "Failed" : "Sent";
  campaign.sentAt = new Date().toISOString();
  campaign.sentCount = sentCount;
  campaign.failedCount = failedCount;
  campaign.totalRecipients = recipients.length;
  campaign.clickCount = campaign.clickCount ?? 0;
  campaign.clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0;

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const { error: recipientError } = await supabase
      .from("np_push_campaign_recipients")
      .upsert(recipients.map((recipient) => recipientToRow(recipient, campaign.tenantId)), {
        onConflict: "campaign_id,subscriber_id"
      });
    if (recipientError) throw new Error(`Update recipients failed: ${recipientError.message}`);
    const { error: campaignError } = await supabase
      .from("np_push_campaigns")
      .update(campaignToRow(campaign))
      .eq("tenant_id", campaign.tenantId)
      .eq("id", campaign.id);
    if (campaignError) throw new Error(`Update campaign failed: ${campaignError.message}`);
  }
}

export async function sendTestCampaign(input: CampaignInput, actorEmail: string) {
  const campaign = await createCampaign(
    {
      ...input,
      audience: "Selected test subscribers",
      sendMode: "Send now"
    },
    actorEmail,
    "Tested"
  );

  const recipients = await ensureRecipients(campaign);
  await completeDelivery(campaign, recipients, await audienceSubscribers("Selected test subscribers"));

  const event = {
    id: canUseProductionData() ? randomUUID() : newId("evt"),
    tenantId: campaign.tenantId,
    campaignId: campaign.id,
    eventType: "Sent test",
    message: "Test delivery completed",
    createdAt: new Date().toISOString()
  };
  if (canUseProductionData()) await insertEvent(getSupabaseAdminOrThrow(), event);
  else getStore().pushEvents.unshift(event);

  recordAuditLog({
    action: "send test",
    actorEmail,
    entityType: "campaign",
    entityId: campaign.id
  });

  return campaign;
}

export async function sendLiveCampaign(input: CampaignInput & { confirmation: string }, actorEmail: string) {
  const settings = canUseProductionData() ? (await import("@/services/settings/settings.service")).getSettings() : Promise.resolve(getStore().appSettings);
  const resolvedSettings = await settings;
  if (resolvedSettings.safety.requireSendConfirmation && input.confirmation !== "SEND") {
    throw new Error("SEND confirmation is required.");
  }

  if (!resolvedSettings.safety.liveSendingEnabled && input.audience !== "Selected test subscribers") {
    throw new Error("Live sending is disabled for this audience.");
  }

  const campaign = await createCampaign(input, actorEmail, "Queued");
  const recipients = await ensureRecipients(campaign);
  const requestEvent = {
    id: canUseProductionData() ? randomUUID() : newId("evt"),
    tenantId: campaign.tenantId,
    campaignId: campaign.id,
    eventType: "Live send requested",
    message: "Live send requested by owner",
    createdAt: new Date().toISOString()
  };

  campaign.status = "Sending";
  if (canUseProductionData()) await insertEvent(getSupabaseAdminOrThrow(), requestEvent);
  else getStore().pushEvents.unshift(requestEvent);

  await completeDelivery(campaign, recipients, await audienceSubscribers(campaign.audience, campaign.audienceGroupId));
  const completeEvent = {
    id: canUseProductionData() ? randomUUID() : newId("evt"),
    tenantId: campaign.tenantId,
    campaignId: campaign.id,
    eventType: "Send completed",
    message: "Delivery completed",
    createdAt: new Date().toISOString()
  };
  if (canUseProductionData()) await insertEvent(getSupabaseAdminOrThrow(), completeEvent);
  else getStore().pushEvents.unshift(completeEvent);

  recordAuditLog({
    action: "send live",
    actorEmail,
    entityType: "campaign",
    entityId: campaign.id
  });

  return campaign;
}

export async function sendExistingCampaignLive(campaignId: string, actorEmail: string) {
  const bundle = await getCampaign(campaignId);
  const campaign = bundle?.campaign;
  if (!campaign) throw new Error("Campaign not found.");
  const settings = canUseProductionData() ? (await import("@/services/settings/settings.service")).getSettings() : Promise.resolve(getStore().appSettings);
  const resolvedSettings = await settings;
  if (!resolvedSettings.safety.liveSendingEnabled && campaign.audience !== "Selected test subscribers") {
    throw new Error("Live sending is disabled for this audience.");
  }
  if (campaign.status === "Sent" || campaign.status === "Sending") {
    throw new Error("Campaign has already started sending.");
  }

  const recipients = await ensureRecipients(campaign);
  const requestEvent = {
    id: canUseProductionData() ? randomUUID() : newId("evt"),
    tenantId: campaign.tenantId,
    campaignId: campaign.id,
    eventType: "Live send requested",
    message: "Live send requested by campaign sender",
    createdAt: new Date().toISOString()
  };

  campaign.status = "Sending";
  if (canUseProductionData()) await insertEvent(getSupabaseAdminOrThrow(), requestEvent);
  else getStore().pushEvents.unshift(requestEvent);

  await completeDelivery(campaign, recipients, await audienceSubscribers(campaign.audience, campaign.audienceGroupId));
  const completeEvent = {
    id: canUseProductionData() ? randomUUID() : newId("evt"),
    tenantId: campaign.tenantId,
    campaignId: campaign.id,
    eventType: "Send completed",
    message: "Delivery completed",
    createdAt: new Date().toISOString()
  };
  if (canUseProductionData()) await insertEvent(getSupabaseAdminOrThrow(), completeEvent);
  else getStore().pushEvents.unshift(completeEvent);

  recordAuditLog({
    action: "send live",
    actorEmail,
    entityType: "campaign",
    entityId: campaign.id
  });

  return campaign;
}

export async function recordCampaignClick(input: { campaignId: string; subscriberId?: string; clickUrl: string }) {
  const bundle = await getCampaign(input.campaignId);
  const campaign = bundle?.campaign;
  if (!campaign) return null;

  const click = {
    id: canUseProductionData() ? randomUUID() : newId("clk"),
    tenantId: campaign.tenantId,
    campaignId: input.campaignId,
    subscriberId: input.subscriberId,
    clickUrl: input.clickUrl,
    clickedAt: new Date().toISOString()
  };

  const recipient = bundle.recipients.find(
    (item) => item.campaignId === input.campaignId && item.subscriberId === input.subscriberId
  );
  if (recipient) recipient.clicked = true;

  campaign.clickCount += 1;
  campaign.clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0;

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const { error: clickError } = await supabase.from("np_push_clicks").insert(clickToRow(click));
    if (clickError) throw new Error(`Record click failed: ${clickError.message}`);
    if (recipient) {
      const { error: recipientError } = await supabase
        .from("np_push_campaign_recipients")
        .update({ clicked: true })
        .eq("campaign_id", recipient.campaignId)
        .eq("subscriber_id", recipient.subscriberId);
      if (recipientError) throw new Error(`Update click recipient failed: ${recipientError.message}`);
    }
    const { error: campaignError } = await supabase
      .from("np_push_campaigns")
      .update({
        click_count: campaign.clickCount,
        click_rate: campaign.clickRate,
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", campaign.tenantId)
      .eq("id", campaign.id);
    if (campaignError) throw new Error(`Update campaign click count failed: ${campaignError.message}`);
  } else {
    const store = getStore();
    store.pushClicks.unshift(click);
    const localRecipient = store.campaignRecipients.find(
      (item) => item.campaignId === input.campaignId && item.subscriberId === input.subscriberId
    );
    if (localRecipient) localRecipient.clicked = true;
    const localCampaign = store.campaigns.find((item) => item.id === input.campaignId);
    if (localCampaign) {
      localCampaign.clickCount = campaign.clickCount;
      localCampaign.clickRate = campaign.clickRate;
    }
  }

  return campaign;
}
