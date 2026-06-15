import { NextResponse } from "next/server";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { deleteDraftCampaign } from "@/services/campaigns/campaigns.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const { id } = await params;
  try {
    const result = deleteDraftCampaign(id, user.email);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete campaign." }, { status: 400 });
  }
}
