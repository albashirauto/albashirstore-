import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopListing, { type SP } from "@/components/shop/ShopListing";
import AdminSeoPanel from "@/components/product/AdminSeoPanel";
import { getBrands, getSettings } from "@/lib/data";
import { SITE_URL, entityInput, entitySeo } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [brands, s] = await Promise.all([getBrands(), getSettings()]);
  const b = brands.find((x) => x.slug === slug);
  if (!b) return { title: "Brand" };
  const seo = entitySeo("brand", b, s.store_name);
  return {
    title: { absolute: seo.title },
    description: seo.description,
    keywords: b.focus_keywords?.split(",").map((k) => k.trim()).filter(Boolean),
    alternates: { canonical: `${SITE_URL}/brands/${b.slug}` },
    openGraph: { title: b.seo_title || b.name, images: b.logo ? [b.logo] : undefined },
  };
}

/** Brand page: logo in the banner, products, owner-written brand description. */
export default async function BrandPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [brands, settings] = await Promise.all([getBrands(), getSettings()]);
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) notFound();
  const facts = [brand.country && `Made in ${brand.country}`, "Genuine parts", "Delivery all over Pakistan"].filter(Boolean).join(" · ");
  return (
    <>
    <ShopListing title={brand.name} eyebrow="Brand" logo={brand.logo} logoFit={brand.logo_fit} subtitle={facts}
      parents={[{ label: "Brands", href: "/brands" }]} basePath={`/brands/${slug}`} fixed={{ brand: slug }} sp={sp} aboutHtml={brand.description_html} />
    <AdminSeoPanel editHref={`/admin/brands/${brand.id}`} label="brand" input={entityInput("brand", brand, brands, settings.store_name)} />
    </>
  );
}
