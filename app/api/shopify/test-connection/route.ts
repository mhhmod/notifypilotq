import { NextResponse } from "next/server";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { getShopifyService } from "@/services/shopify/shopify.service";
import { recordAuditLog } from "@/services/audit/audit.service";

export async function POST() {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const service = await getShopifyService();
  const result = await service.verifyConnection();
  recordAuditLog({
    action: "store connection test",
    actorEmail: user.email,
    entityType: "integration"
  });

  return NextResponse.json(result);
}
