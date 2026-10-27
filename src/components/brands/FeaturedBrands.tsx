import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { money } from "@/lib/format";
import BrandMark from "./BrandMark";
import type { BrandInfo } from "./types";

/** Spotlight on the brands we stock the most of: dark premium cards with part types and popular parts. */
export default function FeaturedBrands({ brands }: { brands: BrandInfo[] }) {
  const featured = [...brands].filter((b) => b.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
  if (!featured.length) return null;

  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4">
      <div className="grid gap-5 lg:grid-cols-3">
        {featured.map((b, i) => (
          <Reveal key={b.id} delay={i * 0.08} y={20} className="h-full">
            <Link href={`/brands/${b.slug}`} className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-brand-900 p-6 text-white shadow-xl shadow-brand-900/20 ring-1 ring-white/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-900/30">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-brand-600),transparent_60%)] opacity-70 transition duration-500 group-hover:opacity-100" />
              <span className="pointer-events-none absolute -right-3 -top-6 font-display text-[7rem] font-extrabold uppercase leading-none text-white/[0.04]">{b.name}</span>

              <div className="relative flex items-center justify-between">
                <BrandMark name={b.name} logo={b.logo} fit={b.logo_fit} size={60} dark />
                <span className="rounded-full bg-hot px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">#{i + 1} in store</span>
              </div>

              <h2 className="relative mt-6 font-display text-4xl font-extrabold uppercase leading-none">{b.name}</h2>
              <p className="relative mt-1 text-sm text-white/60">{b.count} parts in stock</p>

              {b.cats.length > 0 && (
                <div className="relative mt-4 flex flex-wrap gap-1.5">
                  {b.cats.slice(0, 3).map((c) => <span key={c} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">{c}</span>)}
                </div>
              )}

              {b.top.length > 0 && (
                <ul className="relative mt-6 divide-y divide-white/10 border-y border-white/10">
                  {b.top.map((p) => (
                    <li key={p.slug} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="truncate text-white/80">{p.name}</span>
                      <span className="shrink-0 font-bold">{money(p.price)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <span className="relative mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-bold">
                Shop {b.name} <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
