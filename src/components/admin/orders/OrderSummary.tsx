"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { money } from "@/lib/format";
import { autoGrain, bucketLabel, buckets, inRange, type Grain, type Range } from "@/components/admin/dashboard/range";
import { pieces, type Order } from "./types";

const sale = (o: Order) => o.status !== "cancelled" && o.status !== "returned";
const sum = (l: Order[]) => l.reduce((n, o) => n + Number(o.subtotal ?? o.total), 0);

/** Totals for the filtered orders, plus a daily / weekly / monthly breakdown table. */
export default function OrderSummary({ orders, range }: { orders: Order[]; range: Range }) {
  const [open, setOpen] = useState(false);
  const [grain, setGrain] = useState<Grain>("day");

  // "All time" starts in 2020: begin the breakdown at the first order instead
  const first = orders.length ? new Date(Math.min(...orders.map((o) => +new Date(o.created_at)))) : range.from;
  const r: Range = { from: first > range.from ? new Date(first.getFullYear(), first.getMonth(), first.getDate()) : range.from, to: range.to };
  const rows = buckets(r, grain).map((b) => {
    const l = orders.filter((o) => inRange(o.created_at, b));
    return { b, orders: l.length, delivered: l.filter((o) => o.status === "delivered").length, cancelled: l.filter((o) => o.status === "cancelled").length, returned: l.filter((o) => o.status === "returned").length, revenue: sum(l.filter(sale)) };
  }).filter((x) => x.orders).reverse();

  const cards = [
    { l: "Orders", v: orders.length.toLocaleString() },
    { l: "Sales value", v: money(sum(orders.filter(sale))) },
    { l: "Pieces", v: orders.filter(sale).reduce((n, o) => n + pieces(o), 0).toLocaleString() },
    { l: "Cancelled", v: `${orders.filter((o) => o.status === "cancelled").length} · ${money(sum(orders.filter((o) => o.status === "cancelled")))}` },
    { l: "Returned", v: `${orders.filter((o) => o.status === "returned").length} · ${money(sum(orders.filter((o) => o.status === "returned")))}` },
  ];

  return (
    <div className="rounded-2xl border border-line bg-card">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-t-2xl bg-line sm:grid-cols-5">
        {cards.map((c) => (
          <div key={c.l} className="bg-card px-4 py-3">
            <p className="text-xs font-semibold text-muted">{c.l}</p>
            <p className="mt-0.5 truncate font-display text-xl font-extrabold">{c.v}</p>
          </div>
        ))}
      </div>

      <button onClick={() => { setOpen(!open); if (!open) setGrain(autoGrain(r)); }} className="flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-sm font-bold text-brand-600 hover:bg-soft">
        Daily / weekly / monthly breakdown
        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-line p-4">
          <div className="mb-3 flex w-fit gap-1 rounded-full bg-soft p-0.5 text-xs font-bold">
            {(["day", "week", "month"] as const).map((g) => (
              <button key={g} onClick={() => setGrain(g)} className={`rounded-full px-3 py-1 transition ${grain === g ? "bg-card text-fg shadow-sm" : "text-muted hover:text-fg"}`}>{g === "day" ? "Daily" : g === "week" ? "Weekly" : "Monthly"}</button>
            ))}
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase tracking-wider text-muted">
                <tr><th className="py-2 font-semibold">{grain === "day" ? "Day" : grain === "week" ? "Week of" : "Month"}</th><th className="text-right font-semibold">Orders</th><th className="text-right font-semibold">Delivered</th><th className="text-right font-semibold">Cancelled</th><th className="text-right font-semibold">Returned</th><th className="text-right font-semibold">Sales</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((x, i) => (
                  <tr key={i}>
                    <td className="py-2 font-semibold">{bucketLabel(x.b, grain)}</td>
                    <td className="text-right">{x.orders}</td><td className="text-right">{x.delivered}</td>
                    <td className={`text-right ${x.cancelled ? "text-hot" : ""}`}>{x.cancelled}</td>
                    <td className="text-right">{x.returned}</td>
                    <td className="text-right font-bold">{money(x.revenue)}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={6} className="py-6 text-center text-muted">No orders in this period.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
