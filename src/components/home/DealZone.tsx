import Link from "next/link";
import { ArrowRight, BadgePercent, Gift, Sparkles, Wallet } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import Reveal from "@/components/Reveal";
import { discountPct, money } from "@/lib/format";
import { hasScheme, schemeLabel } from "@/lib/scheme";
import { isOut } from "@/lib/stock";
import type { Product } from "@/lib/types";

/**
 * Deal zone, built from the products themselves (nothing to keep up to date):
 * the biggest discount right now as "Deal of the day", plus live cards for discounts, bulk schemes,
 * parts under Rs. 999 and new arrivals. A card with no products hides itself.
 */
export default function DealZone({ products }: { products: Product[] }) {
  const live = products.filter((p) => !isOut(p));
  const sale = live.filter((p) => discountPct(p.price, p.compare_price) > 0).sort((a, b) => discountPct(b.price, b.compare_price) - discountPct(a.price, a.compare_price));
  const scheme = live.filter(hasScheme);
  const cheap = live.filter((p) => p.price <= 999).sort((a, b) => a.price - b.price);
  const fresh = [...live].slice(0, 6); // products come newest first
  const hero = sale[0];
  const best = hero ? discountPct(hero.price, hero.compare_price) : 0;

  const tiles = [
    { show: sale.length > 0, href: "/shop?sale=1", icon: BadgePercent, tone: "from-hot to-hot-dark", tag: `Up to ${best}% off`, title: "Price drops", sub: `${sale.length} part${sale.length === 1 ? "" : "s"} on sale now`, items: sale.slice(1, 4).length ? sale.slice(1, 4) : sale.slice(0, 3) },
    { show: scheme.length > 0, href: "/promotions/schemes", icon: Gift, tone: "from-green-600 to-green-800", tag: "Free pieces", title: "Buy more, get free", sub: scheme[0] ? `e.g. ${schemeLabel(scheme[0])} · ${scheme.length} parts` : "", items: scheme.slice(0, 3) },
    { show: cheap.length > 0, href: "/shop?price=0-999", icon: Wallet, tone: "from-amber-500 to-amber-700", tag: `From ${money(cheap[0]?.price ?? 0)}`, title: "Under Rs. 999", sub: `${cheap.length} budget-friendly part${cheap.length === 1 ? "" : "s"}`, items: cheap.slice(0, 3) },
    { show: fresh.length > 0, href: "/shop", icon: Sparkles, tone: "from-brand-500 to-brand-700", tag: "Just in", title: "New arrivals", sub: "The latest parts in the shop", items: fresh.slice(0, 3) },
  ].filter((t) => t.show);
  if (!hero && !tiles.length) return null;

  return (
    <section aria-labelledby="deal-zone" className="relative mt-24 overflow-hidden bg-brand-900 py-20 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--color-brand-600),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgb(225_29_46/0.35),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

      <div className="relative mx-auto max-w-7xl px-4">
        <Reveal y={16} className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" />Offers</p>
            <h2 id="deal-zone" className="text-4xl font-extrabold uppercase leading-none md:text-5xl">Deal zone</h2>
            <p className="mt-3 max-w-xl text-white/70">Today&apos;s best prices, picked automatically from the shop.</p>
          </div>
          <Link href="/shop?sale=1" className="group inline-flex items-center gap-1.5 text-sm font-bold text-white/80 transition hover:text-white">All deals <ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_1.4fr]">
          {/* deal of the day: the biggest discount right now */}
          {hero && (
            <Reveal y={18} className="h-full">
              <Link href={`/products/${hero.slug}`} className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white text-fg shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 dark:bg-card">
                <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-hot px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />Deal of the day
                </span>
                <span className="absolute right-4 top-4 z-10 grid h-16 w-16 place-items-center rounded-full bg-amber-400 text-center font-display text-lg font-extrabold leading-none text-amber-950 shadow-lg">
                  −{best}%
                </span>
                <span className="relative block aspect-[4/3] overflow-hidden bg-soft">
                  <ProductImage src={hero.images?.[0]} alt={hero.name} sizes="(max-width:1024px) 100vw, 40vw" />
                </span>
                <span className="flex flex-1 flex-col p-6">
                  {hero.brand && <span className="text-xs font-bold uppercase tracking-wider text-brand-600">{hero.brand.name}</span>}
                  <span className="mt-1 line-clamp-2 font-display text-2xl font-extrabold uppercase leading-tight md:text-3xl">{hero.name}</span>
                  <span className="mt-3 flex items-end gap-3">
                    <span className="font-display text-4xl font-extrabold text-brand-700 dark:text-white">{money(hero.price)}</span>
                    <span className="pb-1 text-lg text-muted line-through">{money(hero.compare_price!)}</span>
                  </span>
                  <span className="mt-1 text-sm font-bold text-green-700 dark:text-green-400">You save {money(hero.compare_price! - hero.price)}</span>
                  <span className="mt-auto pt-5">
                    <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3.5 font-bold text-white transition group-hover:bg-brand-700">View deal <ArrowRight size={17} className="transition group-hover:translate-x-1" /></span>
                  </span>
                </span>
              </Link>
            </Reveal>
          )}

          {/* live cards */}
          <div className={`grid gap-5 sm:grid-cols-2 ${hero ? "" : "lg:col-span-2 lg:grid-cols-4"}`}>
            {tiles.map(({ href, icon: Icon, tone, tag, title, sub, items }, i) => (
              <Reveal key={title} delay={i * 0.06} y={18} className="h-full">
                <Link href={href} className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.1]">
                  <span className="flex items-start justify-between gap-3">
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tone} shadow-lg transition duration-300 group-hover:scale-110 group-hover:rotate-6`}><Icon size={22} /></span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{tag}</span>
                  </span>
                  <span className="mt-4 font-display text-2xl font-extrabold uppercase leading-none">{title}</span>
                  <span className="mt-1.5 line-clamp-1 text-sm text-white/65">{sub}</span>
                  <span className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="flex -space-x-3">
                      {items.map((p) => (
                        <span key={p.id} className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-brand-900 bg-white">
                          <ProductImage src={p.images?.[0]} alt="" sizes="48px" />
                        </span>
                      ))}
                    </span>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-900 transition duration-300 group-hover:bg-hot group-hover:text-white"><ArrowRight size={18} className="transition group-hover:translate-x-0.5" /></span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
