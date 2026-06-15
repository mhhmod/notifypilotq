import { NextResponse } from "next/server";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { getSubscriberSummary, listSubscribers } from "@/services/subscribers/subscribers.service";

export async function GET() {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  return NextResponse.json({
    subscribers: listSubscribers(),
    summary: getSubscriberSummary()
  });
}
