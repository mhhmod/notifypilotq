import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/config/env";

export function createClient() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabasePublishableKey) {
    throw new Error("Supabase browser client is not configured.");
  }

  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey);
}
