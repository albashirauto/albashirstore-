import Link from "next/link";

export default function Marquee({ items }: { items: { label: string; href: string }[] }) {
  if (!items.length) return null;
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line bg-soft py-4 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="flex w-max animate-marquee items-center gap-12">
        {row.map((x, i) => (
          <Link key={i} href={x.href} className="font-display whitespace-nowrap text-3xl font-extrabold uppercase text-brand-700/70 transition hover:text-hot dark:text-white/70">{x.label}</Link>
        ))}
      </div>
    </div>
  );
}
