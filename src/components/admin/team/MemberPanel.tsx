"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Crown, Eye, EyeOff, KeyRound, Shield, Wand2, X } from "lucide-react";
import ImageField from "@/components/admin/ImageField";
import type { Member, MemberInput } from "@/app/admin/team/actions";
import { GRANTABLE } from "@/lib/admin-config";

const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const empty = (): MemberInput => ({ name: "", username: "", email: "", phone: "", role: "staff", permissions: ["/admin/orders"], status: "active", title: "", avatar: "", show_on_about: false, password: "" });
// quick presets so the owner does not tick 15 boxes
const PRESETS: { l: string; p: string[] }[] = [
  { l: "Orders desk", p: ["/admin/orders", "/admin/customers"] },
  { l: "Stock & products", p: ["/admin/products", "/admin/categories", "/admin/brands", "/admin/vehicles", "/admin/promotions"] },
  { l: "Content & blog", p: ["/admin/posts", "/admin/pages", "/admin/faqs", "/admin/testimonials", "/admin/awards", "/admin/offerings", "/admin/banners", "/admin/features"] },
];

/** Strong, easy-to-read password (no look-alike characters). */
const genPassword = () => {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const r = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(r, (n) => c[n % c.length]).join("");
};

/** Add / edit a team member: details, role, permissions, password, About-page profile. */
export default function MemberPanel({ open, member, isSelf, onClose, onSave }: {
  open: boolean; member: Member | null; isSelf: boolean; onClose: () => void; onSave: (i: MemberInput) => Promise<string | null>;
}) {
  const [f, setF] = useState<MemberInput>(empty());
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(""); setShow(false);
    setF(member ? {
      user_id: member.user_id, name: member.name ?? "", username: member.username ?? "", email: member.email ?? "", phone: member.phone ?? "",
      role: member.role, permissions: member.permissions, status: member.status, title: member.title ?? "", avatar: member.avatar ?? "", show_on_about: member.show_on_about, password: "",
    } : empty());
  }, [open, member]);

  const set = (v: Partial<MemberInput>) => setF((x) => ({ ...x, ...v }));
  const toggle = (href: string) => set({ permissions: f.permissions.includes(href) ? f.permissions.filter((p) => p !== href) : [...f.permissions, href] });
  const groups = [...new Set(GRANTABLE.map((g) => g.group))];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const problem = await onSave(f);
    setBusy(false);
    if (problem) setErr(problem);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-brand-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.form onSubmit={submit} role="dialog" aria-label={member ? "Edit team member" : "Add team member"}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-xl flex-col bg-bg shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h2 className="text-3xl font-extrabold uppercase leading-none">{member ? "Edit member" : "Add team member"}</h2>
                <p className="text-sm text-muted">{member ? member.email : "They sign in at /admin with this email and password."}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-soft"><X size={20} /></button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">Full name *<input required value={f.name} onChange={(e) => set({ name: e.target.value })} className={`${input} mt-1`} /></label>
                <label className="text-sm font-semibold">Username<input value={f.username} onChange={(e) => set({ username: e.target.value })} placeholder="e.g. tayyab007" className={`${input} mt-1`} /></label>
                <label className="text-sm font-semibold">Login email *<input required type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} className={`${input} mt-1`} /></label>
                <label className="text-sm font-semibold">Phone<input type="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="03xx xxxxxxx" className={`${input} mt-1`} /></label>
              </section>

              {/* role */}
              <section>
                <p className="mb-2 text-sm font-bold">Role</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([["owner", "Owner", "Full access, manages the team", Crown], ["staff", "Staff", "Only the sections you tick", Shield]] as const).map(([k, l, d, I]) => (
                    <button key={k} type="button" onClick={() => set({ role: k })} disabled={isSelf && k === "staff"}
                      className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition disabled:opacity-40 ${f.role === k ? "border-brand-600 bg-brand-50 dark:bg-brand-900" : "border-line hover:border-brand-500/50"}`}>
                      <I size={18} className={f.role === k ? "text-brand-600" : "text-muted"} />
                      <span><span className="block font-bold">{l}</span><span className="text-xs text-muted">{d}</span></span>
                    </button>
                  ))}
                </div>
              </section>

              {/* permissions */}
              {f.role === "staff" && (
                <section>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold">Can open <span className="font-normal text-muted">({f.permissions.length} sections)</span></p>
                    <div className="flex flex-wrap gap-1">
                      {PRESETS.map((p) => <button key={p.l} type="button" onClick={() => set({ permissions: p.p })} className="rounded-full bg-soft px-2.5 py-1 text-xs font-bold text-muted hover:text-brand-600">{p.l}</button>)}
                      <button type="button" onClick={() => set({ permissions: GRANTABLE.map((g) => g.href) })} className="rounded-full bg-soft px-2.5 py-1 text-xs font-bold text-muted hover:text-brand-600">All</button>
                      <button type="button" onClick={() => set({ permissions: [] })} className="rounded-full bg-soft px-2.5 py-1 text-xs font-bold text-muted hover:text-hot">None</button>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-xl border border-line p-3">
                    {groups.map((g) => (
                      <div key={g}>
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">{g}</p>
                        <div className="grid gap-1 sm:grid-cols-2">
                          {GRANTABLE.filter((x) => x.group === g).map((x) => (
                            <label key={x.href} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-soft">
                              <input type="checkbox" checked={f.permissions.includes(x.href)} onChange={() => toggle(x.href)} className="h-4 w-4 accent-[#1d4fd8]" />{x.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-muted">Team and owner-only areas are never shown to staff.</p>
                </section>
              )}

              {/* password */}
              <section>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-bold"><KeyRound size={15} />{member ? "Set a new password (optional)" : "Password *"}</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={show ? "text" : "password"} value={f.password} onChange={(e) => set({ password: e.target.value })} required={!member} minLength={member && !f.password ? undefined : 8} autoComplete="new-password" placeholder={member ? "Leave empty to keep the current one" : "At least 8 characters"} className={`${input} pr-10 font-mono`} />
                    <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide" : "Show"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  <button type="button" onClick={() => { set({ password: genPassword() }); setShow(true); }} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-bold transition hover:border-brand-500"><Wand2 size={15} />Generate</button>
                </div>
                <p className="mt-1.5 text-xs text-muted">Give the password to the member yourself (in person or by call). It is never emailed or sent on WhatsApp.</p>
              </section>

              {/* status + profile */}
              <section className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">Status
                  <select value={f.status} onChange={(e) => set({ status: e.target.value as MemberInput["status"] })} disabled={isSelf} className={`${input} mt-1`}>
                    <option value="active">Active, can sign in</option><option value="disabled">Disabled, signed out & blocked</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">Job title (About page)<input value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Parts expert" className={`${input} mt-1`} /></label>
                <div className="text-sm font-semibold sm:col-span-2">
                  <p className="mb-1">Profile photo</p>
                  <ImageField value={f.avatar || null} onChange={(x) => set({ avatar: (x as string) ?? "" })} folder="team" />
                </div>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold sm:col-span-2">
                  <input type="checkbox" checked={f.show_on_about} onChange={(e) => set({ show_on_about: e.target.checked })} className="h-4 w-4 accent-[#1d4fd8]" />
                  Show on the About page (“Meet our team”: photo, name and job title only)
                </label>
              </section>
            </div>

            <div className="border-t border-line bg-soft px-6 py-4">
              {err && <p role="alert" className="mb-2 text-sm font-semibold text-hot">{err}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="rounded-full border border-line px-6 py-3 font-bold transition hover:bg-card">Cancel</button>
                <button disabled={busy} className="flex-1 rounded-full bg-brand-600 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">{busy ? "Saving…" : member ? "Save member" : "Add member"}</button>
              </div>
            </div>
          </motion.form>
        </>
      )}
    </AnimatePresence>
  );
}
