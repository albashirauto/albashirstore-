import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

export default function SectionTitle({ title, sub, href, cta = "View all", eyebrow }: { title: string; sub?: string; href?: string; cta?: string; eyebrow?: string }) {
  return (
    <Reveal y={16} className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot">
            <span className="h-px w-6 bg-hot" />{eyebrow}
          </p>
        )}
        <h2 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">{title}</h2>
        {sub && <p className="mt-3 max-w-xl text-muted">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="group hidden shrink-0 items-center gap-1.5 text-sm font-bold text-brand-600 transition hover:text-hot sm:flex">
          {cta} <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}
