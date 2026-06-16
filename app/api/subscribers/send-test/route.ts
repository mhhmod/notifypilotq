import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { subscriberIdSchema } from "@/lib/api/schemas";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  canUseProductionData,
  getSettingsFromData,
  getSupabaseAdminOrThrow,
  getTenant,
  insertEvent
} from "@/lib/data/supabase-repository";
import { recordAuditLog } from "@/services/audit/audit.service";
import { listSubscribers } from "@/services/subscribers/subscribers.service";
import { sendPushToSubscriber } from "@/services/push/push.service";
import type { PushCampaign } from "@/types/domain";

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const limit = checkRateLimit(`subscriber-test:${user.email}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Send limit reached. Try again later." }, { status: 429 });

  const parsed = subscriberIdSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Subscriber is required." }, { status: 400 });

  const subscriber = (await listSubscribers()).find((item) => item.id === parsed.data.subscriberId);
  if (!subscriber) return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });

  const tenant = await getTenant();
  const settings = await getSettingsFromData().catch(() => null);
  const storeName = settings?.brand.storeName ?? "SN2 Studios";
  const clickUrl = settings?.brand.defaultClickUrl || settings?.brand.storeUrl || "https://sn2studios.co";

  const testCampaign = {
    id: `test_${randomUUID()}`,
    tenantId: tenant.id,
    name: "Test push",
    notificationTitle: `${storeName} test`,
    notificationBody: "Your push notifications are working.",
    clickUrl,
    audience: "Selected test subscribers",
    status: "Tested",
    createdAt: new Date().toISOString(),
    totalRecipients: 1,
    sentCount: 0,
    failedCount: 0,
    clickCount: 0,
    clickRate: 0
  } as PushCampaign;

  const result = await sendPushToSubscriber(testCampaign, subscriber);

  if (canUseProductionData()) {
    await insertEvent(getSupabaseAdminOrThrow(), {
      id: randomUUID(),
      tenantId: tenant.id,
      subscriberId: subscriber.id,
      eventType: "Sent test",
      message: result.ok ? "Test push delivered" : `Test push failed: ${result.message}`,
      createdAt: new Date().toISOString()
    });
  }
  recordAuditLog({
    action: "send test",
    actorEmail: user.email,
    entityType: "subscriber",
    entityId: subscriber.id
  });

  if (!result.ok) {
    return NextResponse.json({ error: `Test push failed: ${result.message}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true, status: "Test push sent" });
}
