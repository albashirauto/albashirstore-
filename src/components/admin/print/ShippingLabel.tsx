import type { Order } from "@/components/admin/orders/types";
import Barcode from "./Barcode";

/**
 * Parcel label for courier flyers (4×6 in or A6). Big TO block a rider can read at a glance,
 * FROM block for returns, barcode of the tracking (or order) number. Black ink only.
 */
export default function ShippingLabel({ o, s, width, height }: { o: Order; s: Record<string, string>; width: string; height: string }) {
  const no = o.id.slice(0, 8).toUpperCase();
  const code = o.tracking_no || no;
  const pcs = (o.items ?? []).reduce((n, i) => n + i.qty + (i.free ?? 0), 0);
  const paid = o.payment_status === "paid";
  const contents = (o.items ?? []).map((i) => `${i.name} ×${i.qty + (i.free ?? 0)}`).join(", ");

  return (
    <div className="mx-auto flex flex-col overflow-hidden bg-white text-[10.5px] leading-snug text-black" style={{ width, height }}>
      {/* sender strip */}
      <div className="flex items-center justify-between bg-black px-3 py-1.5 text-white">
        <span className="font-display text-base font-extrabold uppercase tracking-wide">{s.store_name || "Al Bashir Autos"}</span>
        <span className="font-bold">#{no}</span>
      </div>

      {/* TO */}
      <div className="flex-1 border-b-2 border-black px-3 py-2">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.2em]">{o.delivery_method === "pickup" ? "Collect from shop" : "Ship to"}</p>
        <p className="mt-0.5 text-[17px] font-extrabold leading-tight">{o.customer_name}</p>
        <p className="text-[16px] font-extrabold tracking-wide">{o.phone}</p>
        <p className="mt-1 text-[12px] font-semibold leading-tight">{o.address}</p>
        {o.city && <p className="mt-1 inline-block border-2 border-black px-2 py-0.5 font-display text-[22px] font-extrabold uppercase leading-none">{o.city}</p>}
        {(o.district || o.province) && <p className="mt-1 text-[11px] font-bold uppercase">{[o.district !== o.city ? o.district : null, o.province].filter(Boolean).join(" · ")}</p>}
      </div>

      {/* barcode + courier */}
      <div className="border-b-2 border-black px-3 py-1.5 text-center">
        <Barcode value={code} height={44} className="mx-auto h-[44px] w-[92%]" />
        <p className="mt-0.5 font-mono text-[12px] font-bold tracking-[0.25em]">{code}</p>
        <p className="text-[10px] font-bold uppercase">{o.courier ? `${o.courier}${o.tracking_no ? " · tracking" : ""}` : "Order number"}</p>
      </div>

      {/* payment + pieces */}
      <div className="grid grid-cols-2 border-b-2 border-black">
        <div className="border-r-2 border-black px-3 py-1.5">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.2em]">{paid ? "Payment" : "Amount to receive"}</p>
          <p className="font-display text-[22px] font-extrabold leading-none">{paid ? "PAID" : `Rs. ${Math.round(o.total).toLocaleString()}`}</p>
        </div>
        <div className="px-3 py-1.5">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.2em]">Pieces · Date</p>
          <p className="font-display text-[22px] font-extrabold leading-none">{pcs} <span className="text-[12px] font-bold">· {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span></p>
        </div>
      </div>

      {/* contents */}
      <div className="border-b-2 border-black px-3 py-1.5">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.2em]">Contents</p>
        <p className="line-clamp-2 text-[10px]">{contents || "Spare parts"}</p>
      </div>

      {/* FROM */}
      <div className="px-3 py-1.5">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.2em]">From (return to)</p>
        <p className="font-bold">{s.store_name || "Al Bashir Autos"} · {s.phone}</p>
        <p className="line-clamp-2 text-[9.5px]">{s.address}</p>
      </div>

      <div className="mt-auto bg-black py-1 text-center text-[9px] font-extrabold uppercase tracking-[0.3em] text-white">Handle with care · Auto parts</div>
    </div>
  );
}
