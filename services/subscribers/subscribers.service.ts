import { createHash, randomUUID } from "crypto";
import { getStore, newId } from "@/lib/data/store";
import {
  canUseProductionData,
  getSupabaseAdminOrThrow,
  getTenant,
  insertActivity,
  insertEvent,
  listSubscribersFromData,
  subscriberToRow
} from "@/lib/data/supabase-repository";
import type { PushSubscriber, PushSubscriptionPayload } from "@/types/domain";
import { recordAuditLog } from "@/services/audit/audit.service";

export async function listSubscribers() {
  return listSubscribersFromData();
}

export async function getSubscriberSummary() {
  const subscribers = await listSubscribers();
  const total = subscribers.length;
  const active = subscribers.filter((subscriber) => subscriber.status === "Active").length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return {
    total,
    active,
    inactive: total - active,
    newThisWeek: subscribers.filter((subscriber) => new Date(subscriber.subscribedAt).getTime() >= weekAgo).length
  };
}

function hashEndpoint(endpoint: string) {
  return `endpoint_${createHash("sha256").update(endpoint).digest("hex").slice(0, 24)}`;
}

function cleanLabel(value: string | undefined, fallback?: string) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, 120) : fallback;
}

function shouldReplaceGeneratedVisitor(value: string) {
  return /^Visitor( WEB)?[-\s]\d+$/i.test(value) || value === "Not provided";
}

export async function deactivateSubscriber(subscriberId: string, actorEmail: string) {
  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const tenant = await getTenant();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("np_push_subscribers")
      .update({ status: "Inactive", last_seen_at: now, updated_at: now })
      .eq("tenant_id", tenant.id)
      .eq("id", subscriberId)
      .select("*")
      .maybeSingle();

    if (error) throw new Error(`Deactivate subscriber failed: ${error.message}`);
    if (!data) throw new Error("Subscriber not found.");

    await insertEvent(supabase, {
      id: randomUUID(),
      tenantId: tenant.id,
      subscriberId,
      eventType: "Subscriber deactivated",
      message: "Subscriber deactivated",
      createdAt: now
    });
    recordAuditLog({
      action: "subscriber deactivate",
      actorEmail,
      entityType: "subscriber",
      entityId: subscriberId
    });

    return {
      id: data.id,
      tenantId: data.tenant_id,
      displayName: data.display_name,
      browser: data.browser,
      device: data.device,
      country: data.country,
      status: data.status,
      subscribedAt: data.subscribed_at,
      lastSeenAt: data.last_seen_at,
      endpointHash: data.endpoint_hash,
      isOwnerAllowed: Boolean(data.is_owner_allowed),
      subscription: data.subscription_payload ?? undefined
    } satisfies PushSubscriber;
  }

  const store = getStore();
  const subscriber = store.subscribers.find((item) => item.id === subscriberId);
  if (!subscriber) throw new Error("Subscriber not found.");

  subscriber.status = "Inactive";
  subscriber.lastSeenAt = new Date().toISOString();

  store.pushEvents.unshift({
    id: newId("evt"),
    tenantId: store.tenant.id,
    subscriberId,
    eventType: "Subscriber deactivated",
    message: "Subscriber deactivated",
    createdAt: new Date().toISOString()
  });

  recordAuditLog({
    action: "subscriber deactivate",
    actorEmail,
    entityType: "subscriber",
    entityId: subscriberId
  });

  return subscriber;
}

