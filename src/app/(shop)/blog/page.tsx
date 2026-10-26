import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Search, X } from "lucide-react";
import PostCard from "@/components/blog/PostCard";
import PageHero from "@/components/PageHero";
import { getPosts } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Blog: bike parts tips & fitment guides",
  description: "Maintenance tips, fitment guides and new stock for motorcycles, rickshaws, loaders and cycles.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

type SP = Promise<{ [k: string]: string | string[] | undefined }>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Blog list (Admin > Blog): featured post large, category chips, ?tag= and ?q= search. */
export default async function Blog({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const cat = one(sp.category), tag = one(sp.tag), q = one(sp.q).trim();
  const all = await getPosts();
  const categories = [...new Set(all.map((p) => p.category).filter(Boolean) as string[])].sort();
  const filtering = !!(cat || tag || q);
  const posts = all.filter((p) =>
    (!cat || p.category === cat) && (!tag || p.tags?.includes(tag)) &&
    (!q || `${p.title} ${p.excerpt ?? ""} ${p.category ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase().includes(q.toLowerCase())));
  // featured post first (newest featured), then newest
  const lead = filtering ? null : posts.find((p) => p.featured) ?? posts[0] ?? null;
  const rest = posts.filter((p) => p !== lead);
  const chip = (on: boolean) => `rounded-full px-4 py-2 text-sm font-bold transition ${on ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25" : "border border-line bg-card hover:border-brand-500"}`;
  const href = (c: string) => (c ? `/blog?category=${encodeURIComponent(c)}` : "/blog");

  return (
    <>
      <PageHero crumb="Blog" eyebrow="Tips & guides" title="Blog" sub="Maintenance tips, fitment guides and what is new in the shop." stats={all.length ? [{ label: "Articles", value: all.length }, ...(categories.length ? [{ label: "Topics", value: categories.length }] : [])] : []} />
      <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4">
        {all.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2 rounded-3xl border border-line bg-card p-3 shadow-xl shadow-brand-900/[0.06]">
            <Link href="/blog" className={chip(!cat && !tag)}>All</Link>
            {categories.map((c) => <Link key={c} href={href(c)} className={chip(cat === c)}>{c}</Link>)}
            <form action="/blog" className="relative ml-auto w-full sm:w-64">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input name="q" defaultValue={q} placeholder="Search articles…" className="w-full rounded-full border border-line bg-bg py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500" />
            </form>
          </div>
        )}

        {filtering && (
          <p className="mb-6 flex flex-wrap items-center gap-2 text-muted">
            {posts.length} article{posts.length === 1 ? "" : "s"}{cat && <> in <b className="text-fg">{cat}</b></>}{tag && <> tagged <b className="text-fg">#{tag}</b></>}{q && <> for “<b className="text-fg">{q}</b>”</>}
            <Link href="/blog" className="inline-flex items-center gap-1 rounded-full bg-soft px-3 py-1 text-xs font-bold hover:text-hot"><X size={12} />Clear</Link>
          </p>
        )}

        {posts.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lead && <PostCard p={lead} big />}
            {rest.map((p, i) => <PostCard key={p.id} p={p} i={i} />)}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line bg-card py-20 text-center">
            <Newspaper size={40} className="mx-auto text-brand-500" />
            <p className="mt-3 text-xl font-bold">{filtering ? "No articles match" : "Articles are on the way"}</p>
            <p className="text-muted">{filtering ? "Try another topic or search." : "Check back soon for tips on keeping your bike running strong."}</p>
          </div>
        )}
      </section>
    </>
  );
}
