import { NextRequest } from "next/server";
import { serverEnv } from "@/lib/config/env";

export function verifyInternalApiKey(request: NextRequest) {
  const expected = serverEnv.internalApiKey;
  if (!expected) return false;

  const provided = request.headers.get("x-internal-api-key");
  return provided === expected;
}
