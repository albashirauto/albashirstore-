import AboutBrands from "@/components/about/AboutBrands";
import AboutNumbers from "@/components/about/AboutNumbers";
import AboutServe from "@/components/about/AboutServe";
import AboutStory from "@/components/about/AboutStory";
import AboutValues from "@/components/about/AboutValues";
import AboutVisit from "@/components/about/AboutVisit";
import CtaBand from "@/components/home/CtaBand";
import PageHero from "@/components/PageHero";
import { getBrands, getCategories, getFeatures, getPage, getProducts, getSettings, getVehicles } from "@/lib/data";

export const metadata = { title: "About us" };
export const revalidate = 60;

/** About us. Sections live in src/components/about/. The story text comes from Admin > Pages > About. */
export default async function About() {
  const [page, settings, features, brands, categories, vehicles, products] = await Promise.all([
    getPage("about"), getSettings(), getFeatures(), getBrands(), getCategories(), getVehicles(), getProducts(),
  ]);

  return (
    <>
      <PageHero crumb="About us" eyebrow="About us" title={settings.store_name || "About us"} sub={settings.tagline} />
      <AboutStory html={page?.content} settings={settings} />
      <AboutNumbers stats={[
        { label: "Parts online", value: products.length },
        { label: "Categories", value: categories.length },
        { label: "Brands", value: brands.length },
        { label: "Bike models", value: vehicles.length },
      ]} />
      <AboutServe />
      <AboutValues features={features} />
      <AboutBrands brands={brands} />
      <AboutVisit settings={settings} />
      <CtaBand settings={settings} />
    </>
  );
}
