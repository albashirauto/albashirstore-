import Link from "next/link";
import { ArrowRight, Clock3, Newspaper, Star } from "lucide-react";
import Reveal from "@/components/Reveal";
import { readingMinutes } from "@/lib/blog";
import type { Post } from "@/lib/types";

export const postDate = (iso: string) => new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });

/** Blog list card: cover, category, date, reading time, title, summary. `big` = the featured post across two columns. */
export default function PostCard({ p, i = 0, big = false }: { p: Post; i?: number; big?: boolean }) {
  return (
    <Reveal delay={(i % 3) * 0.06} y={18} className={`h-full ${big ? "md:col-span-2 lg:col-span-3" : ""}`}>
      <Link href={`/blog/${p.slug}`} className={`group flex h-full overflow-hidden rounded-3xl border border-line bg-card transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/10 ${big ? "flex-col md:flex-row" : "flex-col"}`}>
        <span className={`relative block shrink-0 overflow-hidden bg-soft ${big ? "aspect-[1200/630] md:w-[56%] md:self-center md:rounded-2xl lg:m-3" : "aspect-[16/9]"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.cover ? <img src={p.cover} alt={p.cover_alt || p.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <span className="grid h-full place-items-center text-brand-500/40"><Newspaper size={44} /></span>}
          {p.category && <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-900 shadow">{p.category}</span>}
          {big && p.featured && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow"><Star size={12} className="fill-current" />Featured</span>}
        </span>
        <span className={`flex flex-1 flex-col ${big ? "p-6 md:p-8 lg:p-10" : "p-5 md:p-6"}`}>
          <span className="flex flex-wrap items-center gap-x-3 text-xs font-bold uppercase tracking-wider text-hot">
            {postDate(p.published_at)}
            <span className="inline-flex items-center gap-1 text-muted"><Clock3 size={12} />{readingMinutes(p.content_html ?? "")} min read</span>
          </span>
          <span className={`mt-2 font-display font-extrabold uppercase leading-tight transition group-hover:text-brand-600 ${big ? "text-3xl lg:text-4xl" : "text-2xl"}`}>{p.title}</span>
          {p.excerpt && <span className={`mt-3 leading-relaxed text-muted ${big ? "line-clamp-3" : "line-clamp-3 text-sm"}`}>{p.excerpt}</span>}
          <span className="mt-auto flex items-center justify-between gap-3 pt-5">
            {p.author ? <span className="text-sm font-semibold">{p.author}</span> : <span />}
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600">Read article <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
          </span>
        </span>
      </Link>
    </Reveal>
  );
}
