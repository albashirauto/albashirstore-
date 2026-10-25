"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import SectionTitle from "@/components/SectionTitle";
import BrandMark from "./BrandMark";
import type { BrandInfo } from "./types";

const ease = [0.22, 1, 0.36, 1] as const;

/** A–Z directory: letter bar with sliding highlight, brand cards that re-flow when filtered. */
export default function BrandDirectory({ brands }: { brands: BrandInfo[] }) {
  const [letter, setLetter] = useState("All");
  if (!brands.length) return null;

  const sorted = [...brands].sort((a, b) => a.name.localeCompare(b.name));
  const letters = ["All", ...Array.from(new Set(sorted.map((b) => b.name[0].toUpperCase())))];
  const shown = letter === "All" ? sorted : sorted.filter((b) => b.name[0].toUpperCase() === letter);

  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <SectionTitle eyebrow="Directory" title="All brands A–Z" sub="Every brand on our shelves. Pick one to see all its parts." />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-line bg-soft p-1 scrollbar-none sm:w-fit">
        {letters.map((l) => (
          <button key={l} onClick={() => setLetter(l)} className={`relative min-w-10 shrink-0 rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${letter === l ? "text-white" : "text-muted hover:text-fg"}`}>
            {letter === l && <motion.span layoutId="brand-letter" className="absolute inset-0 rounded-full bg-brand-600 shadow-md shadow-brand-600/30" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{l}</span>
          </button>
        ))}
      </div>

      <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {shown.map((b, i) => (
            <motion.div key={b.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.45, delay: Math.min(i, 11) * 0.03, ease }}>
              <Link href={`/brands/${b.slug}`} className="group relative flex h-full items-center gap-4 rounded-2xl border border-line bg-card p-4 transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10">
                <BrandMark name={b.name} logo={b.logo} size={56} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-xl font-bold uppercase leading-tight tracking-wide transition group-hover:text-brand-600">{b.name}</span>
                  <span className="block text-xs text-muted">{b.count} parts{b.cats.length > 0 && ` · ${b.cats.slice(0, 2).join(", ")}`}</span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition duration-300 group-hover:rotate-45 group-hover:bg-hot group-hover:text-white">
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
