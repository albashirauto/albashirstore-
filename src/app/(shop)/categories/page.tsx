import PageHero from "@/components/PageHero";
import CategoryGrid from "@/components/categories/CategoryGrid";
import CtaBand from "@/components/home/CtaBand";
import { countByCategory, getCategories, getSettings } from "@/lib/data";

export const metadata = { title: "All categories" };
export const revalidate = 60;

/** All categories. Sections live in src/components/categories/. */
export default async function Categories() {
  const [categories, counts, settings] = await Promise.all([getCategories(), countByCategory(), getSettings()]);
  const products = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <>
      <PageHero
        crumb="Categories" eyebrow="Catalogue" title="All categories"
        sub="Every part we stock, sorted by type. Pick a category to see prices, brands and what fits your bike."
        stats={[{ label: "Categories", value: categories.filter((c) => !c.parent_id).length }, { label: "Parts", value: products, plus: true }]}
      />
      <CategoryGrid categories={categories} counts={counts} />
      <CtaBand settings={settings} />
    </>
  );
}
