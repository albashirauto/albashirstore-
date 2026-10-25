"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Bike, Caravan, Motorbike, Truck } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import type { Vehicle } from "@/lib/types";

const icons = { motorcycle: Motorbike, rickshaw: Caravan, loader: Truck, cycle: Bike } as const;
const typeIcon = (t?: string) => icons[t as keyof typeof icons] ?? Motorbike;
const ease = [0.22, 1, 0.36, 1] as const;

/** Type tabs with a sliding highlight, model cards that re-flow smoothly when the filter changes. */
export default function ByBike({ vehicles }: { vehicles: Vehicle[] }) {
  const [type, setType] = useState("all");
  if (!vehicles.length) return null;

  const types = ["all", ...Array.from(new Set(vehicles.map((v) => v.type).filter(Boolean) as string[]))];
  const shown = type === "all" ? vehicles : vehicles.filter((v) => v.type === type);

  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <SectionTitle eyebrow="Fitment" title="Find parts for your bike" sub="Choose your model and see only what fits." href="/vehicles" cta="All models" />

      {types.length > 2 && (
        <Reveal y={12} className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-line bg-soft p-1 scrollbar-none sm:w-fit">
          {types.map((t) => (
            <button key={t} onClick={() => setType(t)} className={`relative shrink-0 rounded-full px-5 py-2 text-sm font-bold capitalize transition-colors ${type === t ? "text-white" : "text-muted hover:text-fg"}`}>
              {type === t && <motion.span layoutId="bike-tab" className="absolute inset-0 rounded-full bg-brand-600 shadow-md shadow-brand-600/30" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">{t === "all" ? "All" : t}</span>
            </button>
          ))}
        </Reveal>
      )}

      <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {shown.map((v, i) => {
            const Icon = typeIcon(v.type);
            return (
              <motion.div key={v.id} layout initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, delay: i * 0.03, ease }}>
                <Link href={`/vehicles/${v.slug}`} className="group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-line bg-card p-4 transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10">
                  <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-50 text-brand-600 transition duration-300 group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900">
                    {v.image ? <Image src={v.image} alt="" fill sizes="56px" className="object-cover" /> : <Icon size={26} strokeWidth={1.7} className="transition duration-300 group-hover:translate-x-0.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {v.company && v.company !== "Various" && <span className="block text-xs font-bold uppercase tracking-wider text-hot">{v.company}</span>}
                    <span className="block truncate font-display text-xl font-bold leading-tight">{v.name}</span>
                    <span className="block text-xs capitalize text-muted">{v.type}</span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 -translate-x-1 text-brand-600 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-hot transition duration-500 group-hover:scale-x-100" />
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
