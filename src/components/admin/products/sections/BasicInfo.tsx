import { Plus } from "lucide-react";
import type { Options, P } from "../model";
import { slugify } from "../model";
import type { QuickKind } from "../QuickCreate";
import { Field, Section, Toggle, input } from "../ui";

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-600 hover:text-hot"><Plus size={13} />{label}</button>;
}

export default function BasicInfo({ p, set, opts, quick, slugTouched, setSlugTouched }: {
  p: P; set: (v: Partial<P>) => void; opts: Options; quick: (k: QuickKind, parent?: string) => void;
  slugTouched: boolean; setSlugTouched: (v: boolean) => void;
}) {
  const mains = opts.categories.filter((c) => !c.parent_id);
  const subsOf = (id: string) => opts.categories.filter((c) => c.parent_id === id);
  const current = opts.categories.find((c) => c.id === p.category_id);
  const mainId = current?.parent_id ?? current?.id ?? "";

  return (
    <Section id="basic" title="Basic info" sub="Name, where it belongs, and what it fits.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name *" wide>
          <input required value={p.name} onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} placeholder="e.g. CD 70 Chain Kit (Chain + Sprockets)" className={input} />
        </Field>
        <Field label="Web address (slug)" help={`yoursite.com/products/${p.slug || "…"}`}>
          <input value={p.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} className={input} />
        </Field>
        <Field label="SKU / part number">
          <input value={p.sku} onChange={(e) => set({ sku: e.target.value })} placeholder="ABA-1001" className={input} />
        </Field>

        <Field label="Category" extra={<span className="flex gap-2"><AddBtn label="Category" onClick={() => quick("category")} /><AddBtn label="Sub-category" onClick={() => quick("subcategory", mainId)} /></span>}>
          <select value={p.category_id} onChange={(e) => set({ category_id: e.target.value })} className={input}>
            <option value="">No category</option>
            {mains.map((m) => (
              <optgroup key={m.id} label={m.name}>
                <option value={m.id}>{m.name}</option>
                {subsOf(m.id).map((s) => <option key={s.id} value={s.id}>↳ {s.name}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Brand" extra={<AddBtn label="New" onClick={() => quick("brand")} />}>
          <select value={p.brand_id} onChange={(e) => set({ brand_id: e.target.value })} className={input}>
            <option value="">No brand</option>
            {opts.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>

        <Field label="Fits bike / vehicle" extra={<AddBtn label="New" onClick={() => quick("vehicle")} />}>
          <select value={p.vehicle_id} onChange={(e) => set({ vehicle_id: e.target.value })} className={input}>
            <option value="">Not set (fits many)</option>
            {opts.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}{v.type ? ` · ${v.type}` : ""}</option>)}
          </select>
        </Field>
        <Field label="Condition">
          <select value={p.condition} onChange={(e) => set({ condition: e.target.value })} className={input}>
            <option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option>
          </select>
        </Field>

        <Field label="Warranty / guarantee" help="Leave empty if none. e.g. 6 months, Check on delivery">
          <input value={p.warranty} onChange={(e) => set({ warranty: e.target.value })} className={input} />
        </Field>
        <div className="sm:pt-6">
          <Toggle on={p.fitment_verified} set={(v) => set({ fitment_verified: v })} label="Fitment checked" hint="You confirmed it fits the bike above" />
        </div>
      </div>
    </Section>
  );
}
