"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";

/** Counts up from 0 once when scrolled into view. */
function Count({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "-60px" });
  useEffect(() => {
    if (!seen || !ref.current) return;
    const c = animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString(); } });
    return () => c.stop();
  }, [seen, to]);
  return <span ref={ref}>0</span>;
}

/** Live store numbers (from the database, never made up). */
export default function AboutNumbers({ stats }: { stats: { label: string; value: number }[] }) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-6 text-center md:p-8">
            <dd className="font-display text-5xl font-extrabold leading-none text-brand-700 dark:text-white md:text-6xl"><Count to={s.value} /><span className="text-hot">+</span></dd>
            <dt className="mt-2 text-sm font-semibold uppercase tracking-wider text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
