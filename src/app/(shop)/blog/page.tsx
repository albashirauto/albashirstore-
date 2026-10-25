import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
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

/** Blog list (Admin > Blog). Newest post shown large. */
export default async function Blog() {
  const posts = await getPosts();
  return (
    <>
      <PageHero crumb="Blog" eyebrow="Tips & guides" title="Blog" sub="Maintenance tips, fitment guides and what is new in the shop." stats={posts.length ? [{ label: "Articles", value: posts.length }] : []} />
      <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4">
        {posts.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => <PostCard key={p.id} p={p} i={i} big={i === 0} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-card py-20 text-center">
            <Newspaper size={40} className="mx-auto text-brand-500" />
            <p className="mt-3 text-xl font-bold">Articles are on the way</p>
            <p className="text-muted">Check back soon for tips on keeping your bike running strong.</p>
          </div>
        )}
      </section>
    </>
  );
}
