import { Phone } from "lucide-react";
import type { X } from "../model";
import { Field, Section, input } from "../ui";

export default function SellerPurchase({ x, setX }: { x: X; setX: (v: Partial<X>) => void }) {
  return (
    <Section id="seller" title="Seller & purchase" sub="Where you buy it and where it sits in the shop." priv>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier name"><input value={x.supplier_name} onChange={(e) => setX({ supplier_name: e.target.value })} placeholder="e.g. Lahore wholesale market" className={input} /></Field>
        <Field label="Supplier phone" extra={x.supplier_phone && <a href={`tel:${x.supplier_phone}`} className="inline-flex items-center gap-1 text-xs font-bold text-brand-600"><Phone size={12} />Call</a>}>
          <input value={x.supplier_phone} onChange={(e) => setX({ supplier_phone: e.target.value })} inputMode="tel" className={input} />
        </Field>
        <Field label="Supplier's part number"><input value={x.supplier_sku} onChange={(e) => setX({ supplier_sku: e.target.value })} className={input} /></Field>
        <Field label="Location in shop" help="Rack, shelf or box, so anyone can find it."><input value={x.location} onChange={(e) => setX({ location: e.target.value })} placeholder="e.g. Rack B, Shelf 3" className={input} /></Field>
        <Field label="Purchase notes" wide><textarea rows={3} value={x.purchase_notes} onChange={(e) => setX({ purchase_notes: e.target.value })} placeholder="Minimum order, last price paid, delivery time…" className={`${input} resize-y`} /></Field>
      </div>
    </Section>
  );
}
