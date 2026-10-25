import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopListing, { type SP } from "@/components/shop/ShopListing";
import AdminSeoPanel from "@/components/product/AdminSeoPanel";
import { countByCategory, getCategories, getSettings } from "@/lib/data";
import { SITE_URL, entityInput, entitySeo } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [cats, s] = await Promise.all([getCategories(), getSettings()]);
  const c = cats.find((x) => x.slug === slug);
  if (!c) return { title: "Category" };
  const seo = entitySeo("category", c, s.store_name);
  return {
    title: { absolute: seo.title },
    description: seo.description,
    robots: { index: true, follow: true },
    keywords: c.focus_keywords?.split(",").map((k) => k.trim()).filter(Boolean),
    alternates: { canonical: `${SITE_URL}/collections/${c.slug}` },
    openGraph: { title: c.seo_title || c.name, images: c.image ? [c.image] : undefined },
  };
}

/** Category page: picture, sub-category tiles (with pictures), products, owner-written description. */
export default async function Collection({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [cats, counts, settings] = await Promise.all([getCategories(), countByCategory(), getSettings()]);
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) notFound();
  const parent = cat.parent_id ? cats.find((c) => c.id === cat.parent_id) : undefined;
  const kids = cats.filter((c) => c.parent_id === cat.id);
  // sub-categories of this category, or its sisters when this is already a sub-category
  const tileSource = kids.length ? kids : parent ? cats.filter((c) => c.parent_id === parent.id && c.id !== cat.id) : [];
  const tiles = tileSource.map((c) => ({ name: c.name, href: `/collections/${c.slug}`, image: c.image, count: counts[c.id] ?? 0 }));

  return (
    <>
    <ShopListing title={cat.name} eyebrow={parent ? `${parent.name} › Sub-category` : "Category"} image={cat.image}
      subtitle={`${cat.name} for motorcycles, rickshaws, loaders and cycles. Filter by bike model, brand or price.`}
      parents={[{ label: "Categories", href: "/categories" }, ...(parent ? [{ label: parent.name, href: `/collections/${parent.slug}` }] : [])]}
      basePath={`/collections/${slug}`} fixed={{ category: slug }} sp={sp} tiles={tiles} aboutHtml={cat.description_html} />
    <AdminSeoPanel editHref={`/admin/categories?edit=${cat.id}`} label="category" input={entityInput("category", cat, cats, settings.store_name)} />
    </>
  );
}