export async function registerSubscriber(input: {
  subscription: PushSubscriptionPayload;
  displayName?: string;
  browser?: string;
  device?: string;
  country?: string;
}) {
  const endpointHash = hashEndpoint(input.subscription.endpoint);

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const tenant = await getTenant();
    const now = new Date().toISOString();
    const { data: existing, error: existingError } = await supabase
      .from("np_push_subscribers")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("endpoint_hash", endpointHash)
      .maybeSingle();

    if (existingError) throw new Error(`Load subscriber failed: ${existingError.message}`);

    if (existing) {
      const nextDisplayName = cleanLabel(input.displayName);
      const nextCountry = cleanLabel(input.country);
      const { data, error } = await supabase
        .from("np_push_subscribers")
        .update({
          status: "Active",
          ...(nextDisplayName && shouldReplaceGeneratedVisitor(existing.display_name)
            ? { display_name: nextDisplayName }
            : {}),
          ...(nextCountry && shouldReplaceGeneratedVisitor(existing.country)
            ? { country: nextCountry }
            : {}),
          last_seen_at: now,
          subscription_payload: input.subscription,
          updated_at: now
        })
        .eq("tenant_id", tenant.id)
        .eq("endpoint_hash", endpointHash)
        .select("*")
        .maybeSingle();

      if (error) throw new Error(`Update subscriber failed: ${error.message}`);
      if (!data) throw new Error("Subscriber not found after update.");

      return {
        id: data.id,
        tenantId: data.tenant_id,
        displayName: data.display_name,
        browser: data.browser,
        device: data.device,
        country: data.country,
        status: data.status,
        subscribedAt: data.subscribed_at,
        lastSeenAt: data.last_seen_at,
        endpointHash: data.endpoint_hash,
        isOwnerAllowed: Boolean(data.is_owner_allowed),
        subscription: data.subscription_payload ?? undefined
      } satisfies PushSubscriber;
    }

    const { count, error: countError } = await supabase
      .from("np_push_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id);
    if (countError) throw new Error(`Count subscribers failed: ${countError.message}`);

    const subscriber: PushSubscriber = {
      id: randomUUID(),
      tenantId: tenant.id,
      displayName:
        cleanLabel(input.displayName) ?? `Visitor ${String((count ?? 0) + 1001).padStart(4, "0")}`,
      browser: input.browser ?? "Chrome",
      device: input.device ?? "Browser",
      country: cleanLabel(input.country, "Not provided") ?? "Not provided",
      status: "Active",
      subscribedAt: now,
      lastSeenAt: now,
      endpointHash,
      isOwnerAllowed: false,
      subscription: input.subscription
    };

    const { error } = await supabase
      .from("np_push_subscribers")
      .upsert(subscriberToRow(subscriber), { onConflict: "tenant_id,endpoint_hash" });
    if (error) throw new Error(`Save subscriber failed: ${error.message}`);

    await insertEvent(supabase, {
      id: randomUUID(),
      tenantId: tenant.id,
      subscriberId: subscriber.id,
      eventType: "Subscriber collection",
      message: "Subscriber collected from storefront",
      createdAt: now
    });
    await insertActivity(supabase, {
      id: randomUUID(),
      tenantId: tenant.id,
      subscriberId: subscriber.id,
      activityType: "Subscriber created",
      message: "Subscriber collected from storefront",
      createdAt: now
    });
    recordAuditLog({
      action: "subscriber created",
      actorEmail: "system@notifypilot",
      entityType: "subscriber",
      entityId: subscriber.id
    });

    return subscriber;
  }

  const store = getStore();
  const existing = store.subscribers.find((subscriber) => subscriber.endpointHash === endpointHash);
  if (existing) {
    const nextDisplayName = cleanLabel(input.displayName);
    const nextCountry = cleanLabel(input.country);
    existing.status = "Active";
    existing.lastSeenAt = new Date().toISOString();
    existing.subscription = input.subscription;
    if (nextDisplayName && shouldReplaceGeneratedVisitor(existing.displayName)) {
      existing.displayName = nextDisplayName;
    }
    if (nextCountry && shouldReplaceGeneratedVisitor(existing.country)) {
      existing.country = nextCountry;
    }
    return existing;
  }

  const subscriber: PushSubscriber = {
    id: randomUUID(),
    tenantId: store.tenant.id,
    displayName: cleanLabel(input.displayName) ?? `Visitor WEB-${1000 + store.subscribers.length + 1}`,
    browser: input.browser ?? "Chrome",
    device: input.device ?? "Browser",
    country: cleanLabel(input.country, "Not provided") ?? "Not provided",
    status: "Active",
    subscribedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    endpointHash,
    isOwnerAllowed: false,
    subscription: input.subscription
  };

  store.subscribers.unshift(subscriber);
  store.pushEvents.unshift({
    id: newId("evt"),
    tenantId: store.tenant.id,
    subscriberId: subscriber.id,
    eventType: "Subscriber collection",
    message: "Subscriber collected from storefront",
    createdAt: new Date().toISOString()
  });
  store.subscriberActivity.unshift({
    id: newId("act"),
    tenantId: store.tenant.id,
    subscriberId: subscriber.id,
    activityType: "Subscriber created",
    message: "Subscriber collected from storefront",
    createdAt: new Date().toISOString()
  });

  recordAuditLog({
    action: "subscriber created",
    actorEmail: "system@notifypilot",
    entityType: "subscriber",
    entityId: subscriber.id
  });

  return subscriber;
}

export async function unsubscribePush(endpoint: string) {
  const endpointHash = hashEndpoint(endpoint);
  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const tenant = await getTenant();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("np_push_subscribers")
      .update({ status: "Inactive", last_seen_at: now, updated_at: now })
      .eq("tenant_id", tenant.id)
      .eq("endpoint_hash", endpointHash)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Unsubscribe failed: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id,
      tenantId: data.tenant_id,
      displayName: data.display_name,
      browser: data.browser,
      device: data.device,
      country: data.country,
      status: data.status,
      subscribedAt: data.subscribed_at,
      lastSeenAt: data.last_seen_at,
      endpointHash: data.endpoint_hash,
      isOwnerAllowed: Boolean(data.is_owner_allowed),
      subscription: data.subscription_payload ?? undefined
    } satisfies PushSubscriber;
  }

  const store = getStore();
  const subscriber = store.subscribers.find((item) => item.endpointHash === endpointHash);
  if (!subscriber) return null;

  subscriber.status = "Inactive";
  subscriber.lastSeenAt = new Date().toISOString();
  return subscriber;
}
