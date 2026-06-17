import { NextRequest, NextResponse } from "next/server";
import { subscriberProfileSchema } from "@/lib/api/schemas";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { updateSubscriberProfile } from "@/services/subscribers/subscribers.service";

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const parsed = subscriberProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Subscriber name is required." }, { status: 400 });

  try {
    const result = await updateSubscriberProfile(parsed.data, user.email);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update subscriber." }, { status: 400 });
  }
}
