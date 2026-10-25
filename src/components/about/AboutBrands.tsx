import Link from "next/link";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import BrandMark from "@/components/brands/BrandMark";
import type { Brand } from "@/lib/types";

export default function AboutBrands({ brands }: { brands: Brand[] }) {
  if (!brands.length) return null;
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <SectionTitle eyebrow="Brands we deal in" title="Trusted names" href="/brands" cta="All brands" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {brands.slice(0, 12).map((b, i) => (
          <Reveal key={b.id} delay={(i % 6) * 0.04} y={14}>
            <Link href={`/brands/${b.slug}`} className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-card p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10">
              <BrandMark name={b.name} logo={b.logo} size={52} />
              <span className="font-display text-lg font-bold uppercase tracking-wide transition group-hover:text-brand-600">{b.name}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
