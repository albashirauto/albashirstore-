"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { CartItem, Product } from "@/lib/types";
import { money } from "@/lib/format";
import ProductImage from "./ProductImage";
import SchemeNote from "./SchemeNote";
import { lineKey } from "@/lib/stock";
import { track } from "@/lib/analytics";

type Ctx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  /** lowest delivery charge (Store settings; the exact one depends on the area, see src/lib/delivery.ts) */
  shipping: number;
  /** "from Rs. X" when areas cost more; free delivery from this parts total (0 = never) */
  shippingMax: number; freeOver: number;
  add: (p: Product, qty?: number, variant?: number | null) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};

export default function CartProvider({ children, shipping = 400, shippingMax = shipping, freeOver = 0 }: { children: React.ReactNode; shipping?: number; shippingMax?: number; freeOver?: number }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aba-cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem("aba-cart", JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const add = useCallback((p: Product, qty = 1, variant: number | null = null) => {
    const key = lineKey(p.id, variant);
    const v = variant !== null ? p.variants?.[variant] : undefined;
    const unit = Number(v?.price ?? p.price);
    track("add_to_cart", { value: unit * qty, items: [{ id: p.id, name: p.name, price: unit, qty }] });
    setItems((cur) => {
      const hit = cur.find((i) => i.id === key);
      const scheme = { scheme_buy: p.scheme_buy ?? null, scheme_free: p.scheme_free ?? null };
      if (hit) return cur.map((i) => (i.id === key ? { ...i, ...scheme, qty: i.qty + qty } : i));
      return [...cur, { id: key, slug: p.slug, name: v ? `${p.name} (${v.name})` : p.name, price: Number(v?.price ?? p.price), image: p.images?.[0] ?? null, qty, ...scheme }];
    });
    setOpen(true);
  }, []);
  const setQty = useCallback((id: string, qty: number) => setItems((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))), []);
  const remove = useCallback((id: string) => setItems((c) => c.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(() => ({
    items, add, setQty, remove, clear, open, setOpen, shipping, shippingMax, freeOver,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.price * i.qty, 0),
  }), [items, add, setQty, remove, clear, open, shipping, shippingMax, freeOver]);

  return (
    <CartCtx.Provider value={value}>
      {children}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-brand-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              role="dialog" aria-label="Shopping cart"
              className="fixed right-0 top-0 z-[61] flex h-dvh w-full max-w-md flex-col bg-bg shadow-2xl"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-2xl font-bold">Your cart ({value.count})</h2>
                <button onClick={() => setOpen(false)} aria-label="Close cart" className="rounded-full p-2 hover:bg-soft"><X size={20} /></button>
              </div>


              <div className="flex-1 overflow-y-auto px-5 py-4">
                {items.length === 0 ? (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <ShoppingBag className="mx-auto text-brand-500" size={48} />
                      <p className="mt-3 text-lg font-semibold">Your cart is empty</p>
                      <Link href="/shop" onClick={() => setOpen(false)} className="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white">Browse parts</Link>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    <AnimatePresence initial={false}>
                      {items.map((i) => (
                        <motion.li key={i.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 60 }} className="flex gap-3">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line"><ProductImage src={i.image} alt={i.name} /></div>
                          <div className="min-w-0 flex-1">
                            <Link href={`/products/${i.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 font-semibold leading-tight hover:text-brand-600">{i.name}</Link>
                            <p className="mt-0.5 text-sm font-bold text-brand-700 dark:text-brand-500">{money(i.price)}</p>
                            <SchemeNote item={i} />
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex items-center rounded-full border border-line">
                                <button aria-label="Decrease" onClick={() => setQty(i.id, i.qty - 1)} className="p-1.5"><Minus size={14} /></button>
                                <span className="w-7 text-center text-sm font-semibold">{i.qty}</span>
                                <button aria-label="Increase" onClick={() => setQty(i.id, i.qty + 1)} className="p-1.5"><Plus size={14} /></button>
                              </div>
                              <button aria-label="Remove" onClick={() => remove(i.id)} className="ml-auto rounded-full p-2 text-hot hover:bg-hot/10"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-line p-5">
                  <div className="mb-3 flex justify-between text-lg font-bold"><span>Subtotal</span><span>{money(value.subtotal)}</span></div>
                  {freeOver > 0 && (
                    <div className="mb-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${Math.min(100, (value.subtotal / freeOver) * 100)}%` }} /></div>
                      <p className="mt-1 text-xs font-semibold text-green-700 dark:text-green-400">{value.subtotal >= freeOver ? "You get FREE delivery!" : `Add ${money(freeOver - value.subtotal)} more for FREE delivery`}</p>
                    </div>
                  )}
                  <p className="mb-3 text-xs text-muted">Delivery {shippingMax > shipping ? `from ${money(shipping)}` : money(shipping)} all over Pakistan. Pay by JazzCash, Easypaisa or bank.</p>
                  <Link href="/checkout" onClick={() => setOpen(false)} className="btn-shine block rounded-full bg-hot py-3.5 text-center text-lg font-bold text-white transition hover:bg-hot-dark">Checkout</Link>
                  <Link href="/cart" onClick={() => setOpen(false)} className="mt-2 block text-center text-sm font-semibold text-brand-600 hover:underline">View full cart</Link>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </CartCtx.Provider>
  );
}
