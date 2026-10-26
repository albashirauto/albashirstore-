import { money } from "@/lib/format";
import { placeLine } from "@/lib/pk-places";
import type { Order } from "@/components/admin/orders/types";
import { statusOf } from "@/components/admin/dashboard/types";

export type Paper = "label46" | "labelA6" | "a4" | "a5p" | "a5l" | "t80" | "t58";
export const PAPERS: { key: Paper; label: string; page: string; width: string; height?: string; thermal?: boolean; isLabel?: boolean }[] = [
  { key: "label46", label: "Parcel label 4×6 in", page: "4in 6in", width: "4in", height: "6in", isLabel: true },
  { key: "labelA6", label: "Parcel label A6", page: "A6 portrait", width: "105mm", height: "148mm", isLabel: true },
  { key: "a4", label: "A4", page: "A4 portrait", width: "210mm" },
  { key: "a5p", label: "A5 portrait", page: "A5 portrait", width: "148mm" },
  { key: "a5l", label: "A5 landscape", page: "A5 landscape", width: "210mm" },
  { key: "t80", label: "Thermal 80 mm", page: "80mm auto", width: "80mm", thermal: true },
  { key: "t58", label: "Thermal 58 mm", page: "58mm auto", width: "58mm", thermal: true },
];

const no = (o: Order) => o.id.slice(0, 8).toUpperCase();
const when = (iso: string) => new Date(iso).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/** Printable receipt. Thermal = narrow single column; A4/A5 = invoice layout. Black ink only. */
export default function Receipt({ o, s, skus, paper }: { o: Order; s: Record<string, string>; skus: Map<string, string>; paper: Paper }) {
  const P = PAPERS.find((x) => x.key === paper)!;
  const pcs = (o.items ?? []).reduce((n, i) => n + i.qty + (i.free ?? 0), 0);

  if (P.thermal) {
    const small = paper === "t58";
    return (
      <div className={`mx-auto bg-white p-[3mm] font-mono text-black ${small ? "text-[10px]" : "text-[11.5px]"}`} style={{ width: P.width }}>
        <div className="text-center">
          <p className={`font-sans font-extrabold uppercase ${small ? "text-sm" : "text-base"}`}>{s.store_name || "Al Bashir Autos"}</p>
          {s.address && <p className="leading-tight">{s.address}</p>}
          {s.phone && <p>{s.phone}</p>}
        </div>
        <p className="my-1.5 border-y border-dashed border-black py-1 text-center font-bold">RECEIPT #{no(o)}</p>
        <p>{when(o.created_at)}</p>
        <p>{o.customer_name} · {o.phone}</p>
        <p className="leading-tight">{[o.address, placeLine(o)].filter(Boolean).join(", ")}</p>
        <div className="my-1.5 border-t border-dashed border-black" />
        {(o.items ?? []).map((i, k) => (
          <div key={k} className="mb-1">
            <p className="leading-tight">{i.name}</p>
            <p className="flex justify-between"><span>{i.qty} x {Math.round(i.price)}{i.free ? ` +${i.free} free` : ""}</span><span>{Math.round(i.price * i.qty).toLocaleString()}</span></p>
          </div>
        ))}
        <div className="my-1.5 border-t border-dashed border-black" />
        <p className="flex justify-between"><span>Subtotal</span><span>{Math.round(o.subtotal).toLocaleString()}</span></p>
        <p className="flex justify-between"><span>Delivery</span><span>{Math.round(o.shipping).toLocaleString()}</span></p>
        <p className={`flex justify-between border-t border-black pt-1 font-bold ${small ? "text-xs" : "text-sm"}`}><span>TOTAL Rs.</span><span>{Math.round(o.total).toLocaleString()}</span></p>
        <p className="mt-1">{pcs} pcs · {(o.payment_status ?? "unpaid").toUpperCase()}</p>
        {(o.courier || o.tracking_no) && <p>{o.courier} {o.tracking_no}</p>}
        <p className="mt-2 border-t border-dashed border-black pt-1.5 text-center">Thank you for shopping with us!</p>
      </div>
    );
  }

  const compact = paper !== "a4";
  return (
    <div className={`mx-auto bg-white text-black ${compact ? "p-[8mm] text-[11px]" : "p-[14mm] text-[13px]"}`} style={{ width: P.width }}>
      <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-3">
        <div>
          <p className={`font-display font-extrabold uppercase leading-none ${compact ? "text-2xl" : "text-4xl"}`}>{s.store_name || "Al Bashir Autos"}</p>
          {s.tagline && <p className="mt-1 text-[0.9em] text-neutral-600">{s.tagline}</p>}
          <p className="mt-1.5 leading-snug">{s.address}</p>
          <p>{[s.phone, s.email].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="text-right">
          <p className={`font-display font-extrabold uppercase ${compact ? "text-xl" : "text-3xl"}`}>Invoice</p>
          <p className="font-bold">#{no(o)}</p>
          <p>{when(o.created_at)}</p>
          <p className="mt-1">Status: <b>{statusOf(o.status).label}</b></p>
          <p>Payment: <b className="capitalize">{o.payment_status ?? "unpaid"}</b></p>
        </div>
      </header>

      <section className={`grid gap-4 py-3 ${paper === "a5l" || paper === "a4" ? "grid-cols-2" : "grid-cols-1"}`}>
        <div>
          <p className="text-[0.85em] font-bold uppercase tracking-wider text-neutral-500">Bill to</p>
          <p className="font-bold">{o.customer_name}</p>
          <p>{o.phone}</p>
          <p className="leading-snug">{[o.address, placeLine(o)].filter(Boolean).join(", ")}</p>
        </div>
        {(o.courier || o.tracking_no || o.note) && (
          <div>
            {(o.courier || o.tracking_no) && <><p className="text-[0.85em] font-bold uppercase tracking-wider text-neutral-500">Shipping</p><p>{o.courier} {o.tracking_no && <b>{o.tracking_no}</b>}</p></>}
            {o.note && <p className="mt-1 italic">Note: {o.note}</p>}
          </div>
        )}
      </section>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-black text-left text-[0.85em] uppercase">
            <th className="py-1.5 pr-2">#</th><th className="py-1.5 pr-2">Item</th><th className="py-1.5 pr-2 text-right">Qty</th><th className="py-1.5 pr-2 text-right">Free</th><th className="py-1.5 pr-2 text-right">Price</th><th className="py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(o.items ?? []).map((i, k) => (
            <tr key={k} className="border-b border-neutral-300 align-top">
              <td className="py-1.5 pr-2">{k + 1}</td>
              <td className="py-1.5 pr-2">{i.name}{i.id && skus.get(i.id) ? <span className="block text-[0.85em] text-neutral-500">{skus.get(i.id)}</span> : null}</td>
              <td className="py-1.5 pr-2 text-right">{i.qty}</td>
              <td className="py-1.5 pr-2 text-right">{i.free || "–"}</td>
              <td className="py-1.5 pr-2 text-right">{money(i.price)}</td>
              <td className="py-1.5 text-right">{money(i.price * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex justify-between gap-6">
        <p className="self-end text-[0.9em] text-neutral-600">{pcs} pieces in total{(o.items ?? []).some((i) => i.free) ? ", free scheme pieces included" : ""}.</p>
        <table className="min-w-[45%]">
          <tbody>
            <tr><td className="py-0.5 pr-4">Subtotal</td><td className="text-right">{money(o.subtotal)}</td></tr>
            <tr><td className="py-0.5 pr-4">Delivery</td><td className="text-right">{money(o.shipping)}</td></tr>
            <tr className="border-t-2 border-black text-[1.15em] font-extrabold"><td className="py-1 pr-4">Total</td><td className="text-right">{money(o.total)}</td></tr>
          </tbody>
        </table>
      </div>

      <footer className="mt-6 border-t border-neutral-300 pt-2 text-center text-[0.9em] text-neutral-600">
        Thank you for your order! Questions? Call or WhatsApp {s.phone}.
      </footer>
    </div>
  );
}
