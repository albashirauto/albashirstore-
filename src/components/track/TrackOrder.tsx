"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion } from "motion/react";
import { Check, ClipboardCheck, Copy, PackageCheck, PackageSearch, Search, Truck, XCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { trackOrder, type Tracked } from "@/app/actions";
import { money } from "@/lib/format";
import { payLabel } from "@/lib/receipt";

const input = "w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

const STEPS = [
  { key: "new", label: "Order placed", icon: ClipboardCheck },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "shipped", label: "Dispatched", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

const when = (d?: string | null) => (d ? new Date(d).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "");

/** Order number + phone -> status timeline, courier and tracking number, items. Opens straight away when both come in the link. */
export default function TrackOrder({ initialNo, initialPhone, whatsapp }: { initialNo: string; initialPhone: string; whatsapp?: string }) {
  const [no, setNo] = useState(initialNo.replace(/^#/, "").toUpperCase());
  const [phone, setPhone] = useState(initialPhone);
  const [order, setOrder] = useState<Tracked | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const phoneRef = useRef<HTMLInputElement>(null);

  const check = (n = no, p = phone) => start(async () => {
    setError("");
    const r = await trackOrder(n, p);
    setOrder(r.order ?? null);
    if (!r.ok) setError(r.message ?? "Something went wrong.");
  });

  useEffect(() => {
    if (initialNo && initialPhone) check(initialNo, initialPhone);
    else if (initialNo) phoneRef.current?.focus();
    // run once for links like /track?no=XXXX&phone=03xx
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const help = `Assalam o Alaikum, I want to ask about my order${no ? ` #${no}` : ""}.`;

  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-3xl px-4">
      <form onSubmit={(e) => { e.preventDefault(); check(); }} className="rounded-2xl border border-line bg-card p-6 shadow-xl shadow-brand-900/[0.07] md:p-8">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-1.5 text-sm font-semibold">Order number
            <input required value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} placeholder="e.g. 3A9F1C02" autoCapitalize="characters" spellCheck={false} className={`${input} font-mono tracking-wider`} />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">Phone used for the order
            <input ref={phoneRef} required value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="03xx xxxxxxx" className={input} />
          </label>
          <button disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">
            <Search size={18} />{pending ? "Checking…" : "Track"}
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">Your order number is on the order confirmation and the receipt you sent us on WhatsApp.</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-hot/10 px-4 py-3 text-sm font-semibold text-hot">{error}</p>}
      </form>

      {order && <Result key={order.no + order.status} o={order} />}

      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(help)}`} target="_blank" rel="noreferrer"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-green-700 hover:underline dark:text-green-400">
          <WhatsAppIcon size={18} />Need help with your order? Message us on WhatsApp
        </a>
      )}
    </section>
  );
}

function Result({ o }: { o: Tracked }) {
  const [copied, setCopied] = useState(false);
  const stopped = o.status === "cancelled" || o.status === "returned";
  const at = Math.max(0, STEPS.findIndex((s) => s.key === o.status));
  const dates: Record<string, string> = { new: when(o.created_at), shipped: when(o.dispatched_at) };

  const copy = async () => {
    try { await navigator.clipboard.writeText(o.tracking_no ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border border-line bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-3xl font-extrabold uppercase leading-none">Order #{o.no}</h2>
        <p className="text-sm text-muted">Placed {when(o.created_at)}</p>
      </div>
      <p className="mt-1 text-muted">Hi {o.name}{o.city ? ` from ${o.city}` : ""}, here is the latest on your order.</p>

      {stopped ? (
        <div className="mt-6 flex gap-3 rounded-xl bg-hot/10 p-4 text-hot">
          <XCircle className="shrink-0" />
          <div>
            <p className="font-bold">This order was {o.status}.</p>
            {o.reason && <p className="text-sm">Reason: {o.reason}</p>}
          </div>
        </div>
      ) : (
        <ol className="mt-8 grid grid-cols-4">
          {STEPS.map((s, i) => {
            const done = i <= at, Icon = s.icon;
            return (
              <li key={s.key} className="relative flex flex-col items-center text-center">
                {i > 0 && <span className={`absolute right-1/2 top-5 h-1 w-full -translate-y-1/2 rounded ${i <= at ? "bg-brand-600" : "bg-line"}`} />}
                <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ delay: i * 0.12 }}
                  className={`relative grid h-10 w-10 place-items-center rounded-full ${done ? "bg-brand-600 text-white" : "border-2 border-line bg-card text-muted"} ${i === at ? "ring-4 ring-brand-500/20" : ""}`}>
                  <Icon size={18} />
                </motion.span>
                <span className={`mt-2 text-xs font-bold sm:text-sm ${done ? "" : "text-muted"}`}>{s.label}</span>
                {done && dates[s.key] && <span className="hidden text-[11px] text-muted sm:block">{dates[s.key]}</span>}
              </li>
            );
          })}
        </ol>
      )}

      {(o.courier || o.tracking_no) && !stopped && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-soft p-4">
          <p className="flex items-center gap-2 font-bold"><Truck size={18} className="text-brand-600" />{o.courier ?? "Courier"}</p>
          {o.tracking_no && (
            <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 font-mono text-sm font-bold transition hover:border-brand-500">
              {o.tracking_no}{copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-muted" />}
            </button>
          )}
          <p className="w-full text-xs text-muted">Use this tracking number on the courier&apos;s website or app.</p>
        </div>
      )}

      <div className="mt-8">
        <p className="flex items-center gap-2 font-bold"><PackageSearch size={18} />Items</p>
        <ul className="mt-3 divide-y divide-line text-sm">
          {o.items.map((i, k) => (
            <li key={k} className="flex justify-between gap-4 py-2">
              <span>{i.name}</span>
              <span className="shrink-0 text-muted">× {i.qty}{i.free ? ` + ${i.free} free` : ""}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-line pt-3 font-bold">
          <span>Total {money(o.total)}</span>
          <span className={o.payment_status === "paid" ? "text-green-600" : "text-muted"}>
            {payLabel(o.payment_method)} · {o.payment_status === "paid" ? "Paid" : o.payment_status === "refunded" ? "Refunded" : "Payment not confirmed yet"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
