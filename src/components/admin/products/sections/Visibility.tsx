import { Plus } from "lucide-react";
import type { Options, P } from "../model";
import type { QuickKind } from "../QuickCreate";
import { Field, Section, Toggle, input } from "../ui";

export default function Visibility({ p, set, opts, quick }: { p: P; set: (v: Partial<P>) => void; opts: Options; quick: (k: QuickKind) => void }) {
  return (
    <Section id="visibility" title="Visibility" sub="Where this product appears on the website.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle on={p.active} set={(v) => set({ active: v })} label="Show on website" hint={p.active ? "Customers can see and buy it" : "Hidden from customers (draft)"} />
        <Toggle on={p.is_featured} set={(v) => set({ is_featured: v })} label="Staff picks" hint="Home page “Staff picks”" />
        <Toggle on={p.is_trending} set={(v) => set({ is_trending: v })} label="Trending" hint="Home page “Trending now”" />
        <Field label="Promotion" extra={<button type="button" onClick={() => quick("promotion")} className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-600 hover:text-hot"><Plus size={13} />New</button>}>
          <select value={p.promotion_id} onChange={(e) => set({ promotion_id: e.target.value })} className={input}>
            <option value="">No promotion</option>
            {opts.promotions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </Field>
      </div>
    </Section>
  );
}
