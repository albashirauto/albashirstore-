import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Truck } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import AddToCart from "@/components/AddToCart";
import WishButton from "@/components/wishlist/WishButton";
import SchemeBox from "@/components/SchemeBox";
import Gallery from "@/components/Gallery";
import ProductCard from "@/components/ProductCard";
import ProductDetails from "@/components/product/ProductDetails";
import AdminSeoPanel from "@/components/product/AdminSeoPanel";
import { isOut, lowLeft } from "@/lib/stock";
import { getCategories, getProduct, getProducts, getReviews, getSettings } from "@/lib/data";
import ProductReviews from "@/components/reviews/ProductReviews";
import Stars from "@/components/reviews/Stars";
import { discountPct, money } from "@/lib/format";
import { SITE_URL, breadcrumbJsonLd, fillVars, productJsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import type { Product, Settings } from "@/lib/types";

const DEF_TITLE = "%name% %sep% %sitename%";
const DEF_DESC = "Buy %name% for %vehicle% at %price%. Genuine quality, checked before dispatch, delivered across Pakistan.";

/** Title / description after filling %variables% (Rank Math style). */
function seoText(p: Product, s: Settings) {
  const ctx = { name: p.name, brand: p.brand?.name, category: p.category?.name, vehicle: p.vehicle?.name, price: p.price, sku: p.sku ?? undefined, sitename: s.store_name, sep: s.seo_separator };
  return {
    title: fillVars(p.seo_title || s.seo_product_title || DEF_TITLE, ctx),
    description: fillVars(p.seo_description || p.description || s.seo_product_description || DEF_DESC, ctx).slice(0, 160),
  };
}

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [p, s] = await Promise.all([getProduct((await params).slug), getSettings()]);
  if (!p) return { title: "Product not found" };
  const { title, description } = seoText(p, s);
  const url = `${SITE_URL}/products/${p.slug}`;
  const image = p.og_image || p.images?.[0];
  return {
    title: { absolute: title },
    description,
    keywords: p.focus_keywords?.split(",").map((k) => k.trim()).filter(Boolean),
    alternates: { canonical: p.canonical_url || url },
    robots: { index: !p.robots_noindex, follow: !p.robots_nofollow },
    openGraph: { type: "website", url, siteName: s.store_name, title: p.og_title || title, description: p.og_description || description, images: image ? [{ url: image, alt: p.name }] : undefined, locale: "en_PK" },
    twitter: { card: image ? "summary_large_image" : "summary", title: p.og_title || title, description: p.og_description || description, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const [settings, related, all, cats, reviews] = await Promise.all([getSettings(), getProducts({ category: p.category?.slug, limit: 5 }), getProducts(), getCategories(), getReviews(p.id)]);
  const avg = reviews.length ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10 : 0;
  // category may be a sub-category: show "Main › Sub"
  const cat = cats.find((c) => c.slug === p.category?.slug);
  const parent = cat?.parent_id ? cats.find((c) => c.id === cat.parent_id) : undefined;
  const bundleItems = (p.bundle ?? []).flatMap((b) => { const x = all.find((q) => q.id === b.product_id); return x ? [{ product: x, qty: b.qty }] : []; });
  const off = discountPct(p.price, p.compare_price);
  const more = related.filter((r) => r.id !== p.id).slice(0, 4);
  const out = isOut(p), low = lowLeft(p);

  // same inputs as the admin editor, so the floating score matches it
  const seo = seoText(p, settings);
  const seoInput = {
    keywords: (p.focus_keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean),
    title: seo.title, description: seo.description, slug: p.slug, name: p.name,
    shortDesc: p.description ?? "", html: p.details_html ?? "", images: p.images?.length ?? 0, video: !!p.video_url,
    specs: (p.specs ?? []).filter((x) => x.label && x.value).length,
    otherKeywords: all.filter((q) => q.id !== p.id && q.focus_keywords).map((q) => q.focus_keywords!.split(",")[0].trim()),
  };

  const schema = [
    productJsonLd({ name: p.name, slug: p.slug, description: seoText(p, settings).description, images: p.images, sku: p.sku, price: p.price, brand: p.brand?.name, category: p.category?.name, condition: p.condition, outOfStock: out, rating: avg, reviews }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" }, { name: "Shop", path: "/shop" },
      ...(parent ? [{ name: parent.name, path: `/collections/${parent.slug}` }] : []),
      ...(p.category ? [{ name: p.category.name, path: `/collections/${p.category.slug}` }] : []),
      { name: p.name, path: `/products/${p.slug}` },
    ]),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* structured data for Google (Product + Breadcrumb) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-600">Home</Link> / <Link href="/shop" className="hover:text-brand-600">Shop</Link>
        {parent && <> / <Link href={`/collections/${parent.slug}`} className="hover:text-brand-600">{parent.name}</Link></>}
        {p.category && <> / <Link href={`/collections/${p.category.slug}`} className="hover:text-brand-600">{p.category.name}</Link></>}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery images={p.images ?? []} alt={p.name} />
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {p.brand && (
              <Link href={`/brands/${p.brand.slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 py-1 pl-1 pr-3 uppercase tracking-wider text-white transition hover:bg-brand-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.brand.logo ? <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-white p-0.5"><img src={p.brand.logo} alt="" className="max-h-full max-w-full object-contain" /></span> : <span className="pl-2" />}
                {p.brand.name}
              </Link>
            )}
            {parent && <Link href={`/collections/${parent.slug}`} className="rounded-full bg-soft px-3 py-1 text-fg/80 transition hover:bg-brand-50 hover:text-brand-600">{parent.name}</Link>}
            {p.category && <Link href={`/collections/${p.category.slug}`} className="rounded-full bg-soft px-3 py-1 text-fg/80 transition hover:bg-brand-50 hover:text-brand-600">{parent ? "↳ " : ""}{p.category.name}</Link>}
            {p.vehicle && <Link href={`/vehicles/${p.vehicle.slug}`} className="rounded-full border border-green-600/30 bg-green-600/10 px-3 py-1 text-green-700 transition hover:bg-green-600 hover:text-white">Fits {p.vehicle.name}</Link>}
          </div>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">{p.name}</h1>
          <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-brand-600">
            <Stars value={avg} size={17} />{reviews.length ? <><b className="text-fg">{avg.toFixed(1)}</b> · {reviews.length} review{reviews.length === 1 ? "" : "s"}</> : "No reviews yet · write one"}
          </a>

          <div className="mt-4 flex items-end gap-3">
            <span className="font-display text-5xl font-extrabold text-brand-700 dark:text-white">{money(p.price)}</span>
            {off > 0 && <><span className="pb-1.5 text-lg text-muted line-through">{money(p.compare_price!)}</span><span className="mb-1.5 rounded-full bg-hot px-3 py-1 text-sm font-bold text-white">Save {off}%</span></>}
          </div>

          <p className={`mt-3 inline-flex items-center gap-2 text-sm font-bold ${!out ? "text-green-600" : "text-hot"}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${!out ? "bg-green-500" : "bg-hot"}`} />
            {out ? "Sold out" : low ? `Only ${low} left` : "In stock"}
          </p>

          {p.description && <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{p.description}</p>}

          <SchemeBox p={p} />

          <AddToCart product={p} />
          <div className="mt-3 flex flex-wrap gap-3">
          <WishButton product={p} variant="full" />
          <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hello, I want to order: ${p.name}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-[#25D366] px-6 py-3 font-bold text-[#128C4A] transition hover:bg-[#25D366] hover:text-white">
            <WhatsAppIcon size={19} />Order on WhatsApp
          </a>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-sm">
            {[["SKU", p.sku], ["Brand", p.brand?.name], ["Category", parent?.name ?? p.category?.name], ["Sub-category", parent ? p.category?.name : null], ["Fits", p.vehicle ? `${p.vehicle.name}${p.fitment_verified ? " ✓ checked" : ""}` : null], ["Condition", p.condition && p.condition !== "new" ? p.condition.charAt(0).toUpperCase() + p.condition.slice(1) : null], ["Warranty", p.warranty]].map(([k, v]) => v && (
              <div key={k} className="bg-card p-3"><dt className="text-muted">{k}</dt><dd className="font-bold">{v}</dd></div>
            ))}
          </dl>

          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li className="flex gap-2"><Truck size={18} className="text-brand-500" />Ships within 24 hours. Delivery charges are taken in advance.</li>
            <li className="flex gap-2"><BadgeCheck size={18} className="text-brand-500" />7-day exchange if we send the wrong part.</li>
          </ul>
        </div>
      </div>

      <ProductDetails p={p} bundleItems={bundleItems} />
      <ProductReviews productId={p.id} productName={p.name} reviews={reviews} />
      <AdminSeoPanel editHref={`/admin/products/${p.id}#seo`} input={seoInput} />

      {more.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-4xl font-extrabold uppercase text-brand-700 dark:text-white">You may also need</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{more.map((r, i) => <ProductCard key={r.id} product={r} index={i} />)}</div>
        </section>
      )}
    </div>
  );
}
