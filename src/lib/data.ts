import { hasSupabase, serverClient } from "./supabase";
import {
  demoBanners, demoBrands, demoCategories, demoFeatures, demoPages, demoProducts, demoPromotions,
  demoFaqs, demoSettings, demoTestimonials, demoVehicles,
} from "./demo";
import type { Award, Banner, Offering, Brand, Category, Faq, Feature, Page, Post, Product, Promotion, Review, Settings, Testimonial, Vehicle } from "./types";
import { hasScheme } from "./scheme";
import { discountPct } from "./format";
import type { Campaign } from "./campaigns";

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
/** brands we sell parts of (menu, /brands, home strip); dealership-only brands are left out */
export const sellBrands = (all: Brand[]) => all.filter((b) => b.show_as_brand !== false);
/** brands we are the dealer for, in dealership order */
export const dealerBrands = (all: Brand[]) => all.filter((b) => b.dealer).sort((a, b) => (a.dealer_order ?? 0) - (b.dealer_order ?? 0));
export const getVehicles = () => list<Vehicle>("vehicles", demoVehicles);
export const getFaqs = () => list<Faq>("faqs", demoFaqs);

/** Published blog posts, newest first (scheduled posts appear on their date). */
export async function getPosts(limit?: number): Promise<Post[]> {
  if (!hasSupabase) return [];
  try {
    let q = serverClient().from("posts").select("*").eq("active", true).is("deleted_at", null).lte("published_at", new Date().toISOString()).order("published_at", { ascending: false });
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
export const getOfferings = () => list<Offering>("offerings", []);
export const getAwards = () => list<Award>("awards", []);
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

type Offer = { id: string; rule: string | null; rule_value: number | null };

/** Products sold most in the last `days` days (from real orders; ids + pieces only). */
async function bestSellerMap(days: number) {
  const { data } = await serverClient().rpc("best_sellers", { p_days: days, p_limit: 100 });
  return new Map(((data as { product_id: string; sold: number }[] | null) ?? []).map((r) => [r.product_id, Number(r.sold)]));
}

/** Smart offer (Admin > Promotions > rule): keep the products that match, plus ones assigned by hand. */
async function applyRule(rows: Product[], o: Offer) {
  const v = Number(o.rule_value ?? 0);
  const mine = (p: Product) => p.promotion_id === o.id;
  if (o.rule === "best_sellers") {
    const sold = await bestSellerMap(v || 30);
    return rows.filter((p) => sold.has(p.id) || mine(p)).sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0));
  }
  const since = Date.now() - (v || 30) * 86400000;
  const match = (p: Product) =>
    o.rule === "under_price" ? p.price <= (v || 999)
    : o.rule === "min_discount" ? discountPct(p.price, p.compare_price) >= (v || 1)
    : o.rule === "scheme" ? hasScheme(p)
    : o.rule === "new" ? new Date(p.created_at ?? 0).getTime() >= since
    : false;
  return rows.filter((p) => match(p) || mine(p));
}

/**
 * Home "Trending now": real best sellers of the last 30 days first, then products marked Trending,
 * then the newest, so the row is never empty and new products join it by themselves.
 */
