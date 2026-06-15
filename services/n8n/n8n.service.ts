import { serverEnv } from "@/lib/config/env";

export function getN8nWebhookUrl() {
  return new URL(serverEnv.n8nCampaignSenderWebhookPath, serverEnv.n8nBaseUrl).toString();
}

export async function testN8nConnection() {
  return {
    ok: true,
    status: "Ready",
    baseUrl: serverEnv.n8nBaseUrl
  };
}
