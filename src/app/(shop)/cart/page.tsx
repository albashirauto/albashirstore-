"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import ProductImage from "@/components/ProductImage";
import SchemeNote from "@/components/SchemeNote";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { money } from "@/lib/format";
import { parseKey } from "@/lib/stock";
import type { Product } from "@/lib/types";

export default function CartPage() {
  const { items, setQty, remove, subtotal, shipping, shippingMax, freeOver } = useCart();
  const free = freeOver > 0 && subtotal >= freeOver;
  const ship = free ? 0 : shipping;
  const wish = useWishlist();
  const pcs = items.reduce((n, i) => n + i.qty, 0);

  if (!items.length)
    return (
      <div className="mx-auto grid max-w-xl place-items-center px-4 py-24 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900"><ShoppingBag size={44} /></span>
        <h1 className="mt-5 text-4xl font-extrabold uppercase">Your cart is empty</h1>
        <p className="mt-2 text-muted">Find the right part for your bike in a few taps.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="rounded-full bg-brand-600 px-8 py-3 font-bold text-white transition hover:bg-brand-700">Browse parts</Link>
          {wish.count > 0 && <Link href="/wishlist" className="inline-flex items-center gap-2 rounded-full border-2 border-line px-6 py-3 font-bold transition hover:border-hot hover:text-hot"><Heart size={17} />Wishlist ({wish.count})</Link>}
        </div>
      </div>
    );

  const saveForLater = (i: (typeof items)[number]) => {
    const id = parseKey(i.id).id;
    if (!wish.has(id)) wish.toggle({ id, slug: i.slug, name: i.name, price: i.price, images: i.image ? [i.image] : [] } as Product);
    remove(i.id);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" />{pcs} {pcs === 1 ? "piece" : "pieces"}</p>
          <h1 className="text-5xl font-extrabold uppercase leading-none text-brand-900 dark:text-white">Your cart</h1>
        </div>
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-hot"><ArrowLeft size={15} />Continue shopping</Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((i) => (
              <motion.li key={i.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                className="flex gap-4 rounded-2xl border border-line bg-card p-4">
                <Link href={`/products/${i.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-soft"><ProductImage src={i.image} alt={i.name} sizes="96px" /></Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/products/${i.slug}`} className="line-clamp-2 font-bold leading-snug hover:text-brand-600">{i.name}</Link>
                    <b className="shrink-0 text-lg">{money(i.price * i.qty)}</b>
                  </div>
                  <p className="text-sm text-muted">{money(i.price)} each</p>
                  <SchemeNote item={i} />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-full border border-line">
                      <button aria-label="Decrease" onClick={() => setQty(i.id, i.qty - 1)} className="p-2 transition hover:text-brand-600"><Minus size={14} /></button>
                      <input aria-label="Quantity" inputMode="numeric" value={i.qty} onChange={(e) => setQty(i.id, Math.max(1, Math.min(999, Number(e.target.value) || 1)))} className="w-10 bg-transparent text-center font-bold outline-none" />
                      <button aria-label="Increase" onClick={() => setQty(i.id, i.qty + 1)} className="p-2 transition hover:text-brand-600"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => saveForLater(i)} className="inline-flex items-center gap-1 text-sm font-semibold text-muted transition hover:text-hot"><Heart size={15} />Save for later</button>
                    <button onClick={() => remove(i.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-muted transition hover:text-hot"><Trash2 size={15} />Remove</button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <aside className="h-fit space-y-4 lg:sticky lg:top-44">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-xl font-bold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal ({pcs} pcs)</dt><dd>{money(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery{shippingMax > shipping && !free ? " (from)" : ""}</dt><dd>{free ? <b className="text-green-700 dark:text-green-400">FREE</b> : money(ship)}</dd></div>
              {freeOver > 0 && (
                <div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${Math.min(100, (subtotal / freeOver) * 100)}%` }} /></div>
                  <p className="mt-1 text-xs font-semibold text-green-700 dark:text-green-400">{free ? "You get FREE delivery!" : `Add ${money(freeOver - subtotal)} more for FREE delivery`}</p>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-2xl font-extrabold"><dt>Total{shippingMax > shipping && !free ? " (est.)" : ""}</dt><dd>{money(subtotal + ship)}</dd></div>
              {shippingMax > shipping && !free && <p className="text-xs text-muted">Exact delivery charge for your area is shown at checkout.</p>}
            </dl>
            <Link href="/checkout" className="group mt-5 flex items-center justify-center gap-2 rounded-full bg-hot py-4 text-lg font-bold text-white shadow-lg shadow-hot/25 transition hover:-translate-y-0.5 hover:bg-hot-dark">
              Checkout <ArrowRight size={19} className="transition group-hover:translate-x-1" />
            </Link>
            <p className="mt-3 text-center text-xs text-muted">Pay with JazzCash, Easypaisa or bank transfer</p>
          </div>
          <ul className="space-y-2 rounded-2xl bg-soft p-4 text-sm">
            <li className="flex gap-2.5"><Truck size={17} className="shrink-0 text-brand-600" />{free ? "FREE delivery on this order" : `Delivery all over Pakistan ${shippingMax > shipping ? "from " : "for "}${money(shipping)}`}{freeOver > 0 && !free ? ` · free over ${money(freeOver)}` : ""}</li>
            <li className="flex gap-2.5"><ShieldCheck size={17} className="shrink-0 text-brand-600" />Genuine parts, checked before dispatch</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
