import type { MetadataRoute } from "next";
import { getBrands, getCategories, getPages, getPosts, getProducts, getVehicles } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";
import { VEHICLE_TYPES } from "@/lib/vehicleTypes";

// rebuilt at most every 10 minutes: new products, categories, brands, bikes and posts appear on their own
export const revalidate = 600;

/** Real "last changed" date when the row has one, so Google trusts the dates. */
const when = (row: unknown, fallback: Date) => {
  const r = row as { updated_at?: string; created_at?: string };
  const d = new Date(r.updated_at || r.created_at || "");
  return Number.isNaN(+d) ? fallback : d;
};

/** /sitemap.xml: every live page. Hidden products and products set to "No index" are left out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands, vehicles, pages, posts] = await Promise.all([getProducts(), getCategories(), getBrands(), getVehicles(), getPages(), getPosts()]);
  const url = (path: string) => `${SITE_URL}${path}`;
  const now = new Date();
  const newest = products.reduce((d, p) => (when(p, d) > d ? when(p, d) : d), new Date(0));
  const shopDate = +newest ? newest : now;

  return [
    { url: url(""), lastModified: shopDate, changeFrequency: "daily", priority: 1 },
    ...["/shop", "/categories", "/brands", "/vehicles", "/promotions", "/promotions/schemes"].map((p) => ({ url: url(p), lastModified: shopDate, changeFrequency: "daily" as const, priority: 0.8 })),
    ...VEHICLE_TYPES.map((t) => ({ url: url(`/parts/${t.type}`), lastModified: shopDate, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.filter((p) => !p.robots_noindex).map((p) => ({
      url: url(`/products/${p.slug}`), lastModified: when(p, now), changeFrequency: "weekly" as const, priority: 0.9,
      images: p.images?.length ? p.images.slice(0, 5) : undefined,
    })),
    ...categories.map((c) => ({ url: url(`/collections/${c.slug}`), lastModified: when(c, now), changeFrequency: "weekly" as const, priority: c.parent_id ? 0.6 : 0.7, images: c.image ? [c.image] : undefined })),
    ...brands.map((b) => ({ url: url(`/brands/${b.slug}`), lastModified: when(b, now), changeFrequency: "weekly" as const, priority: 0.6, images: b.logo ? [b.logo] : undefined })),
    ...vehicles.map((v) => ({ url: url(`/vehicles/${v.slug}`), lastModified: when(v, now), changeFrequency: "weekly" as const, priority: 0.6 })),
    { url: url("/blog"), lastModified: posts[0] ? new Date(posts[0].published_at) : now, changeFrequency: "weekly", priority: 0.6 },
    ...posts.map((p) => ({ url: url(`/blog/${p.slug}`), lastModified: new Date(p.published_at), changeFrequency: "monthly" as const, priority: 0.7, images: p.cover ? [p.cover] : undefined })),
    ...["/about", "/contact"].map((p) => ({ url: url(p), lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...pages.filter((p) => !["about", "contact"].includes(p.slug)).map((p) => ({ url: url(`/pages/${p.slug}`), lastModified: when(p, now), changeFrequency: "monthly" as const, priority: 0.4 })),
  ];
}
