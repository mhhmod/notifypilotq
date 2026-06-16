import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { serverEnv } from "@/lib/config/env";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim().toLowerCase() ?? "";
}

function hash(value: string) {
  return createHmac("sha256", serverEnv.authSessionSecret)
    .update(value)
    .digest("hex");
}

export function getClientIpHash(request: NextRequest) {
  const ip =
    firstHeaderValue(request.headers.get("cf-connecting-ip")) ||
    firstHeaderValue(request.headers.get("x-forwarded-for")) ||
    firstHeaderValue(request.headers.get("x-real-ip")) ||
    "unknown";

  return hash(`ip:${ip}`).slice(0, 32);
}

export function getDiscountClaimFingerprint(request: NextRequest, storeUrl: string) {
  const ipHash = getClientIpHash(request);
  const userAgent = request.headers.get("user-agent")?.trim().toLowerCase() ?? "";
  const language = firstHeaderValue(request.headers.get("accept-language"));
  const platform = request.headers.get("sec-ch-ua-platform")?.trim().toLowerCase() ?? "";
  const mobile = request.headers.get("sec-ch-ua-mobile")?.trim().toLowerCase() ?? "";

  return hash(
    [
      "discount-claim",
      storeUrl.replace(/\/$/, "").toLowerCase(),
      ipHash,
      userAgent,
      language,
      platform,
      mobile
    ].join("|")
  ).slice(0, 48);
}
