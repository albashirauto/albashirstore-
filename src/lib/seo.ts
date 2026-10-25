// Rank Math-style SEO: title/description variables, a 0–100 content score, and Product structured data.
// Used by the admin editor (live score + previews) and the product page (metadata + JSON-LD).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// ---------------------------------------------------------------- variables
export const VARIABLES = [
  { v: "%name%", d: "Product name" }, { v: "%brand%", d: "Brand" }, { v: "%category%", d: "Category" },
  { v: "%vehicle%", d: "Fits bike" }, { v: "%price%", d: "Price" }, { v: "%sku%", d: "SKU" },
  { v: "%sitename%", d: "Store name" }, { v: "%sep%", d: "Separator" },
];
export type VarCtx = { name: string; brand?: string; category?: string; vehicle?: string; price?: number; sku?: string; sitename?: string; sep?: string };

export function fillVars(tpl: string, c: VarCtx) {
  const map: Record<string, string> = {
    "%name%": c.name, "%brand%": c.brand ?? "", "%category%": c.category ?? "", "%vehicle%": c.vehicle ?? "all bikes",
    "%price%": c.price ? `Rs. ${Math.round(c.price).toLocaleString("en-PK")}` : "", "%sku%": c.sku ?? "",
    "%sitename%": c.sitename || "Al Bashir Autos", "%sep%": c.sep || "|",
  };
  return tpl.replace(/%[a-z]+%/g, (m) => map[m] ?? m).replace(/\s{2,}/g, " ").replace(/\s+([.,|-])\s*\1/g, " $1").trim();
}

// ---------------------------------------------------------------- analysis
export type SeoInput = {
  keywords: string[]; title: string; description: string; slug: string;
  name: string; shortDesc: string; html: string; images: number; video: boolean; specs: number;
  otherKeywords: string[]; // main keywords already used by other products (or other categories / brands)
  /** "page" = category or brand page: no specifications, one picture or logo is enough */
  kind?: "product" | "page";
};
export type Check = { id: string; group: "Basic SEO" | "Additional" | "Title readability" | "Content readability"; ok: boolean; warn?: boolean; text: string; weight: number };

