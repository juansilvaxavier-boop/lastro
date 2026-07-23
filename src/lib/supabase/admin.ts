import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { SUPABASE_URL } from "./config";

/**
 * Cliente com service_role — ignora RLS. Uso exclusivo em Route Handlers de
 * jobs de sistema (conectores Bacen/IBGE/CVM, scheduler de alertas,
 * recalculo de scores). Nunca importar em codigo que roda no browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
