import Link from "next/link";
import { STATUS, type DOrder } from "./types";

/** Order status for the chosen range (fulfilment + payment). Rows open the Orders page filtered. */
export default function OrderPipeline({ orders }: { orders: DOrder[] }) {
  const total = orders.length || 1;
  const count = (k: string) => orders.filter((o) => o.status === k).length;
  const paid = orders.filter((o) => o.payment_status === "paid").length;
  const unpaid = orders.filter((o) => (o.payment_status ?? "unpaid") === "unpaid" && o.status !== "cancelled").length;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
      <h3 className="text-xl font-bold">Order status</h3>
      <p className="text-sm text-muted">{orders.length} orders in this period</p>

      <div className="mt-5 flex h-3 gap-[2px] overflow-hidden rounded-full bg-soft">
        {STATUS.map((s) => { const n = count(s.key); return n ? <span key={s.key} className={`h-full ${s.dot} transition-all duration-700`} style={{ width: `${(n / total) * 100}%` }} /> : null; })}
      </div>

      <ul className="mt-4 grid gap-0.5">
        {STATUS.map((s) => (
          <li key={s.key}>
            <Link href={`/admin/orders?status=${s.key}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-soft">
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
              <span className="flex-1 font-semibold">{s.label}</span>
              <span className="text-xs text-muted">{Math.round((count(s.key) / total) * 100)}%</span>
              <span className="w-8 text-right font-display text-lg font-bold">{count(s.key)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 text-center">
        <div className="rounded-xl bg-green-600/10 p-2.5"><p className="font-display text-2xl font-extrabold leading-none text-green-700">{paid}</p><p className="text-xs font-semibold text-muted">Paid</p></div>
        <div className="rounded-xl bg-amber-500/10 p-2.5"><p className="font-display text-2xl font-extrabold leading-none text-amber-700">{unpaid}</p><p className="text-xs font-semibold text-muted">Awaiting payment</p></div>
      </div>
    </div>
  );
}
