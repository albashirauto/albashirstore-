import ByBike from "@/components/home/ByBike";
import Categories from "@/components/home/Categories";
import DealZone from "@/components/home/DealZone";
import Hero from "@/components/home/Hero";
import { CampaignHero } from "@/components/campaigns/CampaignHost";
import ProductRow from "@/components/home/ProductRow";
import SpeedBands from "@/components/home/SpeedBands";
import Testimonials from "@/components/home/Testimonials";
import TrustBar from "@/components/home/TrustBar";
import WhatWeSell from "@/components/home/WhatWeSell";
import { countByCategory, getBanners, getBrands, getCategories, getFeatures, getProducts, getSettings, getTrending, getTestimonials, getVehicles, getOfferings, sellBrands } from "@/lib/data";

export const revalidate = 60;

/** Home page. Each section lives in its own file under src/components/home/. */
export default async function Home() {
  const [banners, features, categories, all, trending, vehicles, brands, testimonials, settings, counts, offerings] = await Promise.all([
    getBanners(), getFeatures(), getCategories(), getProducts(),
    getTrending(8),
    getVehicles(), getBrands(), getTestimonials(), getSettings(), countByCategory(), getOfferings(),
  ]);

  return (
    <>
      <CampaignHero />
      <Hero banners={banners} vehicles={vehicles} settings={settings} />
      <TrustBar features={features} />
      <SpeedBands brands={sellBrands(brands).map((b) => ({ label: b.name, href: `/brands/${b.slug}`, logo: b.logo }))} />
      <WhatWeSell items={offerings} settings={settings} />
      <Categories categories={categories} counts={counts} />
      <DealZone products={all} />
      <ProductRow eyebrow="Popular" title="Trending now" sub="Best sellers of the last 30 days, updated automatically." href="/shop?sort=newest" products={trending} />
      <ByBike vehicles={vehicles} />
      <Testimonials testimonials={testimonials} />
    </>
  );
}
