"use client";

import { motion } from "motion/react";
import { Camera, CheckCheck, Clock, Phone } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import type { Settings } from "@/lib/types";

const ease = [0.22, 1, 0.36, 1] as const;
const bubble = { hide: { opacity: 0, y: 14, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease } } };

/** WhatsApp help band: copy + buttons on the left, a short chat that plays in on scroll on the right. */
export default function CtaBand({ settings }: { settings: Settings }) {
  const store = settings.store_name || "Al Bashir Autos";

  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <Reveal>
        <div className="relative grid items-center gap-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 to-brand-500 p-8 text-white md:p-12 lg:grid-cols-2">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-hot/30 blur-3xl" />

          {/* copy */}
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
              <Clock size={14} /> Replies in minutes
            </span>
            <h2 className="mt-5 text-4xl font-extrabold uppercase leading-none md:text-6xl">Can&apos;t find<br />your part?</h2>
            <p className="mt-4 max-w-md text-lg text-white/85">Send a photo or the part number on WhatsApp. We will check fitment and tell you the price and stock right away.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 rounded-full bg-hot px-7 py-3.5 text-lg font-bold shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-hot-dark">
                <WhatsAppIcon size={20} className="transition group-hover:rotate-12" />WhatsApp us
              </a>
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="inline-flex items-center gap-2 rounded-full border-2 border-white/60 px-7 py-3.5 text-lg font-bold transition hover:-translate-y-0.5 hover:bg-white hover:text-brand-700">
                  <Phone size={20} />{settings.phone}
                </a>
              )}
            </div>
          </div>

          {/* chat preview */}
          <motion.div initial="hide" whileInView="show" viewport={{ once: true, margin: "-80px" }} transition={{ staggerChildren: 0.55, delayChildren: 0.3 }} className="relative mx-auto w-full max-w-sm rounded-3xl bg-white p-4 text-[#0b1330] shadow-2xl shadow-black/30">
            <div className="flex items-center gap-3 border-b border-[#e3e8f5] pb-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 font-display text-lg font-extrabold text-white">{store.charAt(0)}</span>
              <div className="leading-tight">
                <p className="font-bold">{store}</p>
                <p className="flex items-center gap-1.5 text-xs text-emerald-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />online</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 text-sm">
              <motion.div variants={bubble} className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-emerald-50 p-2.5">
                <div className="mb-1.5 grid h-20 w-36 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Camera size={26} /></div>
                Brake shoe for CG 125, do you have it?
              </motion.div>
              <motion.p variants={bubble} className="w-fit max-w-[80%] rounded-2xl rounded-bl-md bg-[#f3f6fd] px-3.5 py-2.5">
                Yes, in stock ✅ Genuine pair, fits CG 125 all models.
              </motion.p>
              <motion.p variants={bubble} className="w-fit max-w-[80%] rounded-2xl rounded-bl-md bg-[#f3f6fd] px-3.5 py-2.5">
                Ships today, delivery in 2-3 days 🚚
              </motion.p>
              <motion.p variants={bubble} className="ml-auto flex w-fit items-center gap-1.5 rounded-2xl rounded-br-md bg-emerald-50 px-3.5 py-2.5">
                Great, order it please! <CheckCheck size={16} className="text-sky-500" />
              </motion.p>
            </div>
          </motion.div>
        </div>
      </Reveal>
    </section>
  );
}
