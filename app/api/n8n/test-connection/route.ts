import { NextResponse } from "next/server";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { testN8nConnection } from "@/services/n8n/n8n.service";

export async function POST() {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const result = await testN8nConnection();
  return NextResponse.json({
    ...result,
    message: "Campaign sender webhook status: Ready"
  });
}
