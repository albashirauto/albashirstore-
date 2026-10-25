"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";

/** What we keep per saved product (enough to show the wishlist page without a database call). */
export type WishItem = { id: string; slug: string; name: string; price: number; compare_price?: number | null; image?: string | null; brand?: string | null };

type Ctx = { items: WishItem[]; has: (id: string) => boolean; toggle: (p: Product) => void; remove: (id: string) => void; count: number };
const WishCtx = createContext<Ctx | null>(null);

export const useWishlist = () => {
  const c = useContext(WishCtx);
  if (!c) throw new Error("useWishlist must be used inside WishlistProvider");
  return c;
};

/** Wishlist saved in this browser (no login needed). */
export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem("aba-wishlist"); if (raw) setItems(JSON.parse(raw)); } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem("aba-wishlist", JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const toggle = useCallback((p: Product) => setItems((cur) =>
    cur.some((i) => i.id === p.id)
      ? cur.filter((i) => i.id !== p.id)
      : [{ id: p.id, slug: p.slug, name: p.name, price: p.price, compare_price: p.compare_price, image: p.images?.[0] ?? null, brand: p.brand?.name ?? null }, ...cur]), []);
  const remove = useCallback((id: string) => setItems((c) => c.filter((i) => i.id !== id)), []);

  const value = useMemo<Ctx>(() => ({ items, has: (id) => items.some((i) => i.id === id), toggle, remove, count: items.length }), [items, toggle, remove]);
  return <WishCtx.Provider value={value}>{children}</WishCtx.Provider>;
}
