import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ArticleView from "@/components/blog/ArticleView";
import PostCard from "@/components/blog/PostCard";
import ShareBar from "@/components/blog/ShareBar";
import CtaBand from "@/components/home/CtaBand";
import { getPost, getPosts, getSettings } from "@/lib/data";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPost((await params).slug);
  if (!p) return { title: "Article" };
  const url = `${SITE_URL}/blog/${p.slug}`;
  const title = p.seo_title || p.title, description = (p.seo_description || p.excerpt || "").slice(0, 160) || undefined;
  const image = p.og_image || p.cover;
  return {
    // an SEO title is used exactly as written; otherwise the site adds " | store name"
    title: p.seo_title ? { absolute: p.seo_title } : p.title,
    description,
    keywords: [...(p.focus_keywords?.split(",").map((k) => k.trim()) ?? []), ...(p.tags ?? [])].filter(Boolean),
    alternates: { canonical: p.canonical_url || url },
    robots: p.noindex ? { index: false, follow: true } : undefined,
    authors: p.author ? [{ name: p.author }] : undefined,
    openGraph: {
      type: "article", url, title: p.og_title || title, description: p.og_description || description, publishedTime: p.published_at,
      modifiedTime: p.updated_at ?? undefined, section: p.category ?? undefined, tags: p.tags ?? undefined, images: image ? [image] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: p.og_title || title, description: p.og_description || description, images: image ? [image] : undefined },
  };
}

/** One article: header, cover, contents, body, tags, share bar, related articles, help band. */
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, all, settings] = await Promise.all([getPost(slug), getPosts(), getSettings()]);
  if (!p) notFound();
  // related: same category first, then shared tags, then newest
  const score = (x: typeof p) => (x.category && x.category === p.category ? 2 : 0) + (x.tags ?? []).filter((t) => p.tags?.includes(t)).length;
  const more = all.filter((x) => x.id !== p.id).sort((a, b) => score(b) - score(a)).slice(0, 3);
  const url = `${SITE_URL}/blog/${p.slug}`;
  const store = settings.store_name || "Al Bashir Autos";
  const schema = [
    {
      "@context": "https://schema.org", "@type": p.schema_type || "BlogPosting", headline: p.title, description: p.seo_description || p.excerpt || undefined,
      image: p.cover ? [p.cover] : undefined, datePublished: p.published_at, dateModified: p.updated_at || p.published_at,
      author: p.author ? { "@type": "Person", name: p.author } : { "@type": "Organization", name: store },
      publisher: { "@type": "Organization", name: store, logo: settings.logo ? { "@type": "ImageObject", url: settings.logo } : undefined },
      mainEntityOfPage: p.canonical_url || url, articleSection: p.category || undefined,
      keywords: [p.focus_keywords?.split(",")[0]?.trim(), ...(p.tags ?? [])].filter(Boolean).join(", ") || undefined,
    },
    breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }]),
  ];
  // "<" written as the six characters < so the JSON can never close the script tag
  const json = JSON.stringify(schema).replace(/</g, String.fromCharCode(92) + "u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-hot"><ArrowLeft size={15} />All articles</Link>
        <div className="mt-6"><ArticleView p={p} tagHref={(t) => `/blog?tag=${encodeURIComponent(t)}`} /></div>
        <ShareBar url={url} title={p.title} />
      </article>

      {more.length > 0 && (
        <section className="mx-auto mt-10 max-w-7xl px-4">
          <h2 className="mb-6 text-3xl font-extrabold uppercase text-brand-900 dark:text-white">Keep reading</h2>
          <div className="grid gap-5 md:grid-cols-3">{more.map((x, i) => <PostCard key={x.id} p={x} i={i} />)}</div>
        </section>
      )}
      <CtaBand settings={settings} />
    </>
  );
}
