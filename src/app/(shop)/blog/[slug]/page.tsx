import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PostCard, { postDate } from "@/components/blog/PostCard";
import CtaBand from "@/components/home/CtaBand";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getPost, getPosts, getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPost((await params).slug);
  if (!p) return { title: "Article" };
  const url = `${SITE_URL}/blog/${p.slug}`;
  return {
    title: p.seo_title || p.title,
    description: (p.seo_description || p.excerpt || "").slice(0, 160) || undefined,
    keywords: p.focus_keywords?.split(",").map((k) => k.trim()).filter(Boolean),
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: p.seo_title || p.title, description: p.excerpt ?? undefined, publishedTime: p.published_at, images: p.cover ? [p.cover] : undefined },
    twitter: { card: p.cover ? "summary_large_image" : "summary", title: p.seo_title || p.title, images: p.cover ? [p.cover] : undefined },
  };
}

/** One article: cover, body, share on WhatsApp / Facebook, more articles, help band. */
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, all, settings] = await Promise.all([getPost(slug), getPosts(), getSettings()]);
  if (!p) notFound();
  const more = all.filter((x) => x.id !== p.id).slice(0, 3);
  const url = `${SITE_URL}/blog/${p.slug}`;
  const schema = {
    "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.excerpt || undefined,
    image: p.cover ? [p.cover] : undefined, datePublished: p.published_at, author: p.author ? { "@type": "Person", name: p.author } : undefined,
    publisher: { "@type": "Organization", name: settings.store_name || "Al Bashir Autos" }, mainEntityOfPage: url,
  };
  // "<" written as the six characters < so the JSON can never close the script tag
  const json = JSON.stringify(schema).replace(/</g, String.fromCharCode(92) + "u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-hot"><ArrowLeft size={15} />All articles</Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-wider text-hot">{postDate(p.published_at)}{p.author ? ` · ${p.author}` : ""}</p>
        <h1 className="mt-2 text-4xl font-extrabold uppercase leading-[0.95] text-brand-900 dark:text-white md:text-6xl">{p.title}</h1>
        {p.excerpt && <p className="mt-4 text-lg leading-relaxed text-muted">{p.excerpt}</p>}
        {p.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover} alt="" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
        )}
        {/* written by the shop owner in the admin panel */}
        <div className="prose-cms mt-8 text-lg" dangerouslySetInnerHTML={{ __html: p.content_html ?? "" }} />

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <span className="text-sm font-bold text-muted">Share:</span>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${p.title} ${url}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1ebe5b]"><WhatsAppIcon size={16} />WhatsApp</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 text-sm font-bold transition hover:border-[#1877F2] hover:text-[#1877F2]">Facebook</a>
        </div>
      </article>

      {more.length > 0 && (
        <section className="mx-auto mt-10 max-w-7xl px-4">
          <h2 className="mb-6 text-3xl font-extrabold uppercase text-brand-900 dark:text-white">More articles</h2>
          <div className="grid gap-5 md:grid-cols-3">{more.map((x, i) => <PostCard key={x.id} p={x} i={i} />)}</div>
        </section>
      )}
      <CtaBand settings={settings} />
    </>
  );
}
