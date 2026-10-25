import { notFound } from "next/navigation";
import ShopListing, { type SP } from "@/components/shop/ShopListing";
import { getVehicles } from "@/lib/data";

export const revalidate = 60;

export default async function VehiclePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const v = (await getVehicles()).find((x) => x.slug === slug);
  if (!v) notFound();
  return <ShopListing title={`${v.name} parts`} eyebrow="Fits your bike" subtitle={`Everything that fits the ${v.name}.`} parents={[{ label: "Shop by bike", href: "/vehicles" }]} basePath={`/vehicles/${slug}`} fixed={{ vehicle: slug }} sp={sp} />;
}
