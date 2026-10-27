"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, LayoutGrid } from "lucide-react";
import VehicleIcon from "@/components/VehicleIcon";
import CategoryIcon from "@/components/CategoryIcon";
import BrandMark from "@/components/brands/BrandMark";
import type { Brand, Category, Settings, Vehicle } from "@/lib/types";

type Mega = "cats" | "bikes" | "brands";
type Item = { key: string; label: string; href?: string; mega?: Mega; icon?: React.ReactNode; hot?: boolean };

const ease = [0.22, 1, 0.36, 1] as const;

/** Desktop menu bar: sliding hover highlight, active underline and one animated mega panel. */
export default function DesktopNav({ settings, categories, vehicles, brands }: { settings: Settings; categories: Category[]; vehicles: Vehicle[]; brands: Brand[] }) {
  const path = usePathname();
  const [hover, setHover] = useState<string | null>(null);
  const [mega, setMega] = useState<Mega | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const items: Item[] = [
    { key: "cats", label: "Categories", mega: "cats", icon: <LayoutGrid size={16} /> },
    { key: "bikes", label: "Shop by bike", mega: "bikes" },
    { key: "brands", label: "Brands", mega: "brands" },
    { key: "deals", label: "Deal zone", href: "/promotions", hot: true },
    { key: "shop", label: "All parts", href: "/shop" },
    { key: "about", label: "About us", href: "/about" },
    { key: "contact", label: "Contact", href: "/contact" },
  ];
  const active = (it: Item) =>
    it.href ? path.startsWith(it.href)
    : it.mega === "cats" ? path.startsWith("/collections") || path.startsWith("/categories")
    : it.mega === "bikes" ? path.startsWith("/vehicles")
    : path.startsWith("/brands");

  // small delay on close so moving the mouse from the bar into the panel does not flicker
  const open = (m: Mega | null) => { clearTimeout(timer.current); setMega(m); };
  const closeSoon = () => { clearTimeout(timer.current); timer.current = setTimeout(() => { setMega(null); setHover(null); }, 120); };
  const close = () => { setMega(null); setHover(null); };

  const nav = categories.filter((c) => c.show_in_nav !== false);
  const groups = Object.entries(
    vehicles.reduce<Record<string, Vehicle[]>>((g, v) => ((g[v.type || "other"] ??= []).push(v), g), {}),
  );

  return (
    <nav className="relative hidden border-t border-line lg:block" onMouseLeave={closeSoon} onMouseEnter={() => clearTimeout(timer.current)}>
      <div className="mx-auto flex h-12 max-w-7xl items-center px-4">
        <ul className="flex items-center gap-1 text-sm font-semibold">
          {items.map((it) => {
            const on = active(it);
            const inner = (
              <>
                {hover === it.key && <motion.span layoutId="nav-hover" className="absolute inset-0 -z-10 rounded-full bg-soft" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                {it.icon}
                {it.label}
                {it.hot && <span className="h-1.5 w-1.5 rounded-full bg-hot" />}
                {it.mega && <ChevronDown size={14} className={`text-muted transition duration-300 ${mega === it.mega ? "rotate-180 text-brand-600" : ""}`} />}
                {on && <motion.span layoutId="nav-active" className="absolute inset-x-4 -bottom-[7px] h-0.5 rounded-full bg-hot" />}
              </>
            );
            const tone = it.hot ? "text-hot" : on || (it.mega && mega === it.mega) ? "text-brand-600" : "text-fg/80 hover:text-fg";
            const cls = `relative z-0 flex items-center gap-1.5 rounded-full px-4 py-2 transition-colors ${tone}`;
            return (
              <li key={it.key} onMouseEnter={() => { setHover(it.key); open(it.mega ?? null); }}>
                {it.href
                  ? <Link href={it.href} onClick={close} className={cls}>{inner}</Link>
                  : <button type="button" onClick={() => setMega(mega === it.mega ? null : it.mega!)} aria-expanded={mega === it.mega} className={cls}>{inner}</button>}
              </li>
            );
          })}
        </ul>
      </div>

      <AnimatePresence>
        {mega && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease }}
            className="absolute inset-x-0 top-full border-b border-t border-line bg-bg shadow-2xl shadow-brand-900/10"
          >
            <AnimatePresence mode="wait">
              <motion.div key={mega} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="mx-auto max-w-7xl px-4 py-7">
                {mega === "cats" && (
                  <div className="grid grid-cols-[1fr_260px] gap-8">
                    <div className="grid grid-cols-3 gap-1 xl:grid-cols-4">
                      {nav.map((c, i) => (
                        <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.3, ease }}>
                          <Link href={`/collections/${c.slug}`} onClick={close} className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-soft">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-sm ring-1 ring-brand-100 transition duration-300 group-hover:from-brand-500 group-hover:to-brand-700 group-hover:text-white group-hover:shadow-md group-hover:shadow-brand-500/30 group-hover:ring-transparent dark:from-brand-900 dark:to-brand-900 dark:ring-brand-900 [&>svg]:transition [&>svg]:duration-300 group-hover:[&>svg]:-rotate-6 group-hover:[&>svg]:scale-110">
                              <CategoryIcon slug={c.slug} name={c.name} size={24} />
                            </span>
                            <span className="text-sm font-semibold transition group-hover:text-brand-600">{c.name}</span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                    <Link href="/promotions" onClick={close} className="group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-brand-900 p-6 text-white">
                      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-brand-600),transparent_65%)]" />
                      <span className="relative w-fit rounded-full bg-hot px-2.5 py-0.5 text-xs font-bold">Offers</span>
                      <span className="relative mt-3 font-display text-3xl font-extrabold uppercase leading-none">Deal zone</span>
                      <span className="relative mt-1 text-sm text-white/70">Limited-time prices on popular parts.</span>
                      <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-bold">See deals <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
                    </Link>
                  </div>
                )}

                {mega === "bikes" && (
                  <div className="grid grid-cols-4 gap-8">
                    {groups.map(([type, list], gi) => {
                      return (
                        <motion.div key={type} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.05, duration: 0.3, ease }}>
                          <Link href={`/parts/${type}`} onClick={close} className="group mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted hover:text-brand-600"><VehicleIcon type={type} size={18} className="text-hot" />{type} parts<ArrowRight size={12} className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" /></Link>
                          <ul className="grid gap-0.5">
                            {list.map((v) => (
                              <li key={v.id}>
                                <Link href={`/vehicles/${v.slug}`} onClick={close} className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm font-semibold transition hover:bg-soft hover:text-brand-600">
                                  {v.name}<ArrowRight size={14} className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {mega === "brands" && (
                  <div className="grid grid-cols-4 gap-3 xl:grid-cols-6">
                    {brands.map((b, i) => (
                      <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.3, ease }}>
                        <Link href={`/brands/${b.slug}`} onClick={close} title={b.name} className="group flex h-16 items-center gap-3 rounded-xl border border-line bg-white px-3 font-display text-lg font-bold uppercase tracking-wide text-fg/70 transition hover:-translate-y-0.5 hover:border-brand-500/50 hover:text-brand-600 hover:shadow-md dark:bg-card">
                          <BrandMark name={b.name} logo={b.logo} fit={b.logo_fit} size={44} />
                          <span className="min-w-0 truncate leading-tight">{b.name}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-end border-t border-line pt-4">
                  <Link href={mega === "cats" ? "/categories" : mega === "bikes" ? "/vehicles" : "/brands"} onClick={close} className="group inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-hot">
                    {mega === "cats" ? "All categories" : mega === "bikes" ? "All bike models" : "All brands"}
                    <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
