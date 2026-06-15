import { getStore, newId } from "@/lib/data/store";
import { isValidUrl } from "@/lib/utils";
import { recordAuditLog } from "@/services/audit/audit.service";
import { sendPushToSubscriber } from "@/services/push/push.service";
import type { AudienceType, CampaignInput, CampaignRecipient, CampaignStatus, PushCampaign } from "@/types/domain";

function activeSubscribers() {
  return getStore().subscribers.filter((subscriber) => subscriber.status === "Active");
}

function audienceSubscribers(audience: AudienceType) {
  const store = getStore();
  if (audience === "Selected test subscribers") {
    return store.subscribers.filter((subscriber) => subscriber.status === "Active" && subscriber.isOwnerAllowed);
  }

  return activeSubscribers();
}

export function estimateAudience(audience: AudienceType) {
  return audienceSubscribers(audience).length;
}

export function listCampaigns() {
  return [...getStore().campaigns].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function getCampaign(campaignId: string) {
  const store = getStore();
  const campaign = store.campaigns.find((item) => item.id === campaignId);
  if (!campaign) return null;

  const recipients = store.campaignRecipients.filter((recipient) => recipient.campaignId === campaignId);
  const events = store.pushEvents
    .filter((event) => event.campaignId === campaignId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return {
    campaign,
    recipients,
    events,
    subscribers: store.subscribers
  };
}

function validateCampaignInput(input: CampaignInput) {
  if (!input.name.trim()) throw new Error("Campaign name is required.");
  if (!input.notificationTitle.trim()) throw new Error("Notification title is required.");
  if (!input.notificationBody.trim()) throw new Error("Notification body is required.");
  if (!input.clickUrl.trim()) throw new Error("Click URL is required.");
  if (!isValidUrl(input.clickUrl)) throw new Error("Click URL must be a valid URL.");
}

export function createCampaign(input: CampaignInput, actorEmail: string, status: CampaignStatus = "Draft") {
  validateCampaignInput(input);

  const store = getStore();
  const estimatedRecipients = estimateAudience(input.audience);
  const campaign: PushCampaign = {
    id: newId("cmp"),
    tenantId: store.tenant.id,
    name: input.name.trim(),
    notificationTitle: input.notificationTitle.trim(),
    notificationBody: input.notificationBody.trim(),
    clickUrl: input.clickUrl.trim(),
    imageUrl: input.imageUrl?.trim() || undefined,
    iconUrl: input.iconUrl?.trim() || undefined,
    audience: input.audience,
    status,
    createdAt: new Date().toISOString(),
    scheduledAt: input.sendMode === "Schedule for later" ? input.scheduledAt : undefined,
    totalRecipients: estimatedRecipients,
    sentCount: 0,
    failedCount: 0,
    clickCount: 0,
    clickRate: 0
  };

  store.campaigns.unshift(campaign);
  store.pushEvents.unshift({
    id: newId("evt"),
    tenantId: store.tenant.id,
    campaignId: campaign.id,
    eventType: status === "Draft" ? "Saved draft" : "Created",
    message: status === "Draft" ? "Draft saved" : "Campaign created",
    createdAt: new Date().toISOString()
  });

  recordAuditLog({
    action: "campaign create",
    actorEmail,
    entityType: "campaign",
    entityId: campaign.id
  });

  return campaign;
}

export function duplicateCampaign(campaignId: string, actorEmail: string) {
  const source = getStore().campaigns.find((campaign) => campaign.id === campaignId);
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
      sendMode: "Save as draft"
    },
    actorEmail,
    "Draft"
  );
}

export function cancelCampaign(campaignId: string, actorEmail: string) {
  const store = getStore();
  const campaign = store.campaigns.find((item) => item.id === campaignId);
  if (!campaign) throw new Error("Campaign not found.");
  if (campaign.status !== "Scheduled" && campaign.status !== "Queued") {
    throw new Error("Only scheduled or queued campaigns can be cancelled.");
  }

  campaign.status = "Cancelled";
  store.pushEvents.unshift({
    id: newId("evt"),
    tenantId: store.tenant.id,
    campaignId,
    eventType: "Cancelled",
    message: "Campaign cancelled",
    createdAt: new Date().toISOString()
  });

  recordAuditLog({
    action: "campaign update",
    actorEmail,
    entityType: "campaign",
    entityId: campaignId
  });

  return campaign;
}

export function deleteDraftCampaign(campaignId: string, actorEmail: string) {
  const store = getStore();
  const campaign = store.campaigns.find((item) => item.id === campaignId);
  if (!campaign) throw new Error("Campaign not found.");
  if (campaign.status !== "Draft") throw new Error("Only draft campaigns can be deleted.");

  store.campaigns = store.campaigns.filter((item) => item.id !== campaignId);
  store.campaignRecipients = store.campaignRecipients.filter((item) => item.campaignId !== campaignId);

  recordAuditLog({
    action: "campaign update",
    actorEmail,
    entityType: "campaign",
    entityId: campaignId
  });

  return { ok: true };
}

