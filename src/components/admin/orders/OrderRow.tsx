"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Copy, MapPin, Pencil, Phone, Printer, Tag, Trash2, Truck, TriangleAlert } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { PAYMENT, ago, statusOf } from "@/components/admin/dashboard/types";
import { money } from "@/lib/format";
import { payLabel, receiptText } from "@/lib/receipt";
import { PAYMENTS, STATUSES, methodLabel, orderNo, pieces, type Order } from "./types";

const wa = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "92");

/** One order: compact row that opens to full details and actions. */
export default function OrderRow({ o, open, toggle, skus, onStatus, setPayment, onEdit, onDelete, store }: {
  o: Order; open: boolean; toggle: () => void; skus: Map<string, string>;
  onStatus: (o: Order, s: string) => void; setPayment: (id: string, s: string) => void;
  onEdit: (o: Order) => void; onDelete: (o: Order) => void; store: string;
}) {
  const receipt = receiptText({ orderNo: orderNo(o), name: o.customer_name, phone: o.phone, city: o.city, address: o.address, lines: (o.items ?? []).map((i) => ({ ...i, free: i.free ?? 0 })), subtotal: o.subtotal, shipping: o.shipping, total: o.total, method: o.payment_method, ref: o.payment_ref, paid: o.payment_status === "paid", store });
  const s = statusOf(o.status);
  const pay = PAYMENT[o.payment_status ?? "unpaid"] ?? PAYMENT.unpaid;
  const showReason = (o.status === "cancelled" || o.status === "returned") && o.status_reason;
  const shipped = ["shipped", "delivered"].includes(o.status) && (o.courier || o.tracking_no);
  const trackMsg = `Assalam o Alaikum ${o.customer_name}, your order #${orderNo(o)} has been dispatched${o.courier ? ` by ${o.courier}` : ""}.${o.tracking_no ? ` Tracking number: ${o.tracking_no}` : ""}`;

  return (
    <li className={`rounded-2xl border bg-card transition ${open ? "border-brand-500/50 shadow-lg shadow-brand-500/10" : "border-line hover:border-brand-500/30"}`}>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button onClick={toggle} className="flex min-w-0 flex-1 basis-64 items-center gap-3 text-left" aria-expanded={open}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-bold text-white">{o.customer_name.charAt(0)}</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-bold">{o.customer_name} <span className="font-normal text-muted">· #{orderNo(o)}</span></span>
            <span className="block truncate text-xs text-muted">{new Date(o.created_at).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · {ago(o.created_at)} · {pieces(o)} pcs{o.city ? ` · ${o.city}` : ""}</span>
            {showReason && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-hot/10 px-2 py-0.5 text-[11px] font-semibold text-hot"><TriangleAlert size={11} />{o.status_reason}</span>}
            {shipped && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-800"><Truck size={11} />{o.courier}{o.tracking_no ? ` · ${o.tracking_no}` : ""}</span>}
          </span>
        </button>

        <select aria-label="Payment" value={o.payment_status ?? "unpaid"} onChange={(e) => setPayment(o.id, e.target.value)} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold outline-none ${pay.pill}`}>
          {PAYMENTS.map((p) => <option key={p} value={p}>{PAYMENT[p].label}</option>)}
        </select>
        <select aria-label="Status" value={o.status} onChange={(e) => onStatus(o, e.target.value)} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold outline-none ${s.pill}`}>
          {STATUSES.map((k) => <option key={k} value={k}>{statusOf(k).label}</option>)}
        </select>
        <b className="w-24 text-right">{money(o.total)}</b>
        <button onClick={toggle} aria-label={open ? "Hide details" : "Show details"} className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-fg">
          <ChevronDown size={18} className={`transition duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            {/* actions */}
            <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
              <button onClick={() => onEdit(o)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-bold transition hover:border-brand-600 hover:text-brand-600"><Pencil size={14} />Edit order</button>
              <a href={`/print/order/${o.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-bold transition hover:border-brand-600 hover:text-brand-600"><Printer size={14} />Print receipt</a>
              <a href={`/print/order/${o.id}?paper=label46`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-bold transition hover:border-brand-600 hover:text-brand-600"><Tag size={14} />Parcel label</a>
              <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-bold transition hover:border-brand-600 hover:text-brand-600"><Phone size={14} />Call</a>
              <a href={`https://wa.me/${wa(o.phone)}?text=${encodeURIComponent(o.status === "shipped" ? trackMsg : `Assalam o Alaikum ${o.customer_name}, about your order #${orderNo(o)}:`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-1.5 text-sm font-bold text-white transition hover:bg-[#1ebe5b]">
                <WhatsAppIcon size={14} />{o.status === "shipped" ? "Send tracking" : "WhatsApp"}
              </a>
              <a href={`https://wa.me/${wa(o.phone)}?text=${encodeURIComponent(receipt)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[#25D366] px-3.5 py-1.5 text-sm font-bold text-[#128C4A] transition hover:bg-[#25D366] hover:text-white"><WhatsAppIcon size={14} />Send receipt</a>
              <button onClick={() => onDelete(o)} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold text-hot transition hover:bg-hot/10"><Trash2 size={14} />Delete</button>
            </div>

            <div className="grid gap-5 border-t border-line p-4 md:grid-cols-[1fr_1.3fr]">
              <div className="space-y-3 text-sm">
                <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-hot" />{o.address}{o.city ? `, ${o.city}` : ""}</p>
                <p className="font-semibold">{o.phone}{o.email ? <span className="font-normal text-muted"> · {o.email}</span> : null}</p>
                {o.note && <p className="rounded-lg bg-soft p-2.5 italic">“{o.note}”</p>}
                {(o.courier || o.tracking_no) && (
                  <div className="rounded-xl bg-purple-100/60 p-3 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100">
                    <p className="flex items-center gap-1.5 font-bold"><Truck size={15} />{o.courier ?? "Courier"}</p>
                    {o.tracking_no && (
                      <p className="mt-1 flex items-center gap-2">Tracking <b>{o.tracking_no}</b>
                        <button onClick={() => navigator.clipboard?.writeText(o.tracking_no!)} aria-label="Copy tracking number" className="rounded p-1 hover:bg-white/50"><Copy size={13} /></button>
                      </p>
                    )}
                    {o.dispatched_at && <p className="text-xs opacity-75">Dispatched {new Date(o.dispatched_at).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>}
                  </div>
                )}
                {o.status_reason && <p className="rounded-xl bg-hot/10 p-3 text-hot"><b>Reason:</b> {o.status_reason}</p>}
                {(o.payment_method || o.payment_ref) && (
                  <p className="rounded-xl bg-green-600/10 p-3 text-green-800 dark:text-green-300"><b>{payLabel(o.payment_method)}</b>{o.payment_ref ? <> · TID <b className="font-mono">{o.payment_ref}</b></> : " · no TID yet"}</p>
                )}
                <p className="text-xs text-muted">Order #{orderNo(o)}{o.order_no ? ` (no. ${o.order_no})` : ""}</p>
              </div>

              <table className="w-full self-start text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted"><tr><th className="pb-2 font-semibold">Item</th><th className="pb-2 text-right font-semibold">Qty</th><th className="pb-2 text-right font-semibold">Amount</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {(o.items ?? []).map((i, k) => (
                    <tr key={k}>
                      <td className="py-2"><span className="font-semibold">{i.name}</span>{i.id && skus.get(i.id) && <span className="ml-1.5 text-xs text-muted">{skus.get(i.id)}</span>}</td>
                      <td className="py-2 text-right">{i.qty}{i.free ? <b className="ml-1 rounded-full bg-green-600/10 px-1.5 text-xs text-green-700">+{i.free}</b> : null}</td>
                      <td className="py-2 text-right">{money(i.price * i.qty)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line"><td className="pt-2 text-muted" colSpan={2}>Subtotal</td><td className="pt-2 text-right">{money(o.subtotal)}</td></tr>
                  <tr><td className="text-muted" colSpan={2}>Delivery</td><td className="text-right">{money(o.shipping)}</td></tr>
                  <tr className="font-extrabold"><td colSpan={2} className="pt-1">Total</td><td className="pt-1 text-right">{money(o.total)}</td></tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
