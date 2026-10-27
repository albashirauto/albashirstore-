"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import VehicleIcon from "@/components/VehicleIcon";
import type { Vehicle } from "@/lib/types";

const ease = [0.22, 1, 0.36, 1] as const;

/** Type tabs with a sliding highlight, model cards that re-flow smoothly when the filter changes. */
export default function ByBike({ vehicles }: { vehicles: Vehicle[] }) {
  const [type, setType] = useState("all");
  if (!vehicles.length) return null;

  const types = ["all", ...Array.from(new Set(vehicles.map((v) => v.type).filter(Boolean) as string[]))];
  const shown = type === "all" ? vehicles : vehicles.filter((v) => v.type === type);

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 md:mt-16">
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
            return (
              <motion.div key={v.id} layout initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, delay: i * 0.03, ease }}>
                <Link href={`/vehicles/${v.slug}`} className="group relative flex h-full flex-col items-start gap-3 overflow-hidden rounded-2xl border border-line bg-card p-3.5 transition sm:flex-row sm:items-center sm:gap-4 sm:p-4 duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10">
                  <span className="relative grid h-14 w-14 shrink-0 place-items-center sm:h-16 sm:w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100 transition duration-300 group-hover:from-brand-500 group-hover:to-brand-700 group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand-500/30 group-hover:ring-transparent dark:from-brand-900 dark:to-brand-900 dark:ring-brand-900">
                    {v.image ? <Image src={v.image} alt="" fill sizes="56px" className="object-cover" /> : <>
                      <VehicleIcon type={v.type} size={34} className="transition duration-500 ease-out group-hover:translate-x-1 group-hover:-rotate-3 group-hover:scale-110" />
                      {/* speed lines on hover */}
                      <span className="absolute left-1.5 top-1/2 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition duration-300 group-hover:opacity-100">
                        <span className="h-0.5 w-2.5 rounded-full bg-white/70" /><span className="ml-1 h-0.5 w-2 rounded-full bg-white/50" /><span className="h-0.5 w-2.5 rounded-full bg-white/70" />
                      </span>
                    </>}
                  </span>
                  <span className="min-w-0 flex-1">
                    {v.company && v.company !== "Various" && <span className="block text-xs font-bold uppercase tracking-wider text-hot">{v.company}</span>}
                    <span className="line-clamp-2 break-words font-display text-lg font-bold leading-tight sm:text-xl">{v.name}</span>
                    <span className="block text-xs capitalize text-muted">{v.type}</span>
                  </span>
                  <ArrowRight size={18} className="hidden shrink-0 -translate-x-1 lg:block text-brand-600 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
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
