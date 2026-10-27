import Link from "next/link";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import type { Brand } from "@/lib/types";
import { fitClass, isContain } from "@/lib/logoFit";

export default function AboutBrands({ brands }: { brands: Brand[] }) {
  if (!brands.length) return null;
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <SectionTitle eyebrow="Dealership of" title="Authorised dealer" sub="We are the dealer for these brands. Genuine stock, dealer prices." href="/brands" cta="All brands" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {brands.slice(0, 12).map((b, i) => (
          <Reveal key={b.id} delay={(i % 6) * 0.04} y={14}>
            <Link href={`/brands/${b.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card text-center transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/15">
              {/* logo fills the top of the card; initials until a logo is uploaded */}
              <span className="relative grid aspect-square place-items-center overflow-hidden bg-white dark:bg-white/95">
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-brand-100),transparent_70%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                {b.logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={b.logo} alt={b.name} loading="lazy" className={`absolute inset-0 m-auto h-full w-full ${fitClass(b.logo_fit)} ${isContain(b.logo_fit) ? "p-1.5" : ""} transition duration-500 group-hover:scale-[1.04]`} />
                  : <span className="relative bg-gradient-to-br from-brand-500 to-brand-800 bg-clip-text font-display text-5xl font-extrabold text-transparent transition duration-500 group-hover:scale-110">{b.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase()}</span>}
              </span>
              <span className="flex flex-1 flex-col items-center justify-center border-t border-line px-3 py-3 transition group-hover:bg-brand-600 group-hover:text-white">
                <span className="font-display text-lg font-bold uppercase tracking-wide">{b.name}</span>
                {b.sub_brands && <span className="mt-0.5 text-xs leading-snug text-muted transition group-hover:text-white/80">{b.sub_brands}</span>}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
