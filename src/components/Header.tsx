"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Menu, Phone, Search, ShoppingCart, X } from "lucide-react";
import { useWishlist } from "./wishlist/WishlistProvider";
import type { Brand, Category, Settings, Vehicle } from "@/lib/types";
import { useCart } from "./CartProvider";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import DesktopNav from "./header/DesktopNav";

type Props = { settings: Settings; categories: Category[]; vehicles: Vehicle[]; brands: Brand[] };

export default function Header({ settings, categories, vehicles, brands }: Props) {
  const router = useRouter();
  const { count, setOpen } = useCart();
  const wish = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) { router.push(`/shop?q=${encodeURIComponent(q.trim())}`); setMenu(false); }
  };

  const nav = categories.filter((c) => c.show_in_nav !== false);
  const text = settings.announcement || "";

  return (
    <header className="sticky top-0 z-50">
      {/* announcement bar */}
      {text && (
        <div className="bg-brand-900 px-4 py-2 text-center text-xs font-semibold tracking-wide text-white/85">
          <span className="line-clamp-1">{text}</span>
        </div>
      )}

      <div className={`border-b border-line bg-bg/90 backdrop-blur-xl transition-shadow duration-300 ${scrolled ? "shadow-lg shadow-brand-900/10" : ""}`}>
        {/* fixed height: changing it on scroll moves the page and makes the header flicker */}
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button className="rounded-full p-2 hover:bg-soft lg:hidden" aria-label="Open menu" onClick={() => setMenu(true)}><Menu size={24} /></button>
          <Link href="/" className="group shrink-0" aria-label={`${settings.store_name} home`}><Logo name={settings.store_name} size={44} src={settings.logo} srcDark={settings.logo_dark} /></Link>

          <form onSubmit={search} className="relative mx-4 hidden max-w-xl flex-1 md:block">
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parts: chain kit, battery, CD 70…"
              className="w-full rounded-full border-2 border-line bg-soft py-2.5 pl-5 pr-14 text-sm outline-none transition focus:border-brand-500 focus:bg-card"
            />
            <button className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-hot" aria-label="Search"><Search size={17} /></button>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <a href={`tel:${settings.phone}`} className="hidden items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-brand-500 xl:flex">
              <Phone size={16} className="text-hot" />{settings.phone}
            </a>
            <ThemeToggle />
            <Link href="/wishlist" aria-label={`Wishlist (${wish.count})`} className="relative grid h-10 w-10 place-items-center rounded-full border border-line transition hover:border-hot hover:text-hot">
              <Heart size={18} className={wish.count ? "fill-hot text-hot" : ""} />
              {wish.count > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-hot px-1 text-[11px] font-bold text-white">{wish.count}</span>}
            </Link>
            <button onClick={() => setOpen(true)} aria-label="Open cart" className="relative grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700">
              <ShoppingCart size={19} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key={count} initial={{ scale: 0.4 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-hot px-1 text-[11px] font-bold">{count}</motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <DesktopNav settings={settings} categories={categories} vehicles={vehicles} brands={brands} />
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {menu && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-brand-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
            <motion.div className="fixed left-0 top-0 z-[61] flex h-dvh w-[86%] max-w-sm flex-col overflow-y-auto bg-bg p-5" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
              <div className="mb-4 flex items-center justify-between">
                <Logo name={settings.store_name} size={38} src={settings.logo} srcDark={settings.logo_dark} />
                <button onClick={() => setMenu(false)} aria-label="Close menu" className="rounded-full p-2 hover:bg-soft"><X size={22} /></button>
              </div>
              <form onSubmit={search} className="relative mb-4">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parts…" className="w-full rounded-full border-2 border-line bg-soft py-2.5 pl-4 pr-12 text-sm outline-none focus:border-brand-500" />
                <button className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white" aria-label="Search"><Search size={15} /></button>
              </form>
              <div className="grid gap-1 text-lg font-bold">
                {[["/shop", "Shop all"], ["/parts/motorcycle", "Motorcycle parts"], ["/parts/rickshaw", "Rickshaw parts"], ["/parts/loader", "Loader parts"], ["/parts/cycle", "Cycle parts"], ["/wishlist", "Wishlist"], ["/categories", "Categories"], ["/vehicles", "Shop by bike"], ["/brands", "Brands"], ["/promotions", "Deal zone"], ["/blog", "Blog"], ["/about", "About us"], ["/awards", "Our awards"], ["/contact", "Contact"]].map(([h, l]) => (
                  <Link key={h} href={h} onClick={() => setMenu(false)} className="rounded-xl px-3 py-2.5 hover:bg-soft">{l}</Link>
                ))}
              </div>
              <p className="mb-1 mt-5 px-3 text-sm font-bold text-muted">Categories</p>
              <div className="grid gap-0.5">
                {nav.map((c) => (
                  <Link key={c.id} href={`/collections/${c.slug}`} onClick={() => setMenu(false)} className="rounded-xl px-3 py-2 font-semibold hover:bg-soft">{c.name}</Link>
                ))}
              </div>
              <a href={`tel:${settings.phone}`} className="mt-auto flex items-center justify-center gap-2 rounded-full bg-brand-600 py-3 font-bold text-white"><Phone size={18} />Call {settings.phone}</a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
