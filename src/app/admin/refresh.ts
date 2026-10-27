"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

/** After an admin edit: rebuild every store page on its next visit, so new logos, pictures and text show at once. */
export async function refreshStore(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !token) return;
  // the caller's own login decides: RLS only returns their admins row if they are a team member
  const db = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data } = await db.auth.getUser(token);
  if (!data.user) return;
  const { data: me } = await db.from("admins").select("status").eq("user_id", data.user.id).maybeSingle();
  if (!me || (me.status ?? "active") !== "active") return;
  revalidatePath("/", "layout");
}
