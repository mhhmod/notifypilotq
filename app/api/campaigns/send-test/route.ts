import { NextRequest, NextResponse } from "next/server";
import { campaignInputSchema } from "@/lib/api/schemas";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sendTestCampaign } from "@/services/campaigns/campaigns.service";

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const limit = checkRateLimit(`campaign-test:${user.email}`, 30, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Send limit reached. Try again later." }, { status: 429 });

  const parsed = campaignInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Campaign content is incomplete." }, { status: 400 });

  try {
    const campaign = await sendTestCampaign(parsed.data, user.email);
    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send test." }, { status: 400 });
  }
}
