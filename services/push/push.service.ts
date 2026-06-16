import webpush from "web-push";
import { randomUUID } from "crypto";
import { canUseRealPush, publicEnv, serverEnv } from "@/lib/config/env";
import { getStore, newId } from "@/lib/data/store";
import { canUseProductionData, getSupabaseAdminOrThrow, getTenant, insertEvent } from "@/lib/data/supabase-repository";
import type { PushCampaign, PushSubscriber } from "@/types/domain";

interface PushResult {
  ok: boolean;
  message: string;
}

export async function sendPushToSubscriber(
  campaign: PushCampaign,
  subscriber: PushSubscriber
): Promise<PushResult> {
  const tenant = await getTenant();

  if (
    !subscriber.subscription ||
    !subscriber.subscription.keys?.p256dh ||
    !subscriber.subscription.keys?.auth ||
    !canUseRealPush()
  ) {
    const event = {
      id: canUseProductionData() ? randomUUID() : newId("evt"),
      tenantId: tenant.id,
      campaignId: campaign.id,
      subscriberId: subscriber.id,
      eventType: "Send attempt",
      message: "Delivery attempt recorded",
      createdAt: new Date().toISOString()
    };
    if (canUseProductionData()) await insertEvent(getSupabaseAdminOrThrow(), event);
    else getStore().pushEvents.unshift(event);
    return { ok: true, message: "Delivery attempt recorded" };
  }

  webpush.setVapidDetails(
    serverEnv.vapidSubject,
    publicEnv.vapidPublicKey!,
    serverEnv.vapidPrivateKey!
  );

  const trackingUrl =
    `${publicEnv.appUrl.replace(/\/$/, "")}/api/push/click` +
    `?campaignId=${encodeURIComponent(campaign.id)}` +
    `&subscriberId=${encodeURIComponent(subscriber.id)}` +
    `&clickUrl=${encodeURIComponent(campaign.clickUrl)}`;

  try {
    await webpush.sendNotification(
      subscriber.subscription as webpush.PushSubscription,
      JSON.stringify({
        title: campaign.notificationTitle,
        body: campaign.notificationBody,
        icon: campaign.iconUrl,
        image: campaign.imageUrl,
        clickUrl: campaign.clickUrl,
        campaignId: campaign.id,
        subscriberId: subscriber.id,
        trackingUrl
      })
    );

    return { ok: true, message: "Sent" };
  } catch (error) {
    const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
    if (statusCode === 404 || statusCode === 410) {
      subscriber.status = "Inactive";
      if (canUseProductionData()) {
        await getSupabaseAdminOrThrow()
          .from("np_push_subscribers")
          .update({ status: "Inactive", updated_at: new Date().toISOString() })
          .eq("tenant_id", tenant.id)
          .eq("id", subscriber.id);
      }
    }

    return { ok: false, message: "Push delivery failed" };
  }
}
