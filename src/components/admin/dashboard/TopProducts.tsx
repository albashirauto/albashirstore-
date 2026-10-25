"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { money } from "@/lib/format";
import { isSale } from "./metrics";
import { inRange, type Range } from "./range";
import type { DOrder } from "./types";

/** Best sellers in the range, by pieces sent or by revenue. */
export default function TopProducts({ orders, range }: { orders: DOrder[]; range: Range }) {
  const [by, setBy] = useState<"units" | "revenue">("units");

  const map = new Map<string, { name: string; units: number; revenue: number }>();
  orders.filter((o) => isSale(o) && inRange(o.created_at, range)).forEach((o) =>
    (o.items ?? []).forEach((i) => {
      const k = i.id ?? i.name;
      const cur = map.get(k) ?? { name: i.name, units: 0, revenue: 0 };
      cur.units += i.qty + (i.free ?? 0);
      cur.revenue += i.price * i.qty;
      map.set(k, cur);
    }),
  );
  const top = [...map.values()].sort((a, b) => b[by] - a[by]).slice(0, 6);
  const max = top[0]?.[by] || 1;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold">Top products</h3>
        <div className="flex gap-1 rounded-full bg-soft p-0.5 text-xs font-bold">
          {(["units", "revenue"] as const).map((x) => (
            <button key={x} onClick={() => setBy(x)} className={`rounded-full px-2.5 py-1 capitalize transition ${by === x ? "bg-card text-fg shadow-sm" : "text-muted hover:text-fg"}`}>{x === "units" ? "Pieces" : "Revenue"}</button>
          ))}
        </div>
      </div>

      {top.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">No sales in this period.</p>
      ) : (
        <ol className="mt-4 grid gap-3">
          {top.map((t, i) => (
            <li key={t.name} className="text-sm">
              <div className="flex items-center gap-2">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-400 text-white" : "bg-soft text-muted"}`}>{i === 0 ? <Trophy size={12} /> : i + 1}</span>
                <span className="flex-1 truncate font-semibold">{t.name}</span>
                <b>{by === "units" ? `${t.units} pcs` : money(t.revenue)}</b>
              </div>
              <div className="ml-8 mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                <div className="h-full rounded-full bg-brand-600 transition-all duration-700" style={{ width: `${(t[by] / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
