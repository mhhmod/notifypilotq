import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { unsubscribePush } from "@/services/subscribers/subscribers.service";

const schema = z.object({
  endpoint: z.string().url()
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Endpoint is required." }, { status: 400 });

  const subscriber = unsubscribePush(parsed.data.endpoint);
  return NextResponse.json({ ok: true, subscriberId: subscriber?.id });
}
