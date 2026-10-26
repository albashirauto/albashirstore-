// /llms.txt and /llms-full.txt: a plain-text guide to the store for AI assistants (llmstxt.org format).
// Built from the database on request, so new products / categories / brands appear automatically.
import { getBrands, getCategories, getPages, getPosts, getProducts, getPromotions, getSettings, getVehicles } from "./data";
import { money } from "./format";
import { teamOf } from "./location";
import { hasScheme, schemeLabel } from "./scheme";
import { SITE_URL } from "./seo";
import { isOut } from "./stock";
import { VEHICLE_TYPES } from "./vehicleTypes";

const one = (t?: string | null) => (t ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const parts = (n: number) => `${n} ${n === 1 ? "part" : "parts"}`;
const link = (title: string, path: string, note?: string) => `- [${title}](${SITE_URL}${path})${note ? `: ${note}` : ""}`;

export async function buildLlms(full: boolean) {
  const [s, products, categories, brands, vehicles, promotions, pages, posts] = await Promise.all([
    getSettings(), getProducts(), getCategories(), getBrands(), getVehicles(), getPromotions(), getPages(), getPosts(),
  ]);
  const name = s.store_name || "Al Bashir Autos";
  const live = products.filter((p) => !p.robots_noindex);
  const count = (catId: string) => live.filter((p) => p.category_id === catId || categories.find((c) => c.id === p.category_id)?.parent_id === catId).length;
  const out: string[] = [];

  out.push(`# ${name}`, "");
  out.push(`> ${s.tagline || "Spare parts for motorcycles, rickshaws, loaders and cycles"}. Online shop in Pakistan with delivery all over Pakistan.`, "");
  out.push(
    "Key facts:",
    `- Location: ${s.address || "Pakistan"}${s.latitude && s.longitude ? ` (${s.latitude}, ${s.longitude})` : ""}`,
    `- Phone: ${s.phone || "see website"}${s.whatsapp ? ` · WhatsApp: +${s.whatsapp}` : ""}${s.email ? ` · Email: ${s.email}` : ""}`,
    `- Opening hours (Pakistan time): ${s.open_hours?.split(/\r?\n/).filter((l) => l.trim()).join("; ") || "see website"}`,
    `- Delivery: all over Pakistan, ${money(Number(s.shipping_flat || 400))} per order`,
    "- Payment: JazzCash, Easypaisa or bank transfer; orders are confirmed by phone",
    `- Catalogue: ${live.length} parts in ${categories.length} categories from ${brands.length} brands`,
    "- Many parts have bulk schemes (buy X, get Y free)",
  );
  const team = teamOf(s);
  if (team.length) out.push(`- Team: ${team.map((t) => `${t.name}${t.role ? ` (${t.role})` : ""} ${t.phone}`).join("; ")}`);
  out.push("");

  out.push("## Shop", link("All parts", "/shop", "every product with filters for category, brand, bike and price"), ...VEHICLE_TYPES.map((t) => link(t.title, `/parts/${t.type}`, t.sub)), link("Deal zone", "/promotions", "sales and bulk schemes"), link("Bulk schemes", "/promotions/schemes", "buy X get Y free items"), "");

  out.push("## Categories", ...categories.filter((c) => !c.parent_id).flatMap((c) => [
    link(c.name, `/collections/${c.slug}`, `${parts(count(c.id))}${one(c.description_html) ? `. ${one(c.description_html).slice(0, 140)}` : ""}`),
    ...categories.filter((k) => k.parent_id === c.id).map((k) => `  ${link(k.name, `/collections/${k.slug}`, parts(count(k.id)))}`),
  ]), "");

  out.push("## Brands", ...brands.map((b) => link(b.name, `/brands/${b.slug}`, [b.country && `from ${b.country}`, parts(live.filter((p) => p.brand_id === b.id).length)].filter(Boolean).join(", "))), "");
  out.push("## Bikes and vehicles", ...vehicles.map((v) => link(v.name, `/vehicles/${v.slug}`, [v.type, v.company].filter(Boolean).join(", "))), "");

  if (promotions.length) out.push("## Offers", ...promotions.map((p) => link(p.title, `/promotions/${p.slug}`, [p.badge, p.subtitle].filter(Boolean).join(". "))), "");
  if (posts.length) out.push("## Guides and articles", ...posts.map((p) => link(p.title, `/blog/${p.slug}`, one(p.excerpt).slice(0, 160))), "");

  out.push("## Help", link("About us", "/about"), link("Contact, FAQs and location", "/contact"), link("Track my order", "/track"),...pages.filter((p) => !["about", "contact"].includes(p.slug)).map((p) => link(p.title, `/pages/${p.slug}`)), "");

  if (full) {
    out.push("## Products", "");
    for (const p of live) {
      const facts = [
        `Price ${money(p.price)}${p.compare_price && p.compare_price > p.price ? ` (was ${money(p.compare_price)})` : ""}`,
        isOut(p) ? "out of stock" : "in stock",
        p.brand?.name && `brand ${p.brand.name}`,
        p.category?.name && `category ${p.category.name}`,
        p.vehicle?.name && `fits ${p.vehicle.name}`,
        p.sku && `SKU ${p.sku}`,
        hasScheme(p) && schemeLabel(p),
      ].filter(Boolean).join(" · ");
      out.push(`### [${p.name}](${SITE_URL}/products/${p.slug})`, facts);
      const d = one(p.description);
      if (d) out.push(d.slice(0, 400));
      const specs = (p.specs ?? []).filter((x) => x.label && x.value);
      if (specs.length) out.push(`Specifications: ${specs.map((x) => `${x.label}: ${x.value}`).join("; ")}`);
      out.push("");
    }
  } else {
    out.push("## Optional", link("Full catalogue for AI (every product with price, stock and fitment)", "/llms-full.txt"), link("Sitemap", "/sitemap.xml"), "");
  }
  out.push(`Updated ${new Date().toISOString().slice(0, 10)}.`);
  return out.join("\n");
}
