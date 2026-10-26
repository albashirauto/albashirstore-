"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Gift, Lock, MapPin, ShieldCheck, Store, TicketPercent, Truck, Wallet, X } from "lucide-react";
import { deliveryQuote } from "@/lib/delivery";
import { checkCoupon, placeOrder, saveCart, type CouponQuote } from "@/app/actions";
import { useCart } from "@/components/CartProvider";
import ProductImage from "@/components/ProductImage";
import { money } from "@/lib/format";
import { receiptText, type PayMethod } from "@/lib/receipt";
import { placeLine } from "@/lib/pk-places";
import PlacePicker from "./PlacePicker";
import { freeQty } from "@/lib/scheme";
import { track } from "@/lib/analytics";
import type { Settings } from "@/lib/types";
import OrderDone from "./OrderDone";
import PaymentPicker from "./PaymentPicker";

const input = "mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 font-normal outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

function Step({ n, title, icon: Icon, children }: { n: number; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-bold">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{n}</span>{title}
        <Icon size={18} className="ml-auto text-muted" />
      </h2>
      {children}
    </section>
  );
}

/** Two steps (delivery details, payment) + sticky summary. Details are remembered on this device. */
export default function Checkout({ s }: { s: Settings }) {
  const { items, subtotal, clear } = useCart();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<CouponQuote | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [checking, setChecking] = useState(false);
  const discount = coupon?.ok ? Math.min(subtotal, coupon.discount ?? 0) : 0;
  const [pickup, setPickup] = useState(false);
  const canPickup = s.pickup_enabled === "yes";
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [f, setF] = useState({ name: "", phone: "", email: "", province: "", district: "", city: "", address: "", note: "" });
  const dq = deliveryQuote(s, f, subtotal, pickup && canPickup);
  const shipping = coupon?.ok && coupon.free_shipping ? 0 : dq.fee;
  const total = subtotal - discount + shipping;
  const [method, setMethod] = useState<PayMethod | "">("");
  const [ref, setRef] = useState("");
  const [done, setDone] = useState<{ no: string; total: number; text: string } | null>(null);

  useEffect(() => { try { const c = localStorage.getItem("aba-customer"); if (c) setF((x) => ({ ...x, ...JSON.parse(c) })); } catch {} }, []);

  const apply = async (c = code) => {
    if (!c.trim()) return;
    setChecking(true); setCouponMsg("");
    const q = await checkCoupon(c, subtotal, f.phone);
    setChecking(false);
    if (q.ok) { setCoupon(q); setCode(q.code ?? c); } else { setCoupon(null); setCouponMsg(q.message ?? "This coupon cannot be used."); }
  };
  // ?coupon=EID10 links (WhatsApp / Facebook posts) fill and apply the code
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("coupon");
    if (c && subtotal > 0) { setCode(c.toUpperCase()); apply(c); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal > 0]);
  // phone typed: keep the cart so the shop can follow up if the visitor leaves
  useEffect(() => {
    if (f.phone.replace(/D/g, "").length < 10 || !items.length || done) return;
    const t = setTimeout(() => { saveCart({ phone: f.phone, name: f.name, city: f.city, items: items.map((i) => ({ id: i.id, slug: i.slug, name: i.name, qty: i.qty, price: i.price })) }).catch(() => {}); }, 1500);
    return () => clearTimeout(t);
  }, [f.phone, f.name, f.city, items, done]);
  // cart changed: check the applied coupon again (minimum order, % amount)
  useEffect(() => {
    if (!coupon?.ok) return;
    const t = setTimeout(() => apply(coupon.code ?? code), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (done) return <OrderDone orderNo={done.no} total={done.total} method={method} receiptText={done.text} whatsapp={s.whatsapp} payLink />;

  if (!items.length)
    return (
      <div className="py-24 text-center">
        <p className="text-xl font-bold">Your cart is empty.</p>
        <Link href="/shop" className="mt-4 inline-block rounded-full bg-brand-600 px-8 py-3 font-bold text-white">Browse parts</Link>
      </div>
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pickup && (!f.province || !f.district || !f.city)) return setError("Choose your province, district and city / town.");
    if (!method) return setError("Choose how you will pay: JazzCash, Easypaisa or bank transfer.");
    const tItems = items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
    track("begin_checkout", { value: subtotal, items: tItems });
    start(async () => {
      const r = await placeOrder({ ...f, pickup: pickup && canPickup, payment_method: method, payment_ref: ref, coupon: coupon?.ok ? coupon.code : "", items: items.map((i) => ({ id: i.id, qty: i.qty })) });
      if (!r.ok || !r.receipt) return setError(r.message ?? "Something went wrong.");
      try { const { name, phone, email, province, district, city, address } = f; localStorage.setItem("aba-customer", JSON.stringify({ name, phone, email, province, district, city, address })); } catch {}
      const no = String(r.orderNo ?? "");
      track("purchase", { value: r.receipt.total, items: tItems, orderNo: no });
      setDone({ no, total: r.receipt.total, text: receiptText({ orderNo: no, name: f.name, phone: f.phone, city: placeLine(f), address: f.address, ...r.receipt, method, ref, store: s.store_name || "Al Bashir Autos" }) });
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" /><Lock size={12} />Secure checkout</p>
      <h1 className="text-5xl font-extrabold uppercase leading-none text-brand-900 dark:text-white">Checkout</h1>

      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Step n={1} title="Delivery details" icon={MapPin}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Full name *<input required autoComplete="name" value={f.name} onChange={set("name")} className={input} /></label>
              <label className="block text-sm font-semibold">Phone / WhatsApp *<input required type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} placeholder="03xx xxxxxxx" className={input} /></label>
            </div>
            {canPickup && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {([[false, "Home delivery", Truck, "Courier to your door"], [true, "Collect from shop", Store, "Free · at our shop"]] as const).map(([v, l, I, d]) => (
                  <button key={l} type="button" onClick={() => setPickup(v)} aria-pressed={pickup === v} className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${pickup === v ? "border-brand-600 bg-brand-50 dark:bg-brand-900" : "border-line hover:border-brand-500/50"}`}>
                    <I size={20} className="shrink-0 text-brand-600" /><span className="leading-tight"><b className="block text-sm">{l}</b><span className="text-xs text-muted">{v && s.pickup_note ? s.pickup_note.slice(0, 40) : d}</span></span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4">
              <PlacePicker optional={pickup} input={input} value={{ province: f.province, district: f.district, city: f.city }} onChange={(p) => setF({ ...f, ...p })} />
            </div>
            <label className="mt-4 block text-sm font-semibold">Email <span className="font-normal text-muted">(optional)</span><input type="email" autoComplete="email" value={f.email} onChange={set("email")} className={input} /></label>
            {!pickup && <label className="mt-4 block text-sm font-semibold">Full address *<textarea required rows={2} autoComplete="street-address" value={f.address} onChange={set("address")} placeholder="House / shop, street, area, nearby landmark" className={input} /></label>}
            <label className="mt-4 block text-sm font-semibold">Note <span className="font-normal text-muted">(bike model, part number…)</span><textarea rows={2} value={f.note} onChange={set("note")} className={input} /></label>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900 dark:bg-brand-900 dark:text-brand-100">
              {pickup ? <Store size={18} className="mt-0.5 shrink-0" /> : <Truck size={18} className="mt-0.5 shrink-0" />}
              <span>
                <b>{pickup ? "Collect from the shop: free" : `Delivery to ${dq.area}: ${shipping ? money(shipping) : "FREE"}`}</b>
                {!pickup && dq.days && <span className="block">Usually arrives in {dq.days}.</span>}
                {pickup && s.pickup_note && <span className="block">{s.pickup_note}</span>}
                {pickup && s.address && <span className="block text-xs opacity-80">{s.address}</span>}
              </span>
            </div>
          </Step>

          <Step n={2} title="Payment" icon={Wallet}>
            <PaymentPicker s={s} method={method} setMethod={setMethod} ref_={ref} setRef={setRef} total={money(total)} />
          </Step>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-44">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-xl font-bold">Your order</h2>
            <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {items.map((i) => {
                const free = freeQty(i.qty, i);
                return (
                  <li key={i.id} className="flex gap-3 text-sm">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-soft">
                      <ProductImage src={i.image} alt={i.name} sizes="56px" />
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{i.qty}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-semibold leading-snug">{i.name}</span>
                      {free > 0 && <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400"><Gift size={11} />+{free} free</span>}
                    </span>
                    <b>{money(i.price * i.qty)}</b>
                  </li>
                );
              })}
            </ul>
            {/* coupon */}
            <div className="mt-4 border-t border-line pt-4">
              {coupon?.ok ? (
                <div className="flex items-center gap-2 rounded-xl border border-green-600/30 bg-green-600/10 px-3 py-2.5 text-sm">
                  <TicketPercent size={18} className="shrink-0 text-green-700 dark:text-green-400" />
                  <span className="min-w-0 flex-1"><b className="font-mono">{coupon.code}</b> applied{coupon.free_shipping ? ": free delivery" : discount ? `: you save ${money(discount)}` : ""}{coupon.description && <span className="block truncate text-xs text-muted">{coupon.description}</span>}</span>
                  <button type="button" onClick={() => { setCoupon(null); setCode(""); }} aria-label="Remove coupon" className="rounded-full p-1 text-muted hover:bg-card hover:text-hot"><X size={15} /></button>
                </div>
              ) : (
                <>
                  <label htmlFor="coupon" className="flex items-center gap-1.5 text-sm font-semibold"><TicketPercent size={15} className="text-hot" />Have a coupon?</label>
                  <div className="mt-1.5 flex gap-2">
                    <input id="coupon" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCouponMsg(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }} placeholder="e.g. EID10" autoCapitalize="characters" spellCheck={false} className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm uppercase outline-none focus:border-brand-500" />
                    <button type="button" onClick={() => apply()} disabled={checking || !code.trim()} className="rounded-xl bg-brand-900 px-4 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-600">{checking ? "…" : "Apply"}</button>
                  </div>
                  {couponMsg && <p className="mt-1.5 text-xs font-semibold text-hot">{couponMsg}</p>}
                </>
              )}
            </div>
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(subtotal)}</dd></div>
              {discount > 0 && <div className="flex justify-between font-semibold text-green-700 dark:text-green-400"><dt>Discount ({coupon?.code})</dt><dd>−{money(discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">{pickup ? "Collect from shop" : `Delivery · ${dq.area}`}</dt><dd>{shipping ? money(shipping) : <b className="text-green-700 dark:text-green-400">FREE</b>}</dd></div>
              {!pickup && dq.freeOver && !(coupon?.ok && coupon.free_shipping) && (
                <div className="pt-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${Math.min(100, (subtotal / dq.freeOver) * 100)}%` }} /></div>
                  <p className="mt-1 text-xs font-semibold text-green-700 dark:text-green-400">{dq.missing ? `Add ${money(dq.missing)} more for FREE delivery` : "You get FREE delivery!"}</p>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-2 text-xl font-extrabold"><dt>Total</dt><dd>{money(total)}</dd></div>
            </dl>
            {error && <p role="alert" className="mt-4 rounded-xl bg-hot/10 p-3 text-sm font-semibold text-hot">{error}</p>}
            <button disabled={pending} className="mt-5 w-full rounded-full bg-hot py-4 text-lg font-bold text-white shadow-lg shadow-hot/25 transition hover:-translate-y-0.5 hover:bg-hot-dark disabled:opacity-60">
              {pending ? "Placing order…" : `Place order · ${money(total)}`}
            </button>
          </div>
          <p className="flex items-center justify-center gap-2 text-xs text-muted"><ShieldCheck size={14} className="text-green-600" />Prices checked again on our server. We confirm every order by phone.</p>
        </aside>
      </form>
    </div>
  );
}
