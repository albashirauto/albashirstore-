import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopListing, { type SP } from "@/components/shop/ShopListing";
import { getProducts, getVehicles } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";
import { VEHICLE_TYPES, vehicleType } from "@/lib/vehicleTypes";

export const revalidate = 60;
export const generateStaticParams = () => VEHICLE_TYPES.map((v) => ({ type: v.type }));

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const t = vehicleType((await params).type);
  if (!t) return {};
  return { title: `${t.title} online in Pakistan`, description: `${t.sub} Genuine parts, delivered all over Pakistan.`, alternates: { canonical: `${SITE_URL}/parts/${t.type}` } };
}

/** Motorcycle / Rickshaw / Loader / Cycle parts, with a filter for every bike model of that type. */
export default async function PartsByType({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<SP> }) {
  const [{ type }, sp] = await Promise.all([params, searchParams]);
  const t = vehicleType(type);
  if (!t) notFound();
  const [vehicles, products] = await Promise.all([getVehicles(), getProducts({ vehicleType: type })]);
  const models = vehicles.filter((v) => v.type === type);
  const tiles = models.map((v) => ({ name: v.name, href: `/parts/${type}?vehicle=${v.slug}`, image: v.image, count: products.filter((p) => p.vehicle?.slug === v.slug).length }));

  return (
    <ShopListing title={t.title} eyebrow="Parts by vehicle" subtitle={t.sub} parents={[{ label: "Shop", href: "/shop" }]}
      basePath={`/parts/${type}`} fixed={{ vehicleType: type }} sp={sp} tiles={tiles} />
  );
}
