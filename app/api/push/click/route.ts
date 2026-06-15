import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordCampaignClick } from "@/services/campaigns/campaigns.service";

const schema = z.object({
  campaignId: z.string().min(1),
  subscriberId: z.string().optional(),
  clickUrl: z.string().url()
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  await recordCampaignClick(parsed.data);
  return NextResponse.json({ ok: true });
}
