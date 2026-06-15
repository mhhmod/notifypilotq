import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { subscriberIdSchema } from "@/lib/api/schemas";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { canUseProductionData, getSupabaseAdminOrThrow, getTenant, insertEvent } from "@/lib/data/supabase-repository";
import { recordAuditLog } from "@/services/audit/audit.service";
import { listSubscribers } from "@/services/subscribers/subscribers.service";

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
  const event = {
    id: randomUUID(),
    tenantId: tenant.id,
    subscriberId: subscriber.id,
    eventType: "Sent test",
    message: "Test delivery recorded for subscriber",
    createdAt: new Date().toISOString()
  };
  if (canUseProductionData()) await insertEvent(getSupabaseAdminOrThrow(), event);
  recordAuditLog({
    action: "send test",
    actorEmail: user.email,
    entityType: "subscriber",
    entityId: subscriber.id
  });

  return NextResponse.json({ ok: true, status: "Test delivery recorded" });
}
