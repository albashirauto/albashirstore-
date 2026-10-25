import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import type { Promotion } from "@/lib/types";

export default function DealZone({ promotions }: { promotions: Promotion[] }) {
  const deals = promotions.filter((p) => p.show_on_home !== false);
  if (!deals.length) return null;

  return (
    <section className="mt-24 bg-soft py-20">
      <div className="mx-auto max-w-7xl px-4">
        <SectionTitle eyebrow="Offers" title="Deal zone" sub="Limited-time offers on parts riders buy most." href="/promotions" cta="All offers" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06} y={18}>
              <Link href={`/promotions/${p.slug}`} className="group relative flex h-60 flex-col justify-between overflow-hidden rounded-2xl bg-brand-900 p-6 text-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/20">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-brand-600),transparent_65%)]" />
                {p.image && <Image src={p.image} alt="" fill sizes="(max-width:640px) 100vw, 25vw" className="object-cover opacity-25 transition duration-700 group-hover:scale-105" />}
                <span className="relative w-fit rounded-full bg-hot px-3 py-1 text-sm font-bold">{p.badge || "Sale"}</span>
                <div className="relative">
                  <h3 className="text-3xl font-extrabold uppercase leading-none">{p.title}</h3>
                  {p.subtitle && <p className="mt-2 line-clamp-2 text-sm text-white/70">{p.subtitle}</p>}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white/90 transition group-hover:text-white">
                    Shop now <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
