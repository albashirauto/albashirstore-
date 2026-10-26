import { CalendarDays, Clock3, ListTree, RefreshCw, Tag } from "lucide-react";
import { readingMinutes, withHeadingIds } from "@/lib/blog";
import type { Post } from "@/lib/types";

export const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });

/** The article itself (header, cover, table of contents, body, tags). Used by /blog/<slug> and the editor's Preview. */
export default function ArticleView({ p, tagHref }: { p: Post; tagHref?: (tag: string) => string }) {
  const { html, toc } = withHeadingIds(p.content_html ?? "");
  const updated = p.updated_at && new Date(p.updated_at).getTime() - new Date(p.published_at).getTime() > 86400000;
  return (
    <>
      <header>
        {p.category && <p className="inline-flex rounded-full bg-hot/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-hot">{p.category}</p>}
        <h1 className="mt-4 text-4xl font-extrabold uppercase leading-[0.95] text-brand-900 dark:text-white md:text-6xl">{p.title}</h1>
        {p.excerpt && <p className="mt-4 text-lg leading-relaxed text-muted md:text-xl">{p.excerpt}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          {p.author && (
            <span className="flex items-center gap-2 font-semibold text-fg">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-sm font-bold text-white">{p.author.charAt(0)}</span>{p.author}
            </span>
          )}
          <span className="flex items-center gap-1.5"><CalendarDays size={15} />{longDate(p.published_at)}</span>
          {updated && <span className="flex items-center gap-1.5"><RefreshCw size={14} />Updated {longDate(p.updated_at!)}</span>}
          <span className="flex items-center gap-1.5"><Clock3 size={15} />{readingMinutes(p.content_html ?? "")} min read</span>
        </div>
      </header>

      {p.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.cover} alt={p.cover_alt || p.title} className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover shadow-xl shadow-brand-900/10" />
      )}

      {toc.length >= 3 && (
        <nav aria-label="Contents" className="mt-8 rounded-2xl border border-line bg-soft/60 p-5">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted"><ListTree size={16} />In this article</p>
          <ol className="mt-3 grid gap-1.5 text-sm">
            {toc.map((t) => (
              <li key={t.id} className={t.level === 3 ? "pl-5" : ""}>
                <a href={`#${t.id}`} className="font-semibold text-brand-600 transition hover:text-hot">{t.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* written by the shop in Admin > Blog */}
      <div className="prose-cms prose-article mt-8 text-lg" dangerouslySetInnerHTML={{ __html: html }} />

      {!!p.tags?.length && (
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <Tag size={16} className="text-muted" />
          {p.tags.map((t) => tagHref
            ? <a key={t} href={tagHref(t)} className="rounded-full border border-line px-3 py-1 text-sm font-semibold transition hover:border-brand-600 hover:text-brand-600">#{t}</a>
            : <span key={t} className="rounded-full border border-line px-3 py-1 text-sm font-semibold">#{t}</span>)}
        </div>
      )}
    </>
  );
}
