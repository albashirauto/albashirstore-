"use client";

import { useState } from "react";
import { Gift, Minus, Plus, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";
import { freeQty, hasScheme } from "@/lib/scheme";
import { isOut } from "@/lib/stock";
import { useCart } from "./CartProvider";

export default function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const variants = product.variants ?? [];
  const [vi, setVi] = useState<number | null>(variants.length ? 0 : null);
  const v = vi !== null ? variants[vi] : undefined;
  const out = isOut(product) || (v?.stock !== null && v?.stock !== undefined && v.stock <= 0);
  const scheme = hasScheme(product);
  const free = freeQty(qty, product);

  return (
    <div className="mt-6">
      {variants.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-bold">Choose option: <span className="font-semibold text-muted">{v?.name}</span></p>
          <div className="flex flex-wrap gap-2">
            {variants.map((o, i) => {
              const gone = o.stock !== null && o.stock !== undefined && o.stock <= 0;
              return (
                <button key={i} type="button" onClick={() => setVi(i)} disabled={gone}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${vi === i ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-white" : "border-line hover:border-brand-500"}`}>
                  {o.name}
                  {o.price !== null && o.price !== undefined && o.price !== product.price && <span className="ml-1.5 font-semibold text-muted">{money(o.price)}</span>}
                </button>
              );
            })}
          </div>
          {v && <p className="mt-2 text-sm text-muted">Price for this option: <b className="text-fg">{money(Number(v.price ?? product.price))}</b>{v.sku ? ` · ${v.sku}` : ""}</p>}
        </div>
      )}

      {scheme && (
        <div className="mb-3 flex flex-wrap gap-2">
          {[1, 2, 3].map((n) => {
            const q = product.scheme_buy! * n;
            return (
              <button key={n} onClick={() => setQty(q)} className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${qty === q ? "border-green-600 bg-green-600 text-white" : "border-line hover:border-green-600 hover:text-green-700"}`}>
                {q} pcs <span className="opacity-80">+{product.scheme_free! * n} free</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border-2 border-line">
          <button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3"><Minus size={16} /></button>
          <input
            type="number" inputMode="numeric" min={1} value={qty} aria-label="Quantity"
            onChange={(e) => setQty(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
            className="w-14 bg-transparent text-center font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button aria-label="Increase quantity" onClick={() => setQty((q) => q + 1)} className="p-3"><Plus size={16} /></button>
        </div>
        <button disabled={out} onClick={() => add(product, qty, vi)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-hot px-8 py-3.5 text-lg font-bold text-white transition hover:bg-hot-dark active:scale-95 disabled:opacity-40 sm:flex-none">
          <ShoppingCart size={20} />{out ? "Sold out" : "Add to cart"}
        </button>
      </div>

      {free > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-green-700 dark:text-green-400">
          <Gift size={15} />You get {qty + free} pieces ({free} free)
        </p>
      )}
    </div>
  );
}
