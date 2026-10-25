import PageHero from "@/components/PageHero";
import PromoCards from "@/components/deals/PromoCards";
import SchemeProducts from "@/components/deals/SchemeProducts";
import SchemeSteps from "@/components/deals/SchemeSteps";
import CtaBand from "@/components/home/CtaBand";
import { getProducts, getPromotions, getSettings } from "@/lib/data";

export const metadata = { title: "Deal zone" };
export const revalidate = 60;

/** Deal zone: bulk "buy X get Y free" schemes + price offers. Sections live in src/components/deals/. */
export default async function Promotions() {
  const [promos, schemes, settings] = await Promise.all([getPromotions(), getProducts({ scheme: true }), getSettings()]);

  return (
    <>
      <PageHero
        crumb="Deal zone" eyebrow="Offers" title="Deal zone"
        sub="Free pieces on bulk orders and limited-time prices on popular parts."
        stats={[{ label: "Scheme items", value: schemes.length }, { label: "Offers", value: promos.length }]}
      />
      <SchemeSteps />
      <SchemeProducts products={schemes.slice(0, 8)} total={schemes.length} />
      <PromoCards promotions={promos} />
      <CtaBand settings={settings} />
    </>
  );
}
