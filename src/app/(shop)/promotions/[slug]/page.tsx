import { notFound } from "next/navigation";
import ShopListing, { type SP } from "@/components/shop/ShopListing";
import { getPromotions } from "@/lib/data";

export const revalidate = 60;

export default async function PromotionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const p = (await getPromotions()).find((x) => x.slug === slug);
  if (!p) notFound();
  return <ShopListing title={p.title} eyebrow="Deal" subtitle={p.subtitle ?? undefined} parents={[{ label: "Deal zone", href: "/promotions" }]} basePath={`/promotions/${slug}`} fixed={{ promotion: slug }} sp={sp} />;
}
