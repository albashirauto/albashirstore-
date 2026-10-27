"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Award as AwardIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Award } from "@/lib/types";

/** Gold-framed award photo: rotating glow border, light sweep and lift on hover. */
export function AwardCard({ a, onOpen, className = "" }: { a: Award; onOpen?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onOpen} className={`group/card relative block shrink-0 overflow-hidden rounded-3xl p-[2px] text-left transition duration-500 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-amber-500/30 ${className}`}>
      {/* spinning gold border */}
      <span className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[220%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,#fbbf24_60deg,#fff7d6_90deg,#f59e0b_120deg,transparent_180deg,transparent_240deg,#fbbf24_300deg,transparent_360deg)] [animation:spin-slow_6s_linear_infinite] group-hover/card:[animation-duration:2s]" />
      <span className="relative block overflow-hidden rounded-[calc(1.5rem-2px)] bg-brand-950 bg-gradient-to-b from-brand-800 to-brand-950">
        <span className="relative block aspect-[4/5] overflow-hidden">
          {a.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={a.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover/card:scale-110" />
            : <span className="grid h-full place-items-center text-amber-300/60"><AwardIcon size={64} /></span>}
          <span className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/10 to-transparent" />
          {/* light sweep */}
          <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent [animation:camp-shine_5s_ease-in-out_infinite] group-hover/card:[animation-duration:1.4s]" />
          {a.year && <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-3 py-1 text-xs font-extrabold text-brand-950 shadow-lg">{a.year}</span>}
        </span>
        <span className="absolute inset-x-0 bottom-0 p-4 text-white">
          <span className="block font-display text-xl font-bold uppercase leading-tight drop-shadow">{a.title}</span>
          {a.given_by && <span className="mt-0.5 block text-sm text-amber-200/90">{a.given_by}</span>}
        </span>
      </span>
    </button>
  );
}

/** Endless strip of awards. Pauses on hover; `reverse` runs it the other way. */
export function AwardMarquee({ awards, reverse = false, onOpen }: { awards: Award[]; reverse?: boolean; onOpen: (i: number) => void }) {
  let base = awards;
  while (base.length && base.length < 6) base = [...base, ...awards];
  const row = [...base, ...base];
  const secs = Math.max(30, base.length * 6);

  return (
    <div className="group overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="flex w-max gap-6 group-hover:[animation-play-state:paused]" style={{ animation: `${reverse ? "marquee-rev" : "marquee"} ${secs}s linear infinite` }}>
        {row.map((a, i) => <AwardCard key={i} a={a} onOpen={() => onOpen(i % awards.length)} className="w-56 sm:w-64" />)}
      </div>
    </div>
  );
}

/** Full-screen viewer with arrows, keyboard and swipe. */
export function AwardLightbox({ awards, index, setIndex }: { awards: Award[]; index: number | null; setIndex: (i: number | null) => void }) {
  const [dir, setDir] = useState(1);
  const go = (d: 1 | -1) => { if (index === null) return; setDir(d); setIndex((index + d + awards.length) % awards.length); };

  useEffect(() => {
    if (index === null) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setIndex(null); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = ""; };
  });

  const a = index === null ? null : awards[index];
  return (
    <AnimatePresence>
      {a && (
        <motion.div key="lb" className="fixed inset-0 z-[100] grid place-items-center bg-brand-950/90 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIndex(null)}>
          <button aria-label="Close" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20"><X /></button>
          {awards.length > 1 && <>
            <button aria-label="Previous" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-amber-400 hover:text-brand-950 md:left-8"><ChevronLeft /></button>
            <button aria-label="Next" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-amber-400 hover:text-brand-950 md:right-8"><ChevronRight /></button>
          </>}
          <AnimatePresence mode="wait" custom={dir}>
            <motion.figure
              key={index} custom={dir} onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, x: dir * 80, scale: 0.92 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: dir * -80, scale: 0.92 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              drag={awards.length > 1 ? "x" : false} dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, i) => { if (i.offset.x < -60) go(1); if (i.offset.x > 60) go(-1); }}
              className="max-w-3xl text-center text-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {a.image && <img src={a.image} alt={a.title} draggable={false} className="mx-auto max-h-[70vh] w-auto rounded-2xl shadow-2xl shadow-amber-500/20 ring-2 ring-amber-300/40" />}
              <figcaption className="mt-5">
                <p className="font-display text-3xl font-bold uppercase">{a.title}</p>
                <p className="mt-1 text-amber-200">{[a.given_by, a.year].filter(Boolean).join(" · ")}</p>
                {a.caption && <p className="mx-auto mt-2 max-w-xl text-white/75">{a.caption}</p>}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Twinkling gold sparkles for dark backgrounds. */
export function Sparkles({ count = 18 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="absolute h-2 w-2 rotate-45 bg-amber-300" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animation: `camp-twinkle ${2.5 + (i % 5) * 0.6}s ease-in-out ${(i % 7) * 0.4}s infinite`, opacity: 0 }} />
      ))}
    </div>
  );
}
