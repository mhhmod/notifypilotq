import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyInternalApiKey } from "@/lib/security/internal-api";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getCampaign, sendExistingCampaignLive } from "@/services/campaigns/campaigns.service";

const schema = z.object({
  campaignId: z.string().optional(),
  dryRun: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  if (!verifyInternalApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const limit = checkRateLimit("n8n-campaign-send", 20, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit reached." }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid campaign request." }, { status: 400 });

  if (parsed.data.dryRun) {
    return NextResponse.json({ ok: true, status: "Campaign Engine Ready", dryRun: true });
  }

  if (!parsed.data.campaignId) {
    return NextResponse.json({ error: "Campaign ID is required." }, { status: 400 });
  }

  const details = getCampaign(parsed.data.campaignId);
  if (!details) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

  const campaign = await sendExistingCampaignLive(details.campaign.id, "n8n");

  return NextResponse.json({ ok: true, campaign });
}
