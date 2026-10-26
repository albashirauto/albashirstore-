"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Gift, Minus, PackageSearch, Plus, ReceiptText, Search, Trash2, UserRound } from "lucide-react";
import { PAYMENT, statusOf } from "@/components/admin/dashboard/types";
import PlacePicker from "@/components/checkout/PlacePicker";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";
import { freeQty } from "@/lib/scheme";
import { PAY_METHODS } from "@/lib/receipt";
import { PAYMENTS, STATUSES, type Order } from "./types";

export type PickProduct = { id: string; name: string; sku: string | null; price: number; stock: number | null; active: boolean; scheme_buy: number | null; scheme_free: number | null };
type Line = { p: PickProduct; qty: number; price: number };
type Customer = Pick<Order, "customer_name" | "phone" | "city" | "district" | "province" | "address">;

const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const EMPTY = { name: "", phone: "", province: "", district: "", city: "", address: "", note: "" };
const card = "rounded-2xl border border-line bg-card p-5 md:p-6";
const heading = "mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted";

/** Admin-made order (phone, WhatsApp or walk-in) on its own page: /admin/orders/new, or /admin/orders/<id> to edit. Can also reduce stock. */
export default function OrderForm({ id }: { id: string }) {
  const isNew = id === "new";
  const router = useRouter();
  const db = browserClient();
  const [products, setProducts] = useState<PickProduct[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editing, setEditing] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  const [c, setC] = useState(EMPTY);
  const [lines, setLines] = useState<Line[]>([]);
  const [q, setQ] = useState("");
  const [delivery, setDelivery] = useState("400");
  const [status, setStatus] = useState("confirmed");
  const [payment, setPayment] = useState("unpaid");
  const [method, setMethod] = useState<string>("");
  const [reduceStock, setReduceStock] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, o, s, e] = await Promise.all([
        db.from("products").select("id,name,sku,price,stock,active,scheme_buy,scheme_free").order("name"),
        db.from("orders").select("customer_name,phone,city,district,province,address").order("created_at", { ascending: false }).limit(3000),
        db.from("settings").select("value").eq("key", "shipping_flat").maybeSingle(),
        isNew ? Promise.resolve({ data: null }) : db.from("orders").select("*").eq("id", id).maybeSingle(),
      ]);
      const list = (p.data as PickProduct[]) ?? [];
      setProducts(list);
      // past customers, newest first, one per phone
      const seen = new Map<string, Customer>();
      ((o.data as Customer[]) ?? []).forEach((x) => { if (!seen.has(x.phone)) seen.set(x.phone, x); });
      setCustomers([...seen.values()]);
      if (isNew) { setDelivery(String(Number(s.data?.value ?? 400) || 0)); setState("ok"); return; }
      const ord = e.data as Order | null;
      if (!ord) return setState("missing");
      setEditing(ord);
      setC({ name: ord.customer_name, phone: ord.phone, province: ord.province ?? "", district: ord.district ?? "", city: ord.city ?? "", address: ord.address, note: ord.note ?? "" });
      // deleted products are kept as plain lines
      setLines((ord.items ?? []).map((i) => ({
        p: list.find((x) => x.id === i.id) ?? { id: i.id ?? `gone-${i.name}`, name: i.name, sku: null, price: i.price, stock: null, active: false, scheme_buy: null, scheme_free: null },
        qty: i.qty, price: i.price,
      })));
      setDelivery(String(ord.shipping ?? 0)); setStatus(ord.status); setPayment(ord.payment_status ?? "unpaid"); setMethod(ord.payment_method ?? "");
      setState("ok");
    })();
  }, [db, id, isNew]);

  const custHits = c.phone.replace(/\D/g, "").length >= 3 || c.name.length >= 2
    ? customers.filter((o) => (c.phone && o.phone.replace(/\D/g, "").includes(c.phone.replace(/\D/g, ""))) || (c.name.length >= 2 && o.customer_name.toLowerCase().includes(c.name.toLowerCase()))).slice(0, 4)
    : [];
  const exact = customers.some((o) => o.phone === c.phone && o.customer_name === c.name);

  const term = q.trim().toLowerCase();
  const hits = useMemo(() => (term ? products.filter((p) => `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(term)).slice(0, 8) : []), [products, term]);

  const add = (p: PickProduct) => {
    setLines((l) => (l.some((x) => x.p.id === p.id) ? l.map((x) => (x.p.id === p.id ? { ...x, qty: x.qty + 1 } : x)) : [...l, { p, qty: 1, price: p.price }]));
    setQ("");
  };
  const patch = (pid: string, v: Partial<Line>) => setLines((l) => l.map((x) => (x.p.id === pid ? { ...x, ...v } : x)));

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const ship = Math.max(0, Number(delivery) || 0);
  const total = subtotal + ship;
  const pcs = lines.reduce((n, l) => n + l.qty + freeQty(l.qty, l.p), 0);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!c.name.trim() || !c.phone.trim() || !c.address.trim()) return setErr("Name, phone and address are needed.");
    if (!lines.length) return setErr("Add at least one product.");
    setBusy(true);
    const items = lines.map((l) => ({ id: l.p.id, name: l.p.name, price: l.price, qty: l.qty, free: freeQty(l.qty, l.p) }));
    const row = {
      customer_name: c.name.trim(), phone: c.phone.trim(), province: c.province || null, district: c.district || null, city: c.city.trim() || null,
      address: c.address.trim(), note: c.note.trim() || null,
      items, subtotal, shipping: ship, total, status, payment_status: payment, payment_method: method || null,
    };
    const { data, error } = editing
      ? await db.from("orders").update({ ...row, updated_at: new Date().toISOString() }).eq("id", editing.id).select("id").single()
      : await db.from("orders").insert(row).select("id").single();
    if (error) { setBusy(false); return setErr(error.message); }

    if (reduceStock) {
      // pieces per product now, minus pieces before (an edit only moves the difference)
      const delta = new Map<string, number>();
      items.forEach((i) => delta.set(i.id, (delta.get(i.id) ?? 0) + i.qty + i.free));
      (editing?.items ?? []).forEach((i) => i.id && delta.set(i.id, (delta.get(i.id) ?? 0) - i.qty - (i.free ?? 0)));
      for (const [pid, d] of delta) {
        const p = products.find((x) => x.id === pid);
        if (p && p.stock !== null && d !== 0) await db.from("products").update({ stock: Math.max(0, p.stock - d) }).eq("id", p.id);
      }
    }
    router.push(`/admin/orders?open=${data.id}`);
  };

  if (state === "loading") return <p className="p-10 text-center text-muted">Loading…</p>;
  if (state === "missing") return (
    <div className="p-10 text-center">
      <p className="font-bold">This order was not found. It may have been deleted.</p>
      <Link href="/admin/orders" className="mt-4 inline-block font-bold text-brand-600">← Back to orders</Link>
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand-600"><ArrowLeft size={16} />Orders</Link>
        <h1 className="mt-2 text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">{editing ? `Edit order #${editing.id.slice(0, 8).toUpperCase()}` : "New order"}</h1>
        <p className="mt-1.5 text-muted">{editing ? `Placed ${new Date(editing.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}` : "For phone, WhatsApp or walk-in customers."}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* customer */}
          <section className={card}>
            <h2 className={heading}><UserRound size={16} />Customer</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Phone *" inputMode="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
              <input className={input} placeholder="Name *" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
              {custHits.length > 0 && !exact && (
                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                  <span className="text-xs font-semibold text-muted">Past customer?</span>
                  {custHits.map((o) => (
                    <button key={o.phone} type="button" onClick={() => setC({ ...c, name: o.customer_name, phone: o.phone, province: o.province ?? "", district: o.district ?? "", city: o.city ?? "", address: o.address })}
                      className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white dark:bg-brand-900 dark:text-white">
                      {o.customer_name} · {o.phone}
                    </button>
                  ))}
                </div>
              )}
              <div className="sm:col-span-2">
                <PlacePicker optional input={input} value={{ province: c.province, district: c.district, city: c.city }} onChange={(p) => setC({ ...c, ...p })} />
              </div>
              <input className={`${input} sm:col-span-2`} placeholder="Address *" value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} />
              <input className={`${input} sm:col-span-2`} placeholder="Note (optional)" value={c.note} onChange={(e) => setC({ ...c, note: e.target.value })} />
            </div>
          </section>

          {/* products */}
          <section className={card}>
            <h2 className={heading}><PackageSearch size={16} />Products</h2>
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
              <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">No products yet. Search above to add.</p>
            )}
          </section>
        </div>

        {/* order + totals (sticky on wide screens) */}
        <aside className={`${card} space-y-4 lg:sticky lg:top-6`}>
          <h2 className={`${heading} mb-0`}><ReceiptText size={16} />Order</h2>
          <label className="block text-sm font-semibold">Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${input} mt-1`}>
              {STATUSES.map((s) => <option key={s} value={s}>{statusOf(s).label}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">Payment
              <select value={payment} onChange={(e) => setPayment(e.target.value)} className={`${input} mt-1`}>
                {PAYMENTS.map((p) => <option key={p} value={p}>{PAYMENT[p].label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">Paid by
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${input} mt-1`}>
                <option value="">Not chosen</option>
                {PAY_METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                <option value="cash">Cash at shop</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold">Delivery (Rs.)
            <input inputMode="numeric" value={delivery} onChange={(e) => setDelivery(e.target.value)} className={`${input} mt-1`} />
          </label>
          <label className="flex items-start gap-2.5 text-sm font-semibold">
            <input type="checkbox" checked={reduceStock} onChange={(e) => setReduceStock(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
            {editing ? "Adjust stock for the changes I made" : "Reduce stock for these pieces (free pieces included)"}
          </label>

          <div className="space-y-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-muted"><span>Subtotal · {pcs} pcs</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-muted"><span>Delivery</span><span>{money(ship)}</span></div>
            <div className="flex justify-between pt-1 text-2xl font-extrabold"><span>Total</span><span>{money(total)}</span></div>
          </div>
          {err && <p role="alert" className="rounded-xl bg-hot/10 px-3 py-2 text-sm font-semibold text-hot">{err}</p>}
          <button disabled={busy} className="w-full rounded-full bg-brand-600 py-3.5 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">
            {busy ? "Saving…" : `${editing ? "Save order" : "Create order"} · ${money(total)}`}
          </button>
          <Link href="/admin/orders" className="block text-center text-sm font-bold text-muted hover:text-fg">Cancel</Link>
        </aside>
      </div>
    </form>
  );
}
