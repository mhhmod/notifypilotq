import { createHash, randomUUID } from "crypto";
import { getStore, newId } from "@/lib/data/store";
import {
  canUseProductionData,
  getSupabaseAdminOrThrow,
  getTenant,
  insertActivity,
  insertEvent,
  listSubscriberGroupsFromData,
  listSubscriberGroupMembershipsFromData,
  listSubscribersFromData,
  subscriberGroupMembershipToRow,
  subscriberGroupToRow,
  subscriberToRow
} from "@/lib/data/supabase-repository";
import type { PushSubscriber, PushSubscriptionPayload, SubscriberGroup, SubscriberGroupMembership } from "@/types/domain";
import { recordAuditLog } from "@/services/audit/audit.service";

export async function listSubscribers() {
  return listSubscribersFromData();
}

export async function listSubscriberGroups() {
  return listSubscriberGroupsFromData();
}

export async function listSubscriberGroupMemberships() {
  return listSubscriberGroupMembershipsFromData();
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

function isSubscriberGroupSchemaMissingError(error: unknown) {
  const value = error as { code?: string; message?: string } | null;
  const message = value?.message ?? (error instanceof Error ? error.message : "");
  return Boolean(
    value?.code === "42P01" ||
      value?.code === "42703" ||
      value?.code === "PGRST205" ||
      /np_subscriber_group|schema cache|could not find the table/i.test(message)
  );
}

function isDuplicateSubscriberGroupError(error: unknown) {
  const value = error as { code?: string; message?: string } | null;
  return Boolean(value?.code === "23505" || /duplicate key|already exists/i.test(value?.message ?? ""));
}

function subscriberGroupsUnavailableMessage() {
  return "Subscriber groups need the latest database update before they can be used. Apply the subscriber groups migration, then refresh.";
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

export async function updateSubscriberProfile(input: { subscriberId: string; displayName: string }, actorEmail: string) {
  const displayName = cleanLabel(input.displayName);
  if (!displayName) throw new Error("Subscriber name is required.");

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const tenant = await getTenant();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("np_push_subscribers")
      .update({ display_name: displayName, updated_at: now })
      .eq("tenant_id", tenant.id)
      .eq("id", input.subscriberId)
      .select("*")
      .maybeSingle();

    if (error) throw new Error(`Update subscriber failed: ${error.message}`);
    if (!data) throw new Error("Subscriber not found.");

    await insertActivity(supabase, {
      id: randomUUID(),
      tenantId: tenant.id,
      subscriberId: input.subscriberId,
      activityType: "Subscriber updated",
      message: "Subscriber name updated",
      metadata: { displayName },
      createdAt: now
    });
  } else {
    const store = getStore();
    const subscriber = store.subscribers.find((item) => item.id === input.subscriberId);
    if (!subscriber) throw new Error("Subscriber not found.");
    subscriber.displayName = displayName;
    subscriber.lastSeenAt = new Date().toISOString();
    store.subscriberActivity.unshift({
      id: newId("act"),
      tenantId: store.tenant.id,
      subscriberId: input.subscriberId,
      activityType: "Subscriber updated",
      message: "Subscriber name updated",
      metadata: { displayName },
      createdAt: new Date().toISOString()
    });
  }

  recordAuditLog({
    action: "subscriber update",
    actorEmail,
    entityType: "subscriber",
    entityId: input.subscriberId,
    metadata: { displayName }
  });

  return { ok: true };
}

export async function createSubscriberGroup(input: { name: string; description?: string }, actorEmail: string) {
  const name = cleanLabel(input.name);
  if (!name) throw new Error("Group name is required.");
  const now = new Date().toISOString();
  const tenant = await getTenant();
  const group: SubscriberGroup = {
    id: canUseProductionData() ? randomUUID() : newId("grp"),
    tenantId: tenant.id,
    name,
    description: cleanLabel(input.description),
    createdAt: now,
    updatedAt: now
  };

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    const { error } = await supabase.from("np_subscriber_groups").insert(subscriberGroupToRow(group));
    if (isSubscriberGroupSchemaMissingError(error)) throw new Error(subscriberGroupsUnavailableMessage());
    if (isDuplicateSubscriberGroupError(error)) throw new Error("A group with this name already exists.");
    if (error) throw new Error(`Create subscriber group failed: ${error.message}`);
  } else {
    const store = getStore();
    if (store.subscriberGroups.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("A group with this name already exists.");
    }
    store.subscriberGroups.push(group);
  }

  recordAuditLog({
    action: "subscriber group create",
    actorEmail,
    entityType: "subscriber_group",
    entityId: group.id,
    metadata: { name }
  });

  return group;
}

export async function setSubscriberGroupMembership(
  input: { subscriberId: string; groupId: string; assigned: boolean },
  actorEmail: string
) {
  const tenant = await getTenant();
  const now = new Date().toISOString();

  if (canUseProductionData()) {
    const supabase = getSupabaseAdminOrThrow();
    if (input.assigned) {
      const membership: SubscriberGroupMembership = {
        tenantId: tenant.id,
        groupId: input.groupId,
        subscriberId: input.subscriberId,
        createdAt: now
      };
      const { error } = await supabase
        .from("np_subscriber_group_members")
        .upsert(subscriberGroupMembershipToRow(membership), { onConflict: "group_id,subscriber_id" });
      if (isSubscriberGroupSchemaMissingError(error)) throw new Error(subscriberGroupsUnavailableMessage());
      if (error) throw new Error(`Assign group failed: ${error.message}`);
    } else {
      const { error } = await supabase
        .from("np_subscriber_group_members")
        .delete()
        .eq("tenant_id", tenant.id)
        .eq("group_id", input.groupId)
        .eq("subscriber_id", input.subscriberId);
      if (isSubscriberGroupSchemaMissingError(error)) throw new Error(subscriberGroupsUnavailableMessage());
      if (error) throw new Error(`Remove group failed: ${error.message}`);
    }
  } else {
    const store = getStore();
    if (input.assigned) {
      const exists = store.subscriberGroupMemberships.some(
        (membership) => membership.groupId === input.groupId && membership.subscriberId === input.subscriberId
      );
      if (!exists) {
        store.subscriberGroupMemberships.push({
          tenantId: tenant.id,
          groupId: input.groupId,
          subscriberId: input.subscriberId,
          createdAt: now
        });
      }
    } else {
      store.subscriberGroupMemberships = store.subscriberGroupMemberships.filter(
        (membership) => !(membership.groupId === input.groupId && membership.subscriberId === input.subscriberId)
      );
    }
  }

  recordAuditLog({
    action: input.assigned ? "subscriber group assign" : "subscriber group remove",
    actorEmail,
    entityType: "subscriber",
    entityId: input.subscriberId,
    metadata: { groupId: input.groupId }
  });

  return { ok: true };
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
