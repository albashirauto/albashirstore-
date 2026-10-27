"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Pencil, Plus, Search, TicketPercent, Trash2 } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";
import { STATE_STYLE, counts, couponState, offer, rules, type Coupon, type CouponState, type Use } from "@/components/admin/coupons/shared";

const SAVED: Record<string, string> = { added: "Coupon added", saved: "Saved", deleted: "Coupon deleted" };

/** Coupons: every code with its status, uses, discount given and sales it brought. */
export default function Coupons() {
  const db = browserClient();
  const [rows, setRows] = useState<Coupon[]>([]);
  const [uses, setUses] = useState<Use[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | CouponState>("all");
  const [msg, setMsg] = useState("");
  const [now] = useState(() => Date.now());
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };

  const load = useCallback(async () => {
    const [{ data: c }, { data: o }] = await Promise.all([
      db.from("coupons").select("*").order("created_at", { ascending: false }),
      db.from("orders").select("coupon_code,discount,total,status,created_at").not("coupon_code", "is", null).limit(5000),
    ]);
    setRows((c as Coupon[]) ?? []); setUses((o as Use[]) ?? []); setLoading(false);
  }, [db]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("saved");
    if (s && SAVED[s]) { flash(SAVED[s]); window.history.replaceState(null, "", window.location.pathname); }
  }, []);

  const stats = useMemo(() => {
    const m = new Map<string, { uses: number; discount: number; sales: number; last?: string }>();
    for (const u of uses.filter(counts)) {
      const k = u.coupon_code.toUpperCase(), s = m.get(k) ?? { uses: 0, discount: 0, sales: 0 };
      s.uses++; s.discount += Number(u.discount); s.sales += Number(u.total);
      if (!s.last || u.created_at > s.last) s.last = u.created_at;
      m.set(k, s);
    }
    return m;
  }, [uses]);
  const stat = (c: Coupon) => stats.get(c.code.toUpperCase()) ?? { uses: 0, discount: 0, sales: 0 };
  const withState = rows.map((c) => ({ c, s: couponState(c, stat(c).uses, now) }));
  const shown = withState.filter(({ c, s }) => (tab === "all" || s === tab) && (!q || `${c.code} ${c.description ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  const totals = [...stats.values()].reduce((t, s) => ({ uses: t.uses + s.uses, discount: t.discount + s.discount, sales: t.sales + s.sales }), { uses: 0, discount: 0, sales: 0 });

  const toggle = async (c: Coupon) => {
    setRows((r) => r.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
    await db.from("coupons").update({ active: !c.active, updated_at: new Date().toISOString() }).eq("id", c.id);
  };
  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}? Past orders keep their discount.`)) return;
    await db.from("coupons").delete().eq("id", c.id); flash("Coupon deleted"); load();
  };
  const copy = async (t: string, what: string) => { try { await navigator.clipboard.writeText(t); flash(`${what} copied`); } catch {} };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">Coupons</h1>
          <p className="mt-1.5 text-muted">Discount codes for Eid sales, first orders, mechanics or free delivery. Customers type them at checkout.</p>
        </div>
        <Link href="/admin/coupons/new" className="inline-flex items-center gap-2 rounded-full bg-hot px-6 py-3 font-bold text-white shadow-lg shadow-hot/25 transition hover:-translate-y-0.5 hover:bg-hot-dark"><Plus size={18} />New coupon</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Active coupons", v: String(withState.filter((x) => x.s === "active").length) },
          { l: "Times used", v: String(totals.uses) },
          { l: "Discount given", v: money(totals.discount) },
          { l: "Sales with coupons", v: money(totals.sales) },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl border border-line bg-card p-4">
            <p className="text-sm font-semibold text-muted">{x.l}</p>
            <p className="mt-1 truncate font-display text-3xl font-extrabold">{x.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-full bg-soft p-1">
          {(["all", "active", "scheduled", "expired", "used_up", "off"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${tab === k ? "bg-card shadow-sm" : "text-muted hover:text-fg"}`}>
              {k === "all" ? "All" : STATE_STYLE[k].l} <span className="text-xs opacity-70">({k === "all" ? rows.length : withState.filter((x) => x.s === k).length})</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-56">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search codes…" className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500" />
        </div>
      </div>

      {loading ? <p className="py-10 text-center text-muted">Loading…</p> : !shown.length ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center">
          <TicketPercent size={36} className="mx-auto text-brand-500/50" />
          <p className="mt-2 font-bold">{rows.length ? "No coupons match." : "No coupons yet."}</p>
          {!rows.length && <Link href="/admin/coupons/new" className="mt-2 inline-block font-bold text-brand-600">Create your first coupon →</Link>}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map(({ c, s }) => {
            const st = STATE_STYLE[s], u = stat(c);
            return (
              <div key={c.id} className="relative overflow-hidden rounded-2xl border border-line bg-card p-5">
                {/* ticket notches */}
                <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-bg" />
                <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-bg" />
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => copy(c.code, "Code")} title="Copy code" className="group inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-brand-500/40 px-3 py-1 font-mono text-xl font-extrabold tracking-wider text-brand-700 transition hover:border-brand-600 dark:text-white">
                    {c.code}<Copy size={14} className="opacity-40 group-hover:opacity-100" />
                  </button>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.l}</span>
                </div>
                <p className="mt-3 font-display text-2xl font-extrabold uppercase text-hot">{offer(c)}</p>
                {c.description && <p className="text-sm text-muted">{c.description}</p>}
                <p className="mt-1 text-xs text-muted">{rules(c).join(" · ") || "No limits"}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-dashed border-line pt-3 text-center">
                  <div><p className="font-display text-xl font-extrabold">{u.uses}{c.usage_limit ? <span className="text-sm text-muted">/{c.usage_limit}</span> : ""}</p><p className="text-[11px] text-muted">Used</p></div>
                  <div><p className="font-display text-xl font-extrabold">{money(u.discount)}</p><p className="text-[11px] text-muted">Given</p></div>
                  <div><p className="font-display text-xl font-extrabold">{money(u.sales)}</p><p className="text-[11px] text-muted">Sales</p></div>
                </div>
                <div className="mt-4 flex items-center gap-1.5">
                  <button onClick={() => toggle(c)} aria-label={c.active ? "Switch off" : "Switch on"} className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${c.active ? "bg-green-600" : "bg-line"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition ${c.active ? "translate-x-5" : ""}`} /></button>
                  <span className="mr-auto text-xs font-semibold text-muted">{c.active ? "On" : "Off"}</span>
                  <button onClick={() => copy(`${window.location.origin}/checkout?coupon=${encodeURIComponent(c.code)}`, "Checkout link")} title="Copy a checkout link that applies this code" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-brand-600"><Link2 size={15} /></button>
                  <Link href={`/admin/coupons/${c.id}`} title="Edit" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-brand-600"><Pencil size={15} /></Link>
                  <button onClick={() => remove(c)} title="Delete" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-hot/10 hover:text-hot"><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {msg && <div role="status" className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-green-600 px-5 py-3 font-bold text-white shadow-xl"><Check size={18} />{msg}</div>}
    </div>
  );
}
