"use client";

import { useState } from "react";
import { PackagePlus, Search, Trash2 } from "lucide-react";
import { money } from "@/lib/format";
import type { Options, P } from "../model";
import { Section, input } from "../ui";

/** "This kit includes…": other products sold together as this one. */
export default function Bundle({ p, set, opts }: { p: P; set: (v: Partial<P>) => void; opts: Options }) {
  const [q, setQ] = useState("");
  const rows = p.bundle;
  const t = q.trim().toLowerCase();
  const hits = t ? opts.products.filter((o) => o.id !== p.id && !rows.some((r) => r.product_id === o.id) && `${o.name} ${o.sku ?? ""}`.toLowerCase().includes(t)).slice(0, 6) : [];
  const find = (id: string) => opts.products.find((o) => o.id === id);
  const separate = rows.reduce((n, r) => n + (find(r.product_id)?.price ?? 0) * r.qty, 0);
  const price = Number(p.price) || 0;

  return (
    <Section id="bundle" title="Bundle" sub="If this product is a kit or set, list what is inside. Customers see it on the product page.">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to include" className={`${input} pl-10`} />
        {hits.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-card shadow-xl">
            {hits.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => { set({ bundle: [...rows, { product_id: o.id, qty: 1 }] }); setQ(""); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-soft">
                  <PackagePlus size={16} className="text-brand-600" /><span className="flex-1 truncate font-semibold">{o.name}</span><span className="text-muted">{money(o.price)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {rows.map((r, i) => {
              const o = find(r.product_id);
              return (
                <li key={r.product_id} className="flex items-center gap-3 p-3 text-sm">
                  <span className="flex-1 truncate font-semibold">{o?.name ?? "Deleted product"}</span>
                  <label className="flex items-center gap-1 text-xs text-muted">Qty
                    <input inputMode="numeric" value={r.qty} onChange={(e) => set({ bundle: rows.map((x, k) => (k === i ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x)) })} className="w-14 rounded-lg border border-line bg-bg px-2 py-1 text-center font-semibold text-fg outline-none focus:border-brand-500" />
                  </label>
                  <span className="w-24 text-right text-muted">{money((o?.price ?? 0) * r.qty)}</span>
                  <button type="button" aria-label="Remove" onClick={() => set({ bundle: rows.filter((_, k) => k !== i) })} className="rounded-lg p-1.5 text-hot hover:bg-hot/10"><Trash2 size={15} /></button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-sm text-muted">
            Bought separately: <b className="text-fg">{money(separate)}</b>
            {price > 0 && separate > price && <> · Bundle saves the customer <b className="text-green-700">{money(separate - price)}</b></>}
          </p>
        </>
      )}
    </Section>
  );
}
