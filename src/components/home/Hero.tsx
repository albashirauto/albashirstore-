"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BadgeCheck, Search, Truck, Wrench } from "lucide-react";
import type { Banner, Settings, Vehicle } from "@/lib/types";
import Sprocket from "@/components/Sprocket";

const DURATION = 6000;
const ease = [0.22, 1, 0.36, 1] as const;
const up = { hide: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } };

export default function Hero({ banners, vehicles, settings }: { banners: Banner[]; vehicles: Vehicle[]; settings: Settings }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const n = banners.length;

  useEffect(() => {
    if (n < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), DURATION);
    return () => clearTimeout(t);
  }, [i, n]);

  const b = banners[i];
  const search = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
  };

  return (
    <section className="relative isolate overflow-hidden bg-brand-900 text-white">
      {/* quiet background: soft light + faint grid */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--color-brand-600),transparent_60%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "56px 56px", maskImage: "linear-gradient(to bottom, #000, transparent 85%)" }} />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-28 pt-16 md:pt-24 lg:grid-cols-[1.15fr_0.85fr]">
        {/* copy + search */}
        <motion.div initial="hide" animate="show" transition={{ staggerChildren: 0.08 }}>
          <motion.p variants={up} className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
            <span className="h-px w-6 bg-hot" />{settings.tagline || "Spare parts for every ride"}
          </motion.p>

          {/* plain CSS slide-in, never hidden: the headline is the page's LCP, so it must paint before the JS loads */}
          <h1 className="max-w-2xl animate-[rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both] text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl lg:text-[5rem]">
            The right part.<br /><span className="text-hot">Right away.</span>
          </h1>

          <motion.p variants={up} className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
            Genuine and imported parts for motorcycles, rickshaws, loaders and cycles, delivered across Pakistan.
          </motion.p>

          <motion.form variants={up} onSubmit={search} className="mt-9 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-xl shadow-black/20 ring-1 ring-white/10 transition focus-within:ring-4 focus-within:ring-white/20">
            <Search className="ml-4 shrink-0 text-[#5b6482]" size={20} />
            <input
              value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search parts"
              placeholder="Search by part name or number"
              className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base text-[#0b1330] outline-none placeholder:text-[#5b6482]"
            />
            <button aria-label="Search" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-hot px-6 py-3 font-bold transition hover:bg-hot-dark">
              <span className="hidden sm:inline">Search</span><ArrowRight size={18} />
            </button>
          </motion.form>

          {vehicles.length > 0 && (
            <motion.div variants={up} className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-white/50">Popular:</span>
              {vehicles.slice(0, 5).map((v) => (
                <Link key={v.id} href={`/vehicles/${v.slug}`} className="rounded-full bg-white/[0.07] px-3 py-1 font-semibold text-white/85 transition hover:bg-white hover:text-brand-900">{v.name}</Link>
              ))}
            </motion.div>
          )}

          <motion.dl variants={up} className="mt-12 flex max-w-xl flex-wrap gap-x-10 gap-y-4">
            {[
              { icon: BadgeCheck, k: "Genuine parts" },
              { icon: Truck, k: "24h dispatch" },
              { icon: Wrench, k: "Fitment help" },
            ].map(({ icon: Icon, k }) => (
              <div key={k} className="flex items-center gap-2.5 text-sm font-semibold text-white/80">
                <Icon size={18} className="text-hot" /><dt>{k}</dt>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* visual: one slow gear + rotating offer card */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.2 }} className="relative mx-auto hidden h-[460px] w-full max-w-[440px] lg:block">
          <div className="absolute inset-12 rounded-full bg-brand-500/30 blur-3xl" />
          <Sprocket size={400} className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 text-white/[0.12] [animation:spin-slow_60s_linear_infinite]" />
          <Sprocket size={150} teeth={11} className="absolute left-2 top-10 text-hot/80 [animation:spin-rev_40s_linear_infinite]" />

          {b && (
            <div className="absolute inset-x-4 bottom-4">
              <AnimatePresence mode="wait">
                <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease }}
                  className="relative overflow-hidden rounded-2xl bg-white p-6 text-[#0b1330] shadow-2xl shadow-black/30">
                  {b.image && <Image src={b.image} alt="" fill sizes="420px" className="object-cover opacity-10" />}
                  <div className="relative">
                    {b.eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-hot">{b.eyebrow}</p>}
                    <p className="mt-1.5 font-display text-3xl font-extrabold uppercase leading-none">{b.title}</p>
                    {b.subtitle && <p className="mt-2 line-clamp-2 text-sm text-[#5b6482]">{b.subtitle}</p>}
                    <Link href={b.link || "/shop"} className="group mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600">
                      {b.button_text || "Shop now"} <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
              {n > 1 && (
                <div className="mt-4 flex justify-center gap-1.5">
                  {banners.map((x, k) => (
                    <button key={x.id} onClick={() => setI(k)} aria-label={`Show offer ${k + 1}`} className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? "w-8 bg-white" : "w-1.5 bg-white/30 hover:bg-white/60"}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
