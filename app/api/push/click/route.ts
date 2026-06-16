import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordCampaignClick } from "@/services/campaigns/campaigns.service";

const schema = z.object({
  campaignId: z.string().min(1),
  subscriberId: z.string().optional(),
  clickUrl: z.string().url()
});

// The service worker fires a `no-cors` request on notification click, which
// cannot carry a JSON body, so the tracking data arrives as query params.
// A JSON body is still accepted as a fallback.
async function resolveInput(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const fromQuery = {
    campaignId: sp.get("campaignId") ?? undefined,
    subscriberId: sp.get("subscriberId") || undefined,
    clickUrl: sp.get("clickUrl") ?? undefined
  };
  if (fromQuery.campaignId && fromQuery.clickUrl) return fromQuery;
  const body = await request.json().catch(() => null);
  return body ?? fromQuery;
}

async function handle(request: NextRequest) {
  const parsed = schema.safeParse(await resolveInput(request));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  await recordCampaignClick(parsed.data);
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
