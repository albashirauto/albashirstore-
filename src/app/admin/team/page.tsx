"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, ServerCog, Trash2, UserCheck, UserX } from "lucide-react";
import MemberPanel from "@/components/admin/team/MemberPanel";
import ResetEmailsCard from "@/components/admin/team/ResetEmailsCard";
import { ago } from "@/components/admin/dashboard/types";
import { GRANTABLE } from "@/lib/admin-config";
import { browserClient } from "@/lib/supabase";
import { listTeam, removeMember, saveMember, setMemberPassword, type Member, type MemberInput } from "./actions";

/** Team: owners + staff with permissions. Every change is checked on the server (owner only). */
export default function Team() {
  const db = browserClient();
  const [rows, setRows] = useState<Member[]>([]);
  const [me, setMe] = useState("");
  const [state, setState] = useState<"loading" | "ok" | "setup" | "error">("loading");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [panel, setPanel] = useState<{ open: boolean; m: Member | null }>({ open: false, m: null });

  const token = async () => (await db.auth.getSession()).data.session?.access_token ?? "";
  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 4000); };

  const load = useCallback(async () => {
    const { data } = await db.auth.getUser();
    setMe(data.user?.id ?? "");
    const r = await listTeam(await token());
    if (r.ok) { setRows(r.data ?? []); setState("ok"); }
    else { setState(r.message?.includes("SUPABASE_SERVICE_ROLE_KEY") ? "setup" : "error"); setMsg({ ok: false, t: r.message ?? "Could not load the team." }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);
  useEffect(() => { load(); }, [load]);

  const save = async (i: MemberInput) => {
    const r = await saveMember(await token(), i);
    if (!r.ok) return r.message ?? "Could not save.";
    setPanel({ open: false, m: null }); flash(true, r.message ?? "Saved."); load();
    return null;
  };
  const newPassword = async (m: Member) => {
    const pw = prompt(`New password for ${m.name ?? m.email} (at least 8 characters).\nYou will give it to them yourself.`);
    if (!pw) return;
    const r = await setMemberPassword(await token(), m.user_id, pw);
    flash(r.ok, r.message ?? "");
  };
  const emailMe = async (m: Member) => {
    const { error } = await db.auth.resetPasswordForEmail(m.email ?? "", { redirectTo: `${window.location.origin}/admin/reset` });
    flash(!error, error ? error.message : `Reset link sent to ${m.email}.`);
  };
  const toggleStatus = async (m: Member) => {
    const r = await saveMember(await token(), { user_id: m.user_id, name: m.name ?? "", username: m.username ?? "", email: m.email ?? "", phone: m.phone ?? "", role: m.role, permissions: m.permissions, status: m.status === "active" ? "disabled" : "active", title: m.title ?? "", avatar: m.avatar ?? "", show_on_about: m.show_on_about });
    flash(r.ok, r.ok ? (m.status === "active" ? `${m.name} disabled and signed out.` : `${m.name} can sign in again.`) : r.message ?? "");
    load();
  };
  const remove = async (m: Member) => {
    if (!confirm(`Remove ${m.name ?? m.email}? Their login is deleted and cannot be undone.`)) return;
    const r = await removeMember(await token(), m.user_id);
    flash(r.ok, r.message ?? ""); load();
  };

  const active = rows.filter((r) => r.status === "active").length;
  const permLabel = (m: Member) => m.role === "owner" ? "Full access" : m.permissions.length === 0 ? "Nothing yet" : m.permissions.length >= GRANTABLE.length ? "All sections" : GRANTABLE.filter((g) => m.permissions.includes(g.href)).map((g) => g.label).slice(0, 3).join(", ") + (m.permissions.length > 3 ? ` +${m.permissions.length - 3}` : "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">Team</h1>
          <p className="mt-1.5 text-muted">{active} active member{active === 1 ? "" : "s"}. Owners have full access; staff only see what you allow. Only owners can open this page, and only you set team passwords.</p>
        </div>
        <button onClick={() => setPanel({ open: true, m: null })} disabled={state !== "ok"} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-50"><Plus size={18} />Add team member</button>
      </div>

      <ResetEmailsCard />

      {state === "setup" && (
        <div className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm">
          <ServerCog size={22} className="shrink-0 text-amber-700" />
          <div>
            <p className="font-bold">One-time setup: the server key</p>
            <p className="mt-1 text-muted">Adding logins and setting passwords needs Supabase&apos;s secret <b>service_role</b> key on the server (never in the browser). Supabase → Project Settings → API keys → <b>service_role</b> (rotate it first if it was ever shared). Put it in <code>.env.local</code> as <code>SUPABASE_SERVICE_ROLE_KEY=…</code> and restart.</p>
          </div>
        </div>
      )}
      {state === "error" && msg && <p className="rounded-2xl bg-hot/10 p-4 text-sm font-semibold text-hot">{msg.t}</p>}

      {state === "ok" && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-line bg-soft/60 text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-5 py-3 font-semibold">Name</th><th className="px-3 font-semibold">Email</th><th className="px-3 font-semibold">Role</th><th className="px-3 font-semibold">Permissions</th><th className="px-3 font-semibold">Last login</th><th className="px-3 font-semibold">Status</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((m) => {
                const self = m.user_id === me;
                return (
                  <tr key={m.user_id} className={`transition hover:bg-soft/50 ${m.status === "disabled" ? "opacity-60" : ""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {m.avatar ? <img src={m.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-bold text-white">{(m.name || m.email || "?").charAt(0).toUpperCase()}</span>}
                        <span className="leading-tight">
                          <span className="flex items-center gap-1.5 font-bold">{m.name || "—"}{self && <span className="rounded-full bg-brand-50 px-1.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900 dark:text-white">You</span>}</span>
                          <span className="font-mono text-xs text-muted">{m.username ? `@${m.username}` : ""}{m.show_on_about ? " · on About" : ""}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-3"><span className="block">{m.email}</span><span className="text-xs text-muted">{m.phone}</span></td>
                    <td className="px-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${m.role === "owner" ? "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-white" : "bg-soft text-fg/80"}`}>{m.role === "owner" ? "Owner" : "Staff"}</span></td>
                    <td className="max-w-56 px-3 text-xs">{permLabel(m)}</td>
                    <td className="px-3 text-xs text-muted">{m.last_login ? <>{new Date(m.last_login).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}<span className="block">{ago(m.last_login)}</span></> : "Never"}</td>
                    <td className="px-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${m.status === "active" ? "bg-green-100 text-green-800" : "bg-hot/10 text-hot"}`}>{m.status === "active" ? "Active" : "Disabled"}</span></td>
                    <td className="px-5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setPanel({ open: true, m })} title="Edit" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900"><Pencil size={15} /></button>
                        {self
                          ? <button onClick={() => emailMe(m)} title="Email me a reset link" className="rounded-full px-2.5 text-xs font-bold text-muted transition hover:bg-soft hover:text-fg">Reset password (email me)</button>
                          : <>
                              <button onClick={() => newPassword(m)} title="Set a new password" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900"><KeyRound size={15} /></button>
                              <button onClick={() => toggleStatus(m)} title={m.status === "active" ? "Disable" : "Enable"} className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-fg">{m.status === "active" ? <UserX size={15} /> : <UserCheck size={15} />}</button>
                              <button onClick={() => remove(m)} title="Remove" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-hot/10 hover:text-hot"><Trash2 size={15} /></button>
                            </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <MemberPanel open={panel.open} member={panel.m} isSelf={panel.m?.user_id === me} onClose={() => setPanel({ open: false, m: null })} onSave={save} />

      {msg && state === "ok" && (
        <div role="status" className={`fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-xl ${msg.ok ? "bg-green-600" : "bg-hot"}`}>{msg.t}</div>
      )}
    </div>
  );
}
