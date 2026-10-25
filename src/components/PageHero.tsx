import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Stat = { label: string; value: number | string; plus?: boolean };

/** Slim branded banner for listing pages: breadcrumb, eyebrow, title, intro and a few stats. */
export default function PageHero({ crumb, parents = [], eyebrow, title, sub, stats = [], image, logo }: { crumb: string; parents?: { label: string; href: string }[]; eyebrow: string; title: string; sub?: string; stats?: Stat[]; image?: string | null; logo?: string | null }) {
  return (
    <section className="relative isolate overflow-hidden bg-brand-900 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--color-brand-600),transparent_60%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "56px 56px", maskImage: "linear-gradient(to bottom, #000, transparent 90%)" }} />

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 md:pt-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-white/60">
          <Link href="/" className="transition hover:text-white">Home</Link>
          {parents.map((p) => (
            <span key={p.href} className="contents">
              <ChevronRight size={14} />
              <Link href={p.href} className="transition hover:text-white">{p.label}</Link>
            </span>
          ))}
          <ChevronRight size={14} />
          <span className="truncate text-white">{crumb}</span>
        </nav>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
          <div className="flex items-center gap-5">
            {(logo || image) && (
              <span className={`relative grid shrink-0 place-items-center overflow-hidden ${logo ? "h-24 w-24 rounded-2xl bg-white p-3 shadow-xl" : "h-24 w-24 rounded-2xl ring-4 ring-white/15 md:h-28 md:w-28"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={(logo || image)!} alt="" className={logo ? "max-h-full max-w-full object-contain" : "h-full w-full object-cover"} />
              </span>
            )}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              <span className="h-px w-6 bg-hot" />{eyebrow}
            </p>
            <h1 className="text-5xl font-extrabold uppercase leading-none md:text-6xl">{title}</h1>
            {sub && <p className="mt-4 max-w-lg text-white/75">{sub}</p>}
          </div>
          </div>

          {stats.length > 0 && (
            <dl className="flex gap-10">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-white/60">{s.label}</dt>
                  <dd className="font-display text-5xl font-extrabold leading-none">{s.value}{s.plus && <span className="text-hot">+</span>}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
