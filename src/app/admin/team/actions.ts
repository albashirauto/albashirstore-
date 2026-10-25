"use server";

import { adminClient, hasServiceKey } from "@/lib/supabaseAdmin";

export type Member = {
  user_id: string; name: string | null; username: string | null; email: string | null; phone: string | null;
  role: "owner" | "staff"; permissions: string[]; status: "active" | "disabled";
  title: string | null; avatar: string | null; show_on_about: boolean; created_at: string; last_login: string | null;
};
export type MemberInput = {
  user_id?: string; name: string; username: string; email: string; phone: string;
  role: "owner" | "staff"; permissions: string[]; status: "active" | "disabled";
  title: string; avatar: string; show_on_about: boolean; password?: string;
};
type Result<T = undefined> = { ok: boolean; message?: string; data?: T };

const SETUP = "Team needs the server key: add SUPABASE_SERVICE_ROLE_KEY to .env.local (and on Vercel).";

/** The caller must be an active owner. The browser sends its own login token; we check it on the server. */
async function requireOwner(token: string) {
  const db = adminClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new Error("Please sign in again.");
  const { data: me } = await db.from("admins").select("role,status").eq("user_id", data.user.id).maybeSingle();
  if (!me || me.role !== "owner" || (me.status ?? "active") !== "active") throw new Error("Only owners can manage the team.");
  return { db, me: data.user };
}

const clean = (i: MemberInput) => ({
  name: i.name.trim() || null, username: i.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "") || null,
  phone: i.phone.trim() || null, role: i.role === "owner" ? "owner" : "staff",
  permissions: i.role === "owner" ? [] : [...new Set(i.permissions.filter((p) => p.startsWith("/admin")))],
  status: i.status === "disabled" ? "disabled" : "active", title: i.title.trim() || null, avatar: i.avatar.trim() || null, show_on_about: !!i.show_on_about,
});

/** Never leave the shop without an active owner. */
async function ownersLeft(db: ReturnType<typeof adminClient>, exceptId: string) {
  const { count } = await db.from("admins").select("user_id", { count: "exact", head: true }).eq("role", "owner").eq("status", "active").neq("user_id", exceptId);
  return count ?? 0;
}

export async function listTeam(token: string): Promise<Result<Member[]>> {
  if (!hasServiceKey()) return { ok: false, message: SETUP };
  try {
    const { db } = await requireOwner(token);
    const [{ data: rows, error }, { data: users }] = await Promise.all([
      db.from("admins").select("*").order("created_at"),
      db.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    if (error) throw error;
    const seen = new Map((users?.users ?? []).map((u) => [u.id, u]));
    return {
      ok: true,
      data: (rows ?? []).map((r) => ({
        ...r, permissions: r.permissions ?? [], role: r.role ?? "staff", status: r.status ?? "active", show_on_about: !!r.show_on_about,
        email: seen.get(r.user_id)?.email ?? r.email, last_login: seen.get(r.user_id)?.last_sign_in_at ?? null,
      })) as Member[],
    };
  } catch (e) { return { ok: false, message: (e as Error).message }; }
}

export async function saveMember(token: string, input: MemberInput): Promise<Result> {
  if (!hasServiceKey()) return { ok: false, message: SETUP };
  try {
    const { db, me } = await requireOwner(token);
    const email = input.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Enter a valid email." };
    if (!input.name.trim()) return { ok: false, message: "Enter a name." };
    const row = clean(input);
    if (input.password && input.password.length < 8) return { ok: false, message: "Password must be at least 8 characters." };

    if (!input.user_id) {
      if (!input.password) return { ok: false, message: "Set a password for the new member (at least 8 characters)." };
      const { data, error } = await db.auth.admin.createUser({ email, password: input.password, email_confirm: true, user_metadata: { name: row.name } });
      if (error) return { ok: false, message: error.message.includes("already") ? "That email already has a login." : error.message };
      const { error: e2 } = await db.from("admins").insert({ user_id: data.user.id, email, ...row });
      if (e2) { await db.auth.admin.deleteUser(data.user.id); return { ok: false, message: e2.message.includes("username") ? "That username is taken." : e2.message }; }
      return { ok: true, message: `${row.name} added.` };
    }

    // editing: keep at least one active owner, and you cannot lock yourself out
    const demoting = row.role !== "owner" || row.status !== "active";
    if (demoting && (await ownersLeft(db, input.user_id)) === 0) return { ok: false, message: "Keep at least one active owner." };
    if (input.user_id === me.id && row.status !== "active") return { ok: false, message: "You cannot disable your own account." };

    const auth: { email?: string; password?: string; email_confirm?: boolean } = {};
    if (email) { auth.email = email; auth.email_confirm = true; }
    if (input.password) auth.password = input.password;
    const { error: e1 } = await db.auth.admin.updateUserById(input.user_id, auth);
    if (e1) return { ok: false, message: e1.message };
    const { error: e2 } = await db.from("admins").update({ email, ...row }).eq("user_id", input.user_id);
    if (e2) return { ok: false, message: e2.message.includes("username") ? "That username is taken." : e2.message };
    // a disabled member is signed out everywhere
    if (row.status === "disabled") await db.auth.admin.signOut(input.user_id).catch(() => {});
    return { ok: true, message: "Saved." };
  } catch (e) { return { ok: false, message: (e as Error).message }; }
}

export async function setMemberPassword(token: string, userId: string, password: string): Promise<Result> {
  if (!hasServiceKey()) return { ok: false, message: SETUP };
  try {
    const { db } = await requireOwner(token);
    if (password.length < 8) return { ok: false, message: "Password must be at least 8 characters." };
    const { error } = await db.auth.admin.updateUserById(userId, { password });
    return error ? { ok: false, message: error.message } : { ok: true, message: "Password changed. Give it to the member yourself." };
  } catch (e) { return { ok: false, message: (e as Error).message }; }
}

export async function removeMember(token: string, userId: string): Promise<Result> {
  if (!hasServiceKey()) return { ok: false, message: SETUP };
  try {
    const { db, me } = await requireOwner(token);
    if (userId === me.id) return { ok: false, message: "You cannot remove yourself." };
    if ((await ownersLeft(db, userId)) === 0) return { ok: false, message: "Keep at least one active owner." };
    await db.from("admins").delete().eq("user_id", userId);
    const { error } = await db.auth.admin.deleteUser(userId);
    return error ? { ok: false, message: error.message } : { ok: true, message: "Member removed and login deleted." };
  } catch (e) { return { ok: false, message: (e as Error).message }; }
}
