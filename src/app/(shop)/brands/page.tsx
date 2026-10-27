import PageHero from "@/components/PageHero";
import BrandDirectory from "@/components/brands/BrandDirectory";
import FeaturedBrands from "@/components/brands/FeaturedBrands";
import type { BrandInfo } from "@/components/brands/types";
import CtaBand from "@/components/home/CtaBand";
import { getBrands, getProducts, getSettings, sellBrands } from "@/lib/data";

export const metadata = { title: "Brands" };
export const revalidate = 60;

/** All brands. Sections live in src/components/brands/. */
export default async function Brands() {
  const [brands, products, settings] = await Promise.all([getBrands(), getProducts(), getSettings()]);

  const info: BrandInfo[] = sellBrands(brands).map((b) => {
    const mine = products.filter((p) => p.brand_id === b.id);
    return {
      ...b,
      count: mine.length,
      cats: Array.from(new Set(mine.map((p) => p.category?.name).filter(Boolean) as string[])),
      top: mine.slice(0, 3).map((p) => ({ name: p.name, slug: p.slug, price: p.price })),
    };
  });

  return (
    <>
      <PageHero
        crumb="Brands" eyebrow="Trusted makers" title="Brands we stock"
        sub="Genuine and quality-checked parts from the names riders and mechanics trust."
        stats={[{ label: "Brands", value: info.length }, { label: "Parts", value: products.length, plus: true }]}
      />
      <FeaturedBrands brands={info} />
      <BrandDirectory brands={info} />
      <CtaBand settings={settings} />
    </>
  );
}
