import { Plus, Trash2 } from "lucide-react";
import type { Variant } from "@/lib/types";
import type { P } from "../model";
import { Section, input } from "../ui";

export default function Variants({ p, set }: { p: P; set: (v: Partial<P>) => void }) {
  const rows = p.variants;
  const upd = (i: number, v: Partial<Variant>) => set({ variants: rows.map((r, k) => (k === i ? { ...r, ...v } : r)) });
  const n = (s: string) => (s === "" ? null : Number(s));

  return (
    <Section id="variants" title="Variants" sub="Options the customer picks, like colour or size. Leave price empty to use the main price.">
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="pb-2 font-semibold">Option name</th><th className="pb-2 font-semibold">SKU</th><th className="pb-2 font-semibold">Price (Rs.)</th><th className="pb-2 font-semibold">Stock</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="pb-2 pr-2"><input value={r.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder="e.g. Black / 428H" className={input} /></td>
                  <td className="pb-2 pr-2"><input value={r.sku ?? ""} onChange={(e) => upd(i, { sku: e.target.value })} className={input} /></td>
                  <td className="pb-2 pr-2"><input inputMode="decimal" value={r.price ?? ""} onChange={(e) => upd(i, { price: n(e.target.value) })} placeholder={p.price || "same"} className={input} /></td>
                  <td className="pb-2 pr-2"><input inputMode="numeric" value={r.stock ?? ""} onChange={(e) => upd(i, { stock: n(e.target.value) })} className={input} /></td>
                  <td className="pb-2"><button type="button" aria-label="Remove" onClick={() => set({ variants: rows.filter((_, k) => k !== i) })} className="rounded-lg p-2 text-hot hover:bg-hot/10"><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" onClick={() => set({ variants: [...rows, { name: "", sku: "", price: null, stock: null }] })} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"><Plus size={15} />Add variant</button>
      {rows.length === 0 && <p className="mt-2 text-xs text-muted">No variants: customers buy this product as it is.</p>}
    </Section>
  );
}