export async function getTrending(limit = 8): Promise<Product[]> {
  const all = await getProducts();
  if (!hasSupabase) return all.filter((p) => p.is_trending).slice(0, limit);
  const sold = await bestSellerMap(30).catch(() => new Map<string, number>());
  const ranked = [
    ...all.filter((p) => sold.has(p.id)).sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0)),
    ...all.filter((p) => !sold.has(p.id) && p.is_trending),
    ...all.filter((p) => !sold.has(p.id) && !p.is_trending),
  ];
  return ranked.slice(0, limit);
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
    const [cat, brand, veh, offer] = await Promise.all([
      resolve("categories", opts.category), resolve("brands", opts.brand), resolve("vehicles", opts.vehicle),
      opts.promotion ? db.from("promotions").select("id,rule,rule_value").eq("slug", opts.promotion).maybeSingle().then((r: { data: Offer | null }) => r.data) : Promise.resolve(undefined),
    ]);
    if (cat === null || brand === null || veh === null || offer === null) return [];
    // a smart offer fills itself by its rule (plus products assigned by hand); a manual one uses the assignment only
    const smart = offer && offer.rule && offer.rule !== "manual" ? offer : null;
    const promo = offer?.id;
    if (cat) {
      // a main category also shows the products of its sub-categories
      const { data: kids } = await db.from("categories").select("id").eq("parent_id", cat);
      query = query.in("category_id", [cat, ...(kids ?? []).map((k: { id: string }) => k.id)]);
    }
    if (brand) query = query.eq("brand_id", brand);
    if (veh) query = query.eq("vehicle_id", veh);
    if (promo && !smart) query = query.eq("promotion_id", promo);
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

    if (opts.limit && !smart) query = query.limit(opts.limit);
    const [{ data, error }, ratings] = await Promise.all([query, ratingMap()]);
    if (error) throw error;
    let rows = (data as Product[]) ?? [];
    if (smart) {
      rows = await applyRule(rows, smart);
      if (opts.limit) rows = rows.slice(0, opts.limit);
    }
    return withRatings(rows, ratings);
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
    const [{ data }, ratings] = await Promise.all([serverClient().from("products").select(SELECT).eq("slug", slug).eq("active", true).maybeSingle(), ratingMap()]);
    return data ? withRatings([data as Product], ratings)[0] : null;
  } catch {
    return demoProducts.find((p) => p.slug === slug) ?? null;
  }
}

/** Approved star ratings per product (Admin > Product reviews). Empty if the table isn't there yet. */
async function ratingMap() {
  const { data } = await serverClient().from("product_ratings").select("product_id,rating,reviews");
  return new Map(((data as { product_id: string; rating: number; reviews: number }[] | null) ?? []).map((r) => [r.product_id, r]));
}
const withRatings = (rows: Product[], m: Map<string, { rating: number; reviews: number }>) =>
  rows.map((p) => { const r = m.get(p.id); return r ? { ...p, rating: Number(r.rating), reviews: r.reviews } : p; });

/** Live campaigns (active + inside their schedule; the database only returns those) and the products they show. */
export async function getCampaigns(): Promise<{ campaigns: Campaign[]; products: Product[] }> {
  if (!hasSupabase) return { campaigns: [], products: [] };
  try {
    const db = serverClient();
    const { data } = await db.from("campaigns").select("id,name,kind,template,status,priority,starts_at,ends_at,content,design,rules").order("priority", { ascending: false });
    const campaigns = (data as Campaign[] | null) ?? [];
    const ids = [...new Set(campaigns.flatMap((c) => c.content?.products ?? []))];
    const { data: ps } = ids.length ? await db.from("products").select(SELECT).in("id", ids).eq("active", true) : { data: [] };
    return { campaigns, products: (ps as Product[] | null) ?? [] };
  } catch (e) {
    console.error("[data] campaigns:", e);
    return { campaigns: [], products: [] };
  }
}

/** Approved reviews of one product, newest first (public columns only). */
export async function getReviews(productId: string): Promise<Review[]> {
  if (!hasSupabase) return [];
  const { data } = await serverClient().from("product_reviews").select("id,name,city,rating,title,body,verified,reply,reply_at,created_at,images")
    .eq("product_id", productId).eq("status", "approved").order("created_at", { ascending: false }).limit(200);
  return (data as Review[]) ?? [];
}

export async function countByCategory(): Promise<Record<string, number>> {
  const all = await getProducts();
  const out: Record<string, number> = {};
  all.forEach((p) => { if (p.category_id) out[p.category_id] = (out[p.category_id] ?? 0) + 1; });
  return out;
}

export { money } from "./format";
