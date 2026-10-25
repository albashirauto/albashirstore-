import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { P } from "../model";
import { Section, input } from "../ui";

const SUGGEST = ["Material", "Size", "Voltage", "Capacity", "Color", "Weight", "Made in", "Pack size", "Teeth", "Thread"];

export default function Specs({ p, set }: { p: P; set: (v: Partial<P>) => void }) {
  const rows = p.specs;
  const upd = (i: number, v: Partial<{ label: string; value: string }>) => set({ specs: rows.map((r, k) => (k === i ? { ...r, ...v } : r)) });
  const move = (i: number, d: number) => { const n = [...rows]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; set({ specs: n }); };
  const unused = SUGGEST.filter((s) => !rows.some((r) => r.label.toLowerCase() === s.toLowerCase()));

  return (
    <Section id="specs" title="Specifications" sub="Shown as a neat table on the product page.">
      {rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="flex gap-2">
              <input value={r.label} onChange={(e) => upd(i, { label: e.target.value })} placeholder="Label" className={`${input} w-2/5`} />
              <input value={r.value} onChange={(e) => upd(i, { value: e.target.value })} placeholder="Value" className={input} />
              <button type="button" aria-label="Up" onClick={() => move(i, -1)} className="rounded-lg px-1.5 text-muted hover:text-fg"><ArrowUp size={15} /></button>
              <button type="button" aria-label="Down" onClick={() => move(i, 1)} className="rounded-lg px-1.5 text-muted hover:text-fg"><ArrowDown size={15} /></button>
              <button type="button" aria-label="Remove" onClick={() => set({ specs: rows.filter((_, k) => k !== i) })} className="rounded-lg px-1.5 text-hot hover:bg-hot/10"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => set({ specs: [...rows, { label: "", value: "" }] })} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"><Plus size={15} />Add row</button>
        {unused.slice(0, 7).map((s) => (
          <button key={s} type="button" onClick={() => set({ specs: [...rows, { label: s, value: "" }] })} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-brand-500 hover:text-brand-600">+ {s}</button>
        ))}
      </div>
    </Section>
  );
}
