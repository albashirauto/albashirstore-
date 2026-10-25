import type { Variant } from "@/lib/types";

/** Everything stored on the product row (public). */
export type P = {
  id?: string;
  name: string; slug: string; sku: string; description: string; details_html: string;
  price: string; compare_price: string; stock: string;
  category_id: string; brand_id: string; vehicle_id: string; promotion_id: string;
  images: string[]; video_url: string;
  specs: { label: string; value: string }[];
  variants: Variant[];
  bundle: { product_id: string; qty: number }[];
  seo_title: string; seo_description: string;
  focus_keywords: string; og_title: string; og_description: string; og_image: string; canonical_url: string;
  robots_noindex: boolean; robots_nofollow: boolean;
  condition: string; warranty: string;
  stock_status: "auto" | "in_stock" | "out_of_stock";
  show_stock: boolean; fitment_verified: boolean;
  is_featured: boolean; is_trending: boolean; active: boolean;
  scheme_buy: string; scheme_free: string;
};

/** Private purchase details (product_costs table, admins only). */
export type X = {
  cost_price: string; supplier_name: string; supplier_phone: string; supplier_sku: string;
  location: string; reorder_level: string; purchase_notes: string;
};

export type Opt = { id: string; name: string; parent_id?: string | null; type?: string | null };
export type Options = { categories: Opt[]; brands: Opt[]; vehicles: Opt[]; promotions: Opt[]; products: (Opt & { price: number; sku: string | null })[] };

export const emptyP = (): P => ({
  name: "", slug: "", sku: "", description: "", details_html: "", price: "", compare_price: "", stock: "0",
  category_id: "", brand_id: "", vehicle_id: "", promotion_id: "", images: [], video_url: "",
  specs: [], variants: [], bundle: [], seo_title: "", seo_description: "",
  focus_keywords: "", og_title: "", og_description: "", og_image: "", canonical_url: "", robots_noindex: false, robots_nofollow: false, condition: "new", warranty: "",
  stock_status: "auto", show_stock: true, fitment_verified: false, is_featured: false, is_trending: false, active: true,
  scheme_buy: "", scheme_free: "",
});
export const emptyX = (): X => ({ cost_price: "", supplier_name: "", supplier_phone: "", supplier_sku: "", location: "", reorder_level: "", purchase_notes: "" });

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const num = (v: string) => (v === "" || v === null || v === undefined ? null : Number(v));
const txt = (v: string) => (v?.trim() ? v.trim() : null);

/** Database row -> form state (nulls become empty strings). */
export function fromRow(r: Record<string, any>): P {
  const e = emptyP();
  const out: any = { ...e };
  for (const k of Object.keys(e) as (keyof P)[]) {
    const v = r[k];
    if (v === null || v === undefined) continue;
    out[k] = typeof e[k] === "string" ? String(v) : v;
  }
  out.id = r.id;
  return out;
}
export function fromPriv(r: Record<string, any> | null): X {
  const e = emptyX();
  if (!r) return e;
  return Object.fromEntries(Object.keys(e).map((k) => [k, r[k] === null || r[k] === undefined ? "" : String(r[k])])) as X;
}

/** Form state -> rows to save. */
export function toRows(p: P, x: X) {
  const product = {
    name: p.name.trim(), slug: slugify(p.slug || p.name), sku: txt(p.sku), description: txt(p.description), details_html: txt(p.details_html),
    price: Number(p.price || 0), compare_price: num(p.compare_price), stock: num(p.stock) ?? 0,
    category_id: p.category_id || null, brand_id: p.brand_id || null, vehicle_id: p.vehicle_id || null, promotion_id: p.promotion_id || null,
    images: p.images, video_url: txt(p.video_url),
    specs: p.specs.filter((s) => s.label.trim() && s.value.trim()),
    variants: p.variants.filter((v) => v.name.trim()).map((v) => ({ name: v.name.trim(), sku: v.sku || null, price: v.price ?? null, stock: v.stock ?? null })),
    bundle: p.bundle.filter((b) => b.product_id && b.qty > 0),
    seo_title: txt(p.seo_title), seo_description: txt(p.seo_description),
    focus_keywords: txt(p.focus_keywords), og_title: txt(p.og_title), og_description: txt(p.og_description), og_image: txt(p.og_image),
    canonical_url: txt(p.canonical_url), robots_noindex: p.robots_noindex, robots_nofollow: p.robots_nofollow,
    condition: p.condition || "new", warranty: txt(p.warranty),
    stock_status: p.stock_status, show_stock: p.show_stock, fitment_verified: p.fitment_verified,
    is_featured: p.is_featured, is_trending: p.is_trending, active: p.active,
    scheme_buy: num(p.scheme_buy), scheme_free: num(p.scheme_free),
  };
  const priv = {
    cost_price: num(x.cost_price), supplier_name: txt(x.supplier_name), supplier_phone: txt(x.supplier_phone), supplier_sku: txt(x.supplier_sku),
    location: txt(x.location), reorder_level: num(x.reorder_level), purchase_notes: txt(x.purchase_notes), updated_at: new Date().toISOString(),
  };
  return { product, priv };
}
