"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Gift, Minus, PackageSearch, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { PAYMENT, statusOf } from "@/components/admin/dashboard/types";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";
import { freeQty } from "@/lib/scheme";
import { PAYMENTS, STATUSES, type Order } from "./types";
import { PAY_METHODS } from "@/lib/receipt";

export type PickProduct = { id: string; name: string; sku: string | null; price: number; stock: number | null; active: boolean; scheme_buy: number | null; scheme_free: number | null };
type Line = { p: PickProduct; qty: number; price: number };

const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

/** Admin-made order (phone, WhatsApp or walk-in). Saves like a website order; can also reduce stock. */
export default function NewOrder({ open, onClose, onSaved, products, orders, shipping, editing = null }: {
  open: boolean; onClose: () => void; onSaved: (id: string) => void;
  products: PickProduct[]; orders: Order[]; shipping: number;
  /** when set, the panel edits this order instead of creating one */
  editing?: Order | null;
}) {
  const [c, setC] = useState({ name: "", phone: "", city: "", address: "", note: "" });
  const [lines, setLines] = useState<Line[]>([]);
  const [q, setQ] = useState("");
  const [delivery, setDelivery] = useState<string>(String(shipping));
  const [status, setStatus] = useState("confirmed");
  const [payment, setPayment] = useState("unpaid");
  const [method, setMethod] = useState<string>("");
  const [reduceStock, setReduceStock] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // fill the form from the order being edited (deleted products are kept as plain lines)
  useEffect(() => {
    if (!open || !editing) return;
    setC({ name: editing.customer_name, phone: editing.phone, city: editing.city ?? "", address: editing.address, note: editing.note ?? "" });
    setLines((editing.items ?? []).map((i) => ({
      p: products.find((p) => p.id === i.id) ?? { id: i.id ?? `gone-${i.name}`, name: i.name, sku: null, price: i.price, stock: null, active: false, scheme_buy: null, scheme_free: null },
      qty: i.qty, price: i.price,
    })));
    setDelivery(String(editing.shipping ?? 0)); setStatus(editing.status); setPayment(editing.payment_status ?? "unpaid"); setMethod(editing.payment_method ?? ""); setErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // past customers, newest first, for the phone/name lookup
  const customers = useMemo(() => {
    const m = new Map<string, Order>();
    orders.forEach((o) => { if (!m.has(o.phone)) m.set(o.phone, o); });
    return [...m.values()];
  }, [orders]);
  const custHits = c.phone.replace(/\D/g, "").length >= 3 || c.name.length >= 2
    ? customers.filter((o) => (c.phone && o.phone.replace(/\D/g, "").includes(c.phone.replace(/\D/g, ""))) || (c.name.length >= 2 && o.customer_name.toLowerCase().includes(c.name.toLowerCase()))).slice(0, 4)
    : [];
  const exact = customers.some((o) => o.phone === c.phone && o.customer_name === c.name);

  const term = q.trim().toLowerCase();
  const hits = term ? products.filter((p) => `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(term)).slice(0, 6) : [];

  const add = (p: PickProduct) => {
    setLines((l) => (l.some((x) => x.p.id === p.id) ? l.map((x) => (x.p.id === p.id ? { ...x, qty: x.qty + 1 } : x)) : [...l, { p, qty: 1, price: p.price }]));
    setQ("");
  };
  const patch = (id: string, v: Partial<Line>) => setLines((l) => l.map((x) => (x.p.id === id ? { ...x, ...v } : x)));

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const ship = Math.max(0, Number(delivery) || 0);
  const total = subtotal + ship;

  const reset = () => { setC({ name: "", phone: "", city: "", address: "", note: "" }); setLines([]); setQ(""); setDelivery(String(shipping)); setStatus("confirmed"); setPayment("unpaid"); setErr(""); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!c.name.trim() || !c.phone.trim() || !c.address.trim()) return setErr("Name, phone and address are needed.");
    if (!lines.length) return setErr("Add at least one product.");
    setBusy(true);
    const db = browserClient();
    const items = lines.map((l) => ({ id: l.p.id, name: l.p.name, price: l.price, qty: l.qty, free: freeQty(l.qty, l.p) }));
    const row = {
      customer_name: c.name.trim(), phone: c.phone.trim(), city: c.city.trim() || null, address: c.address.trim(), note: c.note.trim() || null,
      items, subtotal, shipping: ship, total, status, payment_status: payment, payment_method: method || null,
    };
    const { data, error } = editing
      ? await db.from("orders").update({ ...row, updated_at: new Date().toISOString() }).eq("id", editing.id).select("id").single()
      : await db.from("orders").insert(row).select("id").single();
    if (error) { setBusy(false); return setErr(error.message.includes("payment_status") ? "Run supabase/002_dashboard.sql first (adds payment status)." : error.message); }

    if (reduceStock) {
      // pieces per product now, minus pieces before (an edit only moves the difference)
      const delta = new Map<string, number>();
      items.forEach((i) => delta.set(i.id, (delta.get(i.id) ?? 0) + i.qty + i.free));
      (editing?.items ?? []).forEach((i) => i.id && delta.set(i.id, (delta.get(i.id) ?? 0) - i.qty - (i.free ?? 0)));
      for (const [id, d] of delta) {
        const p = products.find((x) => x.id === id);
        if (p && p.stock !== null && d !== 0) await db.from("products").update({ stock: Math.max(0, p.stock - d) }).eq("id", p.id);
      }
    }
    setBusy(false);
    reset();
    onSaved(data.id);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-brand-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.form onSubmit={save} role="dialog" aria-label={editing ? "Edit order" : "New order"}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-2xl flex-col bg-bg shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h2 className="text-3xl font-extrabold uppercase leading-none">{editing ? "Edit order" : "New order"}</h2>
                <p className="text-sm text-muted">{editing ? `#${editing.id.slice(0, 8).toUpperCase()} · placed ${new Date(editing.created_at).toLocaleDateString("en-PK")}` : "For phone, WhatsApp or walk-in customers"}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-soft"><X size={20} /></button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {/* customer */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted"><UserRound size={16} />Customer</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={input} placeholder="Phone *" inputMode="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
                  <input className={input} placeholder="Name *" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
                  {custHits.length > 0 && !exact && (
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <span className="text-xs font-semibold text-muted">Past customer?</span>
                      {custHits.map((o) => (
                        <button key={o.phone} type="button" onClick={() => setC({ ...c, name: o.customer_name, phone: o.phone, city: o.city ?? "", address: o.address })}
                          className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white dark:bg-brand-900 dark:text-white">
                          {o.customer_name} · {o.phone}
                        </button>
                      ))}
                    </div>
                  )}
                  <input className={input} placeholder="City" value={c.city} onChange={(e) => setC({ ...c, city: e.target.value })} />
                  <input className={input} placeholder="Address *" value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} />
                  <input className={`${input} sm:col-span-2`} placeholder="Note (optional)" value={c.note} onChange={(e) => setC({ ...c, note: e.target.value })} />
                </div>
              </section>

              {/* products */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted"><PackageSearch size={16} />Products</h3>
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input className={`${input} pl-10`} placeholder="Search product name or SKU to add" value={q} onChange={(e) => setQ(e.target.value)} />
                  {hits.length > 0 && (
                    <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-card shadow-xl">
                      {hits.map((p) => (
                        <li key={p.id}>
                          <button type="button" onClick={() => add(p)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-soft">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">{p.name}</span>
                              <span className="text-xs text-muted">{p.sku ?? "no SKU"} · stock {p.stock ?? "?"}{!p.active ? " · hidden" : ""}</span>
                            </span>
                            <b>{money(p.price)}</b><Plus size={16} className="text-brand-600" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {term && !hits.length && <p className="mt-2 text-sm text-muted">No product matches “{q}”.</p>}
                </div>

                {lines.length > 0 ? (
                  <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                    {lines.map((l) => {
                      const free = freeQty(l.qty, l.p);
                      const over = l.p.stock !== null && l.qty + free > l.p.stock;
                      return (
                        <li key={l.p.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                          <span className="min-w-0 flex-1 basis-40">
                            <span className="block truncate font-semibold">{l.p.name}</span>
                            <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                              {l.p.sku}
                              {free > 0 && <b className="inline-flex items-center gap-1 rounded-full bg-green-600/10 px-1.5 text-green-700"><Gift size={11} />+{free} free</b>}
                              {over && <b className="text-hot">only {l.p.stock} in stock</b>}
                            </span>
                          </span>
                          <div className="flex items-center rounded-full border border-line">
                            <button type="button" aria-label="Less" onClick={() => patch(l.p.id, { qty: Math.max(1, l.qty - 1) })} className="p-1.5"><Minus size={13} /></button>
                            <input aria-label="Quantity" inputMode="numeric" value={l.qty} onChange={(e) => patch(l.p.id, { qty: Math.max(1, Number(e.target.value) || 1) })} className="w-10 bg-transparent text-center font-bold outline-none" />
                            <button type="button" aria-label="More" onClick={() => patch(l.p.id, { qty: l.qty + 1 })} className="p-1.5"><Plus size={13} /></button>
                          </div>
                          <label className="flex items-center gap-1 text-xs text-muted">Rs.
                            <input aria-label="Price each" inputMode="numeric" value={l.price} onChange={(e) => patch(l.p.id, { price: Math.max(0, Number(e.target.value) || 0) })} className="w-20 rounded-lg border border-line bg-bg px-2 py-1 text-right text-sm font-semibold text-fg outline-none focus:border-brand-500" />
                          </label>
                          <b className="w-24 text-right">{money(l.price * l.qty)}</b>
                          <button type="button" aria-label="Remove" onClick={() => setLines((x) => x.filter((y) => y.p.id !== l.p.id))} className="rounded-full p-1.5 text-hot hover:bg-hot/10"><Trash2 size={15} /></button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">No products yet. Search above to add.</p>
                )}
              </section>

              {/* status */}
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm font-semibold">Status
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${input} mt-1`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{statusOf(s).label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold">Payment
                  <select value={payment} onChange={(e) => setPayment(e.target.value)} className={`${input} mt-1`}>
                    {PAYMENTS.map((p) => <option key={p} value={p}>{PAYMENT[p].label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold">Paid by
                  <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${input} mt-1`}>
                    <option value="">Not chosen</option>
                    {PAY_METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                    <option value="cash">Cash at shop</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">Delivery (Rs.)
                  <input inputMode="numeric" value={delivery} onChange={(e) => setDelivery(e.target.value)} className={`${input} mt-1`} />
                </label>
                <label className="flex items-center gap-2.5 text-sm font-semibold sm:col-span-2 lg:col-span-4">
                  <input type="checkbox" checked={reduceStock} onChange={(e) => setReduceStock(e.target.checked)} className="h-4 w-4 accent-brand-600" />
                  {editing ? "Adjust stock for the changes I made" : "Reduce stock for these pieces (free pieces included)"}
                </label>
              </section>
            </div>

            {/* totals */}
            <div className="border-t border-line bg-soft px-6 py-4">
              <div className="flex justify-between text-sm text-muted"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-muted"><span>Delivery</span><span>{money(ship)}</span></div>
              <div className="mt-1 flex justify-between text-xl font-extrabold"><span>Total</span><span>{money(total)}</span></div>
              {err && <p role="alert" className="mt-2 text-sm font-semibold text-hot">{err}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={onClose} className="rounded-full border border-line px-6 py-3 font-bold transition hover:bg-card">Cancel</button>
                <button disabled={busy} className="flex-1 rounded-full bg-brand-600 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">{busy ? "Saving…" : `${editing ? "Save order" : "Create order"} · ${money(total)}`}</button>
              </div>
            </div>
          </motion.form>
        </>
      )}
    </AnimatePresence>
  );
}
