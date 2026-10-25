"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/types";
import Sprocket from "./Sprocket";

const DURATION = 6500;

export default function HeroSlider({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = banners.length;

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), DURATION);
    return () => clearTimeout(t);
  }, [i, paused, n]);

  if (!n) return null;
  const b = banners[i];

  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    >
      {/* background: grid, speed streaks, gears */}
      <div className="absolute inset-0 -z-10 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="pointer-events-none absolute -right-40 -top-40 -z-10 text-white/[0.07]"><Sprocket size={640} className="animate-spin-slow" fill="currentColor" /></div>
      <div className="pointer-events-none absolute -bottom-28 left-[28%] -z-10 text-white/[0.06]"><Sprocket size={320} teeth={12} className="animate-spin-rev" fill="currentColor" /></div>
      <div className="pointer-events-none absolute inset-y-0 -z-10 w-1/3 -skew-x-[18deg] bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: "streak 5s linear infinite" }} />
      <div className="absolute bottom-0 left-0 -z-10 h-2 w-2/5 bg-hot" style={{ clipPath: "polygon(0 0, 100% 0, 96% 100%, 0 100%)" }} />

      <div className="mx-auto grid min-h-[480px] max-w-7xl items-center gap-8 px-4 pb-20 pt-12 md:min-h-[560px] lg:grid-cols-[1.1fr_0.9fr]">
        <AnimatePresence mode="wait">
          <motion.div key={b.id} initial="hide" animate="show" exit="out" transition={{ staggerChildren: 0.09 }}>
            {b.eyebrow && (
              <motion.p variants={{ hide: { opacity: 0, x: -30 }, show: { opacity: 1, x: 0 }, out: { opacity: 0 } }} className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur">
                <span className="h-2 w-2 animate-pulse-ring rounded-full bg-hot" />{b.eyebrow}
              </motion.p>
            )}
            <motion.h1 variants={{ hide: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 }, out: { opacity: 0, y: -20 } }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="max-w-2xl text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl lg:text-7xl">
              {b.title}
            </motion.h1>
            {b.subtitle && (
              <motion.p variants={{ hide: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 }, out: { opacity: 0 } }} className="mt-5 max-w-lg text-lg text-white/85">{b.subtitle}</motion.p>
            )}
            <motion.div variants={{ hide: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 }, out: { opacity: 0 } }} className="mt-8 flex flex-wrap gap-3">
              <Link href={b.link || "/shop"} className="btn-shine group inline-flex items-center gap-2 rounded-full bg-hot px-8 py-4 text-lg font-bold shadow-lg shadow-black/25 transition hover:bg-hot-dark">
                {b.button_text || "Shop now"} <ArrowRight className="transition group-hover:translate-x-1" size={20} />
              </Link>
              <Link href="/vehicles" className="inline-flex items-center rounded-full border-2 border-white/60 px-7 py-4 text-lg font-bold transition hover:bg-white hover:text-brand-700">Find by bike</Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* visual */}
        <div className="relative hidden h-[420px] lg:block">
          <AnimatePresence mode="wait">
            <motion.div key={b.id} className="absolute inset-0" initial={{ opacity: 0, scale: 0.85, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              {b.image ? (
                <Image src={b.image} alt={b.title} fill sizes="45vw" className="object-contain drop-shadow-2xl" priority />
              ) : (
                <div className="relative grid h-full place-items-center">
                  <div className="absolute h-[360px] w-[360px] rounded-full bg-white/10 blur-2xl" />
                  <Sprocket size={340} className="animate-spin-slow text-white drop-shadow-2xl" />
                  <Sprocket size={170} teeth={11} className="absolute -bottom-2 -left-2 animate-spin-rev text-hot drop-shadow-xl" />
                  <div className="animate-float absolute right-2 top-6 rotate-6 rounded-2xl bg-white px-5 py-3 text-brand-700 shadow-2xl">
                    <p className="text-xs font-bold text-muted">Genuine parts</p>
                    <p className="font-display text-3xl font-extrabold leading-none">24h dispatch</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* controls */}
      {n > 1 && (
        <div className="absolute inset-x-0 bottom-6 mx-auto flex max-w-7xl items-center gap-3 px-4">
          <div className="flex gap-2">
            {banners.map((x, k) => (
              <button key={x.id} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className="relative h-1.5 w-12 overflow-hidden rounded-full bg-white/30">
                {k === i && <motion.span key={`${i}-${paused}`} className="absolute inset-y-0 left-0 bg-white" initial={{ width: "0%" }} animate={{ width: paused ? "0%" : "100%" }} transition={{ duration: paused ? 0 : DURATION / 1000, ease: "linear" }} />}
                {k < i && <span className="absolute inset-0 bg-white" />}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setI((i - 1 + n) % n)} aria-label="Previous slide" className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white hover:text-brand-700"><ChevronLeft size={20} /></button>
            <button onClick={() => setI((i + 1) % n)} aria-label="Next slide" className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white hover:text-brand-700"><ChevronRight size={20} /></button>
          </div>
        </div>
      )}
    </section>
  );
}
