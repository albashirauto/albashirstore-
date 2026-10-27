"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Search, X } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import type { Category } from "@/lib/types";

const ease = [0.22, 1, 0.36, 1] as const;

/** Search box + grid of top-level categories. Sub-categories (if any) show as small links inside each card. */
export default function CategoryGrid({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const [q, setQ] = useState("");

  const top = categories.filter((c) => !c.parent_id);
  const kids = (id: string) => categories.filter((c) => c.parent_id === id);
  const total = (c: Category) => (counts[c.id] ?? 0) + kids(c.id).reduce((s, k) => s + (counts[k.id] ?? 0), 0);

  const term = q.trim().toLowerCase();
  const shown = term
    ? top.filter((c) => c.name.toLowerCase().includes(term) || kids(c.id).some((k) => k.name.toLowerCase().includes(term)))
    : top;

  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4">
      {/* search */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mx-auto flex max-w-xl items-center gap-2 rounded-full border border-line bg-card p-1.5 shadow-xl shadow-brand-900/[0.08] transition focus-within:border-brand-500/60">
        <Search className="ml-4 shrink-0 text-muted" size={20} />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a category" placeholder="Find a category, e.g. brakes, battery" className="min-w-0 flex-1 bg-transparent px-2 py-3 outline-none placeholder:text-muted" />
        {q && <button onClick={() => setQ("")} aria-label="Clear" className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-fg"><X size={18} /></button>}
      </motion.div>

      <p className="mt-10 text-sm text-muted">
        Showing <b className="text-fg">{shown.length}</b> of {top.length} categories
      </p>

      {/* grid */}
      <motion.div layout className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {shown.map((c, i) => {
            const subs = kids(c.id);
            return (
              <motion.div key={c.id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, delay: Math.min(i, 11) * 0.04, ease }}>
                <div className="group relative flex h-full flex-col rounded-2xl border border-line bg-card p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10">
                  <Link href={`/collections/${c.slug}`} className="absolute inset-0 rounded-2xl" aria-label={c.name} />
                  <div className="flex items-start justify-between">
                    {c.image ? (
                      <span className="relative block h-20 w-20">
                        <span className="absolute inset-2 rounded-full bg-brand-500/15 blur-xl transition duration-500 group-hover:scale-125 group-hover:bg-brand-500/30" />
                        <Image src={c.image} alt="" fill sizes="80px" className="object-contain drop-shadow-[0_8px_10px_rgba(10,31,102,0.18)] transition duration-500 ease-out group-hover:-translate-y-1 group-hover:-rotate-6 group-hover:scale-110" />
                      </span>
                    ) : (
                      <span className="grid h-14 w-14 place-items-center rounded-xl bg-brand-50 text-brand-600 transition duration-300 group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900">
                        <CategoryIcon slug={c.slug} size={26} />
                      </span>
                    )}
                    <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-bold text-muted">{total(c)} items</span>
                  </div>

                  <h2 className="mt-5 font-display text-2xl font-bold leading-tight transition group-hover:text-brand-600">{c.name}</h2>

                  {subs.length > 0 && (
                    <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                      {subs.map((s) => (
                        <Link key={s.id} href={`/collections/${s.slug}`} className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-brand-500 hover:text-brand-600">{s.name}</Link>
                      ))}
                    </div>
                  )}

                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-brand-600">
                    Shop now <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {!shown.length && (
        <div className="py-16 text-center">
          <p className="text-lg font-semibold">No category matches “{q}”.</p>
          <Link href={`/shop?q=${encodeURIComponent(q)}`} className="mt-3 inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-hot">Search all parts for “{q}” <ArrowRight size={16} /></Link>
        </div>
      )}
    </section>
  );
}
