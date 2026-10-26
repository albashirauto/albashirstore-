"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { metrics, type Metrics } from "./metrics";
import { autoGrain, bucketLabel, buckets, type Grain, type Range } from "./range";
import type { DOrder } from "./types";

const H = 200;
const SERIES: { key: keyof Metrics; label: string; money?: boolean }[] = [
  { key: "revenue", label: "Revenue", money: true },
  { key: "profit", label: "Profit", money: true },
  { key: "orders", label: "Orders" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
];
const compact = (n: number) => (Math.abs(n) >= 1000 ? `${Math.round(n / 100) / 10}K` : String(Math.round(n)));
const niceMax = (n: number) => { if (n <= 0) return 1; const p = 10 ** Math.floor(Math.log10(n)); return Math.ceil(n / p) * p; };

/** Sales overview: one measure at a time (no second axis), daily / weekly / monthly. */
export default function SalesOverview({ orders, range, costs, firstOrder }: { orders: DOrder[]; range: Range; costs: Map<string, number>; firstOrder: Map<string, number> }) {
  const [series, setSeries] = useState(SERIES[0]);
  const [grain, setGrain] = useState<Grain | "auto">("auto");
  const [hover, setHover] = useState<number | null>(null);

  const g = grain === "auto" ? autoGrain(range) : grain;
  const rows = buckets(range, g).map((b) => ({ b, m: metrics(orders, b, costs, firstOrder) }));
  const vals = rows.map((r) => Math.max(0, r.m[series.key] as number));
  const max = niceMax(Math.max(...vals));
  const total = rows.reduce((n, r) => n + (r.m[series.key] as number), 0);
  const fmt = (n: number) => (series.money ? money(n) : Math.round(n).toLocaleString());
  const every = Math.max(1, Math.ceil(rows.length / 8));
  const bar = series.key === "cancelled" ? "bg-hot" : series.key === "returned" ? "bg-cyan-600" : series.key === "profit" ? "bg-green-600" : "bg-brand-600 dark:bg-brand-500";

  return (
    <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Sales overview</h3>
          <p className="text-sm text-muted">{series.label} per {g}{series.money ? ", excl. delivery" : ""}</p>
        </div>
        <p className="font-display text-3xl font-extrabold leading-none">{fmt(total)}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {SERIES.map((s) => (
            <button key={s.key} onClick={() => setSeries(s)} className={`rounded-full px-3 py-1 text-xs font-bold transition ${series.key === s.key ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900" : "bg-soft text-muted hover:text-fg"}`}>{s.label}</button>
          ))}
        </div>
        <div className="flex gap-1 rounded-full bg-soft p-0.5 text-xs font-bold">
          {(["auto", "day", "week", "month"] as const).map((x) => (
            <button key={x} onClick={() => setGrain(x)} className={`rounded-full px-2.5 py-1 capitalize transition ${grain === x ? "bg-card text-fg shadow-sm" : "text-muted hover:text-fg"}`}>{x === "auto" ? "Auto" : x === "day" ? "Daily" : x === "week" ? "Weekly" : "Monthly"}</button>
          ))}
        </div>
      </div>

      <div className="relative mt-6 pl-10">
        {[0, 0.5, 1].map((t) => (
          <div key={t} className="absolute left-10 right-0 border-t border-line" style={{ bottom: `${t * H + 22}px` }}>
            <span className="absolute -left-10 -top-2 w-8 text-right text-[11px] text-muted">{compact(max * t)}</span>
          </div>
        ))}
        <div className="relative flex items-end gap-[2px]" style={{ height: H + 22 }} onMouseLeave={() => setHover(null)}>
          {rows.map((r, i) => {
            const h = (vals[i] / max) * H;
            return (
              <div key={i} className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end" onMouseEnter={() => setHover(i)}>
                <div className={`w-full max-w-6 rounded-t-[4px] transition-all duration-500 ${bar} ${hover !== null && hover !== i ? "opacity-50" : ""}`} style={{ height: Math.max(vals[i] ? 3 : 0, h), marginBottom: 22 }} />
                {i % every === 0 && <span className="absolute bottom-0 whitespace-nowrap text-[11px] text-muted">{bucketLabel(r.b, g)}</span>}
                {hover === i && (
                  <div className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-xl ${i > rows.length / 2 ? "right-0" : "left-0"}`} style={{ bottom: h + 30 }}>
                    <p className="font-bold">{bucketLabel(r.b, g)}{g !== "day" ? ` (${g})` : ""}</p>
                    <p className="mt-0.5">Revenue <b>{money(r.m.revenue)}</b></p>
                    <p>Profit <b>{money(r.m.profit)}</b></p>
                    <p className="text-muted">{r.m.orders} orders · {r.m.cancelled} cancelled · {r.m.returned} returned</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {total === 0 && <p className="mt-2 text-center text-sm text-muted">Nothing in this period yet.</p>}

      {/* tables ignore sr-only's 1px width, so the wrapper hides it (else the phone page scrolls sideways) */}
      <div className="sr-only">
        <table>
          <caption>{series.label} per {g}</caption>
          <thead><tr><th>Period</th><th>Revenue</th><th>Profit</th><th>Orders</th><th>Cancelled</th><th>Returned</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}><td>{bucketLabel(r.b, g)}</td><td>{money(r.m.revenue)}</td><td>{money(r.m.profit)}</td><td>{r.m.orders}</td><td>{r.m.cancelled}</td><td>{r.m.returned}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
