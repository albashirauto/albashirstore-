import Link from "next/link";

type Item = { label: string; href: string; logo?: string | null };

/** Quiet, straight marquee of the brands we stock (bikes have their own section). Pauses on hover. */
export default function SpeedBands({ brands }: { brands: Item[] }) {
  const items = brands;
  if (!items.length) return null;
  // each half must be wider than the widest screen, or a gap opens on the right: repeat to 16+ names
  const half = Array.from({ length: Math.ceil(16 / items.length) }, () => items).flat();
  const row = [...half, ...half];

  return (
    <section aria-label="Brands we stock" className="mx-auto mt-10 max-w-7xl px-4">
      <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-muted">Genuine parts from the brands we sell</p>
      <div className="group overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex w-max items-center [animation:marquee_70s_linear_infinite] group-hover:[animation-play-state:paused]">
          {row.map((x, i) => (
            <span key={i} className="flex items-center">
              <Link href={x.href} title={x.label} className="flex items-center gap-2 whitespace-nowrap px-6 font-display text-2xl font-bold uppercase tracking-wide text-fg/55 transition hover:text-brand-600 dark:text-white/55 dark:hover:text-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {x.logo ? <img src={x.logo} alt={x.label} className="h-8 w-auto max-w-28 object-contain opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0" /> : x.label}
              </Link>
              <span className="h-1 w-1 rounded-full bg-hot/60" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
