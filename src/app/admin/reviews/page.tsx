"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, Check, ExternalLink, MessageSquareReply, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Stars from "@/components/reviews/Stars";
import { browserClient } from "@/lib/supabase";

type R = {
  id: string; product_id: string; name: string; phone: string | null; city: string | null; rating: number; title: string | null; body: string;
  verified: boolean; status: "pending" | "approved" | "rejected"; reply: string | null; reply_at: string | null; created_at: string;
  images?: string[] | null; source?: string | null;
  product?: { name: string; slug: string; images: string[] | null } | null;
};
type Tab = "pending" | "approved" | "rejected" | "all";
const TABS: { k: Tab; l: string }[] = [{ k: "pending", l: "Waiting" }, { k: "approved", l: "Approved" }, { k: "rejected", l: "Rejected" }, { k: "all", l: "All" }];
const wa = (p: string) => p.replace(/\D/g, "").replace(/^0/, "92");

/** Product reviews: check new ones, approve / reject, reply as the shop, delete. */
export default function Reviews() {
  const db = browserClient();
  const [rows, setRows] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [stars, setStars] = useState(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [replying, setReplying] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 3000); };

  const load = useCallback(async () => {
    const { data, error } = await db.from("product_reviews").select("*, product:products(name,slug,images)").order("created_at", { ascending: false }).limit(2000);
    if (error) flash(false, error.message.includes("product_reviews") ? "Run supabase/018_reviews.sql first." : error.message);
    setRows((data as R[]) ?? []);
    setLoading(false);
    setSel(new Set());
  }, [db]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("saved");
    const t: Record<string, string> = { added: "Review added", saved: "Review saved", deleted: "Review deleted" };
    if (s && t[s]) { flash(true, t[s]); setTab("all"); window.history.replaceState(null, "", window.location.pathname); }
  }, []);

  const counts = useMemo(() => ({ pending: rows.filter((r) => r.status === "pending").length, approved: rows.filter((r) => r.status === "approved").length, rejected: rows.filter((r) => r.status === "rejected").length, all: rows.length }), [rows]);
  const approved = rows.filter((r) => r.status === "approved");
  const avg = approved.length ? approved.reduce((n, r) => n + r.rating, 0) / approved.length : 0;
  const shown = rows.filter((r) => (tab === "all" || r.status === tab) && (!stars || r.rating === stars) &&
    (!q || `${r.name} ${r.city ?? ""} ${r.title ?? ""} ${r.body} ${r.product?.name ?? ""} ${r.phone ?? ""}`.toLowerCase().includes(q.toLowerCase())));

  const setStatus = async (ids: string[], status: R["status"]) => {
    if (!ids.length) return;
    const { error } = await db.from("product_reviews").update({ status }).in("id", ids);
    if (error) return flash(false, error.message);
    flash(true, status === "approved" ? `Approved: now on the product page` : status === "rejected" ? "Rejected (hidden)" : "Moved back to waiting"); load();
  };
  const remove = async (ids: string[]) => {
    if (!ids.length || !confirm(`Delete ${ids.length === 1 ? "this review" : `${ids.length} reviews`} forever?`)) return;
    const { error } = await db.from("product_reviews").delete().in("id", ids);
    if (error) return flash(false, error.message);
    flash(true, "Deleted"); load();
  };
  const saveReply = async (r: R) => {
    const text = reply.trim();
    const { error } = await db.from("product_reviews").update({ reply: text || null, reply_at: text ? new Date().toISOString() : null }).eq("id", r.id);
    if (error) return flash(false, error.message);
    setReplying(null); flash(true, text ? "Reply saved" : "Reply removed"); load();
  };
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const ids = [...sel];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">Product reviews</h1>
          <p className="mt-1.5 text-muted">Customers review parts on the product page. Nothing shows until you approve it. Approved stars also appear in Google.</p>
        </div>
        <Link href="/admin/reviews/new" className="inline-flex items-center gap-2 rounded-full bg-hot px-6 py-3 font-bold text-white shadow-lg shadow-hot/25 transition hover:-translate-y-0.5 hover:bg-hot-dark"><Plus size={18} />Add review</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Waiting for you", v: String(counts.pending), hot: counts.pending > 0 },
          { l: "Approved", v: String(counts.approved) },
          { l: "Average rating", v: approved.length ? `${avg.toFixed(1)} ★` : "—" },
          { l: "Verified buyers", v: `${rows.filter((r) => r.verified).length}` },
        ].map((x) => (
          <div key={x.l} className={`rounded-2xl border bg-card p-4 ${x.hot ? "border-amber-500/50" : "border-line"}`}>
            <p className="text-sm font-semibold text-muted">{x.l}</p>
            <p className={`mt-1 font-display text-3xl font-extrabold ${x.hot ? "text-amber-600" : ""}`}>{x.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-full bg-soft p-1">
          {TABS.map(({ k, l }) => (
            <button key={k} onClick={() => { setTab(k); setSel(new Set()); }} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${tab === k ? "bg-card shadow-sm" : "text-muted hover:text-fg"}`}>
              {l} <span className={`text-xs ${k === "pending" && counts.pending ? "text-amber-600" : "opacity-70"}`}>({counts[k]})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[5, 4, 3, 2, 1].map((s) => (
            <button key={s} onClick={() => setStars(stars === s ? 0 : s)} className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition ${stars === s ? "bg-amber-400 text-amber-950" : "bg-card ring-1 ring-line hover:ring-amber-400"}`}>{s}<Star size={11} className="fill-current" /></button>
          ))}
        </div>
        <div className="relative ml-auto min-w-56">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reviews…" className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500" />
        </div>
      </div>

      <AnimatePresence>
        {ids.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2 rounded-2xl bg-brand-900 px-4 py-3 text-sm text-white">
            <b>{ids.length} selected</b>
            <button onClick={() => setStatus(ids, "approved")} className="rounded-full bg-green-600 px-3 py-1.5 font-bold">Approve</button>
            <button onClick={() => setStatus(ids, "rejected")} className="rounded-full bg-white/10 px-3 py-1.5 font-bold hover:bg-white/20">Reject</button>
            <button onClick={() => remove(ids)} className="rounded-full bg-hot px-3 py-1.5 font-bold">Delete</button>
            <button onClick={() => setSel(new Set())} className="ml-auto font-bold text-white/70 hover:text-white">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <p className="py-10 text-center text-muted">Loading…</p> : !shown.length ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">
          {tab === "pending" ? "Nothing waiting. New reviews from the product pages show up here." : "No reviews here."}
        </div>
      ) : (
        <ul className="grid gap-3">
          {shown.map((r) => (
            <li key={r.id} className={`rounded-2xl border bg-card p-4 transition md:p-5 ${sel.has(r.id) ? "border-brand-500" : r.status === "pending" ? "border-amber-500/40" : "border-line"}`}>
              <div className="flex flex-wrap items-start gap-3">
                <input type="checkbox" aria-label="Select" checked={sel.has(r.id)} onChange={() => toggle(r.id)} className="mt-1 h-4 w-4 accent-brand-600" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.product?.images?.[0] ? <img src={r.product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="h-12 w-12 rounded-lg bg-soft" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} size={15} />
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.status === "approved" ? "bg-green-100 text-green-800" : r.status === "rejected" ? "bg-hot/10 text-hot" : "bg-amber-100 text-amber-800"}`}>{r.status === "pending" ? "Waiting" : r.status === "approved" ? "Approved" : "Rejected"}</span>
                    {r.verified && <span className="inline-flex items-center gap-1 rounded-full bg-green-600/10 px-2 py-0.5 text-[11px] font-bold text-green-700"><BadgeCheck size={12} />Verified buyer</span>}
                    {r.source === "admin" && <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-bold text-muted">Added by shop</span>}
                  </div>
                  {r.product && <Link href={`/products/${r.product.slug}#reviews`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">{r.product.name}<ExternalLink size={11} /></Link>}
                  {r.title && <p className="mt-1.5 font-bold">{r.title}</p>}
                  <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-muted">{r.body}</p>
                  {!!r.images?.length && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.images.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" className="h-14 w-14 rounded-lg object-cover ring-1 ring-line" /></a>)}
                    </div>
                  )}
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                    <b className="text-fg">{r.name}</b>{r.city && <span>{r.city}</span>}
                    {r.phone && <a href={`https://wa.me/${wa(r.phone)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-green-700"><WhatsAppIcon size={12} />{r.phone}</a>}
                    <span>{new Date(r.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </p>
                  {r.reply && replying !== r.id && <p className="mt-3 rounded-xl border-l-4 border-brand-600 bg-soft p-3 text-sm"><b>Your reply:</b> {r.reply}</p>}
                  {replying === r.id && (
                    <div className="mt-3">
                      <textarea autoFocus rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Thank the customer or answer their question. Shown under the review." className="w-full resize-y rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-brand-500" />
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => saveReply(r)} className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-bold text-white">Save reply</button>
                        <button onClick={() => setReplying(null)} className="rounded-full px-3 py-1.5 text-sm font-bold text-muted">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:flex-col">
                  {r.status !== "approved" && <button onClick={() => setStatus([r.id], "approved")} className="inline-flex items-center justify-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white"><Check size={13} />Approve</button>}
                  {r.status !== "rejected" && <button onClick={() => setStatus([r.id], "rejected")} className="inline-flex items-center justify-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-bold"><X size={13} />Reject</button>}
                  <Link href={`/admin/reviews/${r.id}`} className="inline-flex items-center justify-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-bold"><Pencil size={13} />Edit</Link>
                  <button onClick={() => { setReplying(r.id); setReply(r.reply ?? ""); }} className="inline-flex items-center justify-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-bold"><MessageSquareReply size={13} />{r.reply ? "Edit reply" : "Reply"}</button>
                  <button onClick={() => remove([r.id])} className="inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-hot hover:bg-hot/10"><Trash2 size={13} />Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} role="status" className={`fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 font-bold text-white shadow-xl ${msg.ok ? "bg-green-600" : "bg-hot"}`}>
            {msg.ok && <Check size={18} />}{msg.t}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
