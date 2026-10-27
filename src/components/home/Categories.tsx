import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import type { Category } from "@/lib/types";

/** Clean category grid: cards fade up in sequence, lift gently on hover. */
export default function Categories({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const list = categories.filter((c) => c.show_on_home !== false);
  if (!list.length) return null;

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 md:mt-14">
      <SectionTitle eyebrow="Catalogue" title="Shop by category" sub="Everything a bike, rickshaw or cycle needs, sorted so you find it fast." href="/categories" cta="All categories" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {list.map((c, i) => (
          <Reveal key={c.id} delay={(i % 6) * 0.06} y={18}>
            <Link href={`/collections/${c.slug}`} className="group flex h-full flex-col items-center rounded-2xl border border-line bg-card px-4 py-6 text-center transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10">
              <span className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand-50 text-brand-600 transition duration-300 group-hover:scale-105 group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900">
                {c.image ? <Image src={c.image} alt="" fill sizes="64px" className="object-cover" /> : <CategoryIcon slug={c.slug} size={28} />}
              </span>
              <span className="mt-4 font-display text-xl font-bold leading-tight">{c.name}</span>
              <span className="mt-1 text-sm text-muted">{counts[c.id] ?? 0} products</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-600 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1">
                Shop <ArrowRight size={14} />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
