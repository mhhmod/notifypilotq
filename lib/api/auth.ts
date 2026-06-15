import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

export async function requireApiUser(): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return user;
}

export function isApiResponse(value: SessionUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
