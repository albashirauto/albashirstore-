"use client";

import { motion } from "motion/react";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useWishlist } from "./WishlistProvider";

/** Heart toggle. "icon" = round button on product photos; "full" = labelled button on the product page. */
export default function WishButton({ product, variant = "icon", className = "" }: { product: Product; variant?: "icon" | "full"; className?: string }) {
  const { has, toggle } = useWishlist();
  const on = has(product.id);
  const heart = (
    <motion.span key={String(on)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14 }} className="grid place-items-center">
      <Heart size={variant === "icon" ? 17 : 19} className={on ? "fill-hot text-hot" : ""} />
    </motion.span>
  );

  if (variant === "full")
    return (
      <button type="button" onClick={() => toggle(product)} aria-pressed={on}
        className={`inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 font-bold transition ${on ? "border-hot/40 bg-hot/10 text-hot" : "border-line hover:border-hot hover:text-hot"} ${className}`}>
        {heart}{on ? "Saved to wishlist" : "Add to wishlist"}
      </button>
    );

  return (
    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product); }} aria-pressed={on} aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      className={`grid h-9 w-9 place-items-center rounded-full bg-card/95 text-fg shadow-md backdrop-blur transition hover:scale-110 hover:text-hot ${className}`}>
      {heart}
    </button>
  );
}
