import { createHash, randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStore, newId } from "@/lib/data/store";
import type { PushSubscriptionPayload } from "@/types/domain";
import { recordAuditLog } from "@/services/audit/audit.service";

export function listSubscribers() {
  return [...getStore().subscribers].sort(
    (left, right) => new Date(right.subscribedAt).getTime() - new Date(left.subscribedAt).getTime()
  );
}

export function getSubscriberSummary() {
  const subscribers = getStore().subscribers;
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

function toSubscriberRow(subscriber: ReturnType<typeof listSubscribers>[number]) {
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

export function deactivateSubscriber(subscriberId: string, actorEmail: string) {
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
  browser?: string;
  device?: string;
  country?: string;
}) {
  const store = getStore();
  const endpointHash = hashEndpoint(input.subscription.endpoint);
  const existing = store.subscribers.find((subscriber) => subscriber.endpointHash === endpointHash);
  const supabase = createSupabaseAdminClient();

  if (existing) {
    existing.status = "Active";
    existing.lastSeenAt = new Date().toISOString();
    existing.subscription = input.subscription;
    if (supabase) {
      await supabase
        .from("push_subscribers")
        .update({
          status: existing.status,
          last_seen_at: existing.lastSeenAt,
          subscription_payload: existing.subscription
        })
        .eq("tenant_id", existing.tenantId)
        .eq("endpoint_hash", existing.endpointHash);
    }
    return existing;
  }

  const subscriber = {
    id: randomUUID(),
    tenantId: store.tenant.id,
    displayName: `Visitor AUR-${1000 + store.subscribers.length + 1}`,
    browser: input.browser ?? "Chrome",
    device: input.device ?? "Browser",
    country: input.country ?? "Not provided",
    status: "Active" as const,
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

  if (supabase) {
    await supabase.from("push_subscribers").upsert(toSubscriberRow(subscriber), { onConflict: "tenant_id,endpoint_hash" });
    await supabase.from("subscriber_activity").insert({
      id: randomUUID(),
      tenant_id: store.tenant.id,
      subscriber_id: subscriber.id,
      activity_type: "Subscriber created",
      message: "Subscriber collected from storefront",
      created_at: new Date().toISOString()
    });
  }

  recordAuditLog({
    action: "subscriber created",
    actorEmail: "system@notifypilot",
    entityType: "subscriber",
    entityId: subscriber.id
  });

  return subscriber;
}

export function unsubscribePush(endpoint: string) {
  const store = getStore();
  const endpointHash = hashEndpoint(endpoint);
  const subscriber = store.subscribers.find((item) => item.endpointHash === endpointHash);
  if (!subscriber) return null;

  subscriber.status = "Inactive";
  subscriber.lastSeenAt = new Date().toISOString();
  return subscriber;
}
