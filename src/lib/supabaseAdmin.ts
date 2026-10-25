// SERVER ONLY. Uses the secret service_role key (SUPABASE_SERVICE_ROLE_KEY, no NEXT_PUBLIC_ prefix,
// so Next.js never sends it to the browser). Only import this from server actions / server components.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./supabase";

export const hasServiceKey = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL);

export function adminClient() {
  if (!hasServiceKey()) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set on the server.");
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
