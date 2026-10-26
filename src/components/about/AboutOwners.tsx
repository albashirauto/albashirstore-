"use client";

import "@fontsource/caveat/600.css";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Phone, Quote } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import type { Owner } from "@/lib/location";

const waNumber = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "92");
const initials = (name: string) => name.replace(/^(h\.|hafiz|muhammad|m\.)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// Things the shop really does (checkout confirms by phone, ships Pakistan-wide, bulk schemes).
const PROMISES = ["Talk directly to an owner", "Every order confirmed by phone", "Delivery all over Pakistan", "Bulk schemes: buy more, get free pieces"];

/** "Meet the owners": one spotlight card per owner (photo, bio, quote, signature, call / WhatsApp). Photo, bio and quote: Admin > Settings > Team. */
export default function AboutOwners({ owners, store, title, sub }: { owners: Owner[]; store: string; title?: string; sub?: string }) {
  const [at, setAt] = useState(0);
  if (!owners.length) return null;
  const o = owners[Math.min(at, owners.length - 1)];
  const words = o.name.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop() : "";

  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <SectionTitle eyebrow="Meet the owners" title={title || `The people behind ${store}`} sub={sub || "No call centre. When you call or message, you speak directly to the people who run the shop."} />

      {owners.length > 1 && (
        <Reveal y={12}>
          <div role="tablist" aria-label="Owners" className="mb-6 flex gap-3 overflow-x-auto pb-1">
            {owners.map((p, i) => (
              <button key={i} role="tab" aria-selected={i === at} onClick={() => setAt(i)}
                className={`flex shrink-0 items-center gap-3 rounded-full border py-1.5 pl-1.5 pr-5 text-left transition ${i === at ? "border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-600/25" : "border-line bg-card hover:border-brand-500/50"}`}>
                <Avatar p={p} className="h-10 w-10 text-sm" />
                <span className="leading-tight">
                  <span className="block text-sm font-bold">{p.name}</span>
                  <span className={`block text-xs ${i === at ? "text-white/75" : "text-muted"}`}>{p.role || "Owner"}</span>
                </span>
              </button>
            ))}
          </div>
        </Reveal>
      )}

      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-hot/10 blur-3xl" />

        <AnimatePresence mode="wait">
          <motion.div key={at} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
            className="relative grid items-center gap-10 p-6 md:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:p-14">

            {/* portrait */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-500/40 via-purple-500/25 to-hot/35 blur-2xl" />
              <div className="relative rounded-[2rem] bg-gradient-to-br from-brand-500 via-purple-500 to-hot p-1.5 shadow-2xl shadow-brand-900/20">
                <div className="relative aspect-square overflow-hidden rounded-[1.6rem] bg-brand-900">
                  {o.photo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={o.photo} alt={o.name} className="h-full w-full object-cover" />
                    : <Avatar p={o} className="h-full w-full text-8xl" big />}
                </div>
              </div>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-900 shadow-xl dark:bg-brand-900 dark:text-white">
                {o.role || "Owner"} · {store}
              </span>
            </div>

            {/* story */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">{o.role || "Owner"}</p>
              <h3 className="mt-3 text-5xl font-extrabold uppercase leading-[0.95] md:text-6xl">
                {words.join(" ")}{last && <> <span className="bg-gradient-to-r from-brand-600 via-purple-500 to-hot bg-clip-text text-transparent">{last}</span></>}
              </h3>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                {o.bio || `Assalam o Alaikum! I am one of the owners of ${store}. Call or message me about any part: price, stock or whether it fits your bike. I will give you an honest answer.`}
              </p>

              {o.quote && (
                <blockquote className="mt-6 flex gap-3 border-l-4 border-brand-600 pl-4 text-lg font-semibold italic">
                  <Quote size={18} className="mt-1 shrink-0 text-brand-600" />“{o.quote}”
                </blockquote>
              )}
              <p className="mt-4 text-4xl text-brand-600 dark:text-brand-100" style={{ fontFamily: "Caveat, cursive" }}>{o.name}</p>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {(o.points.length ? o.points : PROMISES).slice(0, 6).map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm font-medium">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-600/15 text-green-600"><Check size={14} strokeWidth={3} /></span>{t}
                  </li>
                ))}
              </ul>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {o.whatsapp && (
                  <a href={`https://wa.me/${waNumber(o.phone)}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 font-bold text-white shadow-lg shadow-[#25D366]/30 transition hover:-translate-y-0.5 hover:bg-[#1ebe5b]">
                    <WhatsAppIcon size={20} />Chat on WhatsApp
                  </a>
                )}
                <a href={`tel:${o.phone}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-bg px-6 py-4 font-bold transition hover:-translate-y-0.5 hover:border-brand-600 hover:text-brand-600">
                  <Phone size={18} />Call {o.phone}
                </a>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/** Photo, or initials on the brand gradient when no photo is uploaded yet. */
function Avatar({ p, className = "", big = false }: { p: Owner; className?: string; big?: boolean }) {
  if (p.photo && !big) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.photo} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br from-brand-500 to-brand-900 font-display font-bold text-white ${big ? "" : "rounded-full"} ${className}`}>
      {big && <span className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />}
      <span className="relative">{initials(p.name)}</span>
    </span>
  );
}
