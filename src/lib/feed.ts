// Product feed for Google Merchant Center (free listings / Shopping) and the Facebook & Instagram catalog.
// One RSS 2.0 file with g: fields, a format both accept. Served at /feeds/products.xml.
import { getBrands, getCategories, getProducts, getSettings } from "./data";
import { SITE_URL } from "./seo";
import { feedSkip } from "./feed-rules";
import { isOut } from "./stock";
import type { Product } from "./types";

const GOOGLE_CATEGORY = "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts";
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const text = (html?: string | null) => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const pkr = (n: number) => `${Number(n).toFixed(2)} PKR`;


export async function buildFeed() {
  const [products, cats, brands, settings] = await Promise.all([getProducts(), getCategories(), getBrands(), getSettings()]);
  const store = settings.store_name || "Al Bashir Autos";
  const cat = new Map(cats.map((c) => [c.id, c]));
  const brand = new Map(brands.map((b) => [b.id, b.name]));
  const path = (id?: string | null) => {
    const c = id ? cat.get(id) : undefined;
    if (!c) return "";
    const parent = c.parent_id ? cat.get(c.parent_id) : undefined;
    return parent ? `${parent.name} > ${c.name}` : c.name;
  };

  const items = products.filter((p) => !feedSkip(p)).map((p) => {
    const sale = Number(p.compare_price) > Number(p.price);
    const desc = (p.seo_description || text(p.description) || text(p.details_html) || p.name).slice(0, 4900);
    const f: [string, unknown][] = [
      ["g:id", p.sku || p.id],
      ["g:title", (p.seo_title || p.name).slice(0, 150)],
      ["g:description", desc],
      ["g:link", `${SITE_URL}/products/${p.slug}`],
      ["g:image_link", p.images![0]],
      ...p.images!.slice(1, 11).map((u): [string, unknown] => ["g:additional_image_link", u]),
      ["g:availability", isOut(p) ? "out_of_stock" : "in_stock"],
      ["g:condition", "new"],
      ["g:price", pkr(sale ? Number(p.compare_price) : p.price)],
      ...(sale ? [["g:sale_price", pkr(p.price)] as [string, unknown]] : []),
      ["g:brand", (p.brand_id && brand.get(p.brand_id)) || store],
      ...(p.sku ? [["g:mpn", p.sku] as [string, unknown]] : []),
      ["g:identifier_exists", "no"],
      ["g:google_product_category", GOOGLE_CATEGORY],
      ...(path(p.category_id) ? [["g:product_type", path(p.category_id)] as [string, unknown]] : []),
      ...((p.scheme_buy ?? 0) > 0 ? [["g:custom_label_0", "scheme"] as [string, unknown]] : []),
    ];
    return `    <item>\n${f.map(([k, v]) => `      <${k}>${esc(v)}</${k}>`).join("\n")}\n    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(store)}</title>
    <link>${esc(SITE_URL)}</link>
    <description>${esc(settings.tagline || `${store} spare parts`)}</description>
${items.join("\n")}
  </channel>
</rss>
`;
}
