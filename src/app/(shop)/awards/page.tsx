import PageHero from "@/components/PageHero";
import AwardsGallery from "@/components/awards/AwardsGallery";
import { getAwards } from "@/lib/data";

export const metadata = { title: "Our awards & rewards", description: "Awards, certificates and honours earned by Al Bashir Autos." };
export const revalidate = 60;

/** Awards page. Photos are managed in Admin → Awards & rewards. */
export default async function AwardsPage() {
  const awards = await getAwards();
  const years = new Set(awards.map((a) => a.year).filter(Boolean)).size;

  return (
    <>
      <PageHero
        crumb="Awards" eyebrow="Trusted & recognised" title="Our awards & rewards"
        sub="Honours from the companies and riders we serve. Tap any award to see it up close."
        stats={[{ label: "Awards", value: awards.length }, ...(years ? [{ label: "Years", value: years }] : [])]}
      />
      <AwardsGallery awards={awards} />
    </>
  );
}
