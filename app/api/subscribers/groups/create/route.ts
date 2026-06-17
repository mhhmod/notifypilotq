import { NextRequest, NextResponse } from "next/server";
import { subscriberGroupCreateSchema } from "@/lib/api/schemas";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { createSubscriberGroup } from "@/services/subscribers/subscribers.service";

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const parsed = subscriberGroupCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Group name is required." }, { status: 400 });

  try {
    const group = await createSubscriberGroup(parsed.data, user.email);
    return NextResponse.json({ group });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create group." }, { status: 400 });
  }
}
