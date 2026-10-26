export type Category = {
  id: string; name: string; slug: string; image?: string | null; parent_id?: string | null;
  show_in_nav?: boolean; show_on_home?: boolean; sort_order?: number; active?: boolean;
  description_html?: string | null; seo_title?: string | null; seo_description?: string | null; focus_keywords?: string | null;
};
export type Variant = { name: string; sku?: string | null; price?: number | null; stock?: number | null };

export type Brand = {
  id: string; name: string; slug: string; logo?: string | null; sort_order?: number; active?: boolean;
  description_html?: string | null; country?: string | null; website?: string | null;
  seo_title?: string | null; seo_description?: string | null; focus_keywords?: string | null;
};
export type Vehicle = {
  id: string; name: string; slug: string; type?: string; company?: string | null; image?: string | null;
  sort_order?: number; active?: boolean;
};
export type Promotion = {
  id: string; title: string; slug: string; subtitle?: string | null; badge?: string | null; image?: string | null;
  show_on_home?: boolean; sort_order?: number; active?: boolean;
};
export type Product = {
  /** approved reviews: average stars and count */
  rating?: number; reviews?: number;
  id: string; name: string; slug: string; sku?: string | null; description?: string | null;
  price: number; compare_price?: number | null; stock?: number; images?: string[];
  category_id?: string | null; brand_id?: string | null; vehicle_id?: string | null; promotion_id?: string | null;
  is_featured?: boolean; is_trending?: boolean; active?: boolean;
  /** bulk scheme: buy this many, get scheme_free pieces free */
  scheme_buy?: number | null; scheme_free?: number | null;
  details_html?: string | null; video_url?: string | null;
  specs?: { label: string; value: string }[] | null;
  variants?: Variant[] | null;
  bundle?: { product_id: string; qty: number }[] | null;
  seo_title?: string | null; seo_description?: string | null;
  focus_keywords?: string | null; og_title?: string | null; og_description?: string | null; og_image?: string | null;
  canonical_url?: string | null; robots_noindex?: boolean | null; robots_nofollow?: boolean | null;
  condition?: string | null; warranty?: string | null;
  /** auto = follow the stock number */
  stock_status?: "auto" | "in_stock" | "out_of_stock" | null;
  show_stock?: boolean | null;
  fitment_verified?: boolean | null;
  category?: { name: string; slug: string; parent_id?: string | null } | null;
  brand?: { name: string; slug: string; logo?: string | null } | null;
  vehicle?: { name: string; slug: string; type?: string | null } | null;
};
export type Banner = {
  id: string; eyebrow?: string | null; title: string; subtitle?: string | null; button_text?: string | null;
  link?: string | null; image?: string | null; sort_order?: number; active?: boolean;
};
export type Page = { id: string; title: string; slug: string; content?: string | null; show_in_footer?: boolean; active?: boolean };
export type Faq = { id: string; question: string; answer: string; sort_order?: number; active?: boolean };
export type Post = {
  id: string; title: string; slug: string; cover?: string | null; excerpt?: string | null; content_html?: string | null;
  author?: string | null; published_at: string; seo_title?: string | null; seo_description?: string | null; focus_keywords?: string | null; active?: boolean;
  category?: string | null; tags?: string[] | null; cover_alt?: string | null; featured?: boolean; deleted_at?: string | null;
  schema_type?: string | null; noindex?: boolean; canonical_url?: string | null;
  og_title?: string | null; og_description?: string | null; og_image?: string | null; updated_at?: string | null; created_at?: string;
};
export type Review = { id: string; name: string; city?: string | null; rating: number; title?: string | null; body: string; verified: boolean; reply?: string | null; reply_at?: string | null; created_at: string; images?: string[] | null };
export type Testimonial = { id: string; name: string; city?: string | null; body: string; rating?: number; sort_order?: number; active?: boolean };
export type Feature = { id: string; title: string; body?: string | null; icon?: string; sort_order?: number; active?: boolean };
export type Settings = Record<string, string>;

export type CartItem = { id: string; slug: string; name: string; price: number; image?: string | null; qty: number; scheme_buy?: number | null; scheme_free?: number | null };
