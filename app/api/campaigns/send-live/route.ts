import { NextRequest, NextResponse } from "next/server";
import { sendLiveSchema } from "@/lib/api/schemas";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sendLiveCampaign } from "@/services/campaigns/campaigns.service";

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const limit = checkRateLimit(`campaign-live:${user.email}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Send limit reached. Try again later." }, { status: 429 });

  const parsed = sendLiveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Campaign content is incomplete." }, { status: 400 });

  try {
    const campaign = await sendLiveCampaign(parsed.data, user.email);
    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send campaign." }, { status: 400 });
  }
}
