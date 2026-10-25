"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Crown, Download, Phone, Repeat, Search, UserPlus, Users, X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { ago } from "@/components/admin/dashboard/types";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";

type O = { id: string; customer_name: string; phone: string; city: string | null; address: string; email: string | null; total: number; subtotal: number; status: string; created_at: string };
type Customer = { key: string; name: string; phone: string; city: string; email: string; address: string; orders: number; sales: number; spent: number; cancelled: number; first: string; last: string };

const digits = (p: string) => p.replace(/\D/g, "").replace(/^92/, "0");
const wa = (p: string) => p.replace(/\D/g, "").replace(/^0/, "92");
const SEGMENTS = [
  { k: "all", l: "All", icon: Users },
  { k: "repeat", l: "Repeat buyers", icon: Repeat },
  { k: "new", l: "One order", icon: UserPlus },
  { k: "top", l: "Top 10 spenders", icon: Crown },
] as const;

/** Customers, built from orders (same phone number = same customer). Nothing to type in. */
export default function Customers() {
  const [orders, setOrders] = useState<O[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<(typeof SEGMENTS)[number]["k"]>("all");
  const [sort, setSort] = useState<"last" | "spent" | "orders">("last");

  useEffect(() => {
    browserClient().from("orders").select("id,customer_name,phone,city,address,email,total,subtotal,status,created_at").order("created_at", { ascending: false }).limit(5000)
      .then(({ data }: { data: O[] | null }) => { setOrders(data ?? []); setLoaded(true); });
  }, []);

  const customers = useMemo(() => {
    const m = new Map<string, Customer>();
    for (const o of orders) { // newest first, so the first order seen holds the latest name / address
      const key = digits(o.phone);
      const sale = o.status !== "cancelled" && o.status !== "returned";
      const c = m.get(key) ?? { key, name: o.customer_name, phone: o.phone, city: o.city ?? "", email: o.email ?? "", address: o.address, orders: 0, sales: 0, spent: 0, cancelled: 0, first: o.created_at, last: o.created_at };
      c.orders++; if (sale) { c.sales++; c.spent += Number(o.subtotal ?? o.total); } else c.cancelled++;
      c.first = o.created_at;
      if (!c.email && o.email) c.email = o.email;
      m.set(key, c);
    }
    return [...m.values()];
  }, [orders]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    let list = customers.filter((c) => !t || `${c.name} ${c.phone} ${digits(c.phone)} ${c.city} ${c.email}`.toLowerCase().includes(t));
    if (seg === "repeat") list = list.filter((c) => c.sales >= 2);
    if (seg === "new") list = list.filter((c) => c.orders === 1);
    if (seg === "top") list = [...list].sort((a, b) => b.spent - a.spent).slice(0, 10);
    return [...list].sort((a, b) => sort === "spent" ? b.spent - a.spent : sort === "orders" ? b.orders - a.orders : +new Date(b.last) - +new Date(a.last));
  }, [customers, q, seg, sort]);

  const repeat = customers.filter((c) => c.sales >= 2).length;
  const total = customers.reduce((n, c) => n + c.spent, 0);

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = shown.map((c) => [c.name, c.phone, c.city, c.email, c.address, c.orders, c.sales, Math.round(c.spent), new Date(c.first).toLocaleDateString("en-PK"), new Date(c.last).toLocaleDateString("en-PK")].map(esc).join(","));
    const blob = new Blob(["﻿" + ["Name,Phone,City,Email,Address,Orders,Completed sales,Spent (Rs.),First order,Last order", ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "customers.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">Customers</h1>
          <p className="mt-1.5 text-muted">Everyone who ordered. Same phone number = same customer.</p>
        </div>
        <button onClick={exportCsv} disabled={!shown.length} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-3 text-sm font-bold transition hover:border-brand-500 disabled:opacity-50"><Download size={16} />Export CSV ({shown.length})</button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Customers", v: customers.length.toLocaleString() },
          { l: "Repeat buyers", v: `${repeat} · ${customers.length ? Math.round((repeat / customers.length) * 100) : 0}%` },
          { l: "Total spent", v: money(total) },
          { l: "Avg. per customer", v: money(customers.length ? total / customers.length : 0) },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl border border-line bg-card p-4">
            <p className="text-sm font-semibold text-muted">{x.l}</p>
            <p className="mt-1 truncate font-display text-3xl font-extrabold">{x.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 basis-72 items-center gap-2 rounded-full border border-line bg-card px-4 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
          <Search size={18} className="shrink-0 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, city or email" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted" />
          {q && <button onClick={() => setQ("")} aria-label="Clear" className="text-muted hover:text-fg"><X size={16} /></button>}
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-full border border-line bg-card px-4 py-3 text-sm font-semibold outline-none focus:border-brand-500" aria-label="Sort">
          <option value="last">Latest order first</option><option value="spent">Most spent</option><option value="orders">Most orders</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {SEGMENTS.map(({ k, l, icon: I }) => (
          <button key={k} onClick={() => setSeg(k)} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition ${seg === k ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900" : "bg-card text-muted ring-1 ring-line hover:text-fg"}`}><I size={14} />{l}</button>
        ))}
      </div>

      {!loaded ? <p className="py-10 text-center text-muted">Loading…</p> : !shown.length ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">{customers.length ? "No customers match." : "No customers yet. They appear here after their first order."}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line bg-soft/60 text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-3 font-semibold">Customer</th><th className="px-3 font-semibold">City</th><th className="px-3 text-right font-semibold">Orders</th><th className="px-3 text-right font-semibold">Spent</th><th className="px-3 font-semibold">Last order</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((c) => (
                <tr key={c.key} className="transition hover:bg-soft/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-bold text-white">{c.name.charAt(0)}</span>
                      <span className="min-w-0 leading-tight">
                        <span className="flex items-center gap-1.5 font-bold">{c.name}{c.sales >= 2 && <span className="rounded-full bg-green-100 px-1.5 text-[10px] font-bold text-green-800">REPEAT</span>}</span>
                        <span className="block text-xs text-muted">{c.phone}{c.email ? ` · ${c.email}` : ""}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 text-muted">{c.city || "—"}</td>
                  <td className="px-3 text-right"><b>{c.orders}</b>{c.cancelled > 0 && <span className="block text-[11px] text-hot">{c.cancelled} cancelled/returned</span>}</td>
                  <td className="px-3 text-right font-bold">{money(c.spent)}</td>
                  <td className="px-3 text-muted">{ago(c.last)}<span className="block text-[11px]">since {new Date(c.first).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}</span></td>
                  <td className="px-4">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/admin/orders?q=${encodeURIComponent(c.phone)}`} className="rounded-full border border-line px-3 py-1.5 text-xs font-bold transition hover:border-brand-600 hover:text-brand-600">Orders</Link>
                      <a href={`tel:${c.phone}`} aria-label={`Call ${c.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-line transition hover:border-brand-600 hover:text-brand-600"><Phone size={14} /></a>
                      <a href={`https://wa.me/${wa(c.phone)}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${c.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-[#25D366] text-white transition hover:scale-105"><WhatsAppIcon size={15} /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
