import { NextRequest, NextResponse } from "next/server";
import { subscriberIdSchema } from "@/lib/api/schemas";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { deactivateSubscriber } from "@/services/subscribers/subscribers.service";

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const parsed = subscriberIdSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Subscriber is required." }, { status: 400 });

  try {
    const subscriber = await deactivateSubscriber(parsed.data.subscriberId, user.email);
    return NextResponse.json({ subscriber });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to deactivate subscriber." }, { status: 400 });
  }
}
