import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "NotifyPilot",
    status: "healthy",
    checkedAt: new Date().toISOString()
  });
}
