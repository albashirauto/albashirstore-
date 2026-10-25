import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import Reveal from "@/components/Reveal";
import type { Post } from "@/lib/types";

export const postDate = (iso: string) => new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });

/** Blog list card: cover, date, title, summary. */
export default function PostCard({ p, i = 0, big = false }: { p: Post; i?: number; big?: boolean }) {
  return (
    <Reveal delay={(i % 3) * 0.06} y={18} className={`h-full ${big ? "md:col-span-2" : ""}`}>
      <Link href={`/blog/${p.slug}`} className={`group flex h-full overflow-hidden rounded-2xl border border-line bg-card transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 ${big ? "flex-col md:flex-row" : "flex-col"}`}>
        <span className={`relative block shrink-0 overflow-hidden bg-soft ${big ? "aspect-[16/9] md:aspect-auto md:w-1/2" : "aspect-[16/9]"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.cover ? <img src={p.cover} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <span className="grid h-full place-items-center text-brand-500/40"><Newspaper size={44} /></span>}
        </span>
        <span className="flex flex-1 flex-col p-5 md:p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-hot">{postDate(p.published_at)}{p.author ? ` · ${p.author}` : ""}</span>
          <span className={`mt-2 font-display font-extrabold uppercase leading-tight transition group-hover:text-brand-600 ${big ? "text-4xl" : "text-2xl"}`}>{p.title}</span>
          {p.excerpt && <span className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{p.excerpt}</span>}
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-brand-600">Read article <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
        </span>
      </Link>
    </Reveal>
  );
}
