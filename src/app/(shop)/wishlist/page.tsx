"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import ProductImage from "@/components/ProductImage";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function WishlistPage() {
  const { items, remove } = useWishlist();
  const { add } = useCart();

  // the saved snapshot is enough for the cart (prices are re-checked on the server at checkout)
  const toCart = (i: (typeof items)[number]) => add({ id: i.id, slug: i.slug, name: i.name, price: i.price, images: i.image ? [i.image] : [] } as Product);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" />Saved for later</p>
          <h1 className="text-5xl font-extrabold uppercase leading-none text-brand-900 dark:text-white">Wishlist</h1>
          <p className="mt-2 text-muted">{items.length ? `${items.length} saved ${items.length === 1 ? "part" : "parts"}. Saved on this device.` : "Tap the ♥ on any part to save it here."}</p>
        </div>
        {items.length > 1 && (
          <button onClick={() => items.forEach(toCart)} className="inline-flex items-center gap-2 rounded-full bg-hot px-6 py-3 font-bold text-white transition hover:bg-hot-dark"><ShoppingCart size={18} />Add all to cart</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line py-20 text-center">
          <Heart size={44} className="mx-auto text-hot" />
          <p className="mt-3 text-xl font-bold">Your wishlist is empty</p>
          <Link href="/shop" className="mt-5 inline-block rounded-full bg-brand-600 px-8 py-3 font-bold text-white transition hover:bg-brand-700">Browse parts</Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {items.map((i) => (
              <motion.li key={i.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="group flex gap-4 rounded-2xl border border-line bg-card p-3 transition hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10">
                <Link href={`/products/${i.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-soft"><ProductImage src={i.image} alt={i.name} sizes="96px" /></Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  {i.brand && <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{i.brand}</p>}
                  <Link href={`/products/${i.slug}`} className="line-clamp-2 font-semibold leading-snug hover:text-brand-600">{i.name}</Link>
                  <p className="mt-1 font-extrabold">{money(i.price)}{i.compare_price && i.compare_price > i.price ? <span className="ml-1.5 text-xs font-normal text-muted line-through">{money(i.compare_price)}</span> : null}</p>
                  <div className="mt-auto flex gap-2 pt-2">
                    <button onClick={() => toCart(i)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-600 py-2 text-sm font-bold text-white transition hover:bg-brand-700"><ShoppingCart size={15} />Add to cart</button>
                    <button onClick={() => remove(i.id)} aria-label="Remove" className="grid h-9 w-9 place-items-center rounded-full text-hot transition hover:bg-hot/10"><Trash2 size={16} /></button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
