"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Download, Table2 } from "lucide-react";
import { PRESETS, autoGrain, buckets, presetRange, previous, ymd, type Preset, type Range } from "@/components/admin/dashboard/range";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";
import { payLabel } from "@/lib/receipt";
import { download, toCsv } from "@/lib/csv";

type Item = { id?: string; name: string; qty: number; price: number; free?: number };
type O = { id: string; phone: string; city: string | null; province: string | null; subtotal: number; shipping: number; total: number; discount: number | null; coupon_code: string | null; status: string; payment_method: string | null; created_at: string; items: Item[] };
type P = { id: string; name: string; category_id: string | null };

const sold = (o: O) => o.status !== "cancelled" && o.status !== "returned";
const key = (p: string) => p.replace(/\D/g, "").slice(-10);
const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);
const inR = (iso: string, r: Range) => { const t = new Date(iso).getTime(); return t >= r.from.getTime() && t < r.to.getTime(); };

/** Reports: sales, profit, orders and customers for any period, compared with the period before; where sales come from. */
export default function Reports() {
  const db = browserClient();
  const [orders, setOrders] = useState<O[]>([]);
  const [products, setProducts] = useState<P[]>([]);
  const [cats, setCats] = useState<Map<string, string>>(new Map());
  const [costs, setCosts] = useState<Map<string, number>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [preset, setPreset] = useState<Preset>("30d");
  const [custom, setCustom] = useState(() => ({ from: ymd(new Date(Date.now() - 29 * 86400000)), to: ymd(new Date()) }));
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [o, p, c, k] = await Promise.all([
        db.from("orders").select("id,phone,city,province,subtotal,shipping,total,discount,coupon_code,status,payment_method,created_at,items").order("created_at").limit(20000),
        db.from("products").select("id,name,category_id"),
        db.from("categories").select("id,name,parent_id"),
        db.from("product_costs").select("product_id,cost_price"),
      ]);
      setOrders((o.data as O[]) ?? []);
      setProducts((p.data as P[]) ?? []);
      // sub-categories roll up into their main category
      const list = (c.data as { id: string; name: string; parent_id: string | null }[]) ?? [];
      setCats(new Map(list.map((x) => [x.id, x.parent_id ? list.find((y) => y.id === x.parent_id)?.name ?? x.name : x.name])));
      setCosts(new Map(((k.data as { product_id: string; cost_price: number | null }[]) ?? []).filter((x) => x.cost_price != null).map((x) => [x.product_id, Number(x.cost_price)])));
      setLoaded(true);
    })();
  }, [db]);

  const range = useMemo(() => presetRange(preset, custom), [preset, custom]);
  const prev = useMemo(() => previous(range), [range]);
  const firstOrder = useMemo(() => { const m = new Map<string, number>(); orders.filter(sold).forEach((o) => { const k = key(o.phone), t = new Date(o.created_at).getTime(); if (!m.has(k) || t < m.get(k)!) m.set(k, t); }); return m; }, [orders]);

  const calc = (r: Range) => {
    const all = orders.filter((o) => inR(o.created_at, r)), s = all.filter(sold);
    const revenue = s.reduce((n, o) => n + Number(o.subtotal) - Number(o.discount ?? 0), 0);
    // profit only over parts with a cost price; each order's discount is shared over its parts by value
    let profit = 0, costed = 0;
    s.forEach((o) => {
      const parts = Number(o.subtotal) || 0, disc = Number(o.discount ?? 0);
      o.items?.forEach((i) => {
        const c = i.id ? costs.get(i.id) : undefined;
        if (c === undefined) return;
        const sale = i.price * i.qty, share = parts ? (sale / parts) * disc : 0;
        costed += sale - share;
        profit += sale - share - c * (i.qty + (i.free ?? 0));
      });
    });
    const custs = new Set(s.map((o) => key(o.phone)));
    const fresh = [...custs].filter((k) => inR(new Date(firstOrder.get(k) ?? 0).toISOString(), r)).length;
    return {
      all, s, revenue, orders: s.length, aov: s.length ? revenue / s.length : 0,
      profit, costedShare: revenue ? Math.min(1, costed / revenue) : 0,
      discount: s.reduce((n, o) => n + Number(o.discount ?? 0), 0), delivery: s.reduce((n, o) => n + Number(o.shipping), 0),
      lost: all.length - s.length, lostRate: all.length ? (all.length - s.length) / all.length : 0, customers: custs.size, fresh, returning: custs.size - fresh,
      pieces: s.reduce((n, o) => n + (o.items ?? []).reduce((m, i) => m + i.qty + (i.free ?? 0), 0), 0),
    };
  };
  const cur = useMemo(() => calc(range), [orders, range, costs, firstOrder]); // eslint-disable-line react-hooks/exhaustive-deps
  const old = useMemo(() => calc(prev), [orders, prev, costs, firstOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const grain = autoGrain(range);
  const series = useMemo(() => buckets(range, grain).map((b) => {
    const s = cur.s.filter((o) => inR(o.created_at, b));
    return { b, revenue: s.reduce((n, o) => n + Number(o.subtotal) - Number(o.discount ?? 0), 0), orders: s.length };
  }), [cur, range, grain]);
  const peak = Math.max(1, ...series.map((x) => x.revenue));
  const label = (r: Range) => grain === "month" ? r.from.toLocaleDateString("en-PK", { month: "short", year: "2-digit" }) : r.from.toLocaleDateString("en-PK", { day: "numeric", month: "short" });

  // breakdowns
  const group = (f: (o: O) => string) => { const m = new Map<string, { v: number; n: number }>(); cur.s.forEach((o) => { const k = f(o) || "—"; const x = m.get(k) ?? { v: 0, n: 0 }; x.v += Number(o.subtotal) - Number(o.discount ?? 0); x.n++; m.set(k, x); }); return [...m].map(([k, x]) => ({ k, ...x })).sort((a, b) => b.v - a.v); };
  const top = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; v: number; profit: number | null; cat: string }>();
    cur.s.forEach((o) => o.items?.forEach((i) => {
      const k = i.id ?? i.name, x = m.get(k) ?? { name: i.name, qty: 0, v: 0, profit: 0, cat: cats.get(products.find((p) => p.id === i.id)?.category_id ?? "") ?? "—" };
      const c = i.id ? costs.get(i.id) : undefined;
      x.qty += i.qty + (i.free ?? 0); x.v += i.price * i.qty; x.profit = c === undefined || x.profit === null ? null : x.profit + i.price * i.qty - c * (i.qty + (i.free ?? 0));
      m.set(k, x);
    }));
    return [...m.values()].sort((a, b) => b.v - a.v);
  }, [cur, costs, cats, products]);
  const byCat = useMemo(() => { const m = new Map<string, number>(); top.forEach((t) => m.set(t.cat, (m.get(t.cat) ?? 0) + t.v)); return [...m].map(([k, v]) => ({ k, v, n: 0 })).sort((a, b) => b.v - a.v); }, [top]);
  const byCity = useMemo(() => group((o) => o.city ?? ""), [cur]); // eslint-disable-line react-hooks/exhaustive-deps
  const byProv = useMemo(() => group((o) => o.province ?? ""), [cur]); // eslint-disable-line react-hooks/exhaustive-deps
  const byPay = useMemo(() => group((o) => payLabel(o.payment_method)), [cur]); // eslint-disable-line react-hooks/exhaustive-deps
  const byCoupon = useMemo(() => group((o) => o.coupon_code ?? "").filter((x) => x.k !== "—"), [cur]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = () => download(`report-${ymd(range.from)}-to-${ymd(new Date(range.to.getTime() - 1))}.csv`, toCsv([
    ["Product", "Category", "Pieces", "Sales (Rs.)", "Profit (Rs.)"], ...top.map((t) => [t.name, t.cat, t.qty, Math.round(t.v), t.profit === null ? "" : Math.round(t.profit)]),
    [], ["Period", "Sales (Rs.)", "Orders"], ...series.map((x) => [label(x.b), Math.round(x.revenue), x.orders]),
  ]));

  const KPIS = [
    { l: "Sales", v: money(cur.revenue), d: pct(cur.revenue, old.revenue), sub: `${cur.pieces} pieces sold` },
    { l: "Orders", v: String(cur.orders), d: pct(cur.orders, old.orders), sub: `${cur.lost} cancelled / returned` },
    { l: "Average order", v: money(cur.aov), d: pct(cur.aov, old.aov) },
    { l: "Profit", v: cur.costedShare ? money(cur.profit) : "—", d: cur.costedShare ? pct(cur.profit, old.profit) : null, sub: cur.revenue ? (cur.costedShare < 0.999 ? `Cost price known for ${Math.round(cur.costedShare * 100)}% of sales` : `${Math.round((cur.profit / cur.revenue) * 100)}% margin`) : "Add cost prices to see profit" },
    { l: "Customers", v: String(cur.customers), d: pct(cur.customers, old.customers), sub: `${cur.fresh} new · ${cur.returning} returning` },
    { l: "Discounts given", v: money(cur.discount), d: null, sub: byCoupon.length ? `${byCoupon.length} coupon${byCoupon.length === 1 ? "" : "s"} used` : undefined },
    { l: "Delivery charged", v: money(cur.delivery), d: null },
    { l: "Cancel / return rate", v: `${Math.round(cur.lostRate * 100)}%`, d: null, bad: cur.lostRate > 0.15 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">Reports</h1>
          <p className="mt-1.5 text-muted">Sales, profit and customers for any period, compared with the same length of time before.</p>
        </div>
        <button onClick={exportCsv} disabled={!cur.orders} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-bold transition hover:border-brand-500 disabled:opacity-50"><Download size={15} />Export CSV</button>
      </div>

      {/* one row of filters above the charts */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => <button key={p.key} onClick={() => setPreset(p.key)} className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${preset === p.key ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900" : "bg-card text-muted ring-1 ring-line hover:text-fg"}`}>{p.label}</button>)}
        {preset === "custom" && (
          <span className="flex items-center gap-2 text-sm">
            <input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="rounded-full border border-line bg-card px-3 py-1.5" aria-label="From" />–
            <input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="rounded-full border border-line bg-card px-3 py-1.5" aria-label="To" />
          </span>
        )}
      </div>

      {!loaded ? <p className="py-10 text-center text-muted">Loading…</p> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {KPIS.map((k) => (
              <div key={k.l} className="rounded-2xl border border-line bg-card p-4">
                <p className="text-sm font-semibold text-muted">{k.l}</p>
                <p className={`mt-1 truncate font-display text-3xl font-extrabold ${k.bad ? "text-hot" : ""}`}>{k.v}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  {k.d !== null && preset !== "all" && (
                    <span className={`inline-flex items-center font-bold ${k.d > 0 ? "text-green-700 dark:text-green-400" : k.d < 0 ? "text-hot" : ""}`}>
                      {k.d > 0 ? <ArrowUpRight size={13} /> : k.d < 0 ? <ArrowDownRight size={13} /> : null}{k.d > 0 ? "+" : ""}{k.d}% vs before
                    </span>
                  )}
                  {k.sub && <span>{k.sub}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* sales over time: single series, bars from a shared baseline, hover tooltip, table view */}
          <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Sales per {grain}</h2>
              <button onClick={() => setTable(!table)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold"><Table2 size={13} />{table ? "Chart" : "Table"}</button>
            </div>
            {table ? (
              <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-line">
                <table className="w-full text-sm"><thead className="sticky top-0 bg-soft text-left text-xs uppercase text-muted"><tr><th className="px-3 py-2">{grain}</th><th className="px-3 text-right">Sales</th><th className="px-3 text-right">Orders</th></tr></thead>
                  <tbody className="divide-y divide-line">{series.map((x, i) => <tr key={i}><td className="px-3 py-1.5">{label(x.b)}</td><td className="px-3 text-right font-semibold">{money(x.revenue)}</td><td className="px-3 text-right">{x.orders}</td></tr>)}</tbody></table>
              </div>
            ) : (
              <div className="relative mt-6">
                {/* recessive grid: 3 lines with values */}
                {[1, 0.5].map((f) => (
                  <div key={f} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `calc(${f * 100}% * 0.86 + 24px)` }}>
                    <span className="absolute -top-2.5 right-0 bg-card pl-1 text-[10px] text-muted">{money(peak * f)}</span>
                  </div>
                ))}
                <div className="flex h-64 items-end gap-0.5 pb-6" onMouseLeave={() => setHover(null)}>
                  {series.map((x, i) => (
                    <div key={i} className="relative flex h-full min-w-0 flex-1 cursor-default flex-col justify-end" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${label(x.b)}: ${money(x.revenue)}, ${x.orders} orders`}>
                      <div className={`w-full rounded-t-sm transition-colors ${hover === i ? "bg-brand-500" : "bg-brand-600"}`} style={{ height: `${(x.revenue / peak) * 86}%`, minHeight: x.revenue ? 3 : 0 }} />
                      {hover === i && (
                        <div className={`pointer-events-none absolute bottom-[calc(100%-1rem)] z-10 w-max rounded-xl bg-brand-900 px-3 py-2 text-xs text-white shadow-xl ${i > series.length / 2 ? "right-0" : "left-0"}`}>
                          <p className="font-bold">{label(x.b)}</p><p>{money(x.revenue)} · {x.orders} order{x.orders === 1 ? "" : "s"}</p>
                        </div>
                      )}
                      {(series.length <= 12 || i % Math.ceil(series.length / 8) === 0) && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 translate-y-full whitespace-nowrap text-[10px] text-muted">{label(x.b)}</span>}
                    </div>
                  ))}
                </div>
                {!cur.orders && <p className="absolute inset-0 grid place-items-center text-sm text-muted">No sales in this period.</p>}
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
              <h2 className="text-lg font-bold">Top products</h2>
              {!top.length ? <p className="mt-3 text-sm text-muted">No sales in this period.</p> : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-130 text-sm">
                    <thead className="text-left text-xs uppercase text-muted"><tr><th className="py-2">Product</th><th className="px-2 text-right">Pieces</th><th className="px-2 text-right">Sales</th><th className="pl-2 text-right">Profit</th></tr></thead>
                    <tbody className="divide-y divide-line">
                      {top.slice(0, 12).map((t) => (
                        <tr key={t.name}>
                          <td className="py-2 pr-2">
                            <span className="block truncate font-semibold">{t.name}</span>
                            <span className="mt-1 block h-1.5 rounded-full bg-brand-600" style={{ width: `${Math.max(3, (t.v / top[0].v) * 100)}%` }} />
                          </td>
                          <td className="px-2 text-right">{t.qty}</td>
                          <td className="px-2 text-right font-bold">{money(t.v)}</td>
                          <td className={`pl-2 text-right ${t.profit !== null && t.profit < 0 ? "text-hot" : ""}`}>{t.profit === null ? <span className="text-xs text-muted">no cost</span> : money(t.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <Breakdown title="Sales by category" rows={byCat} total={cur.revenue} />
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Breakdown title="Top cities" rows={byCity} total={cur.revenue} count />
            <Breakdown title="By province" rows={byProv} total={cur.revenue} count />
            <Breakdown title="Payment method" rows={byPay} total={cur.revenue} count />
            <Breakdown title="Coupons" rows={byCoupon} total={cur.revenue} count empty="No coupons used." />
          </div>
        </>
      )}
    </div>
  );
}

/** Single-series horizontal bars: name, share bar, amount (and order count). */
function Breakdown({ title, rows, total, count, empty = "No sales in this period." }: { title: string; rows: { k: string; v: number; n: number }[]; total: number; count?: boolean; empty?: string }) {
  const top = rows[0]?.v || 1;
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {!rows.length ? <p className="mt-3 text-sm text-muted">{empty}</p> : (
        <ul className="mt-3 space-y-2.5">
          {rows.slice(0, 8).map((r) => (
            <li key={r.k} title={`${r.k}: ${money(r.v)}${count ? ` · ${r.n} orders` : ""}`}>
              <div className="flex justify-between gap-2 text-sm"><span className="truncate font-semibold">{r.k}</span><span className="shrink-0 font-bold">{money(r.v)}</span></div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${(r.v / top) * 100}%` }} /></span>
                <span className="w-16 shrink-0 text-right text-[11px] text-muted">{total ? Math.round((r.v / total) * 100) : 0}%{count ? ` · ${r.n}` : ""}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
