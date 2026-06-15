import { NextResponse } from "next/server";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { listCampaigns } from "@/services/campaigns/campaigns.service";

export async function GET() {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  return NextResponse.json({ campaigns: await listCampaigns() });
}
