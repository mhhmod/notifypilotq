import webpush from "web-push";
import { canUseRealPush, publicEnv, serverEnv } from "@/lib/config/env";
import { getStore, newId } from "@/lib/data/store";
import type { PushCampaign, PushSubscriber } from "@/types/domain";

interface PushResult {
  ok: boolean;
  message: string;
}

export async function sendPushToSubscriber(
  campaign: PushCampaign,
  subscriber: PushSubscriber
): Promise<PushResult> {
  const store = getStore();

  if (
    !subscriber.subscription ||
    !subscriber.subscription.keys?.p256dh ||
    !subscriber.subscription.keys?.auth ||
    !canUseRealPush()
  ) {
    store.pushEvents.unshift({
      id: newId("evt"),
      tenantId: store.tenant.id,
      campaignId: campaign.id,
      subscriberId: subscriber.id,
      eventType: "Send attempt",
      message: "Delivery attempt recorded",
      createdAt: new Date().toISOString()
    });
    return { ok: true, message: "Delivery attempt recorded" };
  }

  webpush.setVapidDetails(
    serverEnv.vapidSubject,
    publicEnv.vapidPublicKey!,
    serverEnv.vapidPrivateKey!
  );

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
        subscriberId: subscriber.id
      })
    );

    return { ok: true, message: "Sent" };
  } catch (error) {
    const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
    if (statusCode === 404 || statusCode === 410) {
      subscriber.status = "Inactive";
    }

    return { ok: false, message: "Push delivery failed" };
  }
}
