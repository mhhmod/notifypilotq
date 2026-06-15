import { NextRequest, NextResponse } from "next/server";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { getSettings, updateSettings } from "@/services/settings/settings.service";

export async function GET() {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  return NextResponse.json({ settings: await getSettings() });
}

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Settings update is required." }, { status: 400 });

  const settings = await updateSettings(body, user.email);
  return NextResponse.json({ settings });
}
