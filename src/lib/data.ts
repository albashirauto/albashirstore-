import { hasSupabase, serverClient } from "./supabase";
import {
  demoBanners, demoBrands, demoCategories, demoFeatures, demoPages, demoProducts, demoPromotions,
  demoFaqs, demoSettings, demoTestimonials, demoVehicles,
} from "./demo";
import type { Banner, Brand, Category, Faq, Feature, Page, Post, Product, Promotion, Settings, Testimonial, Vehicle } from "./types";
import { hasScheme } from "./scheme";

async function list<T>(table: string, demo: T[], order = "sort_order"): Promise<T[]> {
  if (!hasSupabase) return demo;
  try {
    const { data, error } = await serverClient().from(table).select("*").eq("active", true).order(order, { ascending: true });
    if (error) throw error;
    return (data as T[]) ?? [];
  } catch (e) {
    console.error(`[data] ${table}:`, e);
    return demo;
  }
}

export const getCategories = () => list<Category>("categories", demoCategories);
export const getBrands = () => list<Brand>("brands", demoBrands);
export const getVehicles = () => list<Vehicle>("vehicles", demoVehicles);
export const getFaqs = () => list<Faq>("faqs", demoFaqs);

/** Published blog posts, newest first (scheduled posts appear on their date). */
export async function getPosts(limit?: number): Promise<Post[]> {
  if (!hasSupabase) return [];
  try {
    let q = serverClient().from("posts").select("*").eq("active", true).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data as Post[]) ?? [];
  } catch (e) {
    console.error("[data] posts:", e);
    return [];
  }
}
export async function getPost(slug: string): Promise<Post | null> {
  return (await getPosts()).find((p) => p.slug === slug) ?? null;
}
export const getPromotions = () => list<Promotion>("promotions", demoPromotions);
export const getBanners = () => list<Banner>("banners", demoBanners);
export const getFeatures = () => list<Feature>("features", demoFeatures);
export const getTestimonials = () => list<Testimonial>("testimonials", demoTestimonials);
export const getPages = () => list<Page>("pages", demoPages, "title");

export async function getSettings(): Promise<Settings> {
  if (!hasSupabase) return demoSettings;
  try {
    const { data, error } = await serverClient().from("settings").select("key,value");
    if (error) throw error;
    return { ...demoSettings, ...Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])) };
  } catch (e) {
    console.error("[data] settings:", e);
    return demoSettings;
  }
}

export async function getPage(slug: string): Promise<Page | null> {
  const all = await getPages();
  return all.find((p) => p.slug === slug) ?? null;
}

export type ProductQuery = {
  category?: string; brand?: string; vehicle?: string; promotion?: string;
  /** motorcycle | cycle | rickshaw | loader: parts for any bike of that type */
  vehicleType?: string;
  q?: string; trending?: boolean; featured?: boolean; scheme?: boolean; sort?: string; limit?: number;
};

const SELECT = "*, category:categories(name,slug,parent_id), brand:brands(name,slug,logo), vehicle:vehicles(name,slug,type)";

function sortProducts(rows: Product[], sort?: string) {
  const r = [...rows];
  if (sort === "price-asc") r.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") r.sort((a, b) => b.price - a.price);
  else if (sort === "name") r.sort((a, b) => a.name.localeCompare(b.name));
  return r;
}

export async function getProducts(opts: ProductQuery = {}): Promise<Product[]> {
  if (!hasSupabase) return demoFilter(opts);
  try {
    const db = serverClient();
    let query = db.from("products").select(SELECT).eq("active", true);

    const resolve = async (table: string, slug?: string) => {
      if (!slug) return undefined;
      const { data } = await db.from(table).select("id").eq("slug", slug).maybeSingle();
      return (data?.id as string | undefined) ?? null;
    };
    const [cat, brand, veh, promo] = await Promise.all([
      resolve("categories", opts.category), resolve("brands", opts.brand),
      resolve("vehicles", opts.vehicle), resolve("promotions", opts.promotion),
    ]);
    if (cat === null || brand === null || veh === null || promo === null) return [];
    if (cat) {
      // a main category also shows the products of its sub-categories
      const { data: kids } = await db.from("categories").select("id").eq("parent_id", cat);
      query = query.in("category_id", [cat, ...(kids ?? []).map((k: { id: string }) => k.id)]);
    }
    if (brand) query = query.eq("brand_id", brand);
    if (veh) query = query.eq("vehicle_id", veh);
    if (promo) query = query.eq("promotion_id", promo);
    if (opts.vehicleType) {
      const { data: vs } = await db.from("vehicles").select("id").eq("type", opts.vehicleType);
      const ids = (vs ?? []).map((v: { id: string }) => v.id);
      if (!ids.length) return [];
      query = query.in("vehicle_id", ids);
    }
    if (opts.trending) query = query.eq("is_trending", true);
    if (opts.featured) query = query.eq("is_featured", true);
    if (opts.scheme) query = query.gt("scheme_buy", 0).gt("scheme_free", 0);
    if (opts.q) query = query.or(`name.ilike.%${opts.q.replace(/[%,]/g, " ")}%,sku.ilike.%${opts.q.replace(/[%,]/g, " ")}%`);

    if (opts.sort === "price-asc") query = query.order("price", { ascending: true });
    else if (opts.sort === "price-desc") query = query.order("price", { ascending: false });
    else if (opts.sort === "name") query = query.order("name", { ascending: true });
    else query = query.order("created_at", { ascending: false });

    if (opts.limit) query = query.limit(opts.limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data as Product[]) ?? [];
  } catch (e) {
    console.error("[data] products:", e);
    return demoFilter(opts);
  }
}

/** product is in this category, or in one of its sub-categories */
function inDemoCategory(p: Product, slug: string) {
  if (p.category?.slug === slug) return true;
  const main = demoCategories.find((c) => c.slug === slug);
  const own = demoCategories.find((c) => c.id === p.category_id);
  return !!main && !!own?.parent_id && own.parent_id === main.id;
}

function demoFilter(o: ProductQuery): Product[] {
  const promo = demoPromotions.find((p) => p.slug === o.promotion);
  let rows = demoProducts.filter((p) =>
    (!o.category || inDemoCategory(p, o.category)) &&
    (!o.brand || p.brand?.slug === o.brand) &&
    (!o.vehicle || p.vehicle?.slug === o.vehicle) &&
    (!o.vehicleType || demoVehicles.find((v) => v.id === p.vehicle_id)?.type === o.vehicleType) &&
    (!o.promotion || (promo ? p.promotion_id === promo.id : false)) &&
    (!o.trending || p.is_trending) &&
    (!o.featured || p.is_featured) &&
    (!o.scheme || hasScheme(p)) &&
    (!o.q || `${p.name} ${p.sku}`.toLowerCase().includes(o.q.toLowerCase())),
  );
  rows = sortProducts(rows, o.sort);
  return o.limit ? rows.slice(0, o.limit) : rows;
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (!hasSupabase) return demoProducts.find((p) => p.slug === slug) ?? null;
  try {
    const { data } = await serverClient().from("products").select(SELECT).eq("slug", slug).eq("active", true).maybeSingle();
    return (data as Product) ?? null;
  } catch {
    return demoProducts.find((p) => p.slug === slug) ?? null;
  }
}

export async function countByCategory(): Promise<Record<string, number>> {
  const all = await getProducts();
  const out: Record<string, number> = {};
  all.forEach((p) => { if (p.category_id) out[p.category_id] = (out[p.category_id] ?? 0) + 1; });
  return out;
}

export { money } from "./format";
