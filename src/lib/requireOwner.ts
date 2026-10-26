// SERVER ONLY. Used by owner-only server actions (Team, Notifications).
import { adminClient } from "./supabaseAdmin";

/** The caller must be an active owner. The browser sends its own login token; we check it on the server. */
export async function requireOwner(token: string, what = "do this") {
  const db = adminClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new Error("Please sign in again.");
  const { data: me } = await db.from("admins").select("role,status").eq("user_id", data.user.id).maybeSingle();
  if (!me || me.role !== "owner" || (me.status ?? "active") !== "active") throw new Error(`Only owners can ${what}.`);
  return { db, me: data.user };
}
