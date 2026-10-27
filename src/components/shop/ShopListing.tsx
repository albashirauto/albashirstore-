import Link from "next/link";
import PageHero from "@/components/PageHero";
import { getBrands, getCategories, getProducts, getSettings, getVehicles, type ProductQuery } from "@/lib/data";
import { discountPct, money } from "@/lib/format";
import { hasScheme } from "@/lib/scheme";
import { isOut } from "@/lib/stock";
import type { Product } from "@/lib/types";
import ActiveFilters from "./ActiveFilters";
import EmptyState from "./EmptyState";
import FilterPanel, { type Option } from "./FilterPanel";
import HelpCard from "./HelpCard";
import ProductGrid from "./ProductGrid";
import Toolbar from "./Toolbar";
import Pagination from "./Pagination";
import { PER_PAGE, inPrice, type SP } from "./url";

export type { SP };

const countBy = (rows: Product[], pick: (p: Product) => string | undefined) =>
  rows.reduce<Record<string, number>>((m, p) => { const k = pick(p); if (k) m[k] = (m[k] ?? 0) + 1; return m; }, {});

/**
 * Shared product listing for /shop, categories, brands, bikes and deals.
 * `fixed` locks a filter for that page (e.g. the brand on a brand page); `sp` is the URL query.
 */
export default async function ShopListing({ title, subtitle, eyebrow = "Shop", basePath, fixed = {}, sp, parents = [{ label: "Shop", href: "/shop" }], image, logo, logoFit, aboutHtml, tiles }: {
  title: string; subtitle?: string; eyebrow?: string; basePath: string; fixed?: ProductQuery; sp: SP; parents?: { label: string; href: string }[];
  /** category picture or brand logo in the banner */
  image?: string | null; logo?: string | null; logoFit?: string | null;
  /** owner-written description shown under the products (also good for SEO) */
  aboutHtml?: string | null;
  /** quick links shown above the products, e.g. sub-categories or bike models */
  tiles?: { name: string; href: string; image?: string | null; count?: number }[];
}) {
  const { price, stock, sale, scheme, page: _page, ...rest } = sp;
  const [raw, base, categories, brands, vehicles, settings] = await Promise.all([
    getProducts({ ...rest, ...fixed }), getProducts(fixed), getCategories(), getBrands(), getVehicles(), getSettings(),
  ]);

  // price / stock / sale are applied here so they work the same with or without Supabase
  const products = raw.filter((p) => inPrice(p.price, price) && (!stock || !isOut(p)) && (!sale || discountPct(p.price, p.compare_price) > 0) && (!scheme || hasScheme(p)));

  const pages = Math.max(1, Math.ceil(products.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const pageItems = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    category: countBy(base, (p) => p.category?.slug),
    brand: countBy(base, (p) => p.brand?.slug),
    vehicle: countBy(base, (p) => p.vehicle?.slug),
  };
  const opts = (rows: { slug: string; name: string }[], k: keyof typeof counts): Option[] =>
    rows.map((r) => ({ slug: r.slug, name: r.name, count: counts[k][r.slug] ?? 0 })).filter((o) => o.count > 0);

  const names = Object.fromEntries([
    ...categories.map((c) => [`category:${c.slug}`, c.name]),
    ...brands.map((b) => [`brand:${b.slug}`, b.name]),
    ...vehicles.map((v) => [`vehicle:${v.slug}`, v.name]),
  ]);
  const active = [sp.category, sp.brand, sp.vehicle, sp.price, sp.stock, sp.sale, sp.scheme, sp.q].filter(Boolean).length;
  const lowest = base.length ? Math.min(...base.map((p) => p.price)) : 0;

  const filters = (
    <FilterPanel
      basePath={basePath} sp={sp} fixed={fixed}
      groups={[
        { key: "category", title: "Category", options: opts(categories, "category") },
        { key: "brand", title: "Brand", options: opts(brands, "brand") },
        { key: "vehicle", title: fixed.vehicleType ? "Bike model" : "Bike / vehicle", options: opts(fixed.vehicleType ? vehicles.filter((v) => v.type === fixed.vehicleType) : vehicles, "vehicle") },
      ]}
    />
  );

  return (
    <>
      <PageHero
        crumb={title} parents={parents} eyebrow={eyebrow} title={title}
        sub={subtitle ?? "Filter by category, brand or the bike you ride."}
        stats={[{ label: "Parts", value: base.length }, ...(lowest ? [{ label: "From", value: money(lowest) }] : [])]}
        image={image} logo={logo} logoFit={logoFit}
      />

      <div className="relative z-10 mx-auto -mt-10 max-w-7xl px-4">
        <Toolbar basePath={basePath} sp={sp} total={products.length} active={active} filters={filters} />
      </div>

      <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-44 max-h-[calc(100dvh-12rem)] space-y-5 overflow-y-auto pb-4 scrollbar-none">
            <div className="rounded-2xl border border-line bg-card px-4">{filters}</div>
            <HelpCard settings={settings} />
          </div>
        </aside>

        <div className="min-w-0">
          {tiles && tiles.length > 0 && (
            <div className="mb-6 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {tiles.map((t) => (
                <Link key={t.href} href={t.href} className="group flex shrink-0 items-center gap-3 rounded-2xl border border-line bg-card py-2 pl-2 pr-4 transition hover:-translate-y-0.5 hover:border-brand-500/50 hover:shadow-md">
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-50 text-sm font-extrabold text-brand-600 dark:bg-brand-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {t.image ? <img src={t.image} alt="" className="h-full w-full object-cover" /> : t.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-bold transition group-hover:text-brand-600">{t.name}</span>
                    {t.count !== undefined && <span className="text-xs text-muted">{t.count} parts</span>}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <ActiveFilters basePath={basePath} sp={sp} names={names} />
          {products.length ? (
            <>
              <ProductGrid products={pageItems} />
              <Pagination basePath={basePath} sp={sp} page={page} pages={pages} total={products.length}
                from={(page - 1) * PER_PAGE + 1} to={(page - 1) * PER_PAGE + pageItems.length} />
            </>
          ) : <EmptyState clearHref={basePath} q={sp.q} whatsapp={settings.whatsapp} popular={categories.slice(0, 6)} />}
        </div>
      </div>

      {aboutHtml && (
        <section className="mx-auto mt-16 max-w-7xl px-4">
          <div className="rounded-2xl border border-line bg-card p-6 md:p-8">
            <h2 className="text-3xl font-extrabold uppercase text-brand-900 dark:text-white">About {title}</h2>
            {/* written by the shop owner in the admin panel */}
            <div className="prose-cms mt-3 max-w-3xl" dangerouslySetInnerHTML={{ __html: aboutHtml }} />
          </div>
        </section>
      )}

      <div className="mx-auto mt-10 max-w-7xl px-4 lg:hidden"><HelpCard settings={settings} /></div>
    </>
  );
}
