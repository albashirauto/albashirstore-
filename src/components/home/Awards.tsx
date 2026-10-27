"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Trophy } from "lucide-react";
import Reveal from "@/components/Reveal";
import { AwardLightbox, AwardMarquee, Sparkles } from "@/components/awards/AwardsShow";
import type { Award } from "@/lib/types";

/** Dark gold-lit band: our awards slide past in two endless rows going opposite ways. */
export default function Awards({ awards }: { awards: Award[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!awards.length) return null;
  const twoRows = awards.length >= 4;
  const half = Math.ceil(awards.length / 2);

  return (
    <section aria-label="Our awards" className="relative isolate mt-24 overflow-hidden bg-brand-950 py-16 text-white md:py-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.22),transparent_60%)]" />
      <div className="absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl [animation:camp-float_9s_ease-in-out_infinite]" />
      <div className="absolute -right-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl [animation:camp-float_11s_ease-in-out_infinite_reverse]" />
      <Sparkles />

      <div className="mx-auto max-w-7xl px-4 text-center">
        <motion.span
          initial={{ scale: 0, rotate: -120 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 160, damping: 12 }}
          className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 text-brand-950 shadow-xl shadow-amber-500/40"
        >
          <span className="absolute inset-0 rounded-2xl bg-amber-400/60 [animation:pulse-ring_2.4s_ease-out_infinite]" />
          <Trophy size={32} className="relative [animation:float-y_3s_ease-in-out_infinite]" />
        </motion.span>
        <Reveal y={16}>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">Trusted & recognised</p>
          <h2 className="mt-2 bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-[length:200%_auto] bg-clip-text text-4xl font-extrabold uppercase leading-none text-transparent [animation:shimmer-text_4s_linear_infinite] md:text-6xl">Our awards & rewards</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">Honours from the companies and riders we serve. Tap any award to see it up close.</p>
        </Reveal>
      </div>

      <div className="mt-10">
        {twoRows ? <>
          <AwardMarquee awards={awards.slice(0, half)} onOpen={(i) => setOpen(i)} />
          <AwardMarquee awards={awards.slice(half)} reverse onOpen={(i) => setOpen(half + i)} />
        </> : <AwardMarquee awards={awards} onOpen={setOpen} />}
      </div>

      <Reveal y={12} className="mt-8 text-center">
        <Link href="/awards" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-7 py-3.5 font-bold text-brand-950 shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 hover:shadow-amber-500/50">
          See all awards <ArrowRight size={18} className="transition group-hover:translate-x-1" />
        </Link>
      </Reveal>

      <AwardLightbox awards={awards} index={open} setIndex={setOpen} />
    </section>
  );
}