function ensureRecipients(campaign: PushCampaign): CampaignRecipient[] {
  const store = getStore();
  const existing = store.campaignRecipients.filter((recipient) => recipient.campaignId === campaign.id);
  if (existing.length > 0) return existing;

  const recipients = audienceSubscribers(campaign.audience).map((subscriber) => ({
    id: newId("rec"),
    campaignId: campaign.id,
    subscriberId: subscriber.id,
    status: "Queued" as const,
    clicked: false
  }));

  store.campaignRecipients.unshift(...recipients);
  campaign.totalRecipients = recipients.length;
  return recipients;
}

export async function sendTestCampaign(input: CampaignInput, actorEmail: string) {
  const campaign = createCampaign(
    {
      ...input,
      audience: "Selected test subscribers",
      sendMode: "Send now"
    },
    actorEmail,
    "Tested"
  );

  const store = getStore();
  const recipients = ensureRecipients(campaign);
  const subscribersById = new Map(store.subscribers.map((subscriber) => [subscriber.id, subscriber]));
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    const subscriber = subscribersById.get(recipient.subscriberId);
    if (!subscriber) continue;

    const result = await sendPushToSubscriber(campaign, subscriber);
    recipient.status = result.ok ? "Sent" : "Failed";
    recipient.sentAt = result.ok ? new Date().toISOString() : undefined;
    recipient.error = result.ok ? undefined : result.message;
    sentCount += result.ok ? 1 : 0;
    failedCount += result.ok ? 0 : 1;
  }

  campaign.sentCount = sentCount;
  campaign.failedCount = failedCount;
  campaign.sentAt = new Date().toISOString();
  campaign.totalRecipients = recipients.length;

  store.pushEvents.unshift({
    id: newId("evt"),
    tenantId: store.tenant.id,
    campaignId: campaign.id,
    eventType: "Sent test",
    message: "Test delivery completed",
    createdAt: new Date().toISOString()
  });

  recordAuditLog({
    action: "send test",
    actorEmail,
    entityType: "campaign",
    entityId: campaign.id
  });

  return campaign;
}

export async function sendLiveCampaign(input: CampaignInput & { confirmation: string }, actorEmail: string) {
  const store = getStore();
  if (store.appSettings.safety.requireSendConfirmation && input.confirmation !== "SEND") {
    throw new Error("SEND confirmation is required.");
  }

  if (!store.appSettings.safety.liveSendingEnabled && input.audience !== "Selected test subscribers") {
    throw new Error("Live sending is disabled for this audience.");
  }

  const campaign = createCampaign(input, actorEmail, "Queued");
  const recipients = ensureRecipients(campaign);
  const subscribersById = new Map(store.subscribers.map((subscriber) => [subscriber.id, subscriber]));

  store.pushEvents.unshift({
    id: newId("evt"),
    tenantId: store.tenant.id,
    campaignId: campaign.id,
    eventType: "Live send requested",
    message: "Live send requested by owner",
    createdAt: new Date().toISOString()
  });

  campaign.status = "Sending";
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
  campaign.clickCount = 0;
  campaign.clickRate = 0;

  store.pushEvents.unshift({
    id: newId("evt"),
    tenantId: store.tenant.id,
    campaignId: campaign.id,
    eventType: "Send completed",
    message: "Delivery completed",
    createdAt: new Date().toISOString()
  });

  recordAuditLog({
    action: "send live",
    actorEmail,
    entityType: "campaign",
    entityId: campaign.id
  });

  return campaign;
}

export async function sendExistingCampaignLive(campaignId: string, actorEmail: string) {
  const store = getStore();
  const campaign = store.campaigns.find((item) => item.id === campaignId);
  if (!campaign) throw new Error("Campaign not found.");
  if (!store.appSettings.safety.liveSendingEnabled && campaign.audience !== "Selected test subscribers") {
    throw new Error("Live sending is disabled for this audience.");
  }
  if (campaign.status === "Sent" || campaign.status === "Sending") {
    throw new Error("Campaign has already started sending.");
  }

  const recipients = ensureRecipients(campaign);
  const subscribersById = new Map(store.subscribers.map((subscriber) => [subscriber.id, subscriber]));

  store.pushEvents.unshift({
    id: newId("evt"),
    tenantId: store.tenant.id,
    campaignId: campaign.id,
    eventType: "Live send requested",
    message: "Live send requested by campaign sender",
    createdAt: new Date().toISOString()
  });

  campaign.status = "Sending";
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

  store.pushEvents.unshift({
    id: newId("evt"),
    tenantId: store.tenant.id,
    campaignId: campaign.id,
    eventType: "Send completed",
    message: "Delivery completed",
    createdAt: new Date().toISOString()
  });

  recordAuditLog({
    action: "send live",
    actorEmail,
    entityType: "campaign",
    entityId: campaign.id
  });

  return campaign;
}

export function recordCampaignClick(input: { campaignId: string; subscriberId?: string; clickUrl: string }) {
  const store = getStore();
  const campaign = store.campaigns.find((item) => item.id === input.campaignId);
  if (!campaign) return null;

  store.pushClicks.unshift({
    id: newId("clk"),
    tenantId: store.tenant.id,
    campaignId: input.campaignId,
    subscriberId: input.subscriberId,
    clickUrl: input.clickUrl,
    clickedAt: new Date().toISOString()
  });

  const recipient = store.campaignRecipients.find(
    (item) => item.campaignId === input.campaignId && item.subscriberId === input.subscriberId
  );
  if (recipient) recipient.clicked = true;

  campaign.clickCount += 1;
  campaign.clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0;

  return campaign;
}
