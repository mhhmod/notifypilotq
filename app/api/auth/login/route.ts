import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionCookie, validateLogin } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const user = await validateLogin(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "The email or password is incorrect." }, { status: 401 });
  }

  await createSessionCookie(user);
  return NextResponse.json({ user });
}
