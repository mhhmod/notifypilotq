import { NextRequest, NextResponse } from "next/server";
import { campaignInputSchema } from "@/lib/api/schemas";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { createCampaign } from "@/services/campaigns/campaigns.service";

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const parsed = campaignInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Campaign content is incomplete." }, { status: 400 });

  try {
    const status = parsed.data.sendMode === "Schedule for later" ? "Scheduled" : "Draft";
    const campaign = await createCampaign(parsed.data, user.email, status);
    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create campaign." }, { status: 400 });
  }
}
