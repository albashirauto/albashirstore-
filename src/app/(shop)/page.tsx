import ByBike from "@/components/home/ByBike";
import Categories from "@/components/home/Categories";
import CtaBand from "@/components/home/CtaBand";
import DealZone from "@/components/home/DealZone";
import Hero from "@/components/home/Hero";
import ProductRow from "@/components/home/ProductRow";
import SpeedBands from "@/components/home/SpeedBands";
import Testimonials from "@/components/home/Testimonials";
import TrustBar from "@/components/home/TrustBar";
import { countByCategory, getBanners, getBrands, getCategories, getFeatures, getProducts, getPromotions, getSettings, getTestimonials, getVehicles } from "@/lib/data";

export const revalidate = 60;

/** Home page. Each section lives in its own file under src/components/home/. */
export default async function Home() {
  const [banners, features, categories, promotions, trending, featured, vehicles, brands, testimonials, settings, counts] = await Promise.all([
    getBanners(), getFeatures(), getCategories(), getPromotions(),
    getProducts({ trending: true, limit: 8 }), getProducts({ featured: true, limit: 16 }),
    getVehicles(), getBrands(), getTestimonials(), getSettings(), countByCategory(),
  ]);

  // staff picks never repeat a trending product (no duplicate rows); hidden when too few are left
  const seen = new Set(trending.map((p) => p.id));
  const picks = featured.filter((p) => !seen.has(p.id)).slice(0, 8);

  return (
    <>
      <Hero banners={banners} vehicles={vehicles} settings={settings} />
      <TrustBar features={features} />
      <SpeedBands brands={brands.map((b) => ({ label: b.name, href: `/brands/${b.slug}`, logo: b.logo }))} />
      <Categories categories={categories} counts={counts} />
      <DealZone promotions={promotions} />
      <ProductRow eyebrow="Popular" title="Trending now" sub="What riders around Okara and Depalpur are buying this week." href="/shop?sort=newest" products={trending} />
      <ByBike vehicles={vehicles} />
      {picks.length >= 2 && <ProductRow eyebrow="Recommended" title="Staff picks" sub="Reliable parts we recommend at the counter." href="/shop" products={picks} />}
      <CtaBand settings={settings} />
      <Testimonials testimonials={testimonials} />
    </>
  );
}