const POWER = ["best", "genuine", "original", "premium", "heavy duty", "durable", "guaranteed", "free", "new", "top", "pro", "ultimate", "quality", "strong", "fast", "complete", "imported", "authentic", "reliable", "easy"];
const strip = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const words = (t: string) => (t.match(/[\p{L}\p{N}']+/gu) ?? []);
const has = (hay: string, kw: string) => !!kw && hay.toLowerCase().includes(kw.toLowerCase());

export function analyze(i: SeoInput): { score: number; checks: Check[] } {
  const kw = (i.keywords[0] ?? "").trim();
  const body = `${i.shortDesc} ${strip(i.html)}`.trim();
  const w = words(body);
  const kwWords = words(kw).length || 1;
  const hits = kw ? (body.toLowerCase().match(new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length : 0;
  const density = w.length ? (hits * kwWords * 100) / w.length : 0;
  const firstPart = w.slice(0, Math.max(30, Math.ceil(w.length * 0.1))).join(" ");
  const heads = (i.html.match(/<h[2-4][^>]*>(.*?)<\/h[2-4]>/gi) ?? []).map(strip);
  const paras = (i.html.match(/<p[^>]*>(.*?)<\/p>/gis) ?? []).map((p) => words(strip(p)).length);
  const links = i.html.match(/href="([^"]+)"/g) ?? [];
  const internal = links.filter((l) => /href="\/(?!\/)/.test(l) || l.includes(SITE_URL)).length;
  const external = links.length - internal;
  const titlePos = kw ? i.title.toLowerCase().indexOf(kw.toLowerCase()) : -1;

  const c: Check[] = [
    // Basic SEO
    { id: "kw", group: "Basic SEO", weight: 10, ok: !!kw, text: kw ? `Focus keyword set: “${kw}”.` : "Add a focus keyword (the words customers type in Google)." },
    { id: "kwTitle", group: "Basic SEO", weight: 10, ok: has(i.title, kw), text: "Focus keyword in the SEO title." },
    { id: "kwDesc", group: "Basic SEO", weight: 8, ok: has(i.description, kw), text: "Focus keyword in the meta description." },
    { id: "kwUrl", group: "Basic SEO", weight: 7, ok: !!kw && i.slug.includes(kw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")), text: "Focus keyword in the web address (URL)." },
    { id: "kwStart", group: "Basic SEO", weight: 6, ok: has(firstPart, kw), text: "Focus keyword at the start of the description." },
    { id: "length", group: "Basic SEO", weight: 8, ok: w.length >= 150, warn: w.length >= 60 && w.length < 150, text: `Description is ${w.length} words. ${w.length >= 150 ? "Good." : "Aim for 150+ words (fitment, size, material, why it is good)."}` },
    // Additional
    { id: "kwHead", group: "Additional", weight: 4, ok: heads.some((h) => has(h, kw)), text: heads.length ? "Focus keyword in a subheading (H2–H4)." : "Add a subheading (H2/H3) with the focus keyword in the full description." },
    { id: "kwAlt", group: "Additional", weight: 4, ok: i.images > 0 && has(i.name, kw), text: i.images ? "Photo alt text (the product name) contains the focus keyword." : "Add product photos." },
    { id: "density", group: "Additional", weight: 5, ok: density >= 0.8 && density <= 2.8, warn: density > 0 && (density < 0.8 || density > 2.8), text: `Keyword density ${density.toFixed(1)}% (${hits}×). ${density > 2.8 ? "Too often, it reads as spam." : density < 0.8 ? "Use it a few more times naturally." : "Good."}` },
    { id: "urlLen", group: "Additional", weight: 3, ok: i.slug.length > 0 && i.slug.length <= 60, text: `Web address is ${i.slug.length} characters. ${i.slug.length > 60 ? "Shorter is better (under 60)." : "Good."}` },
    { id: "internal", group: "Additional", weight: 3, ok: internal > 0, text: "Link to another page of your store (a category or related part)." },
    { id: "external", group: "Additional", weight: 2, ok: external > 0, warn: true, text: "Optional: link to a trusted source (manufacturer page)." },
    { id: "unique", group: "Additional", weight: 4, ok: !!kw && !i.otherKeywords.some((o) => o.toLowerCase() === kw.toLowerCase()), text: kw && i.otherKeywords.some((o) => o.toLowerCase() === kw.toLowerCase()) ? "Another product already uses this focus keyword. Make it more specific." : "Focus keyword not used by another product." },
    // Title readability
    { id: "titleStart", group: "Title readability", weight: 4, ok: titlePos >= 0 && titlePos <= i.title.length / 2, text: "Focus keyword near the beginning of the title." },
    { id: "titleLen", group: "Title readability", weight: 4, ok: i.title.length >= 30 && i.title.length <= 60, warn: i.title.length > 0 && (i.title.length < 30 || i.title.length > 60), text: `Title is ${i.title.length} characters (best 30–60).` },
    { id: "power", group: "Title readability", weight: 2, ok: POWER.some((p) => i.title.toLowerCase().includes(p)), text: "Title has a power word (Genuine, Heavy Duty, Original…)." },
    { id: "number", group: "Title readability", weight: 2, ok: /\d/.test(i.title), text: "Title has a number (size, model or year, e.g. CD 70, 12V)." },
    // Content readability
    { id: "descLen", group: "Content readability", weight: 4, ok: i.description.length >= 120 && i.description.length <= 160, warn: i.description.length > 0 && (i.description.length < 120 || i.description.length > 160), text: `Meta description is ${i.description.length} characters (best 120–160).` },
    { id: "paras", group: "Content readability", weight: 2, ok: paras.every((n) => n <= 120), text: paras.some((n) => n > 120) ? "Some paragraphs are long. Break them up." : "Paragraphs are short and easy to read." },
    { id: "media", group: "Content readability", weight: 3, ok: i.images >= 3 || (i.images > 0 && i.video), text: `${i.images} photo${i.images === 1 ? "" : "s"}${i.video ? " + video" : ""}. ${i.images >= 3 || i.video ? "Good." : "Add 3+ photos or a video."}` },
    { id: "specs", group: "Content readability", weight: 2, ok: i.specs >= 3, text: i.specs >= 3 ? `${i.specs} specifications listed.` : "Add 3+ specifications (Google loves structured facts)." },
  ];
  // category / brand pages: swap the product-only checks for page ones
  const checks = i.kind === "page"
    ? c.filter((x) => x.id !== "specs").map((x) =>
        x.id === "media" ? { ...x, ok: i.images > 0, text: i.images ? "Has a picture / logo." : "Add a picture (category) or logo (brand)." }
        : x.id === "kwAlt" ? { ...x, ok: i.images > 0 && has(i.name, kw), text: i.images ? "Picture alt text (the name) contains the focus keyword." : "Add a picture or logo." }
        : x.id === "length" ? { ...x, ok: w.length >= 100, warn: w.length >= 40 && w.length < 100, text: `Description is ${w.length} words. ${w.length >= 100 ? "Good." : "Aim for 100+ words: what is in it, which bikes, why buy here."}` }
        : x.id === "unique" ? { ...x, text: x.ok ? "Focus keyword not used by another page." : x.text.replace("Another product", "Another page") }
        : x)
    : c;
  const total = checks.reduce((n, x) => n + x.weight, 0);
  const got = checks.reduce((n, x) => n + (x.ok ? x.weight : x.warn ? x.weight / 2 : 0), 0);
  return { score: Math.round((got / total) * 100), checks };
}

export const scoreTone = (s: number) => (s >= 81 ? { label: "Good", ring: "#16a34a", text: "text-green-700", bg: "bg-green-100" } : s >= 51 ? { label: "Needs work", ring: "#d97706", text: "text-amber-700", bg: "bg-amber-100" } : { label: "Poor", ring: "#e11d2e", text: "text-hot", bg: "bg-hot/10" });

// ---------------------------------------------------------------- schema
export function productJsonLd(p: {
  name: string; slug: string; description?: string | null; images?: string[] | null; sku?: string | null; price: number;
  brand?: string; category?: string; condition?: string | null; outOfStock: boolean;
}) {
  const url = `${SITE_URL}/products/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name, url, sku: p.sku || undefined, description: p.description || undefined,
    image: p.images?.length ? p.images : undefined,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    category: p.category || undefined,
    offers: {
      "@type": "Offer", url, priceCurrency: "PKR", price: Math.round(p.price),
      availability: `https://schema.org/${p.outOfStock ? "OutOfStock" : "InStock"}`,
      itemCondition: `https://schema.org/${p.condition === "used" ? "UsedCondition" : p.condition === "refurbished" ? "RefurbishedCondition" : "NewCondition"}`,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: `${SITE_URL}${x.path}` })),
  };
}

// ---------------------------------------------------------------- category & brand pages
export type SeoEntity = {
  name: string; slug: string; seo_title?: string | null; seo_description?: string | null; focus_keywords?: string | null;
  description_html?: string | null; image?: string | null; logo?: string | null;
};

/** The exact Google title / description a category or brand page uses (shared by the page and the admin score). */
export function entitySeo(kind: "category" | "brand", e: SeoEntity, sitename = "Al Bashir Autos") {
  const title = e.seo_title || (kind === "category" ? `${e.name}: buy online in Pakistan` : `${e.name} parts: genuine ${e.name} spare parts in Pakistan`);
  const description = (e.seo_description || (kind === "category"
    ? `Shop ${e.name} for motorcycles, rickshaws, loaders and cycles. Genuine parts, delivery all over Pakistan.`
    : `Buy genuine ${e.name} spare parts online. Delivery all over Pakistan.`)).slice(0, 160);
  return { title: `${title} | ${sitename}`, description, path: `/${kind === "category" ? "collections" : "brands"}/${e.slug}` };
}

/** Score input for a category or brand. `others` = the other rows of the same kind. */
export function entityInput(kind: "category" | "brand", e: SeoEntity, others: SeoEntity[], sitename?: string): SeoInput {
  const s = entitySeo(kind, e, sitename);
  const html = e.description_html ?? "";
  // the page is reached at /collections/<slug> or /brands/<slug>
  return {
    kind: "page", keywords: (e.focus_keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean),
    title: s.title, description: s.description, slug: e.slug, name: e.name, shortDesc: "", html,
    images: e.image || e.logo ? 1 : 0, video: /youtube|youtu\.be/.test(html), specs: 0,
    otherKeywords: others.filter((o) => o.slug !== e.slug && o.focus_keywords).map((o) => o.focus_keywords!.split(",")[0].trim()),
  };
}
