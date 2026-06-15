import { NextResponse } from "next/server";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { cancelCampaign } from "@/services/campaigns/campaigns.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const { id } = await params;
  try {
    const campaign = await cancelCampaign(id, user.email);
    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to cancel campaign." }, { status: 400 });
  }
}
