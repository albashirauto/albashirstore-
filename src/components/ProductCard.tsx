"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { discountPct, money } from "@/lib/format";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import SchemeBadge from "./SchemeBadge";
import WishButton from "./wishlist/WishButton";
import Stars from "./reviews/Stars";
import { isOut, lowLeft } from "@/lib/stock";

export default function ProductCard({ product: p, index = 0 }: { product: Product; index?: number }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  const off = discountPct(p.price, p.compare_price);
  const out = isOut(p);
  const low = lowLeft(p);
  const hasVariants = (p.variants?.length ?? 0) > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: Math.min(index, 7) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-shadow hover:shadow-lg hover:shadow-brand-500/10"
    >
      <Link href={`/products/${p.slug}`} className="relative block aspect-square overflow-hidden bg-soft">
        <ProductImage src={p.images?.[0]} alt={p.name} />
        <span className="absolute left-3 right-14 top-3 flex flex-wrap items-start gap-1.5">
          {off > 0 && <span className="rounded-full bg-hot px-2.5 py-1 text-xs font-bold text-white shadow">-{off}%</span>}
          <SchemeBadge p={p} />
        </span>
        {out && <span className="absolute inset-0 grid place-items-center bg-bg/70 text-lg font-bold backdrop-blur-[2px]">Sold out</span>}
        <WishButton product={p} className="absolute right-3 top-3 z-10" />
        {!out && low > 0 && <span className="absolute bottom-3 left-3 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-bold text-hot shadow-sm backdrop-blur">Only {low} left</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {p.brand && (
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.brand.logo && <img src={p.brand.logo} alt="" className="h-4 w-auto max-w-10 object-contain" />}
            {p.brand.name}
          </p>
        )}
        <Link href={`/products/${p.slug}`} className="mt-1 line-clamp-2 min-h-[2.6em] font-semibold leading-snug hover:text-brand-600">{p.name}</Link>
        {!!p.reviews && <span className="mt-0.5 flex items-center gap-1 text-xs text-muted"><Stars value={p.rating ?? 0} size={12} /><b className="text-fg">{(p.rating ?? 0).toFixed(1)}</b>({p.reviews})</span>}
        {p.vehicle && <p className="mt-1.5 flex items-center gap-1 text-xs text-muted"><Check size={12} className="text-green-600" />Fits {p.vehicle.name}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-lg font-extrabold leading-none text-brand-700 dark:text-white">{money(p.price)}</p>
            {off > 0 && <p className="mt-1 text-xs text-muted line-through">{money(p.compare_price!)}</p>}
          </div>
          <button
            disabled={out}
            onClick={() => { if (hasVariants) { window.location.href = `/products/${p.slug}`; return; } add(p); setDone(true); setTimeout(() => setDone(false), 1400); }}
            aria-label={`Add ${p.name} to cart`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-hot active:scale-90 disabled:opacity-40"
          >
            {done ? <Check size={20} /> : <ShoppingCart size={19} />}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
