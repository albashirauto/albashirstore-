import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { money } from "@/lib/format";
import { PAYMENT, ago, statusOf, type DOrder } from "./types";

/** Latest orders with payment + fulfilment status. */
export default function RecentOrders({ orders }: { orders: DOrder[] }) {
  return (
    <div className="rounded-2xl border border-line bg-card">
      <div className="flex items-center justify-between p-5 pb-3 md:px-6">
        <h3 className="text-xl font-bold">Recent orders</h3>
        <Link href="/admin/orders" className="group inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-hot">All orders <ArrowRight size={15} className="transition group-hover:translate-x-1" /></Link>
      </div>

      {orders.length === 0 ? (
        <div className="px-6 pb-10 pt-6 text-center">
          <Inbox size={36} className="mx-auto text-muted" />
          <p className="mt-2 font-semibold">No orders yet</p>
          <p className="text-sm text-muted">When a customer orders, it appears here right away.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-y border-line bg-soft/60 text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-5 py-2 font-semibold md:px-6">Customer</th>
                <th className="px-3 py-2 font-semibold">Payment</th>
                <th className="px-3 py-2 font-semibold">Fulfilment</th>
                <th className="px-5 py-2 text-right font-semibold md:px-6">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.slice(0, 8).map((o) => {
                const s = statusOf(o.status);
                const pay = PAYMENT[o.payment_status ?? "unpaid"] ?? PAYMENT.unpaid;
                const pcs = (o.items ?? []).reduce((n, i) => n + i.qty + (i.free ?? 0), 0);
                return (
                  <tr key={o.id} className="transition hover:bg-soft">
                    <td className="px-5 py-3 md:px-6">
                      <Link href={`/admin/orders?status=${o.status}`} className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display font-bold text-white">{o.customer_name.charAt(0)}</span>
                        <span className="min-w-0 leading-tight">
                          <span className="block truncate font-bold">{o.customer_name}</span>
                          <span className="block truncate text-xs text-muted">#{o.id.slice(0, 8).toUpperCase()} · {pcs} pcs · {ago(o.created_at)}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${pay.pill}`}>{pay.label}</span></td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.pill}`}>{s.label}</span></td>
                    <td className="px-5 py-3 text-right font-bold md:px-6">{money(o.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
