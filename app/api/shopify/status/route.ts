import { NextResponse } from "next/server";
import { isApiResponse, requireApiUser } from "@/lib/api/auth";
import { getShopifyService } from "@/services/shopify/shopify.service";

export async function GET() {
  const user = await requireApiUser();
  if (isApiResponse(user)) return user;

  const service = await getShopifyService();
  const [shop, instructions] = await Promise.all([
    service.getShopInfo(),
    service.getThemeInstallInstructions()
  ]);

  return NextResponse.json({ shop, instructions });
}
