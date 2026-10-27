import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { mdiGeneratorPortable, mdiToolbox } from "@mdi/js";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import VehicleIcon from "@/components/VehicleIcon";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import type { Offering, Settings } from "@/lib/types";

const EXTRA: Record<string, string> = { generator: mdiGeneratorPortable, tools: mdiToolbox };

function Placeholder({ icon }: { icon?: string | null }) {
  const d = icon ? EXTRA[icon] : undefined;
  return d
    ? <svg width={64} height={64} viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d={d} /></svg>
    : <VehicleIcon type={icon} size={64} />;
}

/** Product groups (Admin > What we sell): photo floats on a soft panel, lifts and zooms on hover. */
export default function WhatWeSell({ items, settings }: { items: Offering[]; settings: Settings }) {
  if (!items.length) return null;

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 md:mt-16">
      <div className="flex flex-wrap items-end justify-between gap-x-6">
        <SectionTitle eyebrow="Our range" title="What we sell" sub="Parts for bikes, cycles, loader rickshaws, chingchi rickshaws and generators, for every brand we stock. Plus tools." />
        {settings.whatsapp && (
          <Reveal y={10} className="mb-8">
            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 font-bold text-brand-600 transition hover:text-hot">
              <WhatsAppIcon size={18} />Ask for any part<ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </a>
          </Reveal>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {items.map((o, i) => (
          <Reveal key={o.id} delay={(i % 6) * 0.06} y={20}>
            <Link href={o.link || "/shop"} className="group flex h-full flex-col rounded-2xl border border-line bg-card p-4 transition duration-300 hover:-translate-y-1.5 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/10">
              <span className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 via-white to-brand-100 text-brand-600 dark:from-brand-900 dark:via-brand-900 dark:to-brand-950">
                <span className="absolute inset-6 rounded-full bg-brand-500/15 blur-2xl transition duration-500 group-hover:scale-125 group-hover:bg-brand-500/25" />
                {o.image
                  ? <Image src={o.image} alt={o.title} fill sizes="(min-width:1024px) 200px, 45vw" className="object-contain p-3 drop-shadow-[0_12px_14px_rgba(10,31,102,0.2)] transition duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-110" />
                  : <span className="relative transition duration-500 group-hover:-translate-y-1 group-hover:scale-110"><Placeholder icon={o.icon} /></span>}
              </span>
              <span className="mt-4 text-lg font-bold leading-snug transition group-hover:text-brand-600">{o.title}</span>
              {o.body && <span className="mt-1 text-sm leading-relaxed text-muted">{o.body}</span>}
              <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-bold text-brand-600 opacity-0 transition duration-300 group-hover:opacity-100">
                Shop now <ArrowRight size={14} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
