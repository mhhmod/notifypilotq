import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/config/env";

export function createSupabaseAdminClient() {
  if (!publicEnv.supabaseUrl || !serverEnv.supabaseSecretKey) {
    return null;
  }

  return createClient(publicEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
