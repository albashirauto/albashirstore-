"use client";

import { useEffect, useRef } from "react";
import { animate, motion } from "motion/react";
import { Ban, Boxes, Package, PiggyBank, Receipt, ShoppingBag, Undo2, Users, Wallet } from "lucide-react";
import { money } from "@/lib/format";
import type { Metrics } from "./metrics";

function Count({ to, isMoney = false }: { to: number; isMoney?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) => (isMoney ? money(n) : Math.round(n).toLocaleString());
  useEffect(() => {
    const c = animate(0, to, { duration: 0.9, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = format(v); } });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, isMoney]);
  return <span ref={ref}>{format(0)}</span>;
}

/** ▲ 12% / ▼ 8% vs previous period. For cancels and returns, going up is bad. */
function Delta({ cur, prev, badWhenUp = false }: { cur: number; prev: number; badWhenUp?: boolean }) {
  if (!prev && !cur) return <span className="text-xs text-muted">no change</span>;
  if (!prev) return <span className="text-xs font-bold text-muted">new</span>;
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return <span className="text-xs text-muted">same as before</span>;
  const good = badWhenUp ? pct < 0 : pct > 0;
  return <span className={`text-xs font-bold ${good ? "text-green-600" : "text-hot"}`}>{pct > 0 ? "▲" : "▼"} {Math.abs(pct)}%</span>;
}

/** KEY PERFORMANCE INDICATORS for the chosen range, compared with the period before. */
export default function KpiGrid({ m, p, totalProducts, liveProducts }: { m: Metrics; p: Metrics; totalProducts: number; liveProducts: number }) {
  const cards = [
    { label: "Revenue", v: m.revenue, pv: p.revenue, money: true, icon: Wallet, tone: "bg-brand-50 text-brand-600 dark:bg-brand-900", sub: "product sales, excl. delivery" },
    { label: "Profit", v: m.profit, pv: p.profit, money: true, icon: PiggyBank, tone: "bg-green-600/10 text-green-700", sub: m.coverage < 1 && m.sales ? `${Math.round(m.coverage * 100)}% of items have a cost price` : "after cost of all pieces sent" },
    { label: "Orders", v: m.orders, pv: p.orders, icon: Receipt, tone: "bg-amber-500/10 text-amber-700", sub: `${m.sales} counted as sales` },
    { label: "Avg. order", v: m.aov, pv: p.aov, money: true, icon: ShoppingBag, tone: "bg-purple-500/10 text-purple-700", sub: "per sale" },
    { label: "Customers", v: m.customers, pv: p.customers, icon: Users, tone: "bg-brand-50 text-brand-600 dark:bg-brand-900", sub: `${m.newCustomers} new, ${m.customers - m.newCustomers} returning` },
    { label: "Pieces sent", v: m.units, pv: p.units, icon: Package, tone: "bg-amber-500/10 text-amber-700", sub: "incl. free scheme pieces" },
    { label: "Cancelled", v: m.cancelled, pv: p.cancelled, bad: true, icon: Ban, tone: "bg-hot/10 text-hot", sub: `${money(m.cancelledValue)} · ${m.orders ? Math.round((m.cancelled / m.orders) * 100) : 0}% of orders` },
    { label: "Returned", v: m.returned, pv: p.returned, bad: true, icon: Undo2, tone: "bg-cyan-600/10 text-cyan-700", sub: `${money(m.returnedValue)} · ${m.orders ? Math.round((m.returned / m.orders) * 100) : 0}% of orders` },
  ];

  return (
    <section>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">Key performance indicators</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.45 }}
            className="rounded-2xl border border-line bg-card p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/10 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-muted">{c.label}</span>
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${c.tone}`}><c.icon size={17} /></span>
            </div>
            <p className="mt-2 truncate font-display text-3xl font-extrabold leading-none md:text-4xl"><Count to={c.v} isMoney={c.money} /></p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2">
              <Delta cur={c.v} prev={c.pv} badWhenUp={c.bad} />
              <span className="truncate text-xs text-muted">{c.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><Boxes size={13} />{liveProducts} of {totalProducts} products live · ▲▼ compared with the same length of time before</p>
    </section>
  );
}
