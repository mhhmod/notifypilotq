import { NextResponse } from "next/server";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { duplicateCampaign } from "@/services/campaigns/campaigns.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const { id } = await params;
  try {
    const campaign = duplicateCampaign(id, user.email);
    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to duplicate campaign." }, { status: 400 });
  }
}
