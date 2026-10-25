import { Gift } from "lucide-react";
import { money } from "@/lib/format";
import type { P, X } from "../model";
import { Field, Section, Toggle, input } from "../ui";

export default function PricingStock({ p, set, x, setX }: { p: P; set: (v: Partial<P>) => void; x: X; setX: (v: Partial<X>) => void }) {
  const price = Number(p.price) || 0, compare = Number(p.compare_price) || 0, cost = Number(x.cost_price) || 0;
  const off = compare > price && price ? Math.round(((compare - price) / compare) * 100) : 0;
  const margin = price && cost ? price - cost : 0;
  const stock = Number(p.stock) || 0;
  const reorder = Number(x.reorder_level) || 5;
  const shown = p.stock_status === "out_of_stock" ? "Out of stock" : p.stock_status === "in_stock" ? "In stock" : stock <= 0 ? "Out of stock" : stock <= reorder ? `Low: ${stock} left` : `In stock (${stock})`;
  const tone = shown.startsWith("Out") ? "bg-hot/10 text-hot" : shown.startsWith("Low") ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800";

  return (
    <Section id="pricing" title="Pricing & stock" sub="Customer price, your cost (private) and how much you have.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (Rs.) *">
          <input required inputMode="decimal" value={p.price} onChange={(e) => set({ price: e.target.value })} className={input} />
        </Field>
        <Field label="Old price (Rs.)" help={off ? `Shows “-${off}%” on the site` : "Higher than price = discount badge"}>
          <input inputMode="decimal" value={p.compare_price} onChange={(e) => set({ compare_price: e.target.value })} className={input} />
        </Field>
        <Field label="Cost price (Rs.), private" help={margin ? `Profit ${money(margin)} each (${Math.round((margin / price) * 100)}%)` : "What you paid. Used for profit."}>
          <input inputMode="decimal" value={x.cost_price} onChange={(e) => setX({ cost_price: e.target.value })} className={input} />
        </Field>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Field label="Stock quantity">
          <input inputMode="numeric" value={p.stock} onChange={(e) => set({ stock: e.target.value })} className={input} />
        </Field>
        <Field label="Low stock alert at" help="Dashboard warns at this number.">
          <input inputMode="numeric" value={x.reorder_level} onChange={(e) => setX({ reorder_level: e.target.value })} placeholder="5" className={input} />
        </Field>
        <Field label="Availability">
          <select value={p.stock_status} onChange={(e) => set({ stock_status: e.target.value as P["stock_status"] })} className={input}>
            <option value="auto">Automatic (from stock number)</option>
            <option value="in_stock">Always in stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>Customers see: {shown}</span>
        <button type="button" onClick={() => set({ stock_status: "out_of_stock" })} className="text-xs font-bold text-hot hover:underline">Mark out of stock</button>
        <button type="button" onClick={() => set({ stock_status: "auto" })} className="text-xs font-bold text-brand-600 hover:underline">Follow stock number</button>
      </div>
      <div className="mt-4"><Toggle on={p.show_stock} set={(v) => set({ show_stock: v })} label="Show stock count on the website" hint="Turn off to hide “Only 3 left”." /></div>

      <div className="mt-6 rounded-xl border border-green-600/30 bg-green-600/[0.05] p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400"><Gift size={16} />Bulk scheme (optional)</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
          <Field label="Buy (pieces)"><input inputMode="numeric" value={p.scheme_buy} onChange={(e) => set({ scheme_buy: e.target.value })} placeholder="20" className={input} /></Field>
          <Field label="Get free"><input inputMode="numeric" value={p.scheme_free} onChange={(e) => set({ scheme_free: e.target.value })} placeholder="5" className={input} /></Field>
        </div>
        {Number(p.scheme_buy) > 0 && Number(p.scheme_free) > 0 && (
          <p className="mt-2 text-xs text-muted">Buy {p.scheme_buy}, get {p.scheme_free} free. {cost ? `Each full set costs you ${money(cost * (Number(p.scheme_buy) + Number(p.scheme_free)))} and sells for ${money(price * Number(p.scheme_buy))}.` : ""}</p>
        )}
      </div>
    </Section>
  );
}
