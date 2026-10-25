import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when .env.local is filled in. When false the site runs on built-in demo data. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("YOUR-PROJECT"));

/** For server components / server actions (public reads and order inserts). */
export function serverClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

let browser: ReturnType<typeof createBrowserClient> | null = null;
/** For the admin panel (needs the logged-in session). */
export function browserClient() {
  if (!browser) browser = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return browser;
}
