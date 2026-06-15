import { NextResponse } from "next/server";
import { getDashboardMetrics, getSystemStatus } from "@/services/status/status.service";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";

export async function GET() {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const [status, metrics] = await Promise.all([getSystemStatus(), getDashboardMetrics()]);
  return NextResponse.json({ status, metrics });
}
