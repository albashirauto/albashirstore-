"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import type { Testimonial } from "@/lib/types";

const AUTO = 4000;

function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={size} fill={k < Math.round(n) ? "currentColor" : "none"} />)}
    </div>
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure data-card className="group relative flex w-[85%] shrink-0 snap-start flex-col rounded-2xl border border-line bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 sm:w-[360px]">
      <Quote className="absolute right-5 top-5 text-brand-100 transition group-hover:text-brand-500/30 dark:text-brand-900" size={36} />
      <Stars n={t.rating ?? 5} />
      <blockquote className="mt-4 flex-1 leading-relaxed">{t.body}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-bold text-white">{t.name.charAt(0)}</span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-bold">{t.name}</span>
          <span className="flex items-center gap-1 text-xs text-muted"><BadgeCheck size={13} className="text-brand-600" />Verified buyer{t.city && ` · ${t.city}`}</span>
        </span>
      </figcaption>
    </figure>
  );
}

const arrow = "grid h-11 w-11 place-items-center rounded-full border border-line bg-card text-fg transition hover:border-brand-600 hover:bg-brand-600 hover:text-white active:scale-95";

/** Rating summary + an endless review row: auto-swipes with a timer bar, arrows and swipe also work. */
export default function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);

  // repeat the reviews so the row always overflows, then double it for a seamless loop
  let base = testimonials;
  while (base.length && base.length < 6) base = [...base, ...testimonials];
  const row = [...base, ...base];

  const go = (dir: 1 | -1) => {
    const el = track.current;
    const cards = el?.querySelectorAll<HTMLElement>("[data-card]");
    if (!el || !cards || cards.length < 2) return;
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    const half = cards[base.length].offsetLeft - cards[0].offsetLeft;
    // jump invisibly between the two identical halves, then glide one card
    if (dir === 1 && el.scrollLeft >= half - 4) el.scrollTo({ left: el.scrollLeft - half, behavior: "instant" });
    if (dir === -1 && el.scrollLeft < step - 4) el.scrollTo({ left: el.scrollLeft + half, behavior: "instant" });
    el.scrollBy({ left: dir * step, behavior: "smooth" });
    setTick((x) => x + 1);
  };

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(1), AUTO);
    return () => clearTimeout(t);
  }, [paused, tick]);

  if (!testimonials.length) return null;
  const avg = testimonials.reduce((s, t) => s + (t.rating ?? 5), 0) / testimonials.length;

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 md:mt-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionTitle eyebrow="Reviews" title="What customers say" sub="Real riders, real orders. Here is what they tell us after delivery." />
        <Reveal y={12} className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-card px-5 py-3">
            <span className="font-display text-5xl font-extrabold leading-none text-brand-700 dark:text-white">{avg.toFixed(1)}</span>
            <span>
              <Stars n={avg} size={18} />
              <span className="mt-1 block text-sm text-muted">from {testimonials.length} reviews</span>
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => go(-1)} aria-label="Previous review" className={arrow}><ChevronLeft size={20} /></button>
            <button onClick={() => go(1)} aria-label="Next review" className={arrow}><ChevronRight size={20} /></button>
          </div>
        </Reveal>
      </div>

      <Reveal y={20}>
        <div
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}
        >
          <div ref={track} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 py-3 scrollbar-none [mask-image:linear-gradient(90deg,#000_85%,transparent)]">
            {row.map((t, i) => <Card key={i} t={t} />)}
          </div>

          {/* timer bar: fills until the next auto-swipe, freezes while paused */}
          <div className="mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-line">
            <span key={tick} className="block h-full origin-left rounded-full bg-gradient-to-r from-brand-600 to-hot" style={{ animation: `grow-x ${AUTO}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
